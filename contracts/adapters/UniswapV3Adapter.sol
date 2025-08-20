// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IYieldAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../libraries/Errors.sol";
import "../BaseContract.sol";

// Uniswap V3 interfaces (simplified for demonstration)
interface IUniswapV3Pool {
    function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        bytes calldata data
    ) external returns (uint256 amount0, uint256 amount1);
    
    function burn(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external returns (uint256 amount0, uint256 amount1);
    
    function collect(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount0Requested,
        uint128 amount1Requested
    ) external returns (uint128 amount0, uint128 amount1);
}

interface IUniswapV3Factory {
    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external view returns (address pool);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

/**
 * @title UniswapV3Adapter
 * @notice Yield adapter that provides liquidity to Uniswap V3 pools
 * @dev This contract implements yield generation through Uniswap V3 LP positions
 */
contract UniswapV3Adapter is BaseContract, IYieldAdapter {
    using SafeERC20 for IERC20;
    
    // Tokens
    IERC20 public immutable wldToken;
    IERC20 public immutable usdcToken;
    
    // Uniswap V3 contracts
    IUniswapV3Factory public immutable factory;
    ISwapRouter public immutable swapRouter;
    IUniswapV3Pool public pool;
    
    // Pool configuration
    uint24 public constant POOL_FEE = 3000; // 0.3%
    int24 public tickLower;
    int24 public tickUpper;
    
    // Accounting
    mapping(address => uint256) private _sharesOf;
    uint256 public totalShares;
    uint256 public totalDeposited;
    uint256 public yieldAmount;
    uint128 public liquidityAmount;
    
    // Events
    event LiquidityAdded(uint256 wldAmount, uint256 usdcAmount, uint128 liquidity);
    event LiquidityRemoved(uint256 wldAmount, uint256 usdcAmount, uint128 liquidity);
    event FeesCollected(uint256 wldFees, uint256 usdcFees);
    
    constructor(
        address _wldToken,
        address _usdcToken,
        address _factory,
        address _swapRouter,
        int24 _tickLower,
        int24 _tickUpper,
        address initialOwner
    ) BaseContract(initialOwner) {
        wldToken = IERC20(_wldToken);
        usdcToken = IERC20(_usdcToken);
        factory = IUniswapV3Factory(_factory);
        swapRouter = ISwapRouter(_swapRouter);
        tickLower = _tickLower;
        tickUpper = _tickUpper;
        
        // Get or create the pool
        address poolAddress = factory.getPool(_wldToken, _usdcToken, POOL_FEE);
        if (poolAddress == address(0)) {
            revert Errors.InvalidConfiguration();
        }
        pool = IUniswapV3Pool(poolAddress);
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
     * @notice Deposit WLD tokens and provide liquidity to Uniswap V3
     * @param amount The amount of WLD tokens to deposit
     * @return shares The amount of shares minted
     */
    function deposit(uint256 amount) external override whenNotPaused nonReentrant returns (uint256 shares) {
        if (amount == 0) revert Errors.InvalidAmount(amount);
        
        // Transfer WLD tokens from caller
        wldToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Convert half of WLD to USDC for balanced liquidity
        uint256 wldForSwap = amount / 2;
        uint256 wldForLP = amount - wldForSwap;
        
        // Swap WLD to USDC
        uint256 usdcAmount = _swapWLDToUSDC(wldForSwap);
        
        // Add liquidity to Uniswap V3 pool
        uint128 liquidity = _addLiquidity(wldForLP, usdcAmount);
        
        // Calculate shares based on liquidity added
        if (totalShares == 0) {
            shares = uint256(liquidity);
        } else {
            shares = (uint256(liquidity) * totalShares) / uint256(liquidityAmount);
        }
        
        // Update accounting
        totalDeposited += amount;
        totalShares += shares;
        liquidityAmount += liquidity;
        _sharesOf[msg.sender] += shares;
        
        emit FundsDeposited(amount, shares);
        return shares;
    }
    
    /**
     * @notice Withdraw WLD tokens by removing liquidity
     * @param shares The amount of shares to burn
     * @return amount The amount of tokens withdrawn
     */
    function withdraw(uint256 shares) external override whenNotPaused nonReentrant returns (uint256 amount) {
        if (shares == 0) revert Errors.InvalidAmount(shares);
        if (shares > _sharesOf[msg.sender]) revert Errors.InsufficientBalance(shares, _sharesOf[msg.sender]);
        if (shares > totalShares) revert Errors.InsufficientBalance(shares, totalShares);
        
        // Calculate liquidity to remove
        uint128 liquidityToRemove = uint128((shares * uint256(liquidityAmount)) / totalShares);
        
        // Remove liquidity from pool
        (uint256 wldAmount, uint256 usdcAmount) = _removeLiquidity(liquidityToRemove);
        
        // Convert USDC back to WLD
        uint256 additionalWLD = _swapUSDCToWLD(usdcAmount);
        amount = wldAmount + additionalWLD;
        
        // Update accounting
        totalDeposited = totalDeposited > amount ? totalDeposited - amount : 0;
        totalShares -= shares;
        liquidityAmount -= liquidityToRemove;
        _sharesOf[msg.sender] -= shares;
        
        // Transfer WLD tokens to caller
        wldToken.safeTransfer(msg.sender, amount);
        
        emit FundsWithdrawn(shares, amount);
        return amount;
    }
    
    /**
     * @notice Harvest fees from Uniswap V3 position
     * @return yieldAmount The amount of yield harvested
     */
    function harvestYield() external override whenNotPaused nonReentrant returns (uint256) {
        // Collect fees from the position
        (uint256 wldFees, uint256 usdcFees) = _collectFees();
        
        // Convert USDC fees to WLD
        uint256 additionalWLD = 0;
        if (usdcFees > 0) {
            additionalWLD = _swapUSDCToWLD(usdcFees);
        }
        
        uint256 totalYield = wldFees + additionalWLD;
        yieldAmount = totalYield;
        
        // Transfer yield to caller
        if (totalYield > 0) {
            wldToken.safeTransfer(msg.sender, totalYield);
        }
        
        emit YieldHarvested(totalYield);
        emit FeesCollected(wldFees, usdcFees);
        
        yieldAmount = 0;
        return totalYield;
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
     * @notice Get the current APY (estimated based on pool fees)
     * @return The APY in basis points
     */
    function getAPY() external view override returns (uint256) {
        // Simplified APY calculation based on pool fee tier
        // In reality, this would be calculated based on historical fee collection
        return 300; // 3% APY estimate for 0.3% fee tier
    }
    
    /**
     * @notice Set strategy (not applicable for this adapter)
     * @param strategy The strategy address (ignored)
     */
    function setStrategy(address strategy) external override onlyAdmin {
        // This adapter is the strategy itself, so this is a no-op
        emit StrategyChanged(address(0), strategy);
    }
    
    /**
     * @notice Migrate to a new strategy
     * @param newStrategy The new strategy address
     */
    function migrateStrategy(address newStrategy) external override whenNotPaused onlyAdmin {
        // Remove all liquidity
        if (liquidityAmount > 0) {
            _removeLiquidity(liquidityAmount);
        }
        
        // Collect any remaining fees
        _collectFees();
        
        emit StrategyChanged(address(this), newStrategy);
    }
    
    /**
     * @notice Emergency withdrawal function
     * @return The amount of tokens withdrawn
     */
    function emergencyWithdraw() external override whenNotPaused nonReentrant onlyAdmin returns (uint256) {
        // Remove all liquidity
        if (liquidityAmount > 0) {
            _removeLiquidity(liquidityAmount);
        }
        
        // Collect fees
        _collectFees();
        
        // Transfer all WLD tokens
        uint256 wldBalance = wldToken.balanceOf(address(this));
        if (wldBalance > 0) {
            wldToken.safeTransfer(msg.sender, wldBalance);
        }
        
        // Convert and transfer any USDC
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        if (usdcBalance > 0) {
            uint256 additionalWLD = _swapUSDCToWLD(usdcBalance);
            if (additionalWLD > 0) {
                wldToken.safeTransfer(msg.sender, additionalWLD);
            }
            wldBalance += additionalWLD;
        }
        
        // Reset accounting
        totalDeposited = 0;
        totalShares = 0;
        yieldAmount = 0;
        liquidityAmount = 0;
        
        return wldBalance;
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
     * @notice Update tick range for liquidity provision
     * @param _tickLower The lower tick
     * @param _tickUpper The upper tick
     */
    function updateTickRange(int24 _tickLower, int24 _tickUpper) external onlyAdmin {
        // Remove existing liquidity
        if (liquidityAmount > 0) {
            _removeLiquidity(liquidityAmount);
        }
        
        // Update tick range
        tickLower = _tickLower;
        tickUpper = _tickUpper;
        
        // Re-add liquidity with new range if we have tokens
        uint256 wldBalance = wldToken.balanceOf(address(this));
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        
        if (wldBalance > 0 && usdcBalance > 0) {
            _addLiquidity(wldBalance, usdcBalance);
        }
    }
    
    // Internal functions
    
    /**
     * @notice Swap WLD tokens for USDC
     * @param wldAmount The amount of WLD to swap
     * @return usdcAmount The amount of USDC received
     */
    function _swapWLDToUSDC(uint256 wldAmount) internal returns (uint256 usdcAmount) {
        if (wldAmount == 0) return 0;
        
        wldToken.forceApprove(address(swapRouter), wldAmount);
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(wldToken),
            tokenOut: address(usdcToken),
            fee: POOL_FEE,
            recipient: address(this),
            deadline: block.timestamp + 300, // 5 minutes
            amountIn: wldAmount,
            amountOutMinimum: 0, // In production, calculate minimum based on slippage
            sqrtPriceLimitX96: 0
        });
        
        return swapRouter.exactInputSingle(params);
    }
    
    /**
     * @notice Swap USDC tokens for WLD
     * @param usdcAmount The amount of USDC to swap
     * @return wldAmount The amount of WLD received
     */
    function _swapUSDCToWLD(uint256 usdcAmount) internal returns (uint256 wldAmount) {
        if (usdcAmount == 0) return 0;
        
        usdcToken.forceApprove(address(swapRouter), usdcAmount);
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(usdcToken),
            tokenOut: address(wldToken),
            fee: POOL_FEE,
            recipient: address(this),
            deadline: block.timestamp + 300, // 5 minutes
            amountIn: usdcAmount,
            amountOutMinimum: 0, // In production, calculate minimum based on slippage
            sqrtPriceLimitX96: 0
        });
        
        return swapRouter.exactInputSingle(params);
    }
    
    /**
     * @notice Add liquidity to Uniswap V3 pool
     * @param wldAmount The amount of WLD tokens
     * @param usdcAmount The amount of USDC tokens
     * @return liquidity The amount of liquidity added
     */
    function _addLiquidity(uint256 wldAmount, uint256 usdcAmount) internal returns (uint128 liquidity) {
        if (wldAmount == 0 || usdcAmount == 0) return 0;
        
        // Approve tokens for the pool
        wldToken.forceApprove(address(pool), wldAmount);
        usdcToken.forceApprove(address(pool), usdcAmount);
        
        // Calculate liquidity amount (simplified)
        liquidity = uint128(wldAmount); // Simplified calculation
        
        // Add liquidity to pool
        (uint256 amount0, uint256 amount1) = pool.mint(
            address(this),
            tickLower,
            tickUpper,
            liquidity,
            ""
        );
        
        emit LiquidityAdded(amount0, amount1, liquidity);
        return liquidity;
    }
    
    /**
     * @notice Remove liquidity from Uniswap V3 pool
     * @param liquidity The amount of liquidity to remove
     * @return wldAmount The amount of WLD tokens received
     * @return usdcAmount The amount of USDC tokens received
     */
    function _removeLiquidity(uint128 liquidity) internal returns (uint256 wldAmount, uint256 usdcAmount) {
        if (liquidity == 0) return (0, 0);
        
        // Remove liquidity from pool
        (uint256 amount0, uint256 amount1) = pool.burn(tickLower, tickUpper, liquidity);
        
        // Collect the tokens
        (uint128 collected0, uint128 collected1) = pool.collect(
            address(this),
            tickLower,
            tickUpper,
            uint128(amount0),
            uint128(amount1)
        );
        
        emit LiquidityRemoved(collected0, collected1, liquidity);
        return (collected0, collected1);
    }
    
    /**
     * @notice Collect fees from Uniswap V3 position
     * @return wldFees The amount of WLD fees collected
     * @return usdcFees The amount of USDC fees collected
     */
    function _collectFees() internal returns (uint256 wldFees, uint256 usdcFees) {
        // Collect all available fees
        (uint128 collected0, uint128 collected1) = pool.collect(
            address(this),
            tickLower,
            tickUpper,
            type(uint128).max,
            type(uint128).max
        );
        
        return (collected0, collected1);
    }
    
    /**
     * @notice Callback for Uniswap V3 mint
     * @param amount0Owed The amount of token0 owed
     * @param amount1Owed The amount of token1 owed
     * @param data Additional data
     */
    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata data
    ) external {
        require(msg.sender == address(pool), "UniswapV3Adapter: Invalid caller");
        
        // Pay the owed amounts
        if (amount0Owed > 0) {
            wldToken.safeTransfer(address(pool), amount0Owed);
        }
        if (amount1Owed > 0) {
            usdcToken.safeTransfer(address(pool), amount1Owed);
        }
    }
}