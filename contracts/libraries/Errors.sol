// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Errors
 * @notice Custom error definitions for all contract error scenarios
 * @dev Centralized error definitions for gas-efficient error handling
 */
library Errors {
    // Pool Contract Errors
    error InsufficientBalance(uint256 requested, uint256 available);
    error InvalidAmount(uint256 amount);
    error NotWorldIdVerified(address user);
    error WithdrawalExceedsDeposit(uint256 amount, uint256 deposit);
    error UserAlreadyVerified(address user);
    error InvalidWorldIdProof();
    error ZeroAddress();
    error SameAddress();

    // Prize Pool Errors
    error DrawNotReady(uint256 currentTime, uint256 drawTime);
    error DrawAlreadyCompleted(uint256 drawId);
    error NoEligibleParticipants();
    error PrizeAlreadyClaimed(uint256 drawId);
    error NotWinner(address user, uint256 drawId);
    error RandomnessNotAvailable();
    error InvalidDrawId(uint256 drawId);

    // Yield Adapter Errors
    error YieldHarvestFailed(string reason);
    error InsufficientShares(uint256 requested, uint256 available);
    error StrategyNotSet();
    error InvalidStrategy(address strategy);
    error MigrationFailed(string reason);
    error EmergencyWithdrawFailed();

    // Access Control Errors
    error Unauthorized(address caller);
    error NotOwner(address caller);
    error NotAdmin(address caller);
    error NotPoolContract(address caller);

    // General Errors
    error ContractPaused();
    error ContractNotPaused();
    error ExpectedPause();
    error ReentrancyGuardReentrantCall();
    error TransferFailed();
    error InvalidConfiguration();
    error ExceedsMaxLimit(uint256 value, uint256 limit);
    error BelowMinLimit(uint256 value, uint256 limit);
}