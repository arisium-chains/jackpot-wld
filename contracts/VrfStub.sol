// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IVRFAdapter.sol";
import "./BaseContract.sol";
import "./libraries/Errors.sol";

/**
 * @title VrfStub
 * @notice Stub implementation of VRF adapter for testing and development
 * @dev Provides deterministic pseudo-randomness for predictable testing
 */
contract VrfStub is IVRFAdapter, BaseContract {
    struct RandomnessRequest {
        bool exists;
        bool fulfilled;
        address requester;
        uint32 numWords;
        uint256[] randomness;
        uint256 timestamp;
    }
    
    mapping(bytes32 => RandomnessRequest) private requests;
    
    uint256 private nonce;
    bool public autoFulfill = true;
    uint256 public fulfillmentDelay = 0; // Blocks to wait before fulfillment
    
    // VRF Configuration (stub values)
    bytes32 public keyHash = keccak256("STUB_KEY_HASH");
    uint64 public subscriptionId = 1;
    uint32 public callbackGasLimit = 200000;
    
    /**
     * @notice Constructor initializes the VRF stub
     * @param initialOwner The initial owner of the contract
     */
    constructor(address initialOwner) BaseContract(initialOwner) {}
    
    /**
     * @notice Request random words (stub implementation)
     * @param requester The address requesting randomness
     * @param numWords The number of random words to request
     * @return requestId The unique identifier for this randomness request
     */
    function requestRandomness(address requester, uint32 numWords) 
        external 
        override 
        whenNotPaused 
        returns (bytes32 requestId) 
    {
        if (requester == address(0)) revert Errors.ZeroAddress();
        if (numWords == 0 || numWords > 10) revert InvalidConfiguration();
        
        // Generate deterministic request ID
        requestId = keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            msg.sender,
            requester,
            nonce++
        ));
        
        requests[requestId] = RandomnessRequest({
            exists: true,
            fulfilled: false,
            requester: requester,
            numWords: numWords,
            randomness: new uint256[](0),
            timestamp: block.timestamp
        });
        
        emit RandomnessRequested(requestId, requester);
        
        // Auto-fulfill if enabled and no delay
        if (autoFulfill && fulfillmentDelay == 0) {
            _fulfillRequest(requestId);
        }
        
        return requestId;
    }
    
    /**
     * @notice Manually fulfill a randomness request
     * @param requestId The request identifier to fulfill
     */
    function fulfillRequest(bytes32 requestId) external {
        RandomnessRequest storage request = requests[requestId];
        if (!request.exists) revert InvalidRequestId(requestId);
        if (request.fulfilled) revert InvalidRequestId(requestId);
        
        // Check delay requirement
        if (fulfillmentDelay > 0 && block.number < request.timestamp + fulfillmentDelay) {
            revert VRFRequestFailed("Fulfillment delay not met");
        }
        
        _fulfillRequest(requestId);
    }
    
    /**
     * @notice Internal function to fulfill a randomness request
     * @param requestId The request identifier
     */
    function _fulfillRequest(bytes32 requestId) internal {
        RandomnessRequest storage request = requests[requestId];
        
        // Generate deterministic pseudo-random numbers
        uint256[] memory randomWords = new uint256[](request.numWords);
        for (uint32 i = 0; i < request.numWords; i++) {
            randomWords[i] = uint256(keccak256(abi.encodePacked(
                requestId,
                block.timestamp,
                block.prevrandao,
                i,
                "STUB_SEED"
            )));
        }
        
        request.fulfilled = true;
        request.randomness = randomWords;
        
        emit RandomnessFulfilled(requestId, randomWords[0]);
    }
    
    /**
     * @notice Check if a randomness request has been fulfilled
     * @param requestId The request identifier
     * @return fulfilled Whether the request has been fulfilled
     */
    function isRequestFulfilled(bytes32 requestId) external view override returns (bool fulfilled) {
        return requests[requestId].fulfilled;
    }
    
    /**
     * @notice Get the randomness for a fulfilled request
     * @param requestId The request identifier
     * @return randomness The random number(s) generated
     */
    function getRandomness(bytes32 requestId) external view override returns (uint256[] memory randomness) {
        RandomnessRequest storage request = requests[requestId];
        if (!request.exists) revert InvalidRequestId(requestId);
        if (!request.fulfilled) revert VRFRequestFailed("Request not fulfilled");
        
        return request.randomness;
    }
    
    /**
     * @notice Get the status of a randomness request
     * @param requestId The request identifier
     * @return exists Whether the request exists
     * @return fulfilled Whether the request has been fulfilled
     * @return requester The address that made the request
     */
    function getRequestStatus(bytes32 requestId) external view override returns (
        bool exists,
        bool fulfilled,
        address requester
    ) {
        RandomnessRequest storage request = requests[requestId];
        return (request.exists, request.fulfilled, request.requester);
    }
    
    /**
     * @notice Update VRF configuration (stub implementation)
     * @param _keyHash The key hash for the VRF
     * @param _subscriptionId The subscription ID for funding
     * @param _callbackGasLimit The gas limit for the callback
     */
    function updateVRFConfig(
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit
    ) external override onlyAdmin {
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        callbackGasLimit = _callbackGasLimit;
        
        emit VRFConfigUpdated(_keyHash, _subscriptionId, _callbackGasLimit);
    }
    
    /**
     * @notice Get current VRF configuration
     * @return _keyHash The current key hash
     * @return _subscriptionId The current subscription ID
     * @return _callbackGasLimit The current callback gas limit
     */
    function getVRFConfig() external view override returns (
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit
    ) {
        return (keyHash, subscriptionId, callbackGasLimit);
    }
    
    /**
     * @notice Cancel a pending request (stub implementation)
     * @param requestId The request to cancel
     */
    function cancelRequest(bytes32 requestId) external override {
        RandomnessRequest storage request = requests[requestId];
        if (!request.exists) revert InvalidRequestId(requestId);
        if (request.fulfilled) revert VRFRequestFailed("Request already fulfilled");
        if (request.requester != msg.sender && !admins[msg.sender] && msg.sender != owner()) {
            revert Errors.Unauthorized(msg.sender);
        }
        
        delete requests[requestId];
    }
    
    /**
     * @notice Check if the adapter is ready to fulfill requests
     * @return ready Whether the adapter is properly configured
     */
    function isReady() external view override returns (bool ready) {
        return !paused();
    }
    
    /**
     * @notice Set auto-fulfill behavior
     * @param _autoFulfill Whether to auto-fulfill requests
     */
    function setAutoFulfill(bool _autoFulfill) external onlyAdmin {
        autoFulfill = _autoFulfill;
    }
    
    /**
     * @notice Set fulfillment delay in blocks
     * @param _delay Number of blocks to wait before allowing fulfillment
     */
    function setFulfillmentDelay(uint256 _delay) external onlyAdmin {
        fulfillmentDelay = _delay;
    }
    
    /**
     * @notice Get all pending requests (for testing)
     * @return requestIds Array of pending request IDs
     */
    function getPendingRequests() external view returns (bytes32[] memory requestIds) {
        // Note: This is a simplified implementation for testing
        // In production, you'd want a more efficient way to track pending requests
        bytes32[] memory tempIds = new bytes32[](100); // Arbitrary limit
        uint256 count = 0;
        
        // This is inefficient but works for testing with small datasets
        for (uint256 i = 0; i < nonce && count < 100; i++) {
            bytes32 testId = keccak256(abi.encodePacked("test", i));
            if (requests[testId].exists && !requests[testId].fulfilled) {
                tempIds[count] = testId;
                count++;
            }
        }
        
        // Resize array to actual count
        requestIds = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            requestIds[i] = tempIds[i];
        }
        
        return requestIds;
    }
}