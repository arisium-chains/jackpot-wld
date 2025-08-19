// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./libraries/Errors.sol";

/**
 * @title BaseContract
 * @notice Base contract with common functionality for access control, pausable, and reentrancy guard
 * @dev This contract provides shared functionality for all protocol contracts
 */
abstract contract BaseContract is Ownable, Pausable, ReentrancyGuard {
    // Role-based access control
    mapping(address => bool) public admins;
    mapping(address => bool) public operators;

    // Events
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);

    /**
     * @notice Constructor sets the deployer as owner
     * @param initialOwner The initial owner of the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert Errors.ZeroAddress();
    }

    /**
     * @notice Modifier to restrict access to admins only
     */
    modifier onlyAdmin() {
        if (!admins[msg.sender] && msg.sender != owner()) {
            revert Errors.NotAdmin(msg.sender);
        }
        _;
    }

    /**
     * @notice Modifier to restrict access to operators only
     */
    modifier onlyOperator() {
        if (!operators[msg.sender] && !admins[msg.sender] && msg.sender != owner()) {
            revert Errors.Unauthorized(msg.sender);
        }
        _;
    }

    /**
     * @notice Modifier to check for valid addresses
     * @param addr The address to validate
     */
    modifier validAddress(address addr) {
        if (addr == address(0)) revert Errors.ZeroAddress();
        _;
    }

    /**
     * @notice Modifier to check for valid amounts
     * @param amount The amount to validate
     */
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert Errors.InvalidAmount(amount);
        _;
    }

    /**
     * @notice Add an admin
     * @param admin The address to add as admin
     */
    function addAdmin(address admin) external onlyOwner validAddress(admin) {
        admins[admin] = true;
        emit AdminAdded(admin);
    }

    /**
     * @notice Remove an admin
     * @param admin The address to remove from admins
     */
    function removeAdmin(address admin) external onlyOwner {
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    /**
     * @notice Add an operator
     * @param operator The address to add as operator
     */
    function addOperator(address operator) external onlyAdmin validAddress(operator) {
        operators[operator] = true;
        emit OperatorAdded(operator);
    }

    /**
     * @notice Remove an operator
     * @param operator The address to remove from operators
     */
    function removeOperator(address operator) external onlyAdmin {
        operators[operator] = false;
        emit OperatorRemoved(operator);
    }

    /**
     * @notice Pause the contract (admin only)
     */
    function pause() external virtual onlyAdmin {
        _pause();
    }
    
    /**
     * @notice Unpause the contract (admin only)
     */
    function unpause() external virtual onlyAdmin {
        _unpause();
    }

    /**
     * @notice Check if an address is an admin
     * @param account The address to check
     * @return True if the address is an admin
     */
    function isAdmin(address account) external view returns (bool) {
        return admins[account] || account == owner();
    }

    /**
     * @notice Check if an address is an operator
     * @param account The address to check
     * @return True if the address is an operator
     */
    function isOperator(address account) external view returns (bool) {
        return operators[account] || admins[account] || account == owner();
    }

    /**
     * @notice Override _update to include pause check
     */
    function _checkPaused() internal view {
        if (paused()) revert Errors.ContractPaused();
    }

    /**
     * @notice Safe transfer function with error handling
     * @param token The token contract address
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function _safeTransfer(address token, address to, uint256 amount) internal {
        if (to == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount(amount);

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );

        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert Errors.TransferFailed();
        }
    }

    /**
     * @notice Safe transferFrom function with error handling
     * @param token The token contract address
     * @param from The sender address
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        if (from == address(0) || to == address(0)) revert Errors.ZeroAddress();
        if (amount == 0) revert Errors.InvalidAmount(amount);

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
        );

        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert Errors.TransferFailed();
        }
    }
}