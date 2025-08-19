// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing purposes
 * @dev Simulates USDC token with 6 decimals
 */
contract MockUSDC is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(initialOwner, initialSupply);
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @notice Faucet function to get test tokens
     * @param amount The amount of tokens to receive
     */
    function faucet(uint256 amount) external {
        require(amount <= 10000 * 10**_decimals, "MockUSDC: Amount exceeds faucet limit");
        _mint(msg.sender, amount);
    }
}