// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/YieldAdapter.sol";
import "../contracts/mocks/MockWLD.sol";
import "../contracts/mocks/MockUSDC.sol";
import "../contracts/BaseContract.sol";

contract YieldAdapterTest is Test {
    YieldAdapter public yieldAdapter;
    MockWLD public mockWLD;
    MockUSDC public mockUSDC;
    
    address public admin = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    
    uint256 public constant DEPOSIT_AMOUNT = 100e18;
    
    function setUp() public {
        // Deploy mock tokens
        mockWLD = new MockWLD("Worldcoin", "WLD", 18, 1000000e18, admin);
        mockUSDC = new MockUSDC("USD Coin", "USDC", 6, 1000000e6, admin);
        
        // Deploy yield adapter
        yieldAdapter = new YieldAdapter(address(mockWLD), address(mockUSDC), admin);
        
        // Set admin
        vm.prank(admin);
        yieldAdapter.addAdmin(address(this));
        
        // Mint tokens to users
        vm.startPrank(admin);
        mockWLD.mint(user1, 1000e18);
        mockWLD.mint(user2, 1000e18);
        vm.stopPrank();
    }
    
    function testDeposit() public {
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        
        uint256 shares = yieldAdapter.deposit(DEPOSIT_AMOUNT);
        
        assertEq(shares, DEPOSIT_AMOUNT);
        assertEq(yieldAdapter.getTotalDeposited(), DEPOSIT_AMOUNT);
        assertEq(yieldAdapter.getTotalShares(), DEPOSIT_AMOUNT);
        assertEq(yieldAdapter.sharesOf(user1), DEPOSIT_AMOUNT);
        assertEq(mockWLD.balanceOf(address(yieldAdapter)), DEPOSIT_AMOUNT);
        vm.stopPrank();
    }
    
    function testWithdraw() public {
        // First deposit
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        uint256 shares = yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Then withdraw
        vm.startPrank(user1);
        uint256 withdrawAmount = yieldAdapter.withdraw(shares);
        
        assertEq(withdrawAmount, DEPOSIT_AMOUNT);
        assertEq(yieldAdapter.getTotalDeposited(), 0);
        assertEq(yieldAdapter.getTotalShares(), 0);
        assertEq(yieldAdapter.sharesOf(user1), 0);
        assertEq(mockWLD.balanceOf(address(yieldAdapter)), 0);
        assertEq(mockWLD.balanceOf(user1), 1000e18);
        vm.stopPrank();
    }
    
    function testHarvestYield() public {
        // Deposit first
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Generate some yield
        vm.prank(admin);
        yieldAdapter.generateYield(10e18);
        
        // Harvest yield
        uint256 yield = yieldAdapter.harvestYield();
        
        assertEq(yield, 10e18);
        assertEq(yieldAdapter.getYield(), 0);
    }
    
    function testSetStrategy() public {
        vm.prank(admin);
        yieldAdapter.setStrategy(address(1));
        
        assertEq(yieldAdapter.strategyAddress(), address(1));
    }
    
    function testMigrateStrategy() public {
        // Deposit first
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Set initial strategy
        vm.prank(admin);
        yieldAdapter.setStrategy(address(1));
        
        // Migrate strategy
        vm.prank(admin);
        yieldAdapter.migrateStrategy(address(2));
        
        assertEq(yieldAdapter.strategyAddress(), address(2));
    }
    
    function testPauseUnpause() public {
        // Pause contract
        vm.prank(admin);
        yieldAdapter.pause();
        
        assertTrue(yieldAdapter.paused());
        
        // Unpause contract
        vm.prank(admin);
        yieldAdapter.unpause();
        
        assertFalse(yieldAdapter.paused());
    }
    
    function testEmergencyWithdraw() public {
        // Deposit first
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Emergency withdraw
        uint256 initialAdminBalance = mockWLD.balanceOf(admin);
        vm.prank(admin);
        uint256 amount = yieldAdapter.emergencyWithdraw();
        
        assertEq(amount, DEPOSIT_AMOUNT);
        assertEq(mockWLD.balanceOf(admin), initialAdminBalance + amount);
    }
    
    function testLPStrategy() public {
        // Set strategy type to LP
        vm.prank(admin);
        yieldAdapter.setStrategyType(YieldAdapter.StrategyType.LP);
        
        // Set strategy address
        vm.prank(admin);
        yieldAdapter.setStrategy(address(1));
        
        // Deposit with LP strategy
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        uint256 shares = yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Check that LP shares were allocated
        assertGt(yieldAdapter.lpShares(), 0);
    }
    
    function testStakingStrategy() public {
        // Set strategy type to STAKING
        vm.prank(admin);
        yieldAdapter.setStrategyType(YieldAdapter.StrategyType.STAKING);
        
        // Set strategy address
        vm.prank(admin);
        yieldAdapter.setStrategy(address(1));
        
        // Deposit with staking strategy
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        uint256 shares = yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Check that staked amount was allocated
        assertGt(yieldAdapter.stakedAmount(), 0);
    }
    
    function testNoneStrategy() public {
        // Deposit with no strategy (default)
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        uint256 shares = yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Check that no LP or staking allocations were made
        assertEq(yieldAdapter.lpShares(), 0);
        assertEq(yieldAdapter.stakedAmount(), 0);
        assertEq(yieldAdapter.getTotalDeposited(), DEPOSIT_AMOUNT);
    }
    
    function testShareValue() public {
        // Initially no shares
        assertEq(yieldAdapter.getShareValue(), 0);
        
        // Deposit tokens
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Check share value
        assertEq(yieldAdapter.getShareValue(), 1e18);
    }
    
    function testAPY() public {
        // Check default APY
        assertEq(yieldAdapter.getAPY(), 500); // 5% in basis points
    }
    
    // Error cases tests
    function testDepositZeroAmount() public {
        vm.startPrank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAmount.selector, 0));
        yieldAdapter.deposit(0);
        vm.stopPrank();
    }
    
    function testWithdrawZeroAmount() public {
        vm.startPrank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAmount.selector, 0));
        yieldAdapter.withdraw(0);
        vm.stopPrank();
    }
    
    function testWithdrawInsufficientShares() public {
        vm.startPrank(user1);
        vm.expectRevert();
        yieldAdapter.withdraw(DEPOSIT_AMOUNT);
        vm.stopPrank();
    }
    
    function testDepositWhenPaused() public {
        vm.prank(admin);
        yieldAdapter.pause();
        
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        vm.expectRevert(); // Pausable reverts with its own error
        yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
    }
    
    function testWithdrawWhenPaused() public {
        // First deposit
        vm.startPrank(user1);
        mockWLD.approve(address(yieldAdapter), DEPOSIT_AMOUNT);
        yieldAdapter.deposit(DEPOSIT_AMOUNT);
        vm.stopPrank();
        
        // Then pause
        vm.prank(admin);
        yieldAdapter.pause();
        
        // Try to withdraw
        vm.startPrank(user1);
        vm.expectRevert(); // Pausable reverts with its own error
        yieldAdapter.withdraw(DEPOSIT_AMOUNT);
        vm.stopPrank();
    }
}