// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockVRFCoordinator
 * @notice Mock VRF Coordinator for testing randomness functionality
 * @dev Simulates Chainlink VRF behavior for testing purposes
 */
contract MockVRFCoordinator {
    struct RequestConfig {
        uint64 subId;
        uint32 callbackGasLimit;
        uint16 requestConfirmations;
        uint32 numWords;
        bytes32 keyHash;
    }

    mapping(bytes32 => RequestConfig) public requests;
    mapping(bytes32 => bool) public fulfilled;
    
    uint256 private nonce;
    bool public shouldFulfillImmediately = true;
    bool public shouldRevert = false;

    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );

    event RandomWordsFulfilled(
        uint256 indexed requestId,
        uint256[] randomWords,
        bool success
    );

    /**
     * @notice Request random words (mock implementation)
     * @param keyHash The key hash for the VRF
     * @param subId The subscription ID
     * @param requestConfirmations The number of confirmations
     * @param callbackGasLimit The gas limit for the callback
     * @param numWords The number of random words to generate
     * @return requestId The request ID
     */
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        if (shouldRevert) {
            revert("MockVRFCoordinator: Request failed");
        }

        requestId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce++)));
        bytes32 requestIdBytes = bytes32(requestId);

        requests[requestIdBytes] = RequestConfig({
            subId: subId,
            callbackGasLimit: callbackGasLimit,
            requestConfirmations: requestConfirmations,
            numWords: numWords,
            keyHash: keyHash
        });

        emit RandomWordsRequested(
            keyHash,
            requestId,
            uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))),
            subId,
            requestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );

        if (shouldFulfillImmediately) {
            _fulfillRandomWords(requestId, msg.sender);
        }

        return requestId;
    }

    /**
     * @notice Manually fulfill a random words request (for testing)
     * @param requestId The request ID to fulfill
     * @param consumer The consumer contract address
     */
    function fulfillRandomWords(uint256 requestId, address consumer) external {
        _fulfillRandomWords(requestId, consumer);
    }

    /**
     * @notice Internal function to fulfill random words
     * @param requestId The request ID
     * @param consumer The consumer contract address
     */
    function _fulfillRandomWords(uint256 requestId, address consumer) internal {
        bytes32 requestIdBytes = bytes32(requestId);
        require(!fulfilled[requestIdBytes], "MockVRFCoordinator: Already fulfilled");

        RequestConfig memory config = requests[requestIdBytes];
        require(config.numWords > 0, "MockVRFCoordinator: Invalid request");

        fulfilled[requestIdBytes] = true;

        // Generate mock random words
        uint256[] memory randomWords = new uint256[](config.numWords);
        for (uint32 i = 0; i < config.numWords; i++) {
            randomWords[i] = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                requestId,
                i
            )));
        }

        // Call the consumer's fulfillRandomWords function
        (bool success, ) = consumer.call(
            abi.encodeWithSignature(
                "fulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );

        emit RandomWordsFulfilled(requestId, randomWords, success);
    }

    /**
     * @notice Set whether requests should be fulfilled immediately
     * @param immediate Whether to fulfill immediately
     */
    function setShouldFulfillImmediately(bool immediate) external {
        shouldFulfillImmediately = immediate;
    }

    /**
     * @notice Set whether requests should revert
     * @param revert_ Whether requests should revert
     */
    function setShouldRevert(bool revert_) external {
        shouldRevert = revert_;
    }

    /**
     * @notice Check if a request has been fulfilled
     * @param requestId The request ID to check
     * @return Whether the request has been fulfilled
     */
    function isFulfilled(uint256 requestId) external view returns (bool) {
        return fulfilled[bytes32(requestId)];
    }

    /**
     * @notice Get request configuration
     * @param requestId The request ID
     * @return The request configuration
     */
    function getRequestConfig(uint256 requestId) external view returns (RequestConfig memory) {
        return requests[bytes32(requestId)];
    }
}