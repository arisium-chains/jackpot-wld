// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IYieldAdapter.sol";
import "../YieldAdapter.sol";
import "../adapters/UniswapV3Adapter.sol";
import "../libraries/Errors.sol";
import "../BaseContract.sol";

/**
 * @title YieldAdapterFactory
 * @notice Factory contract for deploying different yield adapter implementations
 * @dev Supports multiple yield strategies including mock, Uniswap V3, and future adapters
 */
contract YieldAdapterFactory is BaseContract {
    // Yield implementation types
    enum YieldImplementation {
        MOCK,
        UNISWAP_V3,
        COMPOUND,
        AAVE
    }
    
    // Configuration for Uniswap V3 adapter
    struct UniswapV3Config {
        address factory;
        address swapRouter;
        int24 tickLower;
        int24 tickUpper;
    }
    
    // Events
    event YieldAdapterDeployed(
        address indexed adapter,
        YieldImplementation implementation,
        address wldToken,
        address usdcToken
    );
    
    // State variables
    mapping(YieldImplementation => bool) public supportedImplementations;
    UniswapV3Config public uniswapV3Config;
    
    constructor(address initialOwner) BaseContract(initialOwner) {
        // Enable supported implementations
        supportedImplementations[YieldImplementation.MOCK] = true;
        supportedImplementations[YieldImplementation.UNISWAP_V3] = true;
    }
    
    /**
     * @notice Deploy a yield adapter with the specified implementation
     * @param implementation The yield implementation type
     * @param wldToken The WLD token address
     * @param usdcToken The USDC token address
     * @return adapter The deployed adapter address
     */
    function deployYieldAdapter(
        YieldImplementation implementation,
        address wldToken,
        address usdcToken
    ) external onlyAdmin returns (address adapter) {
        if (!supportedImplementations[implementation]) {
            revert Errors.InvalidConfiguration();
        }
        
        if (wldToken == address(0) || usdcToken == address(0)) {
            revert Errors.InvalidConfiguration();
        }
        
        if (implementation == YieldImplementation.MOCK) {
            adapter = address(new YieldAdapter(wldToken, usdcToken, owner()));
        } else if (implementation == YieldImplementation.UNISWAP_V3) {
            if (uniswapV3Config.factory == address(0) || uniswapV3Config.swapRouter == address(0)) {
                revert Errors.InvalidConfiguration();
            }
            
            adapter = address(new UniswapV3Adapter(
                wldToken,
                usdcToken,
                uniswapV3Config.factory,
                uniswapV3Config.swapRouter,
                uniswapV3Config.tickLower,
                uniswapV3Config.tickUpper,
                owner()
            ));
        } else {
            revert Errors.InvalidConfiguration();
        }
        
        emit YieldAdapterDeployed(adapter, implementation, wldToken, usdcToken);
        return adapter;
    }
    
    /**
     * @notice Set Uniswap V3 configuration
     * @param factory The Uniswap V3 factory address
     * @param swapRouter The Uniswap V3 swap router address
     * @param tickLower The lower tick for liquidity range
     * @param tickUpper The upper tick for liquidity range
     */
    function setUniswapV3Config(
        address factory,
        address swapRouter,
        int24 tickLower,
        int24 tickUpper
    ) external onlyAdmin {
        if (factory == address(0) || swapRouter == address(0)) {
            revert Errors.InvalidConfiguration();
        }
        
        if (tickLower >= tickUpper) {
            revert Errors.InvalidConfiguration();
        }
        
        uniswapV3Config = UniswapV3Config({
            factory: factory,
            swapRouter: swapRouter,
            tickLower: tickLower,
            tickUpper: tickUpper
        });
    }
    
    /**
     * @notice Enable or disable a yield implementation
     * @param implementation The implementation to configure
     * @param enabled Whether the implementation is enabled
     */
    function setImplementationEnabled(
        YieldImplementation implementation,
        bool enabled
    ) external onlyAdmin {
        supportedImplementations[implementation] = enabled;
    }
    
    /**
     * @notice Get the configuration for a yield implementation
     * @param implementation The implementation to query
     * @return enabled Whether the implementation is enabled
     */
    function getImplementationConfig(YieldImplementation implementation) 
        external 
        view 
        returns (bool enabled) 
    {
        return supportedImplementations[implementation];
    }
    
    /**
     * @notice Get Uniswap V3 configuration
     * @return config The Uniswap V3 configuration
     */
    function getUniswapV3Config() external view returns (UniswapV3Config memory config) {
        return uniswapV3Config;
    }
    
    /**
     * @notice Predict the address of a yield adapter deployment
     * @param implementation The yield implementation type
     * @param wldToken The WLD token address
     * @param usdcToken The USDC token address
     * @param salt The salt for CREATE2 deployment
     * @return adapter The predicted adapter address
     */
    function predictYieldAdapterAddress(
        YieldImplementation implementation,
        address wldToken,
        address usdcToken,
        bytes32 salt
    ) external view returns (address adapter) {
        bytes memory bytecode;
        
        if (implementation == YieldImplementation.MOCK) {
            bytecode = abi.encodePacked(
                type(YieldAdapter).creationCode,
                abi.encode(wldToken, usdcToken, owner())
            );
        } else if (implementation == YieldImplementation.UNISWAP_V3) {
            bytecode = abi.encodePacked(
                type(UniswapV3Adapter).creationCode,
                abi.encode(
                    wldToken,
                    usdcToken,
                    uniswapV3Config.factory,
                    uniswapV3Config.swapRouter,
                    uniswapV3Config.tickLower,
                    uniswapV3Config.tickUpper,
                    owner()
                )
            );
        } else {
            revert Errors.InvalidConfiguration();
        }
        
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(bytecode)
        )))));
    }
    
    /**
     * @notice Deploy a yield adapter with CREATE2 for deterministic addresses
     * @param implementation The yield implementation type
     * @param wldToken The WLD token address
     * @param usdcToken The USDC token address
     * @param salt The salt for CREATE2 deployment
     * @return adapter The deployed adapter address
     */
    function deployYieldAdapterCreate2(
        YieldImplementation implementation,
        address wldToken,
        address usdcToken,
        bytes32 salt
    ) external onlyAdmin returns (address adapter) {
        if (!supportedImplementations[implementation]) {
            revert Errors.InvalidConfiguration();
        }
        
        if (wldToken == address(0) || usdcToken == address(0)) {
            revert Errors.InvalidConfiguration();
        }
        
        bytes memory bytecode;
        
        if (implementation == YieldImplementation.MOCK) {
            bytecode = abi.encodePacked(
                type(YieldAdapter).creationCode,
                abi.encode(wldToken, usdcToken, owner())
            );
        } else if (implementation == YieldImplementation.UNISWAP_V3) {
            if (uniswapV3Config.factory == address(0) || uniswapV3Config.swapRouter == address(0)) {
                revert Errors.InvalidConfiguration();
            }
            
            bytecode = abi.encodePacked(
                type(UniswapV3Adapter).creationCode,
                abi.encode(
                    wldToken,
                    usdcToken,
                    uniswapV3Config.factory,
                    uniswapV3Config.swapRouter,
                    uniswapV3Config.tickLower,
                    uniswapV3Config.tickUpper,
                    owner()
                )
            );
        } else {
            revert Errors.InvalidConfiguration();
        }
        
        assembly {
            adapter := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        if (adapter == address(0)) {
            revert Errors.InvalidConfiguration();
        }
        
        emit YieldAdapterDeployed(adapter, implementation, wldToken, usdcToken);
        return adapter;
    }
}