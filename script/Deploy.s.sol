// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import "../contracts/PoolContract.sol";
import "../contracts/YieldAdapter.sol";
import "../contracts/PrizePool.sol";
import "../contracts/VrfStub.sol";
import "../contracts/mocks/MockWLD.sol";
import "../contracts/mocks/MockWorldID.sol";
import "../contracts/mocks/MockVRFCoordinator.sol";
import "../contracts/libraries/Constants.sol";

/**
 * @title DeployScript
 * @notice Foundry deployment script for the PoolTogether Worldcoin Miniapp contracts
 * @dev This script deploys all contracts in the correct order with proper configuration
 */
contract DeployScript is Script {
    // Deployment configuration
    struct DeploymentConfig {
        address wldToken;
        address worldIdRouter;
        address vrfCoordinator;
        bytes32 vrfKeyHash;
        uint64 vrfSubscriptionId;
        uint256 drawInterval;
        address initialOwner;
    }

    // Deployed contract addresses
    struct DeployedContracts {
        address yieldAdapter;
        address prizePool;
        address poolContract;
    }

    function setUp() public {}

    function run() public returns (DeployedContracts memory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        DeploymentConfig memory config = getDeploymentConfig(deployer);
        DeployedContracts memory contracts = deployContracts(config);

        // Initialize contracts with proper configurations
        initializeContracts(contracts, config);

        console.log("=== Deployment Summary ===");
        console.log("YieldAdapter deployed at:", contracts.yieldAdapter);
        console.log("PrizePool deployed at:", contracts.prizePool);
        console.log("PoolContract deployed at:", contracts.poolContract);

        vm.stopBroadcast();

        return contracts;
    }

    /**
     * @notice Get deployment configuration based on the current network
     * @return config The deployment configuration
     */
    function getDeploymentConfig(address deployer) internal view returns (DeploymentConfig memory config) {
        uint256 chainId = block.chainid;
        
        if (chainId == 31337) {
            // Local Anvil configuration
            config = DeploymentConfig({
                wldToken: address(0), // Will be deployed as mock
                worldIdRouter: address(0), // Will be deployed as mock
                vrfCoordinator: address(0), // Will be deployed as mock
                vrfKeyHash: bytes32(0),
                vrfSubscriptionId: 0,
                drawInterval: 1 hours, // Short interval for testing
                initialOwner: deployer
            });
        } else if (chainId == 480) {
            // Worldchain Mainnet configuration
            config = DeploymentConfig({
                wldToken: vm.envAddress("WLD_TOKEN_ADDRESS"),
                worldIdRouter: vm.envAddress("WORLD_ID_ROUTER_ADDRESS"),
                vrfCoordinator: vm.envAddress("VRF_COORDINATOR_ADDRESS"),
                vrfKeyHash: vm.envBytes32("VRF_KEY_HASH"),
                vrfSubscriptionId: uint64(vm.envUint("VRF_SUBSCRIPTION_ID")),
                drawInterval: 24 hours, // Daily draws
                initialOwner: vm.envAddress("INITIAL_OWNER")
            });
        } else if (chainId == 4801) {
            // Worldchain Sepolia configuration
            config = DeploymentConfig({
                wldToken: vm.envAddress("WLD_TOKEN_ADDRESS"),
                worldIdRouter: vm.envAddress("WORLD_ID_ROUTER_ADDRESS"),
                vrfCoordinator: vm.envAddress("VRF_COORDINATOR_ADDRESS"),
                vrfKeyHash: vm.envBytes32("VRF_KEY_HASH"),
                vrfSubscriptionId: uint64(vm.envUint("VRF_SUBSCRIPTION_ID")),
                drawInterval: 6 hours, // More frequent draws for testing
                initialOwner: vm.envAddress("INITIAL_OWNER")
            });
        } else {
            revert("Unsupported network");
        }
    }

    /**
     * @notice Deploy all contracts in the correct order
     * @param config The deployment configuration
     * @return contracts The deployed contract addresses
     */
    function deployContracts(DeploymentConfig memory config) 
        internal 
        returns (DeployedContracts memory contracts) 
    {
        console.log("Deploying contracts...");

        // Deploy mock contracts for local testing
        if (block.chainid == 31337) {
            console.log("Deploying mock contracts for local testing...");
            
            // Deploy mock WLD token
            MockWLD mockWLD = new MockWLD("Mock WLD", "mWLD", 18, 1000000e18, config.initialOwner);
            config.wldToken = address(mockWLD);
            console.log("Mock WLD deployed at:", address(mockWLD));
            
            // Deploy mock World ID
            MockWorldID mockWorldID = new MockWorldID();
            config.worldIdRouter = address(mockWorldID);
            console.log("Mock World ID deployed at:", address(mockWorldID));
            
            // Deploy mock VRF Coordinator
            MockVRFCoordinator mockVRF = new MockVRFCoordinator();
            config.vrfCoordinator = address(mockVRF);
            console.log("Mock VRF Coordinator deployed at:", address(mockVRF));
        }

        // Deploy YieldAdapter
        console.log("Deploying YieldAdapter...");
        YieldAdapter yieldAdapter = new YieldAdapter(
            config.wldToken,
            config.wldToken, // Using WLD as USDC for simplicity in testing
            config.initialOwner
        );
        contracts.yieldAdapter = address(yieldAdapter);
        console.log("YieldAdapter deployed at:", address(yieldAdapter));
        
        // Deploy VRF Adapter (VrfStub for mainnet deployment)
        console.log("Deploying VRF Adapter...");
        VrfStub vrfStub = new VrfStub(config.initialOwner);
        console.log("VrfStub deployed at:", address(vrfStub));
        
        // Deploy PrizePool
        console.log("Deploying PrizePool...");
        PrizePool prizePool = new PrizePool(
            config.wldToken,
            address(vrfStub),
            config.initialOwner
        );
        contracts.prizePool = address(prizePool);
        console.log("PrizePool deployed at:", address(prizePool));
        
        // Deploy PoolContract
        console.log("Deploying PoolContract...");
        PoolContract poolContract = new PoolContract(
            config.wldToken,
            config.worldIdRouter,
            Constants.WORLD_ID_GROUP_ID,
            config.initialOwner
        );
        contracts.poolContract = address(poolContract);
        console.log("PoolContract deployed at:", address(poolContract));
        
        return contracts;
    }

    /**
     * @notice Initialize contracts with proper configurations
     * @param contracts The deployed contract addresses
     * @param config The deployment configuration
     */
    function initializeContracts(
        DeployedContracts memory contracts,
        DeploymentConfig memory config
    ) internal {
        console.log("Initializing contracts...");

        // Get contract instances
        PoolContract poolContract = PoolContract(contracts.poolContract);
        YieldAdapter yieldAdapter = YieldAdapter(contracts.yieldAdapter);
        PrizePool prizePool = PrizePool(contracts.prizePool);

        // 1. Set up contract relationships
        console.log("Setting up contract relationships...");
        
        // Connect Pool Contract to Yield Adapter
        poolContract.setYieldAdapter(contracts.yieldAdapter);
        console.log("Pool Contract connected to Yield Adapter");
        
        // Connect Pool Contract to Prize Pool
        poolContract.setPrizePool(contracts.prizePool);
        console.log("Pool Contract connected to Prize Pool");

        // 2. Configure access controls and permissions
        console.log("Configuring access controls...");
        
        // Add Pool Contract as operator for Yield Adapter
        yieldAdapter.addOperator(contracts.poolContract);
        console.log("Pool Contract added as Yield Adapter operator");
        
        // Set Pool Contract for Prize Pool
        prizePool.setPoolContract(contracts.poolContract);
        console.log("Pool Contract set for Prize Pool");

        // 3. Set initial parameters for local testing
        if (block.chainid == 31337) {
            console.log("Setting test parameters for local deployment...");
            
            // Set shorter harvest intervals for testing
            poolContract.setYieldHarvestThreshold(10 * 1e18); // 10 WLD
            poolContract.setYieldHarvestInterval(1 hours);
            
            // Set shorter draw interval for testing
            prizePool.setDrawInterval(1 hours); // 1 hour for testing instead of 24 hours
        }
        
        console.log("Contract initialization completed successfully");
    }

    /**
     * @notice Verify deployment by checking contract states
     * @param contracts The deployed contract addresses
     */
    function verifyDeployment(DeployedContracts memory contracts) internal view {
        console.log("Verifying deployment...");

        // TODO: Add deployment verification in future tasks
        // 1. Check contract code sizes
        // 2. Verify initial states
        // 3. Test basic functionality
        
        console.log("Deployment verification placeholders created");
    }
}