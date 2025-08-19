// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPrizePool
 * @notice Interface for the prize pool contract that manages lottery draws and prize distribution
 * @dev This contract accumulates yield and distributes it through periodic lottery draws
 */
interface IPrizePool {
    // Events
    event YieldAdded(uint256 amount, uint256 totalPrizePool);
    event DrawScheduled(uint256 drawId, uint256 drawTime);
    event WinnerSelected(uint256 indexed drawId, address indexed winner, uint256 prizeAmount);
    event DrawCompleted(uint256 indexed drawId, address winner, uint256 prizeAmount, uint256 participants);
    event RandomnessRequested(uint256 indexed drawId, bytes32 requestId);
    
    // Core lottery functions
    function addYield(uint256 amount) external;
    function scheduleDraw() external;
    function drawWinner() external returns (address winner);
    function claimPrize(uint256 drawId) external;
    
    // Participant management functions
    function addParticipant(address user, uint256 tickets) external;
    function removeParticipant(address user, uint256 tickets) external;
    
    // View functions
    function getCurrentPrizeAmount() external view returns (uint256);
    function getNextDrawTime() external view returns (uint256);
    function getCurrentDrawId() external view returns (uint256);
    function getDrawInfo(uint256 drawId) external view returns (
        uint256 prizeAmount,
        address winner,
        uint256 drawTime,
        bool completed,
        uint256 participants
    );
    function getUserParticipation(address user) external view returns (bool eligible, uint256 tickets);
    
    // Admin functions
    function setDrawInterval(uint256 interval) external;
    function emergencyWithdraw() external;
    function setRandomnessProvider(address provider) external;
    
    // VRF integration
    function fulfillRandomness(bytes32 requestId, uint256 randomness) external;
}