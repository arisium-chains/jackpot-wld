// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPoolContract
 * @notice Interface for the main pool contract that handles user deposits and withdrawals
 * @dev This contract manages user funds and integrates with yield generation mechanisms
 */
interface IPoolContract {
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 newBalance);
    event Withdraw(address indexed user, uint256 amount, uint256 newBalance);
    event YieldAccrued(uint256 amount, uint256 totalYield);
    event UserVerified(address indexed user);

    // Core deposit/withdrawal functions
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    
    // View functions
    function getUserBalance(address user) external view returns (uint256);
    function getTotalDeposits() external view returns (uint256);
    function getTotalYieldGenerated() external view returns (uint256);
    function isUserVerified(address user) external view returns (bool);
    
    // Admin functions
    function accrueYield() external;
    function setYieldAdapter(address adapter) external;
    function setPrizePool(address prizePool) external;
    function removeYieldAdapter() external;
    
    // World ID integration
    function verifyUser(
        address user,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external;
}