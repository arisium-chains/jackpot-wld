// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IWorldID.sol";

/**
 * @title MockWorldID
 * @notice Mock World ID contract for testing purposes
 * @dev Simulates World ID verification functionality
 */
contract MockWorldID is IWorldID {
    mapping(uint256 => bool) public usedNullifiers;
    mapping(address => bool) public verifiedUsers;
    
    bool public verificationEnabled = true;
    bool public shouldRevert = false;

    event VerificationAttempt(
        address indexed user,
        uint256 nullifierHash,
        bool success
    );

    /**
     * @notice Mock implementation of World ID proof verification
     * @param root The root of the Merkle tree (ignored in mock)
     * @param groupId The group ID for the verification (ignored in mock)
     * @param signalHash The hash of the signal being verified (ignored in mock)
     * @param nullifierHash The nullifier hash to prevent double-spending
     * @param externalNullifierHash The external nullifier hash (ignored in mock)
     * @param proof The zero-knowledge proof (ignored in mock)
     */
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view override {
        // Silence unused parameter warnings
        root; groupId; signalHash; externalNullifierHash; proof;

        if (shouldRevert) {
            revert("MockWorldID: Verification failed");
        }

        if (!verificationEnabled) {
            revert("MockWorldID: Verification disabled");
        }

        if (usedNullifiers[nullifierHash]) {
            revert("MockWorldID: Nullifier already used");
        }
    }

    /**
     * @notice Simulate successful verification for a user
     * @param user The user address to verify
     * @param nullifierHash The nullifier hash to mark as used
     */
    function mockVerifyUser(address user, uint256 nullifierHash) external {
        require(!usedNullifiers[nullifierHash], "MockWorldID: Nullifier already used");
        
        usedNullifiers[nullifierHash] = true;
        verifiedUsers[user] = true;
        
        emit VerificationAttempt(user, nullifierHash, true);
    }

    /**
     * @notice Check if a user is verified
     * @param user The user address to check
     * @return True if the user is verified
     */
    function isVerified(address user) external view returns (bool) {
        return verifiedUsers[user];
    }

    /**
     * @notice Set verification enabled/disabled for testing
     * @param enabled Whether verification should be enabled
     */
    function setVerificationEnabled(bool enabled) external {
        verificationEnabled = enabled;
    }

    /**
     * @notice Set whether verification should revert for testing
     * @param revert_ Whether verification should revert
     */
    function setShouldRevert(bool revert_) external {
        shouldRevert = revert_;
    }

    /**
     * @notice Reset a user's verification status for testing
     * @param user The user address to reset
     */
    function resetUser(address user) external {
        verifiedUsers[user] = false;
    }

    /**
     * @notice Reset a nullifier for testing
     * @param nullifierHash The nullifier hash to reset
     */
    function resetNullifier(uint256 nullifierHash) external {
        usedNullifiers[nullifierHash] = false;
    }
}