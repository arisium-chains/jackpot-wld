// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IYieldAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/Errors.sol";
import "./BaseContract.sol";
import "./mocks/MockWLD.sol";

/**
 * @title YieldAdapter
 * @notice Yield adapter contract that handles LP and staking mechanisms for WLD tokens
 * @dev This contract implements yield generation through different strategies
 */
 contract YieldAdapter is BaseContract, IYieldAdapter {
   using SafeERC20 for IERC20;
   
   IERC20 public wldToken;
   IERC20 public usdcToken;
   
   // Strategy types
   enum StrategyType {
       NONE,
       LP,
       STAKING
   }
   
   StrategyType public currentStrategy;
   address public strategyAddress;
   
   // Accounting
   mapping(address => uint256) private _sharesOf;
   uint256 public totalShares;
   uint256 public totalDeposited;
   uint256 public yieldAmount;
   
   // Strategy-specific data
   uint256 public lpShares;
   uint256 public stakedAmount;
   
   constructor(
       address _wldToken,
       address _usdcToken,
       address initialOwner
   ) BaseContract(initialOwner) {
       wldToken = IERC20(_wldToken);
       usdcToken = IERC20(_usdcToken);
       currentStrategy = StrategyType.NONE;
   }
   
   /**
    * @notice Get the shares of an account
    * @param account The account address
    * @return The shares of the account
    */
   function sharesOf(address account) external view override returns (uint256) {
       return _sharesOf[account];
   }
   
   /**
    * @notice Deposit WLD tokens to generate yield
    * @param amount The amount of tokens to deposit
    * @return shares The amount of shares minted
    */
   function deposit(uint256 amount) external override whenNotPaused nonReentrant returns (uint256 shares) {
       if (amount == 0) revert Errors.InvalidAmount(amount);
       
       // Transfer tokens from caller
       wldToken.safeTransferFrom(msg.sender, address(this), amount);
       
       // Calculate shares based on current share value
       if (totalShares == 0) {
           shares = amount;
       } else {
           shares = (amount * totalShares) / totalDeposited;
       }
       
       // Update accounting
       totalDeposited += amount;
       totalShares += shares;
       _sharesOf[msg.sender] += shares;
       
       // Execute strategy
       _executeStrategy(amount);
       
       emit FundsDeposited(amount, shares);
       return shares;
   }
   
   /**
    * @notice Withdraw WLD tokens by burning shares
    * @param shares The amount of shares to burn
    * @return amount The amount of tokens withdrawn
    */
   function withdraw(uint256 shares) external override whenNotPaused nonReentrant returns (uint256 amount) {
       if (shares == 0) revert Errors.InvalidAmount(shares);
       if (shares > _sharesOf[msg.sender]) revert Errors.InsufficientBalance(shares, _sharesOf[msg.sender]);
       if (shares > totalShares) revert Errors.InsufficientBalance(shares, totalShares);
       
       // Withdraw from strategy first
       _withdrawFromStrategy(shares);
       
       // Calculate amount based on current share value
       amount = (shares * totalDeposited) / totalShares;
       
       // Update accounting
       totalDeposited -= amount;
       totalShares -= shares;
       _sharesOf[msg.sender] -= shares;
       
       // Transfer tokens to caller
       wldToken.safeTransfer(msg.sender, amount);
       
       emit FundsWithdrawn(shares, amount);
       return amount;
   }
   
   /**
    * @notice Harvest generated yield and send to prize pool
    * @return yieldAmount The amount of yield harvested
    */
   function harvestYield() external override whenNotPaused nonReentrant returns (uint256) {
       // Harvest yield from strategy
       _harvestYieldFromStrategy();
       
       uint256 yield = yieldAmount;
       yieldAmount = 0;
       
       // Transfer the actual yield tokens to the caller
       if (yield > 0) {
           wldToken.safeTransfer(msg.sender, yield);
       }
       
       emit YieldHarvested(yield);
       return yield;
   }
   
   /**
    * @notice Get the current amount of yield generated
    * @return The yield amount
    */
   function getYield() external view override returns (uint256) {
       return yieldAmount;
   }
   
   /**
    * @notice Get the total amount of deposited tokens
    * @return The total deposited amount
    */
   function getTotalDeposited() external view override returns (uint256) {
       return totalDeposited;
   }
   
   /**
    * @notice Get the total amount of shares
    * @return The total shares
    */
   function getTotalShares() external view override returns (uint256) {
       return totalShares;
   }
   
   /**
    * @notice Get the current value of each share
    * @return The share value
    */
   function getShareValue() external view override returns (uint256) {
       if (totalShares == 0) return 0;
       return (totalDeposited * 1e18) / totalShares;
   }
   
   /**
    * @notice Get the current APY
    * @return The APY in basis points
    */
   function getAPY() external view override returns (uint256) {
       // Placeholder return value of 5% APY
       return 500;
   }
   
   /**
    * @notice Migrate to a new strategy
    * @param newStrategy The new strategy address
    */
   function migrateStrategy(address newStrategy) external override whenNotPaused onlyAdmin {
       // Withdraw all funds from current strategy
       _withdrawAllFromStrategy();
       
       address oldStrategy = strategyAddress;
       strategyAddress = newStrategy;
       emit StrategyChanged(oldStrategy, strategyAddress);
   }
   
   /**
    * @notice Emergency withdrawal function
    * @return The amount of tokens withdrawn
    */
   function emergencyWithdraw() external override whenNotPaused nonReentrant onlyAdmin returns (uint256) {
       // Withdraw all funds from strategy
       _withdrawAllFromStrategy();
       
       uint256 balance = wldToken.balanceOf(address(this));
       wldToken.safeTransfer(msg.sender, balance);
       
       // Reset accounting
       totalDeposited = 0;
       totalShares = 0;
       yieldAmount = 0;
       
       return balance;
   }
   
   /**
    * @notice Pause the contract
    */
   function pause() external override(BaseContract, IYieldAdapter) onlyAdmin {
       _pause();
   }
   
   /**
    * @notice Unpause the contract
    */
   function unpause() external override(BaseContract, IYieldAdapter) onlyAdmin {
       _unpause();
   }
   
   /**
    * @notice Simulate yield generation (for testing purposes)
    * @param amount The amount of yield to generate
    */
   function generateYield(uint256 amount) external onlyAdmin whenNotPaused {
       yieldAmount += amount;
       totalDeposited += amount;
   }
   
   /**
    * @notice Set the yield generation strategy
    * @param strategy The strategy address
    */
   function setStrategy(address strategy) external override onlyAdmin whenNotPaused {
       address oldStrategy = strategyAddress;
       strategyAddress = strategy;
       emit StrategyChanged(oldStrategy, strategyAddress);
   }
   
   /**
    * @notice Set the yield generation strategy type
    * @param strategy The strategy type
    */
   function setStrategyType(StrategyType strategy) external onlyAdmin whenNotPaused {
       currentStrategy = strategy;
   }
   
   /**
    * @notice Execute the current yield strategy
    * @param amount The amount to deposit in the strategy
    */
   function _executeStrategy(uint256 amount) internal {
       if (currentStrategy == StrategyType.LP) {
           // For LP strategy, we would deposit tokens in Uniswap V3 pool
           // This is a simplified implementation for demonstration
           // In a real implementation, we would:
           // 1. Convert some WLD to USDC to provide liquidity
           // 2. Add liquidity to Uniswap V3 pool
           // 3. Track our LP shares
           
           // Mock implementation: split tokens for LP
           uint256 lpAmount = amount / 2;
           uint256 reserveAmount = amount - lpAmount;
           
           // LP tokens would be added to Uniswap pool in real implementation
           lpShares += lpAmount;
           // Reserve tokens remain in contract for yield
           // (In real implementation, we would actually convert and add liquidity)
       } else if (currentStrategy == StrategyType.STAKING) {
           // For staking strategy, we would stake tokens in a staking contract
           // This is a simplified implementation for demonstration
           // In a real implementation, we would:
           // 1. Call staking contract's stake function
           // 2. Track staked amount
           
           stakedAmount += amount;
       }
       // If strategy is NONE, tokens remain in this contract
   }
   
   /**
    * @notice Withdraw from the current yield strategy
    * @param shares The amount of shares to withdraw
    */
   function _withdrawFromStrategy(uint256 shares) internal {
       if (currentStrategy == StrategyType.LP) {
           // Calculate amount to withdraw from LP based on shares
           // This is a simplified implementation for demonstration
           uint256 amountFromLP = (shares * lpShares) / totalShares;
           lpShares -= amountFromLP;
       } else if (currentStrategy == StrategyType.STAKING) {
           // Calculate amount to unstake based on shares
           uint256 amountFromStaking = (shares * stakedAmount) / totalShares;
           stakedAmount -= amountFromStaking;
       }
       // If strategy is NONE, no action needed
   }
   
   /**
    * @notice Withdraw all funds from the current strategy
    */
   function _withdrawAllFromStrategy() internal {
       if (currentStrategy == StrategyType.LP) {
           // Withdraw all LP shares
           // In a real implementation, we would interact with Uniswap V3
           lpShares = 0;
       } else if (currentStrategy == StrategyType.STAKING) {
           // Unstake all tokens
           // In a real implementation, we would interact with staking contract
           stakedAmount = 0;
       }
       // If strategy is NONE, no action needed
   }
   
   /**
    * @notice Harvest yield from the current strategy
    */
   function _harvestYieldFromStrategy() internal {
       if (currentStrategy == StrategyType.LP) {
           // For LP strategy, yield comes from swap fees
           // In a real implementation, we would collect fees from Uniswap V3
           // This is a simplified implementation for demonstration
           yieldAmount += 1e18; // Add 1 WLD as mock yield
       } else if (currentStrategy == StrategyType.STAKING) {
           // For staking strategy, yield comes from staking rewards
           // In a real implementation, we would claim rewards from staking contract
           yieldAmount += 1e18; // Add 1 WLD as mock yield
       }
       // If strategy is NONE, no yield is generated
   }
}