// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IYieldAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockYieldAdapter
 * @notice Mock yield adapter contract for testing purposes
 * @dev Simulates yield generation functionality
 */
contract MockYieldAdapter is IYieldAdapter {
    using SafeERC20 for IERC20;
    
    IERC20 public wldToken;
    mapping(address => uint256) public sharesOf;
    uint256 public totalShares;
    uint256 public totalDeposited;
    uint256 public yieldAmount;
    bool public paused;
    
    constructor(address _wldToken) {
        wldToken = IERC20(_wldToken);
    }
    
    
    function deposit(uint256 amount) external override returns (uint256 shares) {
            require(!paused, "MockYieldAdapter: Contract is paused");
            // Transfer tokens from caller to this contract
            wldToken.safeTransferFrom(msg.sender, address(this), amount);
            totalDeposited += amount;
            shares = amount; // Simple 1:1 ratio for testing
            totalShares += shares;
            sharesOf[msg.sender] += shares;
            
            emit FundsDeposited(amount, shares);
            return shares;
        }
    
    function withdraw(uint256 shares) external override returns (uint256 amount) {
            require(!paused, "MockYieldAdapter: Contract is paused");
            require(shares <= sharesOf[msg.sender], "MockYieldAdapter: Insufficient shares");
            require(shares <= totalShares, "MockYieldAdapter: Insufficient total shares");
            
            amount = shares; // Simple 1:1 ratio for testing
            totalDeposited -= amount;
            totalShares -= shares;
            sharesOf[msg.sender] -= shares;
            
            // Transfer tokens to the caller
            wldToken.safeTransfer(msg.sender, amount);
            
            emit FundsWithdrawn(shares, amount);
            return amount;
        }
    
    function harvestYield() external override returns (uint256) {
        uint256 yield = yieldAmount;
        yieldAmount = 0;
        emit YieldHarvested(yield);
        return yield;
    }
    
    function getYield() external view override returns (uint256) {
        return yieldAmount;
    }
    
    function getTotalDeposited() external view override returns (uint256) {
        return totalDeposited;
    }
    
    function getTotalShares() external view override returns (uint256) {
        return totalShares;
    }
    
    function getShareValue() external view override returns (uint256) {
        if (totalShares == 0) return 0;
        return (totalDeposited * 1e18) / totalShares;
    }
    
    function getAPY() external view override returns (uint256) {
        return 500; // 5% APY for testing
    }
    
    function setStrategy(address strategy) external override {
        // Mock implementation
        emit StrategyChanged(address(0), strategy);
    }
    
    function migrateStrategy(address newStrategy) external override {
        // Mock implementation
    }
    
    function emergencyWithdraw() external override returns (uint256) {
        // Mock implementation
        return 0;
    }
    
    function pause() external override {
        paused = true;
    }
    
    function unpause() external override {
        paused = false;
    }
    
    // Helper functions for testing
    function setYieldAmount(uint256 amount) external {
        yieldAmount = amount;
    }
    
    function mintShares(address account, uint256 shares) external {
        sharesOf[account] += shares;
        totalShares += shares;
    }
    
    function mintDepositedAmount(uint256 amount) external {
        totalDeposited += amount;
    }
}