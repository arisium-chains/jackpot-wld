// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/BaseContract.sol";
import "../contracts/mocks/MockWLD.sol";
import "../contracts/mocks/MockWorldID.sol";
import "../contracts/mocks/MockVRFCoordinator.sol";
import "../contracts/libraries/Errors.sol";
import "../contracts/libraries/Constants.sol";
import "../contracts/libraries/Math.sol";

// Test contract that extends BaseContract for testing
contract TestContract is BaseContract {
    constructor(address initialOwner) BaseContract(initialOwner) {}
    
    function testFunction() external whenNotPaused nonReentrant {
        // Test function for base contract functionality
    }
}

// Import the PoolContract
import "../contracts/mocks/MockYieldAdapter.sol";
import "../contracts/PoolContract.sol";

/**
 * @title BaseContractTest
 * @notice Test suite for base contract functionality and interfaces
 * @dev Tests the core infrastructure components
 */
contract BaseContractTest is Test {
    TestContract public testContract;
    MockWLD public mockWLD;
    MockWorldID public mockWorldID;
    MockVRFCoordinator public mockVRF;
    
    address public owner = address(0x1);
    address public admin = address(0x2);
    address public operator = address(0x3);
    address public user = address(0x4);

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy test contracts
        testContract = new TestContract(owner);
        mockWLD = new MockWLD("Mock WLD", "mWLD", 18, 1000000e18, owner);
        mockWorldID = new MockWorldID();
        mockVRF = new MockVRFCoordinator();
        
        vm.stopPrank();
    }

    function testBaseContractDeployment() public {
        assertEq(testContract.owner(), owner);
        assertFalse(testContract.paused());
        assertTrue(testContract.isAdmin(owner));
        assertTrue(testContract.isOperator(owner));
    }

    function testAccessControl() public {
        // Test admin addition
        vm.prank(owner);
        testContract.addAdmin(admin);
        assertTrue(testContract.isAdmin(admin));

        // Test operator addition
        vm.prank(admin);
        testContract.addOperator(operator);
        assertTrue(testContract.isOperator(operator));

        // Test unauthorized access
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Errors.NotAdmin.selector, user));
        testContract.addOperator(user);
    }

    function testPauseUnpause() public {
        // Test pause
        vm.prank(owner);
        testContract.pause();
        assertTrue(testContract.paused());

        // Test function call when paused (OpenZeppelin uses EnforcedPause)
        vm.prank(user);
        vm.expectRevert();
        testContract.testFunction();

        // Test unpause
        vm.prank(owner);
        testContract.unpause();
        assertFalse(testContract.paused());
    }

    function testMockWLD() public {
        // Test initial supply
        assertEq(mockWLD.totalSupply(), 1000000e18);
        assertEq(mockWLD.balanceOf(owner), 1000000e18);

        // Test faucet
        vm.prank(user);
        mockWLD.faucet(100e18);
        assertEq(mockWLD.balanceOf(user), 100e18);

        // Test faucet limit
        vm.prank(user);
        vm.expectRevert("MockWLD: Amount exceeds faucet limit");
        mockWLD.faucet(2000e18);
    }

    function testMockWorldID() public {
        uint256 nullifierHash = 12345;
        
        // Test verification
        vm.prank(user);
        mockWorldID.mockVerifyUser(user, nullifierHash);
        assertTrue(mockWorldID.isVerified(user));
        assertTrue(mockWorldID.usedNullifiers(nullifierHash));

        // Test double verification prevention
        vm.expectRevert("MockWorldID: Nullifier already used");
        mockWorldID.mockVerifyUser(user, nullifierHash);
    }

    function testMockVRF() public {
        bytes32 keyHash = keccak256("test");
        uint64 subId = 1;
        uint16 requestConfirmations = 3;
        uint32 callbackGasLimit = 200000;
        uint32 numWords = 1;

        // Test VRF request
        uint256 requestId = mockVRF.requestRandomWords(
            keyHash,
            subId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        assertTrue(requestId > 0);
        assertTrue(mockVRF.isFulfilled(requestId));
    }

    function testMathLibrary() public {
        // Test BPS calculation
        uint256 result = Math.calculateBps(1000, 500); // 5% of 1000
        assertEq(result, 50);

        // Test share calculation
        uint256 shares = Math.calculateShares(100, 1000, 10000);
        assertEq(shares, 10);

        // Test asset calculation
        uint256 assets = Math.calculateAssets(10, 1000, 10000);
        assertEq(assets, 100);

        // Test min/max
        assertEq(Math.min(5, 10), 5);
        assertEq(Math.max(5, 10), 10);
    }

    function testConstants() public {
        // Test time constants
        assertEq(Constants.MIN_DRAW_INTERVAL, 1 hours);
        assertEq(Constants.MAX_DRAW_INTERVAL, 7 days);
        assertEq(Constants.DEFAULT_DRAW_INTERVAL, 24 hours);

        // Test amount constants
        assertEq(Constants.MIN_DEPOSIT_AMOUNT, 1e18);
        assertEq(Constants.MAX_DEPOSIT_AMOUNT, 1000000e18);

        // Test percentage constants
        assertEq(Constants.MAX_FEE_BPS, 500);
        assertEq(Constants.BPS_PRECISION, 10000);
    }

    function testErrorHandling() public {
        // Test zero address error (OpenZeppelin uses OwnableInvalidOwner)
        vm.expectRevert();
        new TestContract(address(0));

        // Test zero address in addAdmin
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Errors.ZeroAddress.selector));
        testContract.addAdmin(address(0));
    }
}

/**
 * @title PoolContractTest
 * @notice Test suite for PoolContract functionality
 * @dev Tests deposit, withdrawal, and World ID verification
 */
contract PoolContractTest is Test {
    // Events for testing
    event Deposit(address indexed user, uint256 amount, uint256 newBalance);
    event Withdraw(address indexed user, uint256 amount, uint256 newBalance);
    event YieldAccrued(uint256 amount, uint256 totalYield);
    // Yield adapter events
    event FundsDeposited(uint256 amount, uint256 shares);
    event FundsWithdrawn(uint256 shares, uint256 amount);
    event UserVerified(address indexed user);
    PoolContract public poolContract;
    MockWLD public mockWLD;
    MockYieldAdapter public mockYieldAdapter;
    MockWorldID public mockWorldID;
    
    address public owner = address(0x1);
    address public admin = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    
    uint256 public constant WORLD_ID_GROUP_ID = 1;
    uint256 public constant DEPOSIT_AMOUNT = 100e18;
    uint256 public constant NULLIFIER_HASH_1 = 12345;
    uint256 public constant NULLIFIER_HASH_2 = 67890;

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock contracts
        mockWLD = new MockWLD("Mock WLD", "mWLD", 18, 1000000e18, owner);
        mockWorldID = new MockWorldID();
        mockYieldAdapter = new MockYieldAdapter(address(mockWLD));
        
        // Deploy pool contract
        poolContract = new PoolContract(
            address(mockWLD),
            address(mockWorldID),
            WORLD_ID_GROUP_ID,
            owner
        );
        
        // Set yield adapter
        poolContract.setYieldAdapter(address(mockYieldAdapter));
        
        // Add admin
        poolContract.addAdmin(admin);
        
        // Give users some tokens
        mockWLD.transfer(user1, 1000e18);
        mockWLD.transfer(user2, 1000e18);
        
        vm.stopPrank();
    }

    function testPoolContractDeployment() public {
        assertEq(address(poolContract.wldToken()), address(mockWLD));
        assertEq(poolContract.worldIdGroupId(), WORLD_ID_GROUP_ID);
        assertEq(poolContract.getTotalDeposits(), 0);
        assertEq(poolContract.getTotalYieldGenerated(), 0);
    }

    function testWorldIdVerification() public {
        // User should not be verified initially
        assertFalse(poolContract.isUserVerified(user1));
        
        // Mock World ID verification
        mockWorldID.mockVerifyUser(user1, NULLIFIER_HASH_1);
        
        // Verify user through pool contract
        uint256[8] memory proof;
        vm.prank(user1);
        poolContract.verifyUser(user1, 0, NULLIFIER_HASH_1, proof);
        
        // User should now be verified
        assertTrue(poolContract.isUserVerified(user1));
    }

    function testWorldIdVerificationFailures() public {
        // Test already verified user
        mockWorldID.mockVerifyUser(user1, NULLIFIER_HASH_1);
        uint256[8] memory proof;
        
        vm.prank(user1);
        poolContract.verifyUser(user1, 0, NULLIFIER_HASH_1, proof);
        
        // Try to verify again
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.UserAlreadyVerified.selector, user1));
        poolContract.verifyUser(user1, 0, NULLIFIER_HASH_2, proof);
        
        // Test used nullifier
        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidWorldIdProof.selector));
        poolContract.verifyUser(user2, 0, NULLIFIER_HASH_1, proof);
    }

    function testDeposit() public {
            // Verify user first
            _verifyUser(user1, NULLIFIER_HASH_1);
            
            // Approve tokens
            vm.prank(user1);
            mockWLD.approve(address(poolContract), DEPOSIT_AMOUNT);
            
            // Get initial balances
            uint256 initialUserBalance = mockWLD.balanceOf(user1);
            uint256 initialContractBalance = mockWLD.balanceOf(address(poolContract));
            uint256 initialYieldAdapterBalance = mockWLD.balanceOf(address(mockYieldAdapter));
            
            // Deposit
            vm.prank(user1);
            poolContract.deposit(DEPOSIT_AMOUNT);
            
            // Check balances
            assertEq(mockWLD.balanceOf(user1), initialUserBalance - DEPOSIT_AMOUNT);
            assertEq(mockWLD.balanceOf(address(poolContract)), initialContractBalance); // Pool contract balance should be unchanged
            assertEq(mockWLD.balanceOf(address(mockYieldAdapter)), initialYieldAdapterBalance + DEPOSIT_AMOUNT); // Yield adapter should have the tokens
            assertEq(poolContract.getUserBalance(user1), DEPOSIT_AMOUNT);
            assertEq(poolContract.getTotalDeposits(), DEPOSIT_AMOUNT);
        }

    function testDepositFailures() public {
        // Test deposit without verification
        vm.prank(user1);
        mockWLD.approve(address(poolContract), DEPOSIT_AMOUNT);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.NotWorldIdVerified.selector, user1));
        poolContract.deposit(DEPOSIT_AMOUNT);
        
        // Verify user
        _verifyUser(user1, NULLIFIER_HASH_1);
        
        // Test zero amount
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAmount.selector, 0));
        poolContract.deposit(0);
        
        // Test amount below minimum
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.BelowMinLimit.selector, 1e15, Constants.MIN_DEPOSIT_AMOUNT));
        poolContract.deposit(1e15);
        
        // Test amount above maximum
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.ExceedsMaxLimit.selector, Constants.MAX_DEPOSIT_AMOUNT + 1, Constants.MAX_DEPOSIT_AMOUNT));
        poolContract.deposit(Constants.MAX_DEPOSIT_AMOUNT + 1);
        
        // Test insufficient balance
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.InsufficientBalance.selector, 2000e18, 1000e18));
        poolContract.deposit(2000e18);
    }

    function testWithdraw() public {
            // Setup: verify user and deposit
            _verifyUser(user1, NULLIFIER_HASH_1);
            _deposit(user1, DEPOSIT_AMOUNT);
            
            // Get initial balances
            uint256 initialUserBalance = mockWLD.balanceOf(user1);
            uint256 initialContractBalance = mockWLD.balanceOf(address(poolContract));
            uint256 initialYieldAdapterBalance = mockWLD.balanceOf(address(mockYieldAdapter));
            uint256 withdrawAmount = 50e18;
            
            // Withdraw
            vm.prank(user1);
            poolContract.withdraw(withdrawAmount);
            
            // Check balances
            assertEq(mockWLD.balanceOf(user1), initialUserBalance + withdrawAmount);
            assertEq(mockWLD.balanceOf(address(poolContract)), initialContractBalance); // Pool contract balance should be unchanged (tokens immediately transferred to user)
            assertEq(mockWLD.balanceOf(address(mockYieldAdapter)), initialYieldAdapterBalance - withdrawAmount); // Yield adapter should have fewer tokens
            assertEq(poolContract.getUserBalance(user1), DEPOSIT_AMOUNT - withdrawAmount);
            assertEq(poolContract.getTotalDeposits(), DEPOSIT_AMOUNT - withdrawAmount);
        }

    function testWithdrawFailures() public {
        // Setup: verify user and deposit
        _verifyUser(user1, NULLIFIER_HASH_1);
        _deposit(user1, DEPOSIT_AMOUNT);
        
        // Test zero amount
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.InvalidAmount.selector, 0));
        poolContract.withdraw(0);
        
        // Test amount below minimum
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.BelowMinLimit.selector, 1e12, Constants.MIN_WITHDRAWAL_AMOUNT));
        poolContract.withdraw(1e12);
        
        // Test insufficient balance (this is checked first)
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.InsufficientBalance.selector, DEPOSIT_AMOUNT + 1, DEPOSIT_AMOUNT));
        poolContract.withdraw(DEPOSIT_AMOUNT + 1);
    }

    function testMultipleUsersDeposits() public {
        // Verify both users
        _verifyUser(user1, NULLIFIER_HASH_1);
        _verifyUser(user2, NULLIFIER_HASH_2);
        
        // Both users deposit
        _deposit(user1, DEPOSIT_AMOUNT);
        _deposit(user2, DEPOSIT_AMOUNT * 2);
        
        // Check individual balances
        assertEq(poolContract.getUserBalance(user1), DEPOSIT_AMOUNT);
        assertEq(poolContract.getUserBalance(user2), DEPOSIT_AMOUNT * 2);
        assertEq(poolContract.getTotalDeposits(), DEPOSIT_AMOUNT * 3);
    }

    function testPoolStats() public {
        // Setup deposits
        _verifyUser(user1, NULLIFIER_HASH_1);
        _verifyUser(user2, NULLIFIER_HASH_2);
        _deposit(user1, DEPOSIT_AMOUNT);
        _deposit(user2, DEPOSIT_AMOUNT * 2);
        
        // Get pool stats
        (uint256 totalDeposits, uint256 totalYield, uint256 participantCount, uint256 currentAPY) = poolContract.getPoolStats();
        
        assertEq(totalDeposits, DEPOSIT_AMOUNT * 3);
        assertEq(totalYield, 0); // No yield generated yet
        assertEq(participantCount, 0); // Not implemented yet
        assertEq(currentAPY, 500); // Mock yield adapter returns 5% APY (500 basis points)
    }

    function testAdminFunctions() public {
        // Test setting yield adapter (should work for admin)
        address mockAdapter = address(0x123);
        vm.prank(admin);
        poolContract.setYieldAdapter(mockAdapter);
        assertEq(address(poolContract.yieldAdapter()), mockAdapter);
        
        // Test setting prize pool (should work for admin)
        address mockPrizePool = address(0x456);
        vm.prank(admin);
        poolContract.setPrizePool(mockPrizePool);
        assertEq(address(poolContract.prizePool()), mockPrizePool);
        
        // Test unauthorized access
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Errors.NotAdmin.selector, user1));
        poolContract.setYieldAdapter(mockAdapter);
    }

    function testPauseUnpause() public {
        // Verify user and approve tokens
        _verifyUser(user1, NULLIFIER_HASH_1);
        vm.prank(user1);
        mockWLD.approve(address(poolContract), DEPOSIT_AMOUNT);
        
        // Pause contract
        vm.prank(admin);
        poolContract.pause();
        
        // Try to deposit (should fail)
        vm.prank(user1);
        vm.expectRevert();
        poolContract.deposit(DEPOSIT_AMOUNT);
        
        // Unpause contract
        vm.prank(admin);
        poolContract.unpause();
        
        // Deposit should work now
        vm.prank(user1);
        poolContract.deposit(DEPOSIT_AMOUNT);
        assertEq(poolContract.getUserBalance(user1), DEPOSIT_AMOUNT);
    }

    function testDepositEvent() public {
        // Verify user first
        _verifyUser(user1, NULLIFIER_HASH_1);
        
        // Approve tokens
        vm.prank(user1);
        mockWLD.approve(address(poolContract), DEPOSIT_AMOUNT);
        
        // Expect Deposit event
        vm.expectEmit(true, false, false, true);
        // Emit the event we expect to see
        emit Deposit(user1, DEPOSIT_AMOUNT, DEPOSIT_AMOUNT);
        
        // Deposit
        vm.prank(user1);
        poolContract.deposit(DEPOSIT_AMOUNT);
    }
    
    function testWithdrawEvent() public {
        // Setup: verify user and deposit
        _verifyUser(user1, NULLIFIER_HASH_1);
        _deposit(user1, DEPOSIT_AMOUNT);
        
        uint256 withdrawAmount = 50e18;
        
        // Expect Withdraw event
        vm.expectEmit(true, false, false, true);
        // Emit the event we expect to see
        emit Withdraw(user1, withdrawAmount, DEPOSIT_AMOUNT - withdrawAmount);
        
        // Withdraw
        vm.prank(user1);
        poolContract.withdraw(withdrawAmount);
    }
    
    function testUserVerifiedEvent() public {
        // Mock World ID verification
        mockWorldID.mockVerifyUser(user1, NULLIFIER_HASH_1);
        
        // Expect UserVerified event
        vm.expectEmit(true, false, false, true);
        // Emit the event we expect to see
        emit UserVerified(user1);
        
        // Verify user through pool contract
        uint256[8] memory proof;
        vm.prank(user1);
        poolContract.verifyUser(user1, 0, NULLIFIER_HASH_1, proof);
    }

    // Helper functions
    function _verifyUser(address user, uint256 nullifierHash) internal {
        mockWorldID.mockVerifyUser(user, nullifierHash);
        uint256[8] memory proof;
        vm.prank(user);
        poolContract.verifyUser(user, 0, nullifierHash, proof);
    }

    
    function testWithdrawFromYieldAdapter() public {
            // Setup: verify user and deposit
            _verifyUser(user1, NULLIFIER_HASH_1);
            
            // Deposit funds
            _deposit(user1, DEPOSIT_AMOUNT);
            
            // Verify funds were routed to yield adapter (both accounting and actual balance)
            assertEq(mockYieldAdapter.getTotalDeposited(), DEPOSIT_AMOUNT);
            assertEq(mockYieldAdapter.sharesOf(address(poolContract)), DEPOSIT_AMOUNT);
            assertEq(mockWLD.balanceOf(address(mockYieldAdapter)), DEPOSIT_AMOUNT);
            assertEq(mockWLD.balanceOf(address(poolContract)), 0);
            
            // Withdraw funds - this should pull from yield adapter
            uint256 withdrawAmount = 50e18;
            
            // Expect FundsWithdrawn event from yield adapter
            vm.expectEmit(true, false, false, true);
            emit FundsWithdrawn(withdrawAmount, withdrawAmount);
            
            vm.prank(user1);
            poolContract.withdraw(withdrawAmount);
            
            // Check balances
            assertEq(mockWLD.balanceOf(user1), 1000e18 - DEPOSIT_AMOUNT + withdrawAmount);
            assertEq(mockYieldAdapter.getTotalDeposited(), DEPOSIT_AMOUNT - withdrawAmount);
            assertEq(mockWLD.balanceOf(address(mockYieldAdapter)), DEPOSIT_AMOUNT - withdrawAmount);
            assertEq(mockWLD.balanceOf(address(poolContract)), 0); // Pool contract should not retain tokens
            assertEq(poolContract.getUserBalance(user1), DEPOSIT_AMOUNT - withdrawAmount);
            assertEq(poolContract.getTotalDeposits(), DEPOSIT_AMOUNT - withdrawAmount);
        }
    function _deposit(address user, uint256 amount) internal {
        vm.prank(user);
        mockWLD.approve(address(poolContract), amount);
        vm.prank(user);
        // Expect FundsDeposited event from yield adapter when depositing funds
        vm.expectEmit(true, false, false, true);
        emit FundsDeposited(amount, amount);
        poolContract.deposit(amount);
    }
}