// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BaseContract.sol";
import "./interfaces/IPrizePool.sol";
import "./interfaces/IPoolContract.sol";
import "./libraries/Errors.sol";
import "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "./mocks/MockVRFCoordinator.sol";

/**
 * @title PrizePool
 * @notice Prize pool contract that manages lottery draws and prize distribution
 * @dev This contract accumulates yield and distributes it through periodic lottery draws
 */
contract PrizePool is BaseContract, IPrizePool, VRFConsumerBaseV2 {
    using SafeERC20 for IERC20;

    // State variables
    IERC20 public immutable wldToken;
    VRFCoordinatorV2Interface public vrfCoordinator;
    
    uint256 public drawInterval;  // Time between draws in seconds
    uint256 public nextDrawTime;
    uint256 public currentDrawId;
    
    uint256 public prizePoolAmount;  // Total amount in the prize pool
    
    // Draw information
    struct DrawInfo {
        uint256 prizeAmount;
        address winner;
        uint256 drawTime;
        bool completed;
        uint256 participants;  // Number of eligible participants
    }
    
    mapping(uint256 => DrawInfo) public draws;
    
    // User participation tracking
    mapping(address => bool) public userParticipatedInCurrentDraw;
    mapping(address => uint256) public userTickets;  // Number of tickets per user
    mapping(uint256 => address[]) public drawParticipants;
    mapping(uint256 => mapping(address => uint256)) public participantIndex; // For efficient removal
    
    // VRF configuration
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    uint32 public numWords;
    
    // Mock testing compatibility
    address public randomnessProvider;
    
    // Pending randomness requests
    struct RandomnessRequest {
        uint256 drawId;
        bool fulfilled;
    }
    
    mapping(uint256 => RandomnessRequest) public randomnessRequests;
    mapping(uint256 => bytes32) public drawRequestIds;
    
    /**
     * @notice Constructor initializes the prize pool contract
     * @param _wldToken The WLD token contract address
     * @param _initialOwner The initial owner of the contract
     * @param _drawInterval The time interval between draws in seconds
     * @param _vrfCoordinator The VRF coordinator address (can be zero for testing)
     */
    constructor(
        address _wldToken,
        address _initialOwner,
        uint256 _drawInterval,
        address _vrfCoordinator
    ) BaseContract(_initialOwner) VRFConsumerBaseV2(_vrfCoordinator) {
        if (_wldToken == address(0)) revert Errors.ZeroAddress();
        if (_drawInterval == 0) revert Errors.InvalidAmount(_drawInterval);
        
        wldToken = IERC20(_wldToken);
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        
        drawInterval = _drawInterval;
        nextDrawTime = block.timestamp + drawInterval;
        currentDrawId = 1;
        
        // VRF configuration defaults
        subscriptionId = 1;
        keyHash = bytes32(0);
        callbackGasLimit = 200000;
        requestConfirmations = 3;
        numWords = 1;
    }
    
    /**
     * @notice Add yield to the prize pool
     * @param amount The amount of yield to add
     */
    function addYield(uint256 amount) external override {
        if (amount == 0) revert Errors.InvalidAmount(amount);
        
        // Transfer tokens from caller (should be PoolContract)
        wldToken.safeTransferFrom(msg.sender, address(this), amount);
        
        prizePoolAmount += amount;
        
        emit YieldAdded(amount, prizePoolAmount);
    }
    
    /**
     * @notice Schedule the next lottery draw
     */
    function scheduleDraw() external override {
        if (paused()) revert Errors.ContractPaused();
        // Can only schedule a new draw if the current one is completed or past due
        DrawInfo storage currentDraw = draws[currentDrawId];
        if (!currentDraw.completed && block.timestamp < nextDrawTime) {
            revert Errors.DrawNotReady(block.timestamp, nextDrawTime);
        }
        
        // If there's an uncompleted draw, complete it with no winner
        if (!currentDraw.completed) {
            currentDraw.completed = true;
            currentDraw.drawTime = block.timestamp;
            emit DrawCompleted(currentDrawId, address(0), 0, currentDraw.participants);
        }
        
        // Increment draw ID and set next draw time
        currentDrawId++;
        nextDrawTime = block.timestamp + drawInterval;
        
        draws[currentDrawId].drawTime = nextDrawTime;
        draws[currentDrawId].prizeAmount = prizePoolAmount;
        
        emit DrawScheduled(currentDrawId, nextDrawTime);
    }
    
    /**
     * @notice Draw a winner for the current lottery
     * @return winner The address of the winner
     */
    function drawWinner() external override returns (address) {
        if (paused()) revert Errors.ContractPaused();
        DrawInfo storage currentDraw = draws[currentDrawId];
        
        // Check if draw is ready
        if (block.timestamp < nextDrawTime) {
            revert Errors.DrawNotReady(block.timestamp, nextDrawTime);
        }
        
        // Check if draw is already completed
        if (currentDraw.completed) {
            revert Errors.DrawAlreadyCompleted(currentDrawId);
        }
        
        // Check if there are participants
        if (drawParticipants[currentDrawId].length == 0) {
            revert Errors.NoEligibleParticipants();
        }
        
        uint256 requestId;
        // If VRF coordinator is set, request randomness from Chainlink
        if (address(vrfCoordinator) != address(0)) {
            // Request randomness from VRF Coordinator
            requestId = vrfCoordinator.requestRandomWords(
                keyHash,
                subscriptionId,
                requestConfirmations,
                callbackGasLimit,
                numWords
            );
            
            // Store the request ID
            randomnessRequests[requestId] = RandomnessRequest({
                drawId: currentDrawId,
                fulfilled: false
            });
            drawRequestIds[currentDrawId] = bytes32(requestId);
            
        } else if (randomnessProvider != address(0)) {
            // Request randomness from the randomness provider (mock coordinator)
            requestId = MockVRFCoordinator(randomnessProvider).requestRandomWords(
                keyHash,
                subscriptionId,
                requestConfirmations,
                callbackGasLimit,
                numWords
            );
            
            // Store the request ID
            randomnessRequests[requestId] = RandomnessRequest({
                drawId: currentDrawId,
                fulfilled: false
            });
            drawRequestIds[currentDrawId] = bytes32(requestId);
            
        } else {
            // For direct testing without VRF or provider, generate a pseudo-random request ID
            requestId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, currentDrawId)));
            
            // Store the request ID
            randomnessRequests[requestId] = RandomnessRequest({
                drawId: currentDrawId,
                fulfilled: false
            });
            drawRequestIds[currentDrawId] = bytes32(requestId);
            
            // Immediately fulfill with pseudo-random value for testing
            uint256 randomness = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, currentDrawId)));
            _fulfillRandomness(requestId, randomness);
        }
        
        // Store draw information
        currentDraw.drawTime = block.timestamp;
        currentDraw.prizeAmount = prizePoolAmount;
        
        emit RandomnessRequested(currentDrawId, bytes32(requestId));
        
        // Return a placeholder - actual winner will be determined in fulfillRandomWords
        return address(0x1);
    }
    
    /**
     * @notice Claim prize for winning a draw
     * @param drawId The draw ID to claim
     */
    function claimPrize(uint256 drawId) external override nonReentrant {
        if (paused()) revert Errors.ContractPaused();
        DrawInfo storage draw = draws[drawId];
        
        // Check if draw exists
        if (drawId == 0 || drawId > currentDrawId) {
            revert Errors.InvalidDrawId(drawId);
        }
        
        // Check if draw is completed
        if (!draw.completed) {
            revert Errors.DrawNotReady(block.timestamp, draw.drawTime);
        }
        
        // Check if sender is the winner
        if (draw.winner != msg.sender) {
            revert Errors.NotWinner(msg.sender, drawId);
        }
        
        // Check if prize was already claimed
        if (draw.prizeAmount == 0) {
            revert Errors.PrizeAlreadyClaimed(drawId);
        }
        
        // Transfer prize to winner
        uint256 prizeAmount = draw.prizeAmount;
        draw.prizeAmount = 0;  // Mark as claimed
        
        wldToken.safeTransfer(msg.sender, prizeAmount);
        
        emit WinnerSelected(drawId, msg.sender, prizeAmount);
    }
    
    /**
     * @notice Get the current prize amount
     * @return The current prize amount
     */
    function getCurrentPrizeAmount() external view override returns (uint256) {
        return prizePoolAmount;
    }
     
     /**
      * @notice Set VRF configuration for Chainlink integration
      * @param _vrfCoordinator The VRF coordinator address
      * @param _subscriptionId The subscription ID
      * @param _keyHash The key hash
      * @param _callbackGasLimit The callback gas limit
      * @param _requestConfirmations The request confirmations
      * @param _numWords The number of words
      */
     function setVRFConfig(
         address _vrfCoordinator,
         uint64 _subscriptionId,
         bytes32 _keyHash,
         uint32 _callbackGasLimit,
         uint16 _requestConfirmations,
         uint32 _numWords
     ) external onlyAdmin {
         vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
         subscriptionId = _subscriptionId;
         keyHash = _keyHash;
         callbackGasLimit = _callbackGasLimit;
         requestConfirmations = _requestConfirmations;
         numWords = _numWords;
     }
     
     /**
      * @notice Set the randomness provider (for mock testing)
      * @param provider The randomness provider address
      */
     function setRandomnessProvider(address provider) external override onlyAdmin {
         randomnessProvider = provider;
     }
    
    /**
     * @notice Get the next draw time
     * @return The next draw time
     */
    function getNextDrawTime() external view override returns (uint256) {
        return nextDrawTime;
    }
    
    /**
     * @notice Get the current draw ID
     * @return The current draw ID
     */
    function getCurrentDrawId() external view override returns (uint256) {
        return currentDrawId;
    }
    
    /**
     * @notice Get draw information
     * @param drawId The draw ID
     * @return prizeAmount The prize amount for this draw
     * @return winner The winner of this draw
     * @return drawTime The time of the draw
     * @return completed Whether the draw is completed
     * @return participants The number of participants in this draw
     */
    function getDrawInfo(uint256 drawId) external view override returns (
        uint256 prizeAmount,
        address winner,
        uint256 drawTime,
        bool completed,
        uint256 participants
    ) {
        DrawInfo storage draw = draws[drawId];
        return (
            draw.prizeAmount,
            draw.winner,
            draw.drawTime,
            draw.completed,
            draw.participants
        );
    }
    
    /**
     * @notice Get user participation status
     * @param user The user address
     * @return eligible Whether the user is eligible for the current draw
     * @return tickets The number of tickets the user has
     */
    function getUserParticipation(address user) external view override returns (bool eligible, uint256 tickets) {
        eligible = userParticipatedInCurrentDraw[user];
        tickets = userTickets[user];
    }
    
    /**
     * @notice Add a participant to the current draw
     * @param user The user address to add as participant
     * @param tickets The number of tickets to give the user
     */
    function addParticipant(address user, uint256 tickets) external override {
        // Check if user is already participating in current draw
        if (!userParticipatedInCurrentDraw[user]) {
            userParticipatedInCurrentDraw[user] = true;
            drawParticipants[currentDrawId].push(user);
            participantIndex[currentDrawId][user] = drawParticipants[currentDrawId].length - 1; // 0-indexed
        }
        
        // Update user tickets
        userTickets[user] += tickets;
        
        // participants counter is not used for actual logic, we'll use the array length instead
    }
    
    /**
     * @notice Remove a participant from the current draw
     * @param user The user address to remove
     * @param tickets The number of tickets to remove from the user
     */
    function removeParticipant(address user, uint256 tickets) external override {
        // Check if user was participating
        if (!userParticipatedInCurrentDraw[user]) revert Errors.NotWinner(user, currentDrawId);
        
        // Update user tickets (cannot go below zero)
        if (userTickets[user] < tickets) revert Errors.InsufficientBalance(tickets, userTickets[user]);
        userTickets[user] -= tickets;
        
        // If user has no more tickets, remove them as participant
        if (userTickets[user] == 0) {
            userParticipatedInCurrentDraw[user] = false;
            
            // Remove from draw participants array efficiently
            uint256 index = participantIndex[currentDrawId][user];
            address[] storage participants = drawParticipants[currentDrawId];
            if (index < participants.length) {  // Check if index is valid
                // Replace with last element if not already the last element
                if (index != participants.length - 1) {
                    address lastParticipant = participants[participants.length - 1];
                    participants[index] = lastParticipant;
                    participantIndex[currentDrawId][lastParticipant] = index;
                }
                // Remove last element
                participants.pop();
                
                // Clean up index mapping (optional but good practice)
                delete participantIndex[currentDrawId][user];
            }
        }
    }
    
    /**
     * @notice Set the draw interval
     * @param interval The draw interval in seconds
     */
    function setDrawInterval(uint256 interval) external override onlyAdmin {
        if (interval == 0) revert Errors.InvalidAmount(interval);
        drawInterval = interval;
    }
    
    /**
     * @notice Pause the contract (admin only)
     */
    function pause() external override onlyAdmin {
        _pause();
    }
    
    /**
     * @notice Unpause the contract (admin only)
     */
    function unpause() external override onlyAdmin {
        _unpause();
    }
    
    
    /**
     * @notice Emergency withdrawal function
     */
    function emergencyWithdraw() external override onlyOwner {
        if (!paused()) revert Errors.ExpectedPause();
        
        uint256 balance = wldToken.balanceOf(address(this));
        if (balance == 0) revert Errors.InsufficientBalance(1, 0);
        
        wldToken.safeTransfer(msg.sender, balance);
        
        // Reset accounting
        prizePoolAmount = 0;
    }
    
    
    /**
     * @notice Fulfill randomness request from VRF Coordinator
     * @param requestId The request ID
     * @param randomWords The random words generated
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        _fulfillRandomness(requestId, randomWords[0]);
    }
    
    /**
     * @notice Fulfill randomness request (for mock testing)
     * @param requestId The request ID (bytes32)
     * @param randomness The random number
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) external override {
        // For mock testing, convert bytes32 requestId to uint256
        uint256 requestIdUint = uint256(requestId);
        _fulfillRandomness(requestIdUint, randomness);
    }
    
    /**
     * @notice Internal function to fulfill randomness requests
     * @param requestId The request ID (uint256)
     * @param randomness The random number
     */
    function _fulfillRandomness(uint256 requestId, uint256 randomness) internal {
        if (paused()) revert Errors.ContractPaused();
        
        RandomnessRequest storage request = randomnessRequests[requestId];
        if (request.fulfilled) revert Errors.RandomnessNotAvailable();
        
        request.fulfilled = true;
        
        // Select winner based on randomness
        address winner = _selectWinner(randomness, request.drawId);
        
        DrawInfo storage draw = draws[request.drawId];
        draw.winner = winner;
        draw.completed = true;
        draw.participants = drawParticipants[request.drawId].length;
        uint256 prizeAmount = prizePoolAmount;
        draw.prizeAmount = prizeAmount; // Store the prize amount for this draw
        
        // Reset prize pool amount as it's been allocated to this draw
        prizePoolAmount = 0;
        
        // Clear participants for the completed draw to save gas
        _clearDrawParticipants(request.drawId);
        
        // Automatically schedule the next draw
        _scheduleNextDraw();
        
        emit DrawCompleted(request.drawId, winner, prizeAmount, draw.participants);
        emit WinnerSelected(request.drawId, winner, prizeAmount);
    }
    
    /**
     * @notice Reset user participation for the next draw
     * @param completedDrawId The completed draw ID
     */
    function _resetUserParticipation(uint256 completedDrawId) internal {
        address[] memory participants = drawParticipants[completedDrawId];
        for (uint256 i = 0; i < participants.length; i++) {
            userParticipatedInCurrentDraw[participants[i]] = false;
            userTickets[participants[i]] = 0;
        }
    }
    
    /**
     * @notice Clear participants for a completed draw to save gas
     * @param drawId The draw ID to clear participants for
     */
    function _clearDrawParticipants(uint256 drawId) internal {
        address[] storage participants = drawParticipants[drawId];
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            userParticipatedInCurrentDraw[participant] = false;
            userTickets[participant] = 0;
            delete participantIndex[drawId][participant];
        }
        delete drawParticipants[drawId];
    }
    
    /**
     * @notice Automatically schedule the next draw
     */
    function _scheduleNextDraw() internal {
        currentDrawId++;
        nextDrawTime = block.timestamp + drawInterval;
        
        draws[currentDrawId].drawTime = nextDrawTime;
        
        emit DrawScheduled(currentDrawId, nextDrawTime);
    }
    
    /**
     * @notice Select winner based on randomness
     * @param randomness The random number
     * @param drawId The draw ID to select winner for
     * @return winner The address of the winner
     */
    function _selectWinner(uint256 randomness, uint256 drawId) internal view returns (address winner) {
        uint256 participantsCount = drawParticipants[drawId].length;
        
        // Check if there are eligible participants
        if (participantsCount == 0) revert Errors.NoEligibleParticipants();
        
        // Use randomness to select a winner from the current draw participants
        uint256 winnerIndex = randomness % participantsCount;
        winner = drawParticipants[drawId][winnerIndex];
    }
}