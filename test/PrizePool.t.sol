// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/PrizePool.sol";
import "../contracts/mocks/MockWLD.sol";
import "../contracts/mocks/MockVRFCoordinator.sol";
import "../contracts/libraries/Errors.sol";

/**
 * @title PrizePoolTest
 * @notice Test suite for PrizePool functionality
 * @dev Tests the lottery mechanics, yield addition, and prize claiming
 */
contract PrizePoolTest is Test {
    // Events for testing
    event YieldAdded(uint256 amount, uint256 totalPrizePool);
    event DrawScheduled(uint256 drawId, uint256 drawTime);
    event WinnerSelected(uint256 indexed drawId, address indexed winner, uint256 prizeAmount);
    event DrawCompleted(uint256 indexed drawId, address winner, uint256 prizeAmount, uint256 participants);
    event RandomnessRequested(uint256 indexed drawId, bytes32 requestId);
    
    PrizePool public prizePool;
    MockWLD public mockWLD;
    MockVRFCoordinator public mockVRF;
    
    address public owner = address(0x1);
    address public admin = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public poolContract = address(0x5);
    
    uint256 public constant DEFAULT_DRAW_INTERVAL = 24 hours;
    uint256 public constant YIELD_AMOUNT = 100e18;
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock contracts
        mockWLD = new MockWLD("Mock WLD", "mWLD", 18, 1000000e18, owner);
        mockVRF = new MockVRFCoordinator();
        
        // Deploy prize pool contract
        prizePool = new PrizePool(
            address(mockWLD),
            owner,
            DEFAULT_DRAW_INTERVAL,
            address(mockVRF)
        );
        
        // Add admin
        prizePool.addAdmin(admin);
        
        // Set randomness provider
        prizePool.setRandomnessProvider(address(mockVRF));
        
        // Give pool contract some tokens
        mockWLD.transfer(poolContract, 10000e18);
        
        vm.stopPrank();
    }
    
    function testPrizePoolDeployment() public {
        assertEq(address(prizePool.wldToken()), address(mockWLD));
        assertEq(prizePool.drawInterval(), DEFAULT_DRAW_INTERVAL);
        assertEq(prizePool.getCurrentDrawId(), 1);
        assertTrue(prizePool.getNextDrawTime() > block.timestamp);
        assertEq(prizePool.getCurrentPrizeAmount(), 0);
    }
    
    function testAddYield() public {
        // Transfer tokens to prize pool and add yield
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        assertEq(prizePool.getCurrentPrizeAmount(), YIELD_AMOUNT);
        assertEq(mockWLD.balanceOf(address(prizePool)), YIELD_AMOUNT);
    }
    
    function testAddYieldFailures() public {
        // Test zero amount
        vm.prank(poolContract);
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAmount.selector, 0));
        prizePool.addYield(0);
        
        // Test unauthorized caller
        vm.prank(user1);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        
        vm.prank(user1);
        vm.expectRevert(); // Should fail because user1 doesn't have enough tokens approved to prizePool
        prizePool.addYield(YIELD_AMOUNT);
    }
    
    function testScheduleDraw() public {
        // Add some yield first
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        uint256 initialDrawId = prizePool.getCurrentDrawId();
        uint256 initialNextDrawTime = prizePool.getNextDrawTime();
        
        // Advance time to make draw ready
        vm.warp(initialNextDrawTime);
        
        // Schedule draw
        prizePool.scheduleDraw();
        
        assertEq(prizePool.getCurrentDrawId(), initialDrawId + 1);
        assertEq(prizePool.getNextDrawTime(), block.timestamp + DEFAULT_DRAW_INTERVAL);
        
        // Check that previous draw was completed
        (, , , bool completed, ) = prizePool.getDrawInfo(initialDrawId);
        assertTrue(completed);
    }
    
    function testScheduleDrawFailures() public {
        // Test scheduling draw before it's ready
        uint256 nextDrawTime = prizePool.getNextDrawTime();
        
        // Try to schedule draw before it's ready
        vm.expectRevert(abi.encodeWithSelector(Errors.DrawNotReady.selector, block.timestamp, nextDrawTime));
        prizePool.scheduleDraw();
        
        // Advance time to make draw ready
        vm.warp(nextDrawTime);
        
        // Test scheduling draw when contract is paused
        vm.prank(owner);
        prizePool.pause();
        
        vm.expectRevert(abi.encodeWithSelector(Errors.ContractPaused.selector));
        prizePool.scheduleDraw();
    }
    
    function testDrawWinner() public {
        // Add some yield
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        uint256 drawId = prizePool.getCurrentDrawId();
        uint256 nextDrawTime = prizePool.getNextDrawTime();
        
        // Advance time to make draw ready
        vm.warp(nextDrawTime);
        
        // Draw winner
        address winner = prizePool.drawWinner();
        
        // Winner should be a valid address (our pseudo-random implementation)
        assertTrue(winner != address(0));
        
        // Check that randomness request was emitted
        bytes32 requestId = prizePool.drawRequestIds(drawId);
        assertTrue(requestId != bytes32(0));
        
        // Check draw information
        (uint256 prizeAmount, address drawWinner, uint256 drawTime, bool completed, uint256 participants) = prizePool.getDrawInfo(drawId);
        assertEq(prizeAmount, YIELD_AMOUNT);
        assertEq(drawWinner, address(0)); // Winner not set until randomness is fulfilled
        assertEq(drawTime, nextDrawTime);
        assertFalse(completed); // Draw should not be completed until randomness is fulfilled
        assertEq(participants, 0); // Not implemented in this basic version
    }
    
    function testDrawWinnerFailures() public {
        uint256 nextDrawTime = prizePool.getNextDrawTime();
        
        // Test drawing winner before draw is ready
        vm.expectRevert(abi.encodeWithSelector(Errors.DrawNotReady.selector, block.timestamp, nextDrawTime));
        prizePool.drawWinner();
        
        // Advance time to make draw ready
        vm.warp(nextDrawTime);
        
        // Draw winner first time
        prizePool.drawWinner();
        
        // Test drawing winner when contract is paused
        vm.prank(owner);
        prizePool.pause();
        
        vm.expectRevert(abi.encodeWithSelector(Errors.ContractPaused.selector));
        prizePool.drawWinner();
    }
    
    function testFulfillRandomness() public {
        // Add some participants first
        prizePool.addParticipant(user1, 1);
        prizePool.addParticipant(user2, 1);
        
        // Add some yield
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        uint256 drawId = prizePool.getCurrentDrawId();
        uint256 nextDrawTime = prizePool.getNextDrawTime();
        
        // Advance time to make draw ready
        vm.warp(nextDrawTime);
        
        // Draw winner to generate request
        prizePool.drawWinner();
        bytes32 requestId = prizePool.drawRequestIds(drawId);
        
        // Fulfill randomness
        uint256 randomness = 12345;
        vm.prank(address(mockVRF));
        prizePool.fulfillRandomness(requestId, randomness);
        
        // Check that request is marked as fulfilled
        (uint256 requestDrawId, bool fulfilled) = prizePool.randomnessRequests(uint256(requestId));
        assertEq(requestDrawId, drawId);
        assertTrue(fulfilled);
        
        // Check that draw is completed
        (, address winner, , bool completed, ) = prizePool.getDrawInfo(drawId);
        assertTrue(completed);
        assertTrue(winner != address(0));
    }
    
    function testFulfillRandomnessFailures() public {
        // Add some participants first
        prizePool.addParticipant(user1, 1);
        prizePool.addParticipant(user2, 1);
        
        bytes32 fakeRequestId = bytes32(uint256(12345));
        uint256 randomness = 67890;
        
        // Test unauthorized caller
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.Unauthorized.selector, user1));
        prizePool.fulfillRandomness(fakeRequestId, randomness);
        
        // Set up a real request first
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        uint256 drawId = prizePool.getCurrentDrawId();
        uint256 nextDrawTime = prizePool.getNextDrawTime();
        
        // Advance time to make draw ready
        vm.warp(nextDrawTime);
        
        // Draw winner to generate request
        prizePool.drawWinner();
        bytes32 requestId = prizePool.drawRequestIds(drawId);
        
        // Try to fulfill the same request twice
        vm.prank(address(mockVRF));
        prizePool.fulfillRandomness(requestId, randomness);
        
        vm.prank(address(mockVRF));
        vm.expectRevert(abi.encodeWithSelector(Errors.RandomnessNotAvailable.selector));
        prizePool.fulfillRandomness(requestId, randomness);
    }
    
    function testClaimPrize() public {
        // Add some participants first
        prizePool.addParticipant(user1, 1);
        prizePool.addParticipant(user2, 1);
        
        // Add some yield
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        uint256 drawId = prizePool.getCurrentDrawId();
        uint256 nextDrawTime = prizePool.getNextDrawTime();
        
        // Advance time to make draw ready
        vm.warp(nextDrawTime);
        
        // Draw winner to generate request
        prizePool.drawWinner();
        bytes32 requestId = prizePool.drawRequestIds(drawId);
        
        // Fulfill randomness with a predetermined winner (user2 since 3 % 2 = 1)
        uint256 randomness = 3;
        vm.prank(address(mockVRF));
        prizePool.fulfillRandomness(requestId, randomness);
        
        // Check initial balances
        uint256 initialUserBalance = mockWLD.balanceOf(user2);
        uint256 initialPoolBalance = mockWLD.balanceOf(address(prizePool));
        
        // Winner claims prize
        vm.prank(user2);
        prizePool.claimPrize(drawId);
        
        // Check updated balances
        assertEq(mockWLD.balanceOf(user2), initialUserBalance + YIELD_AMOUNT);
        assertEq(mockWLD.balanceOf(address(prizePool)), initialPoolBalance - YIELD_AMOUNT);
        
        // Check that prize amount is now zero
        (uint256 prizeAmount, , , , ) = prizePool.getDrawInfo(drawId);
        assertEq(prizeAmount, 0);
    }
    
    function testClaimPrizeFailures() public {
        // Add some participants first
        prizePool.addParticipant(user1, 1);
        prizePool.addParticipant(user2, 1);
        
        // Add some yield
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        uint256 drawId = prizePool.getCurrentDrawId();
        uint256 nextDrawTime = prizePool.getNextDrawTime();
        
        // Advance time to make draw ready
        vm.warp(nextDrawTime);
        
        // Draw winner to generate request
        prizePool.drawWinner();
        bytes32 requestId = prizePool.drawRequestIds(drawId);
        
        // Fulfill randomness with user2 as winner (since 3 % 2 = 1)
        uint256 randomness = 3;
        vm.prank(address(mockVRF));
        prizePool.fulfillRandomness(requestId, randomness);
        
        // Test invalid draw ID
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidDrawId.selector, 999));
        prizePool.claimPrize(999);
        
        // Test non-winner trying to claim (user1 is not the winner)
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.NotWinner.selector, user1, drawId));
        prizePool.claimPrize(drawId);
        
        // Winner claims prize first
        vm.prank(user2);
        prizePool.claimPrize(drawId);
        
        // Try to claim again (should fail)
        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSelector(Errors.PrizeAlreadyClaimed.selector, drawId));
        prizePool.claimPrize(drawId);
        
        // Test when contract is paused
        vm.prank(owner);
        prizePool.pause();
        
        // Try to schedule draw when paused (should fail)
        vm.expectRevert(abi.encodeWithSelector(Errors.ContractPaused.selector));
        prizePool.scheduleDraw();
        
        uint256 newDrawId = prizePool.getCurrentDrawId();
        vm.warp(prizePool.getNextDrawTime());
        
        // Try to draw winner when paused (should fail)
        vm.expectRevert(abi.encodeWithSelector(Errors.ContractPaused.selector));
        prizePool.drawWinner();
        
        // Set up a new request ID for testing fulfillRandomness
        bytes32 newRequestId = bytes32(newDrawId);
        
        // Try to fulfill randomness when paused (should fail)
        randomness = uint256(uint160(user2));
        vm.prank(address(mockVRF));
        vm.expectRevert(abi.encodeWithSelector(Errors.ContractPaused.selector));
        prizePool.fulfillRandomness(newRequestId, randomness);
        
        // Try to claim when paused (should fail)
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.ContractPaused.selector));
        prizePool.claimPrize(newDrawId);
    }
    
    function testAdminFunctions() public {
        // Test set draw interval
        uint256 newInterval = 12 hours;
        vm.prank(admin);
        prizePool.setDrawInterval(newInterval);
        assertEq(prizePool.drawInterval(), newInterval);
        
        // Test set randomness provider
        address newProvider = address(0x123);
        vm.prank(admin);
        prizePool.setRandomnessProvider(newProvider);
        assertEq(prizePool.randomnessProvider(), newProvider);
        
        // Test unauthorized access to admin functions
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.NotAdmin.selector, user1));
        prizePool.setDrawInterval(6 hours);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.NotAdmin.selector, user1));
        prizePool.setRandomnessProvider(address(0x456));
    }
    
    function testEmergencyWithdraw() public {
        // Add some yield first
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        // Pause the contract
        vm.prank(owner);
        prizePool.pause();
        
        // Check initial balances
        uint256 initialUserBalance = mockWLD.balanceOf(owner);
        uint256 initialPoolBalance = mockWLD.balanceOf(address(prizePool));
        
        // Emergency withdraw
        vm.prank(owner);
        prizePool.emergencyWithdraw();
        
        // Check updated balances
        assertEq(mockWLD.balanceOf(owner), initialUserBalance + initialPoolBalance);
        assertEq(mockWLD.balanceOf(address(prizePool)), 0);
        assertEq(prizePool.getCurrentPrizeAmount(), 0);
    }
    
    function testEmergencyWithdrawFailures() public {
        // Test emergency withdraw when not paused
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Errors.ExpectedPause.selector));
        prizePool.emergencyWithdraw();
        
        // Pause the contract
        vm.prank(owner);
        prizePool.pause();
        
        // Test emergency withdraw with zero balance
        // We don't transfer any yield to the pool, so balance should be zero
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Errors.InsufficientBalance.selector, 1, 0));
        prizePool.emergencyWithdraw();
        
        // Test unauthorized emergency withdraw when paused
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        prizePool.emergencyWithdraw();
    }
    
    function testViewFunctions() public {
        // Test getCurrentPrizeAmount
        assertEq(prizePool.getCurrentPrizeAmount(), 0);
        
        // Add yield and test again
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        assertEq(prizePool.getCurrentPrizeAmount(), YIELD_AMOUNT);
        
        // Test getNextDrawTime
        uint256 nextDrawTime = prizePool.getNextDrawTime();
        assertTrue(nextDrawTime > block.timestamp);
        
        // Test getCurrentDrawId
        assertEq(prizePool.getCurrentDrawId(), 1);
        
        // Test getUserParticipation
        (bool eligible, uint256 tickets) = prizePool.getUserParticipation(user1);
        assertFalse(eligible);
        assertEq(tickets, 0);
    }
    
    function testEventEmissions() public {
        // Test YieldAdded event
        vm.prank(poolContract);
        mockWLD.approve(address(prizePool), YIELD_AMOUNT);
        
        vm.expectEmit(false, false, false, true);
        emit YieldAdded(YIELD_AMOUNT, YIELD_AMOUNT);
        
        vm.prank(poolContract);
        prizePool.addYield(YIELD_AMOUNT);
        
        // Test DrawScheduled event
        vm.warp(prizePool.getNextDrawTime());
        
        vm.expectEmit(false, false, false, true);
        emit DrawScheduled(prizePool.getCurrentDrawId() + 1, block.timestamp + DEFAULT_DRAW_INTERVAL);
        
        prizePool.scheduleDraw();
        
        // Test RandomnessRequested event
        vm.warp(prizePool.getNextDrawTime());
        
        uint256 drawId = prizePool.getCurrentDrawId();
        
        // We need to emit the expected event before calling drawWinner
        vm.expectEmit(true, false, false, true);
        emit RandomnessRequested(drawId, bytes32(0x044852b2a670ade5407e78fb57cafd4608fe155bee8905052358de7090b6a6fa));
        
        prizePool.drawWinner();
    }
}