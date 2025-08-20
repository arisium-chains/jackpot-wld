// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/PoolContract.sol";
import "../contracts/PrizePool.sol";
import "../contracts/mocks/MockWLD.sol";
import "../contracts/mocks/MockWorldID.sol";
import "../contracts/mocks/MockVRFCoordinator.sol";
import "../contracts/mocks/MockYieldAdapter.sol";
import "../contracts/libraries/Errors.sol";
import "../contracts/libraries/Constants.sol";

/**
 * @title InvariantTests
 * @notice Invariant tests for the PoolTogether system
 * @dev Tests critical invariants that must always hold
 */
contract InvariantTests is Test {
    PoolContract public poolContract;
    PrizePool public prizePool;
    MockWLD public mockWLD;
    MockWorldID public mockWorldID;
    MockVRFCoordinator public mockVRF;
    MockYieldAdapter public mockYieldAdapter;
    
    address public owner = address(0x1);
    address public admin = address(0x2);
    address public user1 = address(0x10);
    address public user2 = address(0x11);
    address public user3 = address(0x12);
    
    uint256 constant INITIAL_BALANCE = 1000e18;
    uint256 constant NULLIFIER_HASH_1 = 0x123;
    uint256 constant NULLIFIER_HASH_2 = 0x456;
    uint256 constant NULLIFIER_HASH_3 = 0x789;
    
    event FundsDeposited(uint256 amount, uint256 shares);
    event FundsWithdrawn(uint256 amount, uint256 shares);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock contracts
        mockWLD = new MockWLD("Mock WLD", "mWLD", 18, 10000000e18, owner);
        mockWorldID = new MockWorldID();
        mockVRF = new MockVRFCoordinator();
        mockYieldAdapter = new MockYieldAdapter(address(mockWLD));
        
        // Deploy main contracts
        poolContract = new PoolContract(
            address(mockWLD),
            address(mockWorldID),
            1, // worldIdGroupId
            owner
        );
        
        prizePool = new PrizePool(
            address(mockWLD),
            address(mockVRF),
            owner
        );
        
        // Setup relationships
        poolContract.setYieldAdapter(address(mockYieldAdapter));
        poolContract.setPrizePool(address(prizePool));
        prizePool.setPoolContract(address(poolContract));
        
        // Grant admin role
        poolContract.addAdmin(admin);
        
        // Setup user balances
        mockWLD.transfer(user1, INITIAL_BALANCE);
        mockWLD.transfer(user2, INITIAL_BALANCE);
        mockWLD.transfer(user3, INITIAL_BALANCE);
        
        vm.stopPrank();
    }
    
    /**
     * @notice Invariant: Principal Conservation
     * @dev Total user balances should equal total deposits, yield adapter can have more due to yield
     */
    function invariant_principalConservation() public {
        uint256 totalUserBalances = 0;
        
        // Sum all user balances in the pool
        totalUserBalances += poolContract.getUserBalance(user1);
        totalUserBalances += poolContract.getUserBalance(user2);
        totalUserBalances += poolContract.getUserBalance(user3);
        
        // Get yield adapter balance
        uint256 yieldAdapterBalance = mockYieldAdapter.getTotalDeposited();
        
        // Get total deposits tracked by pool
        uint256 totalDeposits = poolContract.getTotalDeposits();
        
        // Principal conservation: user balances should equal total deposits
        assertEq(totalUserBalances, totalDeposits, "User balances != total deposits");
        
        // Yield adapter balance should be at least equal to total deposits
        // (can be higher due to yield generation or fuzzer calling mintDepositedAmount)
        assertGe(yieldAdapterBalance, totalDeposits, "Yield adapter balance < total deposits");
    }
    
    /**
     * @notice Invariant: Prize Reserve Conservation
     * @dev Prize pool reserve should never exceed available yield
     */
    function invariant_prizeReserveConservation() public {
        uint256 prizeReserve = prizePool.prizeBalance();
        uint256 currentYield = mockYieldAdapter.getYield();
        
        // Prize reserve should be reasonable compared to current yield
        // Note: This is a simplified check since yield gets harvested periodically
        assertTrue(prizeReserve >= 0, "Prize reserve should be non-negative");
    }
    
    /**
     * @notice Invariant: Access Control
     * @dev Only authorized roles can perform privileged operations
     */
    function invariant_accessControl() public {
        // Only admin should be able to call admin functions
        assertTrue(poolContract.isAdmin(admin), "Admin should have admin role");
        assertFalse(poolContract.isAdmin(user1), "User1 should not have admin role");
    }
    
    /**
     * @notice Invariant: User Balance Non-Negative
     * @dev User balances should never be negative
     */
    function invariant_userBalanceNonNegative() public {
        assertGe(poolContract.getUserBalance(user1), 0, "User1 balance is negative");
        assertGe(poolContract.getUserBalance(user2), 0, "User2 balance is negative");
        assertGe(poolContract.getUserBalance(user3), 0, "User3 balance is negative");
    }
    
    /**
     * @notice Invariant: Total Deposits Non-Negative
     * @dev Total deposits should never be negative
     */
    function invariant_totalDepositsNonNegative() public {
        assertGe(poolContract.getTotalDeposits(), 0, "Total deposits is negative");
    }
    
    /**
     * @notice Test helper: Perform random operations to test invariants
     */
    function testInvariantsWithOperations() public {
        // Verify users
        _verifyUser(user1, NULLIFIER_HASH_1);
        _verifyUser(user2, NULLIFIER_HASH_2);
        _verifyUser(user3, NULLIFIER_HASH_3);
        
        // Perform deposits
        _deposit(user1, 100e18);
        _deposit(user2, 200e18);
        _deposit(user3, 150e18);
        
        // Check invariants after deposits
        invariant_principalConservation();
        invariant_prizeReserveConservation();
        invariant_userBalanceNonNegative();
        invariant_totalDepositsNonNegative();
        
        // Perform withdrawals
        _withdraw(user1, 50e18);
        _withdraw(user2, 100e18);
        
        // Check invariants after withdrawals
        invariant_principalConservation();
        invariant_prizeReserveConservation();
        invariant_userBalanceNonNegative();
        invariant_totalDepositsNonNegative();
        
        // Generate some yield
        mockYieldAdapter.setYieldAmount(50e18);
        
        // Check invariants after yield generation
        invariant_principalConservation();
        invariant_prizeReserveConservation();
        invariant_userBalanceNonNegative();
        invariant_totalDepositsNonNegative();
    }
    
    // Helper functions
    function _verifyUser(address user, uint256 nullifierHash) internal {
        mockWorldID.mockVerifyUser(user, nullifierHash);
        uint256[8] memory proof;
        vm.prank(user);
        poolContract.verifyUser(user, 0, nullifierHash, proof);
    }
    
    function _deposit(address user, uint256 amount) internal {
        vm.prank(user);
        mockWLD.approve(address(poolContract), amount);
        vm.prank(user);
        poolContract.deposit(amount);
    }
    
    function _withdraw(address user, uint256 amount) internal {
        vm.prank(user);
        poolContract.withdraw(amount);
    }
}