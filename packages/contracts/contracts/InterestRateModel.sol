// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title InterestRateModel
 * @dev Calculates supply and borrow interest rates based on utilization
 * Uses a two-slope interest rate model similar to Aave/Compound
 */
contract InterestRateModel {
    // Constants (all values in RAY = 10^27 for precision)
    uint256 public constant RAY = 10**27;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // Interest rate model parameters (in percentage * 10^25, so 2% = 2 * 10^25)
    uint256 public baseRate;           // Base rate when utilization is 0
    uint256 public optimalUtilization; // Target utilization rate (e.g., 80%)
    uint256 public slope1;             // Rate of increase below optimal
    uint256 public slope2;             // Rate of increase above optimal
    uint256 public reserveFactor;      // Platform fee (e.g., 10%)

    // Events
    event ParametersUpdated(
        uint256 baseRate,
        uint256 optimalUtilization,
        uint256 slope1,
        uint256 slope2,
        uint256 reserveFactor
    );

    constructor() {
        // Default parameters
        baseRate = 2 * 10**25;           // 2% base rate
        optimalUtilization = 80 * 10**25; // 80% optimal utilization
        slope1 = 4 * 10**25;              // 4% slope below optimal
        slope2 = 75 * 10**25;             // 75% slope above optimal
        reserveFactor = 10 * 10**25;      // 10% reserve factor
    }

    /**
     * @dev Calculate the utilization rate
     * @param totalSupplied Total amount supplied to the pool
     * @param totalBorrowed Total amount borrowed from the pool
     * @return Utilization rate in RAY
     */
    function calculateUtilization(
        uint256 totalSupplied,
        uint256 totalBorrowed
    ) public pure returns (uint256) {
        if (totalSupplied == 0) {
            return 0;
        }
        return (totalBorrowed * RAY) / totalSupplied;
    }

    /**
     * @dev Calculate the borrow rate based on utilization
     * @param utilization Current utilization rate in RAY
     * @return Borrow rate per second in RAY
     */
    function calculateBorrowRate(uint256 utilization) public view returns (uint256) {
        uint256 borrowRatePerYear;

        if (utilization <= optimalUtilization) {
            // Below optimal: baseRate + (utilization / optimal) * slope1
            borrowRatePerYear = baseRate + (utilization * slope1) / optimalUtilization;
        } else {
            // Above optimal: baseRate + slope1 + ((utilization - optimal) / (1 - optimal)) * slope2
            uint256 excessUtilization = utilization - optimalUtilization;
            uint256 maxExcess = RAY - optimalUtilization;
            borrowRatePerYear = baseRate + slope1 + (excessUtilization * slope2) / maxExcess;
        }

        // Convert annual rate to per-second rate
        return borrowRatePerYear / SECONDS_PER_YEAR;
    }

    /**
     * @dev Calculate the supply rate based on borrow rate and utilization
     * @param borrowRate Current borrow rate per second
     * @param utilization Current utilization rate
     * @return Supply rate per second in RAY
     */
    function calculateSupplyRate(
        uint256 borrowRate,
        uint256 utilization
    ) public view returns (uint256) {
        // supplyRate = borrowRate * utilization * (1 - reserveFactor)
        uint256 oneMinusReserve = RAY - reserveFactor;
        return (borrowRate * utilization * oneMinusReserve) / (RAY * RAY);
    }

    /**
     * @dev Get both supply and borrow rates
     * @param totalSupplied Total supplied to pool
     * @param totalBorrowed Total borrowed from pool
     * @return supplyRate Supply rate per second
     * @return borrowRate Borrow rate per second
     */
    function getInterestRates(
        uint256 totalSupplied,
        uint256 totalBorrowed
    ) external view returns (uint256 supplyRate, uint256 borrowRate) {
        uint256 utilization = calculateUtilization(totalSupplied, totalBorrowed);
        borrowRate = calculateBorrowRate(utilization);
        supplyRate = calculateSupplyRate(borrowRate, utilization);
    }

    /**
     * @dev Get annual percentage rates for display
     * @param totalSupplied Total supplied to pool
     * @param totalBorrowed Total borrowed from pool
     * @return supplyAPY Annual supply rate (in basis points, 100 = 1%)
     * @return borrowAPY Annual borrow rate (in basis points)
     */
    function getAPYs(
        uint256 totalSupplied,
        uint256 totalBorrowed
    ) external view returns (uint256 supplyAPY, uint256 borrowAPY) {
        uint256 utilization = calculateUtilization(totalSupplied, totalBorrowed);
        uint256 borrowRatePerSecond = calculateBorrowRate(utilization);
        uint256 supplyRatePerSecond = calculateSupplyRate(borrowRatePerSecond, utilization);

        // Convert per-second rate to annual rate in basis points
        borrowAPY = (borrowRatePerSecond * SECONDS_PER_YEAR * 10000) / RAY;
        supplyAPY = (supplyRatePerSecond * SECONDS_PER_YEAR * 10000) / RAY;
    }
}
