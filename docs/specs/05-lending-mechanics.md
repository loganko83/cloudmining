# Lending Mechanics - Xphere Mining Cloud

## 1. Overview

The Xphere Lending Pool implements an Aave-style pooled lending mechanism where:
- **Suppliers** deposit XP tokens and receive XPx (interest-bearing tokens)
- **Borrowers** provide collateral (USDT) to borrow XP tokens
- **Interest rates** adjust dynamically based on pool utilization
- **Liquidators** can liquidate unhealthy positions for a bonus

---

## 2. Interest Rate Model

### 2.1 Utilization Rate

```
Utilization Rate (U) = Total Borrowed / Total Supplied
```

### 2.2 Borrow Rate Calculation

The interest rate follows a kinked curve with two slopes:

```
If U <= Optimal (80%):
    Borrow Rate = Base Rate + (U / Optimal) * Slope1

If U > Optimal (80%):
    Borrow Rate = Base Rate + Slope1 + ((U - Optimal) / (1 - Optimal)) * Slope2
```

### 2.3 Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Base Rate | 2% | Minimum borrow rate |
| Optimal Utilization | 80% | Target utilization |
| Slope 1 | 4% | Rate increase below optimal |
| Slope 2 | 75% | Rate increase above optimal |
| Reserve Factor | 10% | Protocol fee on interest |

### 2.4 Rate Examples

| Utilization | Borrow APY | Supply APY |
|-------------|------------|------------|
| 0% | 2.00% | 0.00% |
| 20% | 3.00% | 0.54% |
| 40% | 4.00% | 1.44% |
| 60% | 5.00% | 2.70% |
| 80% | 6.00% | 4.32% |
| 90% | 43.50% | 35.24% |
| 100% | 81.00% | 72.90% |

### 2.5 Interest Rate Curve

```
    Rate (%)
     │
  80 │                                    ╱
     │                                  ╱
  60 │                                ╱
     │                              ╱
  40 │                            ╱
     │                          ╱
  20 │        ────────────────╱
     │       ╱
   0 │─────╱────────────────────────────────
     └─────────────────────────────────────►
       0%   20%   40%   60%   80%   100%
                 Utilization Rate
                        │
                   Optimal (80%)
```

---

## 3. Supply Mechanism

### 3.1 Supplying XP

When a user supplies XP:

1. XP tokens are transferred from user to pool
2. XPx tokens are minted based on current liquidity index
3. XPx balance represents share of the pool

```
XPx Minted = XP Amount / Liquidity Index
```

### 3.2 XPx Token Value

XPx tokens appreciate over time as interest accrues:

```
Current XP Value = XPx Balance * Current Liquidity Index
Earned Interest = Current XP Value - Original XP Supplied
```

### 3.3 Example

```
Initial State:
- Liquidity Index: 1.00
- User supplies: 1000 XP
- User receives: 1000 XPx

After 1 year (8.5% APY):
- Liquidity Index: 1.085
- XPx Balance: 1000 XPx
- Redeemable XP: 1000 * 1.085 = 1085 XP
- Interest Earned: 85 XP
```

---

## 4. Borrow Mechanism

### 4.1 Collateralization

To borrow XP, users must provide collateral:

```
Maximum Borrow = Collateral Value * LTV Ratio
```

| Parameter | Value |
|-----------|-------|
| LTV (Loan-to-Value) | 75% |
| Liquidation Threshold | 80% |
| Liquidation Bonus | 5% |

### 4.2 Example

```
Collateral: 1000 USDT
LTV: 75%
XP Price: $0.362

Maximum Borrow in USD = 1000 * 0.75 = $750
Maximum XP Borrow = $750 / $0.362 = 2071.82 XP
```

### 4.3 Interest Accrual

Debt grows over time based on borrow index:

```
Current Debt = Principal * (Current Borrow Index / Entry Borrow Index)
```

---

## 5. Health Factor

### 5.1 Definition

Health Factor determines if a position is at risk of liquidation:

```
Health Factor = (Collateral Value * Liquidation Threshold) / Debt Value
```

### 5.2 States

| Health Factor | State | Action |
|---------------|-------|--------|
| > 1.5 | Safe | No action needed |
| 1.0 - 1.5 | Warning | Consider adding collateral |
| < 1.0 | Liquidatable | Position can be liquidated |

### 5.3 Example

```
Collateral: 1000 USDT = $1000
Debt: 600 XP @ $0.362 = $217.20
Liquidation Threshold: 80%

Health Factor = (1000 * 0.80) / 217.20 = 3.68 (Safe)

If XP price rises to $1.00:
Debt Value = 600 * $1.00 = $600
Health Factor = (1000 * 0.80) / 600 = 1.33 (Warning)

If XP price rises to $1.50:
Debt Value = 600 * $1.50 = $900
Health Factor = (1000 * 0.80) / 900 = 0.89 (Liquidatable!)
```

---

## 6. Liquidation

### 6.1 Process

When Health Factor < 1.0:

1. Liquidator repays the borrower's debt
2. Liquidator receives collateral + bonus
3. Borrower's position is closed

```
Collateral Received = Debt Repaid + (Debt Repaid * Liquidation Bonus)
```

### 6.2 Example

```
Borrower Position:
- Debt: 500 XP = $181 (at $0.362)
- Collateral: 200 USDT
- Health Factor: 0.88 (Liquidatable)

Liquidator Action:
- Repays: 500 XP
- Receives: 200 USDT + 5% bonus = 210 USDT worth of collateral

Liquidator Profit:
- Paid: $181 (500 XP)
- Received: $210 (USDT)
- Profit: $29 (16%)
```

### 6.3 Liquidation Price

The price at which a position becomes liquidatable:

```
Liquidation Price = (Debt Amount * Entry XP Price) / (Collateral * Liquidation Threshold)
```

---

## 7. User Flows

### 7.1 Supply Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│   User   │────▶│ Approve XP   │────▶│  Call supply │
└──────────┘     └──────────────┘     └──────────────┘
                                              │
                                              ▼
                 ┌──────────────┐     ┌──────────────┐
                 │ Receive XPx  │◀────│ Pool mints   │
                 │   tokens     │     │    XPx       │
                 └──────────────┘     └──────────────┘
```

### 7.2 Borrow Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│   User   │────▶│ Approve USDT │────▶│ Call borrow  │
└──────────┘     │ (collateral) │     │              │
                 └──────────────┘     └──────────────┘
                                              │
                                              ▼
                 ┌──────────────┐     ┌──────────────┐
                 │ Receive XP   │◀────│ Pool locks   │
                 │   tokens     │     │  collateral  │
                 └──────────────┘     └──────────────┘
```

### 7.3 Repay Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│   User   │────▶│  Approve XP  │────▶│  Call repay  │
└──────────┘     │   (debt)     │     │              │
                 └──────────────┘     └──────────────┘
                                              │
                                              ▼
                 ┌──────────────┐     ┌──────────────┐
                 │   Receive    │◀────│ Pool returns │
                 │  collateral  │     │  collateral  │
                 └──────────────┘     └──────────────┘
```

---

## 8. Index Calculation

### 8.1 Liquidity Index Update

```solidity
function updateLiquidityIndex() internal {
    uint256 timeDelta = block.timestamp - lastUpdateTimestamp;
    uint256 utilizationRate = totalBorrowed * RAY / totalSupplied;
    uint256 supplyRate = getSupplyRate(utilizationRate);

    uint256 linearAccumulation = supplyRate * timeDelta / SECONDS_PER_YEAR;
    liquidityIndex = liquidityIndex * (RAY + linearAccumulation) / RAY;
}
```

### 8.2 Borrow Index Update

```solidity
function updateBorrowIndex() internal {
    uint256 timeDelta = block.timestamp - lastUpdateTimestamp;
    uint256 utilizationRate = totalBorrowed * RAY / totalSupplied;
    uint256 borrowRate = getBorrowRate(utilizationRate);

    uint256 linearAccumulation = borrowRate * timeDelta / SECONDS_PER_YEAR;
    borrowIndex = borrowIndex * (RAY + linearAccumulation) / RAY;
}
```

---

## 9. Risk Parameters

### 9.1 Collateral Assets

| Asset | LTV | Liquidation Threshold | Liquidation Bonus |
|-------|-----|----------------------|-------------------|
| USDT | 75% | 80% | 5% |
| XP | 50% | 60% | 10% |

### 9.2 Supply/Borrow Caps

| Parameter | Value |
|-----------|-------|
| Max Supply per User | 1,000,000 XP |
| Max Borrow per User | 500,000 XP |
| Pool Supply Cap | 100,000,000 XP |
| Pool Borrow Cap | 50,000,000 XP |

### 9.3 Flash Loan

Flash loans are not enabled in v1 to reduce complexity.

---

## 10. Frontend Integration

### 10.1 Displayed Metrics

```typescript
interface LendingPoolMetrics {
  totalSupplied: number;
  totalBorrowed: number;
  utilizationRate: number; // 0-100%
  supplyAPY: number;
  borrowAPY: number;
  availableLiquidity: number;
}

interface UserPosition {
  supplies: {
    xpxBalance: number;
    currentValue: number;
    earnedInterest: number;
  }[];
  borrows: {
    debt: number;
    collateral: number;
    healthFactor: number;
    liquidationPrice: number;
  }[];
  netAPY: number;
}
```

### 10.2 User Actions

```typescript
// Supply XP
async function supply(amount: bigint) {
  await xpToken.approve(lendingPool.address, amount);
  await lendingPool.supply(amount);
}

// Withdraw XP
async function withdraw(xpxAmount: bigint) {
  await lendingPool.withdraw(xpxAmount);
}

// Borrow with collateral
async function borrow(
  borrowAmount: bigint,
  collateralAsset: string,
  collateralAmount: bigint
) {
  await IERC20(collateralAsset).approve(lendingPool.address, collateralAmount);
  await lendingPool.borrow(borrowAmount, collateralAsset, collateralAmount);
}

// Repay debt
async function repay(amount: bigint) {
  await xpToken.approve(lendingPool.address, amount);
  await lendingPool.repay(amount);
}
```
