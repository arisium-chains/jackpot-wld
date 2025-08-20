// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import "../contracts/PoolContract.sol";
import "../contracts/YieldAdapter.sol";
import "../contracts/PrizePool.sol";
import "../contracts/VrfStub.sol";
import "../contracts/VrfConsumer.sol";
import "../contracts/factories/YieldAdapterFactory.sol";
import "../contracts/adapters/UniswapV3Adapter.sol";
import "../contracts/mocks/MockWLD.sol";
import "../contracts/mocks/MockWorldID.sol";
import "../contracts/mocks/MockVRFCoordinator.sol";
import "../contracts/libraries/Constants.sol";

/**
 * @title DeployTestnetScript
 * @notice Foundry deployment script specifically for testnet deployment
 * @dev This script deploys contracts and generates addresses.json + ABIs for frontend
 */
contract DeployTestnetScript is Script {
    // Deployment configuration
    struct DeploymentConfig {
        address wldToken;
        address worldIdRouter;
        address vrfCoordinator;
        bytes32 vrfKeyHash;
        uint64 vrfSubscriptionId;
        uint256 drawInterval;
        address initialOwner;
        YieldAdapterFactory.YieldImplementation yieldImpl;
        address uniswapV3Factory;
        address uniswapV3Router;
        int24 tickLower;
        int24 tickUpper;
    }

    // Deployed contract addresses
    struct DeployedContracts {
        address wldToken;
        address worldIdRouter;
        address vrfCoordinator;
        address vrfAdapter;
        address yieldAdapterFactory;
        address yieldAdapter;
        address prizePool;
        address poolContract;
    }

    function setUp() public {}

    function run() public returns (DeployedContracts memory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts to testnet with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        DeploymentConfig memory config = getDeploymentConfig(deployer);
        DeployedContracts memory contracts = deployContracts(config);

        // Initialize contracts with proper configurations
        initializeContracts(contracts, config);

        console.log("=== Testnet Deployment Summary ===");
        console.log("WLD Token:", contracts.wldToken);
        console.log("World ID Router:", contracts.worldIdRouter);
        console.log("VRF Coordinator:", contracts.vrfCoordinator);
        console.log("VRF Adapter:", contracts.vrfAdapter);
        console.log("YieldAdapterFactory:", contracts.yieldAdapterFactory);
        console.log("YieldAdapter:", contracts.yieldAdapter);
        console.log("PrizePool:", contracts.prizePool);
        console.log("PoolContract:", contracts.poolContract);

        vm.stopBroadcast();

        // Generate addresses.json and ABIs for frontend
        generateFrontendFiles(contracts);

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
                initialOwner: deployer,
                yieldImpl: _getYieldImplementation(),
                uniswapV3Factory: vm.envOr("UNISWAP_V3_FACTORY", address(0)),
                uniswapV3Router: vm.envOr("UNISWAP_V3_ROUTER", address(0)),
                tickLower: int24(vm.envOr("UNISWAP_TICK_LOWER", int256(-887220))),
                tickUpper: int24(vm.envOr("UNISWAP_TICK_UPPER", int256(887220)))
            });
        } else if (chainId == 4801) {
            // Worldchain Sepolia configuration
            config = DeploymentConfig({
                wldToken: vm.envOr("WLD_TOKEN_ADDRESS", address(0)), // Deploy mock if not provided
                worldIdRouter: vm.envOr("WORLD_ID_ROUTER_ADDRESS", address(0)), // Deploy mock if not provided
                vrfCoordinator: vm.envOr("VRF_COORDINATOR_ADDRESS", address(0)), // Deploy mock if not provided
                vrfKeyHash: vm.envOr("VRF_KEY_HASH", bytes32(0)),
                vrfSubscriptionId: uint64(vm.envOr("VRF_SUBSCRIPTION_ID", uint256(0))),
                drawInterval: 6 hours, // More frequent draws for testing
                initialOwner: vm.envOr("INITIAL_OWNER", deployer),
                yieldImpl: _getYieldImplementation(),
                uniswapV3Factory: vm.envOr("UNISWAP_V3_FACTORY", address(0)),
                uniswapV3Router: vm.envOr("UNISWAP_V3_ROUTER", address(0)),
                tickLower: int24(vm.envOr("UNISWAP_TICK_LOWER", int256(-887220))),
                tickUpper: int24(vm.envOr("UNISWAP_TICK_UPPER", int256(887220)))
            });
        } else if (chainId == 11155111) {
            // Ethereum Sepolia configuration
            config = DeploymentConfig({
                wldToken: vm.envOr("WLD_TOKEN_ADDRESS", address(0)), // Deploy mock if not provided
                worldIdRouter: vm.envOr("WORLD_ID_ROUTER_ADDRESS", address(0)), // Deploy mock if not provided
                vrfCoordinator: vm.envOr("VRF_COORDINATOR_ADDRESS", address(0)), // Deploy mock if not provided
                vrfKeyHash: vm.envOr("VRF_KEY_HASH", bytes32(0)),
                vrfSubscriptionId: uint64(vm.envOr("VRF_SUBSCRIPTION_ID", uint256(0))),
                drawInterval: 6 hours, // More frequent draws for testing
                initialOwner: vm.envOr("INITIAL_OWNER", deployer),
                yieldImpl: _getYieldImplementation(),
                uniswapV3Factory: vm.envOr("UNISWAP_V3_FACTORY", address(0)),
                uniswapV3Router: vm.envOr("UNISWAP_V3_ROUTER", address(0)),
                tickLower: int24(vm.envOr("UNISWAP_TICK_LOWER", int256(-887220))),
                tickUpper: int24(vm.envOr("UNISWAP_TICK_UPPER", int256(887220)))
            });
        } else {
            // Default testnet configuration - deploy all mocks
            config = DeploymentConfig({
                wldToken: address(0), // Will be deployed as mock
                worldIdRouter: address(0), // Will be deployed as mock
                vrfCoordinator: address(0), // Will be deployed as mock
                vrfKeyHash: bytes32(0),
                vrfSubscriptionId: 0,
                drawInterval: 6 hours, // More frequent draws for testing
                initialOwner: deployer,
                yieldImpl: _getYieldImplementation(),
                uniswapV3Factory: vm.envOr("UNISWAP_V3_FACTORY", address(0)),
                uniswapV3Router: vm.envOr("UNISWAP_V3_ROUTER", address(0)),
                tickLower: int24(vm.envOr("UNISWAP_TICK_LOWER", int256(-887220))),
                tickUpper: int24(vm.envOr("UNISWAP_TICK_UPPER", int256(887220)))
            });
        }
    }
    
    /**
     * @notice Get yield implementation from environment variable
     * @return The yield implementation type
     */
    function _getYieldImplementation() internal view returns (YieldAdapterFactory.YieldImplementation) {
        string memory yieldImpl = vm.envOr("YIELD_IMPL", string("MOCK"));
        
        if (keccak256(abi.encodePacked(yieldImpl)) == keccak256(abi.encodePacked("UNISWAP_V3"))) {
            return YieldAdapterFactory.YieldImplementation.UNISWAP_V3;
        } else if (keccak256(abi.encodePacked(yieldImpl)) == keccak256(abi.encodePacked("COMPOUND"))) {
            return YieldAdapterFactory.YieldImplementation.COMPOUND;
        } else if (keccak256(abi.encodePacked(yieldImpl)) == keccak256(abi.encodePacked("AAVE"))) {
            return YieldAdapterFactory.YieldImplementation.AAVE;
        } else {
             return YieldAdapterFactory.YieldImplementation.MOCK;
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

        // Deploy mock contracts if addresses not provided
        if (config.wldToken == address(0)) {
            console.log("Deploying mock WLD token...");
            MockWLD mockWLD = new MockWLD("Mock WLD", "mWLD", 18, 1000000e18, config.initialOwner);
            contracts.wldToken = address(mockWLD);
            console.log("Mock WLD deployed at:", address(mockWLD));
        } else {
            contracts.wldToken = config.wldToken;
            console.log("Using existing WLD token at:", config.wldToken);
        }
        
        if (config.worldIdRouter == address(0)) {
            console.log("Deploying mock World ID router...");
            MockWorldID mockWorldID = new MockWorldID();
            contracts.worldIdRouter = address(mockWorldID);
            console.log("Mock World ID deployed at:", address(mockWorldID));
        } else {
            contracts.worldIdRouter = config.worldIdRouter;
            console.log("Using existing World ID router at:", config.worldIdRouter);
        }
        
        if (config.vrfCoordinator == address(0)) {
            console.log("Deploying mock VRF Coordinator...");
            MockVRFCoordinator mockVRF = new MockVRFCoordinator();
            contracts.vrfCoordinator = address(mockVRF);
            console.log("Mock VRF Coordinator deployed at:", address(mockVRF));
        } else {
            contracts.vrfCoordinator = config.vrfCoordinator;
            console.log("Using existing VRF Coordinator at:", config.vrfCoordinator);
        }

        // Deploy YieldAdapterFactory
        console.log("Deploying YieldAdapterFactory...");
        YieldAdapterFactory yieldAdapterFactory = new YieldAdapterFactory(config.initialOwner);
        contracts.yieldAdapterFactory = address(yieldAdapterFactory);
        console.log("YieldAdapterFactory deployed at:", address(yieldAdapterFactory));
        
        // Configure Uniswap V3 if needed
        if (config.yieldImpl == YieldAdapterFactory.YieldImplementation.UNISWAP_V3) {
            if (config.uniswapV3Factory != address(0) && config.uniswapV3Router != address(0)) {
                console.log("Configuring Uniswap V3 settings...");
                yieldAdapterFactory.setUniswapV3Config(
                    config.uniswapV3Factory,
                    config.uniswapV3Router,
                    config.tickLower,
                    config.tickUpper
                );
                console.log("Uniswap V3 configuration set");
            } else {
                console.log("Warning: Uniswap V3 implementation selected but factory/router not configured, falling back to MOCK");
                config.yieldImpl = YieldAdapterFactory.YieldImplementation.MOCK;
            }
        }
        
        // Deploy YieldAdapter using factory
        console.log("Deploying YieldAdapter with implementation:", uint256(config.yieldImpl));
        address yieldAdapter = yieldAdapterFactory.deployYieldAdapter(
            config.yieldImpl,
            contracts.wldToken,
            contracts.wldToken // Using WLD as USDC for simplicity in testing
        );
        contracts.yieldAdapter = yieldAdapter;
        console.log("YieldAdapter deployed at:", yieldAdapter);
        
        // Deploy VRF Adapter (use stub for testing, consumer for production)
        console.log("Deploying VRF Adapter...");
        address vrfAdapter;
        if (config.vrfSubscriptionId == 0 || config.vrfKeyHash == bytes32(0)) {
             // Deploy VrfStub for testing
             VrfStub vrfStub = new VrfStub(config.initialOwner);
             vrfAdapter = address(vrfStub);
             console.log("VrfStub deployed at:", address(vrfStub));
         } else {
             // Deploy VrfConsumer for production
             VrfConsumer vrfConsumer = new VrfConsumer(
                 config.initialOwner,
                 contracts.vrfCoordinator,
                 config.vrfKeyHash,
                 config.vrfSubscriptionId
             );
             vrfAdapter = address(vrfConsumer);
             console.log("VrfConsumer deployed at:", address(vrfConsumer));
         }
        contracts.vrfAdapter = vrfAdapter;
        
        // Deploy PrizePool
        console.log("Deploying PrizePool...");
        PrizePool prizePool = new PrizePool(
            contracts.wldToken,
            vrfAdapter,
            config.initialOwner
        );
        contracts.prizePool = address(prizePool);
        console.log("PrizePool deployed at:", address(prizePool));
        
        // Deploy PoolContract
        console.log("Deploying PoolContract...");
        PoolContract poolContract = new PoolContract(
            contracts.wldToken,
            contracts.worldIdRouter,
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
        
        // VRF Adapter is ready to use (no additional authorization needed)
        console.log("VRF Adapter configured and ready for use");

        // 3. Set testnet parameters
        console.log("Setting testnet parameters...");
        
        // Set shorter harvest intervals for testing
        poolContract.setYieldHarvestThreshold(10 * 1e18); // 10 WLD
        poolContract.setYieldHarvestInterval(1 hours);
        
        // Set shorter draw interval for testing
        prizePool.setDrawInterval(config.drawInterval);
        
        console.log("Contract initialization completed successfully");
    }

    /**
     * @notice Generate addresses.json and ABIs for frontend
     * @param contracts The deployed contract addresses
     */
    function generateFrontendFiles(DeployedContracts memory contracts) internal {
        console.log("Generating frontend files...");
        
        // Generate addresses.json
        string memory addressesJson = string.concat(
            "{",
            '"chainId":', vm.toString(block.chainid), ",",
            '"wldToken":"', vm.toString(contracts.wldToken), '",',
            '"worldIdRouter":"', vm.toString(contracts.worldIdRouter), '",',
            '"vrfCoordinator":"', vm.toString(contracts.vrfCoordinator), '",',
            '"vrfAdapter":"', vm.toString(contracts.vrfAdapter), '",',
            '"yieldAdapterFactory":"', vm.toString(contracts.yieldAdapterFactory), '",',
            '"yieldAdapter":"', vm.toString(contracts.yieldAdapter), '",',
            '"prizePool":"', vm.toString(contracts.prizePool), '",',
            '"poolContract":"', vm.toString(contracts.poolContract), '"',
            "}"
        );
        
        vm.writeFile("./public/addresses.json", addressesJson);
        console.log("Generated addresses.json");
        
        // Copy ABIs to frontend
        string[] memory copyCommands = new string[](6);
        
        copyCommands[0] = "cp";
        copyCommands[1] = "./out/PoolContract.sol/PoolContract.json";
        copyCommands[2] = "./src/abi/PoolContract.json";
        vm.ffi(copyCommands);
        
        copyCommands[1] = "./out/PrizePool.sol/PrizePool.json";
        copyCommands[2] = "./src/abi/PrizePool.json";
        vm.ffi(copyCommands);
        
        copyCommands[1] = "./out/YieldAdapterFactory.sol/YieldAdapterFactory.json";
        copyCommands[2] = "./src/abi/YieldAdapterFactory.json";
        vm.ffi(copyCommands);
        
        copyCommands[1] = "./out/YieldAdapter.sol/YieldAdapter.json";
        copyCommands[2] = "./src/abi/YieldAdapter.json";
        vm.ffi(copyCommands);
        
        copyCommands[1] = "./out/UniswapV3Adapter.sol/UniswapV3Adapter.json";
        copyCommands[2] = "./src/abi/UniswapV3Adapter.json";
        vm.ffi(copyCommands);
        
        copyCommands[1] = "./out/MockWLD.sol/MockWLD.json";
        copyCommands[2] = "./src/abi/MockWLD.json";
        vm.ffi(copyCommands);
        
        console.log("Copied ABIs to frontend");
    }
}