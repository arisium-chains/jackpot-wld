// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BaseContract.sol";
import "./interfaces/IPoolContract.sol";
import "./interfaces/IYieldAdapter.sol";
import "./interfaces/IPrizePool.sol";
import "./interfaces/IWorldID.sol";
import "./libraries/Errors.sol";
import "./libraries/Constants.sol";
import "./libraries/Math.sol";
import "./mocks/MockWorldID.sol";

// Add using statements
using WorldIDUtils for bytes;

/**
 * @title PoolContract
 * @notice Main pool contract that handles user deposits and withdrawals
 * @dev Integrates with World ID verification and yield generation mechanisms
 */
contract PoolContract is BaseContract, IPoolContract {
    // State variables
    IERC20 public immutable wldToken;
    IWorldID public worldId;
    IYieldAdapter public yieldAdapter;
    IPrizePool public prizePool;

    // User data
    mapping(address => uint256) private userBalances;
    mapping(address => bool) private verifiedUsers;
    mapping(uint256 => bool) private usedNullifiers;

    // Pool state
    uint256 private totalDeposits;
    uint256 private totalYieldGenerated;
    uint256 private lastYieldAccrual;
    uint256 private participantCount;
    
    // Yield harvesting configuration
    uint256 public yieldHarvestThreshold = 100 * 1e18; // 100 WLD minimum to harvest
    uint256 public yieldHarvestInterval = 24 hours; // Harvest at least once per day

    // World ID configuration
    uint256 public immutable worldIdGroupId;
    string public constant WORLD_ID_ACTION = "pool-together-deposit";

    /**
     * @notice Constructor initializes the pool contract
     * @param _wldToken The WLD token contract address
     * @param _worldId The World ID router contract address
     * @param _worldIdGroupId The World ID group ID for verification
     * @param _initialOwner The initial owner of the contract
     */
    constructor(
        address _wldToken,
        address _worldId,
        uint256 _worldIdGroupId,
        address _initialOwner
    ) BaseContract(_initialOwner) {
        if (_wldToken == address(0)) revert Errors.ZeroAddress();
        if (_worldId == address(0)) revert Errors.ZeroAddress();

        wldToken = IERC20(_wldToken);
        worldId = IWorldID(_worldId);
        worldIdGroupId = _worldIdGroupId;
        lastYieldAccrual = block.timestamp;
    }

    /**
     * @notice Deposit WLD tokens into the pool
     * @param amount The amount of WLD tokens to deposit
     * @dev Requires World ID verification and valid amount
     */
    function deposit(uint256 amount) 
        external 
        override 
        whenNotPaused 
        nonReentrant 
        validAmount(amount) 
    {
        address user = msg.sender;
        
        // Check World ID verification
        if (!verifiedUsers[user]) {
            revert Errors.NotWorldIdVerified(user);
        }

        // Validate deposit amount
        if (amount < Constants.MIN_DEPOSIT_AMOUNT) {
            revert Errors.BelowMinLimit(amount, Constants.MIN_DEPOSIT_AMOUNT);
        }
        if (amount > Constants.MAX_DEPOSIT_AMOUNT) {
            revert Errors.ExceedsMaxLimit(amount, Constants.MAX_DEPOSIT_AMOUNT);
        }

        // Check user's token balance
        uint256 userTokenBalance = wldToken.balanceOf(user);
        if (userTokenBalance < amount) {
            revert Errors.InsufficientBalance(amount, userTokenBalance);
        }

        // Transfer tokens from user to contract
        _safeTransferFrom(address(wldToken), user, address(this), amount);

        // Track new participants
        bool isNewParticipant = userBalances[user] == 0;
        
        // Update user balance and total deposits
        userBalances[user] += amount;
        totalDeposits += amount;
        
        // Update participant count for new users
        if (isNewParticipant) {
            participantCount++;
        }

        // Route funds to yield generation if adapter is set
        if (address(yieldAdapter) != address(0)) {
            wldToken.approve(address(yieldAdapter), amount);
            yieldAdapter.deposit(amount);
        }

        // Add user as participant in prize pool if prize pool is set
        if (address(prizePool) != address(0)) {
            prizePool.addParticipant(user, amount);
        }

        // Check if we should harvest yield automatically
        _checkAndHarvestYield();

        emit Deposit(user, amount, userBalances[user]);
    }

    /**
     * @notice Withdraw WLD tokens from the pool
     * @param amount The amount of WLD tokens to withdraw
     * @dev Can only withdraw up to the user's principal deposit
     */
    function withdraw(uint256 amount) 
        external 
        override 
        whenNotPaused 
        nonReentrant 
        validAmount(amount) 
    {
        address user = msg.sender;
        uint256 userBalance = userBalances[user];

        // Check if user has sufficient balance
        if (userBalance < amount) {
            revert Errors.InsufficientBalance(amount, userBalance);
        }

        // Validate withdrawal amount
        if (amount < Constants.MIN_WITHDRAWAL_AMOUNT) {
            revert Errors.BelowMinLimit(amount, Constants.MIN_WITHDRAWAL_AMOUNT);
        }

        // Check if withdrawal exceeds user's deposit
        if (amount > userBalance) {
            revert Errors.WithdrawalExceedsDeposit(amount, userBalance);
        }

        // Withdraw from yield adapter if needed
        uint256 availableBalance = wldToken.balanceOf(address(this));
        if (availableBalance < amount && address(yieldAdapter) != address(0)) {
            // Calculate shares to withdraw from yield adapter
            uint256 totalShares = yieldAdapter.getTotalShares();
            uint256 totalAssets = yieldAdapter.getTotalDeposited();
            uint256 sharesToWithdraw = Math.calculateShares(amount - availableBalance, totalShares, totalAssets);
            
            yieldAdapter.withdraw(sharesToWithdraw);
        }

        // Final balance check
        availableBalance = wldToken.balanceOf(address(this));
        if (availableBalance < amount) {
            revert Errors.InsufficientBalance(amount, availableBalance);
        }

        // Check if user will have zero balance after withdrawal
        bool willBeZeroBalance = userBalances[user] == amount;
        
        // Update user balance and total deposits
        userBalances[user] -= amount;
        totalDeposits -= amount;
        
        // Update participant count if user withdraws everything
        if (willBeZeroBalance) {
            participantCount--;
        }

        // Transfer tokens to user
        _safeTransfer(address(wldToken), user, amount);

        // Remove user as participant in prize pool if prize pool is set
        if (address(prizePool) != address(0)) {
            prizePool.removeParticipant(user, amount);
        }

        emit Withdraw(user, amount, userBalances[user]);
    }

    /**
     * @notice Verify a user with World ID
     * @param user The user address to verify
     * @param root The root of the Merkle tree
     * @param nullifierHash The nullifier hash to prevent double-spending
     * @param proof The zero-knowledge proof
     */
    function verifyUser(
        address user,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external override whenNotPaused {
        // Check if user is already verified
        if (verifiedUsers[user]) {
            revert Errors.UserAlreadyVerified(user);
        }

        // Check if nullifier has been used
        if (usedNullifiers[nullifierHash]) {
            revert Errors.InvalidWorldIdProof();
        }

        // For mock World ID, check if user is pre-verified
        // In production, this would call the actual World ID verification
        if (address(worldId) != address(0)) {
            // Check if this is a mock World ID contract
            try MockWorldID(address(worldId)).isVerified(user) returns (bool isVerified) {
                if (!isVerified) {
                    revert Errors.InvalidWorldIdProof();
                }
            } catch {
                // If it's not a mock, try the real World ID verification
                try worldId.verifyProof(
                    root,
                    worldIdGroupId,
                    abi.encodePacked(WORLD_ID_ACTION).hashToField(),
                    nullifierHash,
                    abi.encodePacked(user).hashToField(),
                    proof
                ) {
                    // Verification successful
                } catch {
                    revert Errors.InvalidWorldIdProof();
                }
            }
        }

        // Mark user as verified and nullifier as used
        verifiedUsers[user] = true;
        usedNullifiers[nullifierHash] = true;
        
        emit UserVerified(user);
    }

    /**
     * @notice Accrue yield from the yield adapter to the prize pool
     * @dev Can be called by operators to harvest yield
     */
    function accrueYield() external override onlyOperator whenNotPaused nonReentrant {
        if (address(yieldAdapter) == address(0)) {
            revert Errors.StrategyNotSet();
        }
        if (address(prizePool) == address(0)) {
            revert Errors.InvalidConfiguration();
        }

        // Harvest yield from adapter
        uint256 yieldAmount = yieldAdapter.harvestYield();
        
        if (yieldAmount > 0) {
            totalYieldGenerated += yieldAmount;
            lastYieldAccrual = block.timestamp;

            // Transfer yield to prize pool
            wldToken.approve(address(prizePool), yieldAmount);
            prizePool.addYield(yieldAmount);

            emit YieldAccrued(yieldAmount, totalYieldGenerated);
        }
    }

    /**
     * @notice Set the yield adapter contract
     * @param adapter The yield adapter contract address
     */
    function setYieldAdapter(address adapter) external override onlyAdmin validAddress(adapter) {
        yieldAdapter = IYieldAdapter(adapter);
    }

    /**
     * @notice Set the prize pool contract
     * @param _prizePool The prize pool contract address
     */
    function setPrizePool(address _prizePool) external override onlyAdmin validAddress(_prizePool) {
        prizePool = IPrizePool(_prizePool);
    }
    
    /**
     * @notice Remove the yield adapter contract
     * @dev Admin function to reset yield adapter to zero address
     */
    function removeYieldAdapter() external onlyAdmin {
        yieldAdapter = IYieldAdapter(address(0));
    }

    /**
     * @notice Get user's deposit balance
     * @param user The user address
     * @return The user's balance
     */
    function getUserBalance(address user) external view override returns (uint256) {
        return userBalances[user];
    }

    /**
     * @notice Get total deposits in the pool
     * @return The total deposits
     */
    function getTotalDeposits() external view override returns (uint256) {
        return totalDeposits;
    }

    /**
     * @notice Get total yield generated by the pool
     * @return The total yield generated
     */
    function getTotalYieldGenerated() external view override returns (uint256) {
        return totalYieldGenerated;
    }

    /**
     * @notice Check if a user is World ID verified
     * @param user The user address
     * @return True if the user is verified
     */
    function isUserVerified(address user) external view override returns (bool) {
        return verifiedUsers[user];
    }

    /**
     * @notice Get the current APY from the yield adapter
     * @return The current APY in basis points
     */
    function getCurrentAPY() external view returns (uint256) {
        if (address(yieldAdapter) == address(0)) return 0;
        return yieldAdapter.getAPY();
    }

    /**
     * @notice Get pool statistics
     * @return totalDeposits_ The total deposits
     * @return totalYield The total yield generated
     * @return participantCount_ The number of verified participants
     * @return currentAPY The current APY
     */
    function getPoolStats() external view returns (
        uint256 totalDeposits_,
        uint256 totalYield,
        uint256 participantCount_,
        uint256 currentAPY
    ) {
        totalDeposits_ = totalDeposits;
        totalYield = totalYieldGenerated;
        participantCount_ = participantCount;
        currentAPY = address(yieldAdapter) != address(0) ? yieldAdapter.getAPY() : 0;
    }
    
    /**
     * @notice Check if yield should be harvested and harvest if conditions are met
     * @dev Internal function called during deposits to optimize yield collection
     */
    function _checkAndHarvestYield() internal {
        if (address(yieldAdapter) == address(0) || address(prizePool) == address(0)) {
            return;
        }
        
        // Check if enough time has passed since last harvest
        bool timeConditionMet = block.timestamp >= lastYieldAccrual + yieldHarvestInterval;
        
        // Check if there's enough pending yield to harvest
        uint256 pendingYield = yieldAdapter.getYield();
        bool yieldConditionMet = pendingYield >= yieldHarvestThreshold;
        
        // Harvest if either condition is met
        if (timeConditionMet || yieldConditionMet) {
            uint256 yieldAmount = yieldAdapter.harvestYield();
            
            if (yieldAmount > 0) {
                totalYieldGenerated += yieldAmount;
                lastYieldAccrual = block.timestamp;

                // Transfer yield to prize pool
                wldToken.approve(address(prizePool), yieldAmount);
                prizePool.addYield(yieldAmount);

                emit YieldAccrued(yieldAmount, totalYieldGenerated);
            }
        }
    }
    
    /**
     * @notice Set yield harvest threshold (admin only)
     * @param threshold The new threshold amount
     */
    function setYieldHarvestThreshold(uint256 threshold) external onlyAdmin {
        yieldHarvestThreshold = threshold;
    }
    
    /**
     * @notice Set yield harvest interval (admin only)
     * @param interval The new interval in seconds
     */
    function setYieldHarvestInterval(uint256 interval) external onlyAdmin {
        require(interval >= 1 hours, "Interval too short");
        yieldHarvestInterval = interval;
    }

    /**
     * @notice Emergency withdrawal function (admin only)
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     * @param to The recipient address
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner validAddress(to) validAmount(amount) {
        _safeTransfer(token, to, amount);
    }

    /**
     * @notice Update World ID router (admin only)
     * @param _worldId The new World ID router address
     */
    function updateWorldId(address _worldId) external onlyAdmin validAddress(_worldId) {
        worldId = IWorldID(_worldId);
    }

    /**
     * @notice Harvest yield and fund prize pool (admin convenience function)
     * @dev Calls accrueYield internally
     */
    function harvestAndFundPrize() external onlyAdmin {
        this.accrueYield();
    }

    /**
     * @notice Get comprehensive pool information including prize balance
     * @return totalDeposits_ The total deposits in the pool
     * @return totalYield The total yield generated
     * @return participantCount_ The number of verified participants
     * @return currentAPY The current APY from yield adapter
     * @return prizeBalance The current prize pool balance
     */
    function getPoolInfo() external view returns (
        uint256 totalDeposits_,
        uint256 totalYield,
        uint256 participantCount_,
        uint256 currentAPY,
        uint256 prizeBalance
    ) {
        totalDeposits_ = totalDeposits;
        totalYield = totalYieldGenerated;
        participantCount_ = participantCount;
        currentAPY = address(yieldAdapter) != address(0) ? yieldAdapter.getAPY() : 0;
        prizeBalance = address(prizePool) != address(0) ? prizePool.getCurrentPrizeAmount() : 0;
    }
}