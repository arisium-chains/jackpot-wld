// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IVRFAdapter
 * @notice Interface for VRF (Verifiable Random Function) adapters
 * @dev This interface abstracts different VRF providers (Chainlink VRF, custom implementations, etc.)
 */
interface IVRFAdapter {
    // Events
    event RandomnessRequested(bytes32 indexed requestId, address indexed requester);
    event RandomnessFulfilled(bytes32 indexed requestId, uint256 randomness);
    event VRFConfigUpdated(bytes32 keyHash, uint64 subscriptionId, uint32 callbackGasLimit);
    
    // Errors
    error VRFRequestFailed(string reason);
    error InvalidRequestId(bytes32 requestId);
    error UnauthorizedFulfillment(address caller);
    error InsufficientFunds();
    error InvalidConfiguration();
    
    /**
     * @notice Request random words from the VRF provider
     * @param requester The address requesting randomness
     * @param numWords The number of random words to request
     * @return requestId The unique identifier for this randomness request
     */
    function requestRandomness(address requester, uint32 numWords) external returns (bytes32 requestId);
    
    /**
     * @notice Check if a randomness request has been fulfilled
     * @param requestId The request identifier
     * @return fulfilled Whether the request has been fulfilled
     */
    function isRequestFulfilled(bytes32 requestId) external view returns (bool fulfilled);
    
    /**
     * @notice Get the randomness for a fulfilled request
     * @param requestId The request identifier
     * @return randomness The random number(s) generated
     */
    function getRandomness(bytes32 requestId) external view returns (uint256[] memory randomness);
    
    /**
     * @notice Get the status of a randomness request
     * @param requestId The request identifier
     * @return exists Whether the request exists
     * @return fulfilled Whether the request has been fulfilled
     * @return requester The address that made the request
     */
    function getRequestStatus(bytes32 requestId) external view returns (
        bool exists,
        bool fulfilled,
        address requester
    );
    
    /**
     * @notice Update VRF configuration (admin only)
     * @param keyHash The key hash for the VRF
     * @param subscriptionId The subscription ID for funding
     * @param callbackGasLimit The gas limit for the callback
     */
    function updateVRFConfig(
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit
    ) external;
    
    /**
     * @notice Get current VRF configuration
     * @return keyHash The current key hash
     * @return subscriptionId The current subscription ID
     * @return callbackGasLimit The current callback gas limit
     */
    function getVRFConfig() external view returns (
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit
    );
    
    /**
     * @notice Emergency function to cancel a pending request
     * @param requestId The request to cancel
     */
    function cancelRequest(bytes32 requestId) external;
    
    /**
     * @notice Check if the adapter is ready to fulfill requests
     * @return ready Whether the adapter is properly configured and funded
     */
    function isReady() external view returns (bool ready);
}