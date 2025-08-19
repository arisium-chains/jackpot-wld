// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IYieldAdapter
 * @notice Interface for yield generation adapters that handle LP and staking mechanisms
 * @dev This contract abstracts different yield generation strategies
 */
interface IYieldAdapter {
    // Events
    event FundsDeposited(uint256 amount, uint256 shares);
    event FundsWithdrawn(uint256 shares, uint256 amount);
    event YieldHarvested(uint256 amount);
    event StrategyChanged(address oldStrategy, address newStrategy);

    // Core yield functions
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
    function harvestYield() external returns (uint256 yieldAmount);
    
    // View functions
    function getYield() external view returns (uint256);
    function getTotalDeposited() external view returns (uint256);
    function getTotalShares() external view returns (uint256);
    function getShareValue() external view returns (uint256);
    function getAPY() external view returns (uint256);
    function sharesOf(address account) external view returns (uint256);
    
    // Strategy management
    function setStrategy(address strategy) external;
    function migrateStrategy(address newStrategy) external;
    
    // Emergency functions
    function emergencyWithdraw() external returns (uint256);
    function pause() external;
    function unpause() external;
}