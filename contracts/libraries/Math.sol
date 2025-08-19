// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Math
 * @notice Mathematical utility functions for the protocol
 * @dev Safe math operations and percentage calculations
 */
library Math {
    /**
     * @notice Calculate percentage of a value using basis points
     * @param value The value to calculate percentage of
     * @param bps The basis points (10000 = 100%)
     * @return The calculated percentage
     */
    function calculateBps(uint256 value, uint256 bps) internal pure returns (uint256) {
        return (value * bps) / 10000;
    }

    /**
     * @notice Calculate APY based on yield and time period
     * @param yieldAmount The yield generated
     * @param principal The principal amount
     * @param timeElapsed The time elapsed in seconds
     * @return The APY in basis points
     */
    function calculateAPY(
        uint256 yieldAmount,
        uint256 principal,
        uint256 timeElapsed
    ) internal pure returns (uint256) {
        if (principal == 0 || timeElapsed == 0) return 0;
        
        // Calculate annualized yield rate
        uint256 yearInSeconds = 365 days;
        uint256 yieldRate = (yieldAmount * 1e18) / principal;
        uint256 annualizedRate = (yieldRate * yearInSeconds) / timeElapsed;
        
        // Convert to basis points
        return (annualizedRate * 10000) / 1e18;
    }

    /**
     * @notice Calculate shares based on deposit amount and current share price
     * @param amount The deposit amount
     * @param totalShares The total shares outstanding
     * @param totalAssets The total assets under management
     * @return The number of shares to mint
     */
    function calculateShares(
        uint256 amount,
        uint256 totalShares,
        uint256 totalAssets
    ) internal pure returns (uint256) {
        if (totalShares == 0 || totalAssets == 0) {
            return amount;
        }
        return (amount * totalShares) / totalAssets;
    }

    /**
     * @notice Calculate assets based on shares and current share price
     * @param shares The number of shares
     * @param totalShares The total shares outstanding
     * @param totalAssets The total assets under management
     * @return The asset amount
     */
    function calculateAssets(
        uint256 shares,
        uint256 totalShares,
        uint256 totalAssets
    ) internal pure returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares * totalAssets) / totalShares;
    }

    /**
     * @notice Calculate weighted random selection based on deposit amounts
     * @param randomSeed The random seed
     * @param totalWeight The total weight (sum of all deposits)
     * @return The selected weight position
     */
    function weightedRandomSelection(
        uint256 randomSeed,
        uint256 totalWeight
    ) internal pure returns (uint256) {
        if (totalWeight == 0) return 0;
        return randomSeed % totalWeight;
    }

    /**
     * @notice Safe minimum function
     * @param a First value
     * @param b Second value
     * @return The minimum value
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @notice Safe maximum function
     * @param a First value
     * @param b Second value
     * @return The maximum value
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /**
     * @notice Calculate compound interest
     * @param principal The principal amount
     * @param rate The interest rate (in basis points per period)
     * @param periods The number of periods
     * @return The final amount after compound interest
     */
    function compoundInterest(
        uint256 principal,
        uint256 rate,
        uint256 periods
    ) internal pure returns (uint256) {
        if (periods == 0) return principal;
        
        uint256 result = principal;
        for (uint256 i = 0; i < periods; i++) {
            result = result + calculateBps(result, rate);
        }
        return result;
    }
}

/**
 * @title WorldIDUtils
 * @notice Utility functions for World ID integration
 */
library WorldIDUtils {
    /**
     * @notice Hash a string to field element for World ID
     * @param input The input bytes to hash
     * @return The field element
     */
    function hashToField(bytes memory input) internal pure returns (uint256) {
        return uint256(keccak256(input)) >> 8;
    }
}