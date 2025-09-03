// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IVRFAdapter.sol";
import "./interfaces/IPrizePool.sol";

/**
 * @title PrizePool
 * @notice Prize pool contract with VRF-based secure random winner selection
 * @dev This contract accumulates yield and distributes it through lottery draws using VRF
 */
contract PrizePool is IPrizePool, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // State variables
    IERC20 public immutable wldToken;
    IVRFAdapter public vrfAdapter;
    
    uint256 public prizeBalance;        // Current prize pool balance
    uint256 public reserveBps = 1000;   // 10% reserve (1000 basis points)
    uint256 public nextDrawAt;          // Timestamp for next draw
    address public lastWinner;          // Address of last winner
    uint256 public drawInterval = 24 hours; // Default draw interval
    
    // Pool contract for getting total tickets
    address public poolContract;
    
    // VRF-related state
    bytes32 public pendingDrawRequestId;
    bool public drawInProgress;
    uint256 public drawStartTime;
    
    // Events
    event YieldAdded(uint256 amount);
    event WinnerDrawn(address indexed winner, uint256 amount);
    event DrawIntervalSet(uint256 newInterval);
    event PoolContractSet(address indexed poolContract);
    event VRFAdapterSet(address indexed vrfAdapter);
    event RandomnessRequested(bytes32 indexed requestId);
    event RandomnessFulfilled(bytes32 indexed requestId, uint256 randomness);
    
    /**
     * @notice Constructor initializes the prize pool contract
     * @param _wldToken The WLD token contract address
     * @param _vrfAdapter The VRF adapter contract address
     * @param _initialOwner The initial owner of the contract
     */
    constructor(
        address _wldToken,
        address _vrfAdapter,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_wldToken != address(0), "Invalid WLD token address");
        require(_vrfAdapter != address(0), "Invalid VRF adapter address");
        
        wldToken = IERC20(_wldToken);
        vrfAdapter = IVRFAdapter(_vrfAdapter);
        nextDrawAt = block.timestamp + drawInterval;
    }
    
    /**
     * @notice Set the pool contract address
     * @param _poolContract The pool contract address
     */
    function setPoolContract(address _poolContract) external onlyOwner {
        require(_poolContract != address(0), "Invalid pool contract address");
        poolContract = _poolContract;
        emit PoolContractSet(_poolContract);
    }
    
    /**
     * @notice Set the VRF adapter address
     * @param _vrfAdapter The VRF adapter address
     */
    function setRandomnessProvider(address _vrfAdapter) external override onlyOwner {
        require(_vrfAdapter != address(0), "Invalid VRF adapter address");
        vrfAdapter = IVRFAdapter(_vrfAdapter);
        emit VRFAdapterSet(_vrfAdapter);
    }
    
    /**
     * @notice Add yield to the prize pool
     * @param amount The amount of yield to add
     */
    function addYield(uint256 amount) external override {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from caller (should be PoolContract)
        wldToken.safeTransferFrom(msg.sender, address(this), amount);
        
        prizeBalance += amount;
        
        emit YieldAdded(amount, prizeBalance);
    }
    
    /**
     * @notice Schedule a new draw
     */
    function scheduleDraw() external override onlyOwner {
        require(!drawInProgress, "Draw already in progress");
        require(block.timestamp >= nextDrawAt, "Draw not ready yet");
        require(prizeBalance > 0, "No prize to distribute");
        
        drawInProgress = true;
        drawStartTime = block.timestamp;
        
        // Request randomness from VRF adapter
        pendingDrawRequestId = vrfAdapter.requestRandomness(address(this), 1);
        
        emit RandomnessRequested(getCurrentDrawId(), pendingDrawRequestId);
    }
    
    /**
     * @notice Add participant to the lottery
     * @param user The user address
     * @param tickets Number of tickets to add
     */
    function addParticipant(address user, uint256 tickets) external override {
        require(msg.sender == poolContract, "Only pool contract can add participants");
        // Implementation handled by pool contract tracking
    }
    
    /**
     * @notice Remove participant from the lottery
     * @param user The user address
     * @param tickets Number of tickets to remove
     */
    function removeParticipant(address user, uint256 tickets) external override {
        require(msg.sender == poolContract, "Only pool contract can remove participants");
        // Implementation handled by pool contract tracking
    }
    
    /**
     * @notice Draw a winner using VRF randomness
     * @dev Called internally after VRF fulfillment
     * @return winner The address of the winner
     */
    function drawWinner() external override nonReentrant returns (address winner) {
        require(drawInProgress, "No draw in progress");
        require(pendingDrawRequestId != bytes32(0), "No pending randomness request");
        require(vrfAdapter.isRequestFulfilled(pendingDrawRequestId), "Randomness not fulfilled");
        require(poolContract != address(0), "Pool contract not set");
        
        // Get total tickets from pool contract
        uint256 totalTickets = _getTotalTickets();
        require(totalTickets > 0, "No participants");
        
        // Calculate prize amount (90% of balance, 10% reserve)
        uint256 prizeAmount = (prizeBalance * (10000 - reserveBps)) / 10000;
        
        // Get randomness from VRF adapter
        uint256[] memory randomWords = vrfAdapter.getRandomness(pendingDrawRequestId);
        uint256 randomNumber = randomWords[0];
        uint256 winningTicket = randomNumber % totalTickets;
        
        // Get winner address from pool contract
        winner = _getWinnerByTicket(winningTicket);
        require(winner != address(0), "Invalid winner");
        
        // Update state
        lastWinner = winner;
        prizeBalance -= prizeAmount;
        nextDrawAt = block.timestamp + drawInterval;
        drawInProgress = false;
        pendingDrawRequestId = bytes32(0);
        
        // Transfer prize to winner
        wldToken.safeTransfer(winner, prizeAmount);
        
        uint256 drawId = getCurrentDrawId();
        emit WinnerSelected(drawId, winner, prizeAmount);
        emit DrawCompleted(drawId, winner, prizeAmount, totalTickets);
        
        return winner;
    }
    
    /**
     * @notice Claim prize for a specific draw
     * @param drawId The draw ID to claim
     */
    function claimPrize(uint256 drawId) external override {
        // For this implementation, prizes are auto-transferred
        // This function is kept for interface compatibility
        revert("Prizes are automatically transferred");
    }
    
    /**
     * @notice Fulfill randomness from VRF adapter
     * @param requestId The request ID
     * @param randomness The random number
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) external override {
        require(msg.sender == address(vrfAdapter), "Only VRF adapter can fulfill");
        require(requestId == pendingDrawRequestId, "Invalid request ID");
        
        emit RandomnessFulfilled(requestId, randomness);
        
        // Auto-execute draw after randomness is fulfilled
        this.drawWinner();
    }
    
    /**
     * @notice Get current prize amount
     * @return The current prize balance
     */
    function getCurrentPrizeAmount() external view override returns (uint256) {
        return prizeBalance;
    }
    
    /**
     * @notice Get next draw time
     * @return The timestamp of the next draw
     */
    function getNextDrawTime() external view override returns (uint256) {
        return nextDrawAt;
    }
    
    /**
     * @notice Get current draw ID
     * @return The current draw identifier
     */
    function getCurrentDrawId() public view override returns (uint256) {
        return block.timestamp / drawInterval;
    }
    
    /**
     * @notice Get draw information
     * @param drawId The draw ID
     * @return prizeAmount The prize amount for the draw
     * @return winner The winner address
     * @return drawTime The draw timestamp
     * @return completed Whether the draw is completed
     * @return participants Number of participants
     */
    function getDrawInfo(uint256 drawId) external view override returns (
        uint256 prizeAmount,
        address winner,
        uint256 drawTime,
        bool completed,
        uint256 participants
    ) {
        // Simplified implementation for current draw
        uint256 currentDrawId = getCurrentDrawId();
        if (drawId == currentDrawId) {
            return (
                (prizeBalance * (10000 - reserveBps)) / 10000,
                lastWinner,
                nextDrawAt,
                !drawInProgress,
                _getTotalTickets()
            );
        }
        return (0, address(0), 0, false, 0);
    }
    
    /**
     * @notice Get user participation info
     * @param user The user address
     * @return eligible Whether user is eligible
     * @return tickets Number of tickets
     */
    function getUserParticipation(address user) external view override returns (bool eligible, uint256 tickets) {
        // Simplified implementation - check if user has balance in pool contract
        if (poolContract != address(0)) {
            try IERC20(wldToken).balanceOf(user) returns (uint256 balance) {
                return (balance > 0, balance);
            } catch {
                return (false, 0);
            }
        }
        return (false, 0);
    }
    
    /**
     * @notice Set the draw interval
     * @param interval The new draw interval in seconds
     */
    function setDrawInterval(uint256 interval) external override onlyOwner {
        require(interval > 0, "Interval must be greater than 0");
        require(interval >= 5 minutes, "Interval too short - minimum 5 minutes");
        
        drawInterval = interval;
        
        // Update next draw time if current draw hasn't happened yet
        if (block.timestamp < nextDrawAt) {
            nextDrawAt = block.timestamp + drawInterval;
        }
        
        emit DrawIntervalSet(interval);
    }
    
    /**
     * @notice Get current prize pool information
     * @return balance Current prize balance
     * @return nextDraw Timestamp of next draw
     * @return winner Address of last winner
     */
    function getPrizeInfo() external view returns (
        uint256 balance,
        uint256 nextDraw,
        address winner
    ) {
        return (prizeBalance, nextDrawAt, lastWinner);
    }
    
    /**
     * @notice Check if a draw is ready
     * @return ready True if draw can be executed
     */
    function isDrawReady() external view returns (bool ready) {
        return block.timestamp >= nextDrawAt && prizeBalance > 0;
    }
    
    /**
     * @notice Emergency withdraw function for owner
     */
    function emergencyWithdraw() external override onlyOwner {
        uint256 amount = prizeBalance;
        require(amount > 0, "No balance to withdraw");
        
        prizeBalance = 0;
        drawInProgress = false;
        pendingDrawRequestId = bytes32(0);
        
        wldToken.safeTransfer(owner(), amount);
    }
    
    /**
     * @notice Get total tickets from pool contract
     * @dev This is a simplified implementation for POC
     * @return totalTickets Total number of tickets
     */
    function _getTotalTickets() internal view returns (uint256 totalTickets) {
        if (poolContract == address(0)) return 0;
        
        // Call pool contract to get total deposited amount
        // Each WLD deposited = 1 ticket for simplicity
        try IERC20(wldToken).balanceOf(poolContract) returns (uint256 balance) {
            return balance;
        } catch {
            return 0;
        }
    }
    
    /**
     * @notice Get winner address by ticket number
     * @dev Simplified implementation for POC - uses pool contract balance as proxy
     * @param ticketNumber The winning ticket number
     * @return winner The winner address
     */
    function _getWinnerByTicket(uint256 ticketNumber) internal view returns (address winner) {
        // For POC, we'll use a simplified approach
        // In a real implementation, this would query the pool contract for user balances
        // and determine the winner based on their proportional share
        
        // For now, return the pool contract owner as a placeholder
        // This should be replaced with actual user selection logic
        if (poolContract != address(0)) {
            try Ownable(poolContract).owner() returns (address poolOwner) {
                return poolOwner;
            } catch {
                return address(0);
            }
        }
        
        return address(0);
    }
}