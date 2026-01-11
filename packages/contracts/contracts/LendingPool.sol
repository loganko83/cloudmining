// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./XPxToken.sol";
import "./InterestRateModel.sol";

/**
 * @title LendingPool
 * @dev Main lending pool contract for XP token
 * - Users can supply XP and receive XPx (interest-bearing token)
 * - Users can borrow XP by providing collateral
 * - Supports liquidation of undercollateralized positions
 */
contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant RAY = 10**27;
    uint256 public constant PERCENTAGE_FACTOR = 10000; // 100.00%

    // Pool parameters
    uint256 public ltvRatio = 7500;              // 75% LTV
    uint256 public liquidationThreshold = 8000;   // 80% liquidation threshold
    uint256 public liquidationBonus = 500;        // 5% liquidation bonus

    // Tokens
    IERC20 public xpToken;
    XPxToken public xpxToken;
    InterestRateModel public interestRateModel;

    // Pool state
    uint256 public totalSupplied;
    uint256 public totalBorrowed;
    uint256 public liquidityIndex = RAY;
    uint256 public borrowIndex = RAY;
    uint256 public lastUpdateTimestamp;

    // User borrow positions
    struct BorrowPosition {
        uint256 borrowedAmount;      // Principal borrowed
        uint256 collateralAmount;    // Collateral deposited
        uint256 entryBorrowIndex;    // Borrow index at entry
    }

    mapping(address => BorrowPosition) public borrowPositions;

    // Events
    event Supply(address indexed user, uint256 amount, uint256 xpxMinted);
    event Withdraw(address indexed user, uint256 amount, uint256 xpxBurned);
    event Borrow(address indexed user, uint256 borrowAmount, uint256 collateralAmount);
    event Repay(address indexed user, uint256 repayAmount, uint256 remainingDebt);
    event Liquidation(
        address indexed liquidator,
        address indexed borrower,
        uint256 debtCovered,
        uint256 collateralSeized
    );
    event IndexesUpdated(uint256 liquidityIndex, uint256 borrowIndex);

    constructor(
        address _xpToken,
        address _xpxToken,
        address _interestRateModel
    ) Ownable(msg.sender) {
        require(_xpToken != address(0), "Invalid XP token");
        require(_xpxToken != address(0), "Invalid XPx token");
        require(_interestRateModel != address(0), "Invalid interest rate model");

        xpToken = IERC20(_xpToken);
        xpxToken = XPxToken(_xpxToken);
        interestRateModel = InterestRateModel(_interestRateModel);
        lastUpdateTimestamp = block.timestamp;
    }

    /**
     * @dev Update indexes based on time elapsed
     */
    function updateIndexes() public {
        uint256 timeElapsed = block.timestamp - lastUpdateTimestamp;
        if (timeElapsed == 0) return;

        (uint256 supplyRate, uint256 borrowRate) = interestRateModel.getInterestRates(
            totalSupplied,
            totalBorrowed
        );

        // Update liquidity index (for suppliers)
        if (totalSupplied > 0) {
            uint256 liquidityAccrued = (liquidityIndex * supplyRate * timeElapsed) / RAY;
            liquidityIndex += liquidityAccrued;
        }

        // Update borrow index (for borrowers)
        if (totalBorrowed > 0) {
            uint256 borrowAccrued = (borrowIndex * borrowRate * timeElapsed) / RAY;
            borrowIndex += borrowAccrued;
        }

        lastUpdateTimestamp = block.timestamp;

        // Update XPx token index
        xpxToken.updateLiquidityIndex(liquidityIndex);

        emit IndexesUpdated(liquidityIndex, borrowIndex);
    }

    /**
     * @dev Supply XP to the lending pool
     * @param amount Amount of XP to supply
     */
    function supply(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        updateIndexes();

        // Transfer XP from user
        xpToken.safeTransferFrom(msg.sender, address(this), amount);

        // Mint XPx tokens
        xpxToken.mint(msg.sender, amount, liquidityIndex);

        totalSupplied += amount;

        emit Supply(msg.sender, amount, amount);
    }

    /**
     * @dev Withdraw XP from the lending pool
     * @param amount Amount of XP to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        updateIndexes();

        uint256 userBalance = xpxToken.balanceOf(msg.sender);
        require(userBalance >= amount, "Insufficient XPx balance");

        uint256 availableLiquidity = totalSupplied - totalBorrowed;
        require(availableLiquidity >= amount, "Insufficient liquidity");

        // Burn XPx tokens
        xpxToken.burn(msg.sender, amount, liquidityIndex);

        // Transfer XP to user
        xpToken.safeTransfer(msg.sender, amount);

        totalSupplied -= amount;

        emit Withdraw(msg.sender, amount, amount);
    }

    /**
     * @dev Borrow XP by providing collateral
     * @param borrowAmount Amount of XP to borrow
     * @param collateralAmount Amount of XP collateral to provide
     */
    function borrow(uint256 borrowAmount, uint256 collateralAmount) external nonReentrant {
        require(borrowAmount > 0, "Borrow amount must be greater than 0");
        require(collateralAmount > 0, "Collateral amount must be greater than 0");

        updateIndexes();

        // Check LTV ratio
        uint256 maxBorrow = (collateralAmount * ltvRatio) / PERCENTAGE_FACTOR;
        require(borrowAmount <= maxBorrow, "Borrow exceeds LTV limit");

        // Check liquidity
        uint256 availableLiquidity = totalSupplied - totalBorrowed;
        require(availableLiquidity >= borrowAmount, "Insufficient liquidity");

        // Transfer collateral from user
        xpToken.safeTransferFrom(msg.sender, address(this), collateralAmount);

        // Update borrow position
        BorrowPosition storage position = borrowPositions[msg.sender];
        if (position.borrowedAmount > 0) {
            // Add to existing position with accrued interest
            uint256 currentDebt = getDebtWithInterest(msg.sender);
            position.borrowedAmount = currentDebt + borrowAmount;
            position.collateralAmount += collateralAmount;
        } else {
            position.borrowedAmount = borrowAmount;
            position.collateralAmount = collateralAmount;
        }
        position.entryBorrowIndex = borrowIndex;

        // Transfer borrowed XP to user
        xpToken.safeTransfer(msg.sender, borrowAmount);

        totalBorrowed += borrowAmount;

        emit Borrow(msg.sender, borrowAmount, collateralAmount);
    }

    /**
     * @dev Repay borrowed XP
     * @param amount Amount of XP to repay
     */
    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        updateIndexes();

        BorrowPosition storage position = borrowPositions[msg.sender];
        require(position.borrowedAmount > 0, "No borrow position");

        uint256 currentDebt = getDebtWithInterest(msg.sender);
        uint256 repayAmount = amount > currentDebt ? currentDebt : amount;

        // Transfer XP from user
        xpToken.safeTransferFrom(msg.sender, address(this), repayAmount);

        // Update position
        if (repayAmount >= currentDebt) {
            // Full repayment - return collateral
            uint256 collateralToReturn = position.collateralAmount;
            xpToken.safeTransfer(msg.sender, collateralToReturn);

            delete borrowPositions[msg.sender];
            totalBorrowed -= position.borrowedAmount;
        } else {
            // Partial repayment
            position.borrowedAmount = currentDebt - repayAmount;
            position.entryBorrowIndex = borrowIndex;
            totalBorrowed -= repayAmount;
        }

        emit Repay(msg.sender, repayAmount, currentDebt - repayAmount);
    }

    /**
     * @dev Liquidate an undercollateralized position
     * @param borrower Address of the borrower to liquidate
     * @param debtToCover Amount of debt to cover
     */
    function liquidate(address borrower, uint256 debtToCover) external nonReentrant {
        require(borrower != msg.sender, "Cannot liquidate own position");

        updateIndexes();

        BorrowPosition storage position = borrowPositions[borrower];
        require(position.borrowedAmount > 0, "No borrow position");

        uint256 healthFactor = getHealthFactor(borrower);
        require(healthFactor < PERCENTAGE_FACTOR, "Position is healthy");

        uint256 currentDebt = getDebtWithInterest(borrower);
        uint256 actualDebtToCover = debtToCover > currentDebt ? currentDebt : debtToCover;

        // Calculate collateral to seize (with bonus)
        uint256 collateralToSeize = (actualDebtToCover * (PERCENTAGE_FACTOR + liquidationBonus)) / PERCENTAGE_FACTOR;
        require(collateralToSeize <= position.collateralAmount, "Not enough collateral");

        // Transfer debt payment from liquidator
        xpToken.safeTransferFrom(msg.sender, address(this), actualDebtToCover);

        // Transfer collateral to liquidator
        xpToken.safeTransfer(msg.sender, collateralToSeize);

        // Update position
        position.borrowedAmount = currentDebt - actualDebtToCover;
        position.collateralAmount -= collateralToSeize;
        position.entryBorrowIndex = borrowIndex;

        if (position.borrowedAmount == 0) {
            // Return remaining collateral to borrower
            if (position.collateralAmount > 0) {
                xpToken.safeTransfer(borrower, position.collateralAmount);
            }
            delete borrowPositions[borrower];
        }

        totalBorrowed -= actualDebtToCover;

        emit Liquidation(msg.sender, borrower, actualDebtToCover, collateralToSeize);
    }

    /**
     * @dev Get current debt with accrued interest
     */
    function getDebtWithInterest(address user) public view returns (uint256) {
        BorrowPosition memory position = borrowPositions[user];
        if (position.borrowedAmount == 0) return 0;

        return (position.borrowedAmount * borrowIndex) / position.entryBorrowIndex;
    }

    /**
     * @dev Get health factor for a position
     */
    function getHealthFactor(address user) public view returns (uint256) {
        BorrowPosition memory position = borrowPositions[user];
        if (position.borrowedAmount == 0) return type(uint256).max;

        uint256 currentDebt = getDebtWithInterest(user);
        if (currentDebt == 0) return type(uint256).max;

        // healthFactor = (collateral * liquidationThreshold) / debt
        return (position.collateralAmount * liquidationThreshold) / currentDebt;
    }

    /**
     * @dev Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 _totalSupplied,
        uint256 _totalBorrowed,
        uint256 _availableLiquidity,
        uint256 _utilizationRate,
        uint256 _supplyAPY,
        uint256 _borrowAPY
    ) {
        _totalSupplied = totalSupplied;
        _totalBorrowed = totalBorrowed;
        _availableLiquidity = totalSupplied - totalBorrowed;
        _utilizationRate = totalSupplied > 0 ? (totalBorrowed * PERCENTAGE_FACTOR) / totalSupplied : 0;

        (_supplyAPY, _borrowAPY) = interestRateModel.getAPYs(totalSupplied, totalBorrowed);
    }

    /**
     * @dev Update pool parameters (owner only)
     */
    function updateParameters(
        uint256 _ltvRatio,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus
    ) external onlyOwner {
        require(_ltvRatio < _liquidationThreshold, "LTV must be less than threshold");
        require(_liquidationThreshold <= PERCENTAGE_FACTOR, "Invalid threshold");
        require(_liquidationBonus <= 2000, "Bonus too high"); // Max 20%

        ltvRatio = _ltvRatio;
        liquidationThreshold = _liquidationThreshold;
        liquidationBonus = _liquidationBonus;
    }
}
