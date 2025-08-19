// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockWLD
 * @notice Mock WLD token for testing purposes
 * @dev ERC20 token that mimics the WLD token functionality
 */
contract MockWLD is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        _decimals = decimals_;
        _mint(initialOwner, initialSupply);
    }

    /**
     * @notice Override decimals function
     * @return The number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint tokens to an address (owner only)
     * @param to The address to mint tokens to
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from an address (owner only)
     * @param from The address to burn tokens from
     * @param amount The amount to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @notice Faucet function for testing - allows anyone to mint tokens
     * @param amount The amount to mint (max 1000 WLD per call)
     */
    function faucet(uint256 amount) external {
        require(amount <= 1000 * 10**_decimals, "MockWLD: Amount exceeds faucet limit");
        _mint(msg.sender, amount);
    }
}