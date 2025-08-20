// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/PoolContract.sol";
import "../contracts/PrizePool.sol";
import "../contracts/VrfStub.sol";
import "../contracts/mocks/MockYieldAdapter.sol";
import "../contracts/mocks/MockWLD.sol";

/**
 * @title DemoFlow
 * @notice Demonstrates the complete Jackpot WLD flow:
 * 1. Deploy contracts
 * 2. Setup initial configuration
 * 3. Simulate user deposits
 * 4. Generate yield
 * 5. Harvest and fund prize
 * 6. Draw winner
 */
contract DemoFlow is Script {
    PoolContract public poolContract;
    PrizePool public prizePool;
    MockYieldAdapter public yieldAdapter;
    MockWLD public wldToken;
    
    address public user1 = address(0x1111);
    address public user2 = address(0x2222);
    address public user3 = address(0x3333);
    address public admin = address(0x9999);
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 1e18; // 1M WLD
    uint256 public constant DEPOSIT_AMOUNT = 1000 * 1e18; // 1000 WLD per user
    uint256 public constant DRAW_INTERVAL = 1 days;
    
    function run() external {
        vm.startBroadcast();
        
        console.log("=== Jackpot WLD Demo Flow ===");
        
        // Step 1: Deploy contracts
        deployContracts();
        
        // Step 2: Setup configuration
        setupConfiguration();
        
        // Step 3: Simulate user deposits
        simulateUserDeposits();
        
        // Step 4: Generate yield
        generateYield();
        
        // Step 5: Harvest and fund prize
        harvestAndFundPrize();
        
        // Step 6: Draw winner
        drawWinner();
        
        // Step 7: Display final state
        displayFinalState();
        
        vm.stopBroadcast();
        
        console.log("=== Demo Complete ===");
    }
    
    function deployContracts() internal {
        console.log("\n1. Deploying contracts...");
        
        // Deploy WLD token
        wldToken = new MockWLD("World Token", "WLD", 18, INITIAL_SUPPLY, msg.sender);
        console.log("WLD Token deployed at:", address(wldToken));
        
        // Deploy yield adapter
        yieldAdapter = new MockYieldAdapter(address(wldToken));
        console.log("Yield Adapter deployed at:", address(yieldAdapter));
        
        // Deploy prize pool
        // Deploy a simple VRF stub for demo
        VrfStub vrfStub = new VrfStub(msg.sender);
        prizePool = new PrizePool(address(wldToken), address(vrfStub), msg.sender);
        console.log("Prize Pool deployed at:", address(prizePool));
        
        // Deploy pool contract
        poolContract = new PoolContract(
            address(wldToken),
            address(0x1), // Mock WorldID address
            1, // Mock group ID
            msg.sender
        );
        console.log("Pool Contract deployed at:", address(poolContract));
        
        // Set yield adapter and prize pool
        poolContract.setYieldAdapter(address(yieldAdapter));
        poolContract.setPrizePool(address(prizePool));
        prizePool.setPoolContract(address(poolContract));
    }
    
    function setupConfiguration() internal {
        console.log("\n2. Setting up configuration...");
        
        // Set draw interval
        prizePool.setDrawInterval(DRAW_INTERVAL);
        console.log("Draw interval set to:", DRAW_INTERVAL, "seconds");
        
        // Set yield harvest threshold (1% of total deposits)
        poolContract.setYieldHarvestThreshold(10); // 1%
        console.log("Yield harvest threshold set to: 1%");
        
        // Distribute tokens to users
        wldToken.transfer(user1, DEPOSIT_AMOUNT * 2);
        wldToken.transfer(user2, DEPOSIT_AMOUNT * 2);
        wldToken.transfer(user3, DEPOSIT_AMOUNT * 2);
        console.log("Tokens distributed to users");
    }
    
    function simulateUserDeposits() internal {
        console.log("\n3. Simulating user deposits...");
        
        // User 1 deposit
        vm.startPrank(user1);
        wldToken.approve(address(poolContract), DEPOSIT_AMOUNT);
        poolContract.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        console.log("User 1 deposited:", DEPOSIT_AMOUNT / 1e18, "WLD");
        
        // User 2 deposit
        vm.startPrank(user2);
        wldToken.approve(address(poolContract), DEPOSIT_AMOUNT);
        poolContract.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        console.log("User 2 deposited:", DEPOSIT_AMOUNT / 1e18, "WLD");
        
        // User 3 deposit
        vm.startPrank(user3);
        wldToken.approve(address(poolContract), DEPOSIT_AMOUNT);
        poolContract.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        console.log("User 3 deposited:", DEPOSIT_AMOUNT / 1e18, "WLD");
        
        // Display pool stats
        (uint256 totalDeposits, uint256 totalYield, uint256 participantCount, uint256 currentAPY, uint256 prizeBalance) = poolContract.getPoolInfo();
        console.log("Total deposits:", totalDeposits / 1e18, "WLD");
        console.log("Participant count:", participantCount);
        console.log("Current prize balance:", prizeBalance / 1e18, "WLD");
    }
    
    function generateYield() internal {
        console.log("\n4. Generating yield...");
        
        // Simulate time passage and yield generation
        vm.warp(block.timestamp + 1 hours);
        
        // Generate 5% yield on deposits
        uint256 yieldAmount = (DEPOSIT_AMOUNT * 3 * 5) / 100; // 5% of total deposits
        yieldAdapter.setYieldAmount(yieldAmount);
        
        console.log("Generated yield:", yieldAmount / 1e18, "WLD");
        
        // Accrue yield in pool contract
        poolContract.accrueYield();
        
        (uint256 totalDeposits, uint256 totalYield, uint256 participantCount, uint256 currentAPY, uint256 prizeBalance) = poolContract.getPoolInfo();
        console.log("Total yield after accrual:", totalYield / 1e18, "WLD");
        console.log("Current APY:", currentAPY / 100, "%");
    }
    
    function harvestAndFundPrize() internal {
        console.log("\n5. Harvesting yield and funding prize...");
        
        uint256 prizeBalanceBefore = prizePool.getCurrentPrizeAmount();
        console.log("Prize balance before harvest:", prizeBalanceBefore / 1e18, "WLD");
        
        // Harvest and fund prize
        poolContract.harvestAndFundPrize();
        
        uint256 prizeBalanceAfter = prizePool.getCurrentPrizeAmount();
        console.log("Prize balance after harvest:", prizeBalanceAfter / 1e18, "WLD");
        console.log("Prize funded with:", (prizeBalanceAfter - prizeBalanceBefore) / 1e18, "WLD");
    }
    
    function drawWinner() internal {
        console.log("\n6. Drawing winner...");
        
        // Fast forward to draw time
        vm.warp(prizePool.nextDrawAt());
        
        uint256 prizeAmount = prizePool.getCurrentPrizeAmount();
        console.log("Prize amount to be won:", prizeAmount / 1e18, "WLD");
        
        // Draw winner (simplified - in real implementation would use VRF)
        address winner = prizePool.drawWinner();
        console.log("Winner drawn:", winner);
        
        // Check winner's balance
        uint256 winnerBalance = wldToken.balanceOf(winner);
        console.log("Winner's WLD balance:", winnerBalance / 1e18, "WLD");
    }
    
    function displayFinalState() internal {
        console.log("\n7. Final State:");
        
        (uint256 totalDeposits, uint256 totalYield, uint256 participantCount, uint256 currentAPY, uint256 prizeBalance) = poolContract.getPoolInfo();
        
        console.log("--- Pool Contract ---");
        console.log("Total deposits:", totalDeposits / 1e18, "WLD");
        console.log("Total yield generated:", totalYield / 1e18, "WLD");
        console.log("Participant count:", participantCount);
        console.log("Current APY:", currentAPY / 100, "%");
        
        console.log("--- Prize Pool ---");
        console.log("Current prize balance:", prizeBalance / 1e18, "WLD");
        console.log("Next draw at:", prizePool.nextDrawAt());
        
        console.log("--- User Balances ---");
        console.log("User 1 balance:", poolContract.getUserBalance(user1) / 1e18, "WLD");
        console.log("User 2 balance:", poolContract.getUserBalance(user2) / 1e18, "WLD");
        console.log("User 3 balance:", poolContract.getUserBalance(user3) / 1e18, "WLD");
        
        console.log("--- Contract Addresses ---");
        console.log("WLD Token:", address(wldToken));
        console.log("Pool Contract:", address(poolContract));
        console.log("Prize Pool:", address(prizePool));
        console.log("Yield Adapter:", address(yieldAdapter));
    }
}