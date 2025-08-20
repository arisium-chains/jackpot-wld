// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../script/Deploy.s.sol";

/**
 * @title DeployTest
 * @notice Test suite for deployment script functionality
 * @dev Tests the deployment script structure and configuration
 */
contract DeployTest is Test {
    DeployScript public deployScript;
    
    function setUp() public {
        deployScript = new DeployScript();
    }

    function testDeployScriptSetup() public {
        // Test that the deploy script can be instantiated
        assertTrue(address(deployScript) != address(0));
    }

    function testLocalDeployment() public {
        // Set up environment for local deployment
        vm.setEnv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
        
        // Test deployment on local network (Anvil)
        // This should not revert and should deploy the PoolContract
        DeployScript.DeployedContracts memory contracts = deployScript.run();
        
        // Verify that all contracts are deployed successfully
        assertTrue(contracts.yieldAdapter != address(0));
        assertTrue(contracts.prizePool != address(0));
        assertTrue(contracts.poolContract != address(0));
        
        console.log("YieldAdapter deployed at:", contracts.yieldAdapter);
        console.log("PrizePool deployed at:", contracts.prizePool);
        console.log("PoolContract deployed at:", contracts.poolContract);
    }

    function testUnsupportedNetwork() public {
        // Set up environment for unsupported network
        vm.setEnv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
        
        // Change to unsupported chain ID
        vm.chainId(999);
        
        // Should revert with unsupported network
        vm.expectRevert("Unsupported network");
        deployScript.run();
    }
}