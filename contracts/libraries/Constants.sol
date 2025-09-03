// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Constants
 * @notice Constants used throughout the protocol
 * @dev Centralized constants for consistency and gas optimization
 */
library Constants {
    // Time constants
    uint256 public constant MIN_DRAW_INTERVAL = 5 minutes; // Allow 5-minute draws for frequent wins
    uint256 public constant MAX_DRAW_INTERVAL = 7 days;
    uint256 public constant DEFAULT_DRAW_INTERVAL = 5 minutes; // Default to 5-minute winning events

    // Amount constants
    uint256 public constant MIN_DEPOSIT_AMOUNT = 1e18; // 1 WLD
    uint256 public constant MAX_DEPOSIT_AMOUNT = 1000000e18; // 1M WLD
    uint256 public constant MIN_WITHDRAWAL_AMOUNT = 1e15; // 0.001 WLD

    // Percentage constants (basis points - 10000 = 100%)
    uint256 public constant MAX_FEE_BPS = 500; // 5% max fee
    uint256 public constant DEFAULT_PROTOCOL_FEE_BPS = 100; // 1% protocol fee
    uint256 public constant YIELD_RESERVE_BPS = 1000; // 10% yield reserve

    // World ID constants
    uint256 public constant WORLD_ID_GROUP_ID = 1;
    string public constant WORLD_ID_ACTION = "pool-together-deposit";

    // VRF constants
    uint32 public constant VRF_CALLBACK_GAS_LIMIT = 200000;
    uint16 public constant VRF_REQUEST_CONFIRMATIONS = 3;
    uint32 public constant VRF_NUM_WORDS = 1;

    // Pool limits
    uint256 public constant MAX_PARTICIPANTS = 10000;
    uint256 public constant MIN_PARTICIPANTS_FOR_DRAW = 2;

    // Precision constants
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BPS_PRECISION = 10000;

    // Address constants (will be set per network)
    address public constant ZERO_ADDRESS = address(0);
}