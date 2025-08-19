// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IWorldID
 * @notice Interface for World ID verification integration
 * @dev This interface defines the World ID verification methods
 */
interface IWorldID {
    /**
     * @notice Verify a World ID proof
     * @param root The root of the Merkle tree
     * @param groupId The group ID for the verification
     * @param signalHash The hash of the signal being verified
     * @param nullifierHash The nullifier hash to prevent double-spending
     * @param externalNullifierHash The external nullifier hash
     * @param proof The zero-knowledge proof
     */
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}