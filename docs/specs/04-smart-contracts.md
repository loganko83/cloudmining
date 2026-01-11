# Smart Contracts Specification - Xphere Mining Cloud

## 1. Contract Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │    XPToken      │
                    │   (ERC-20)      │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ MiningRewards   │ │  LendingPool    │ │ MachinePayment  │
│                 │ │                 │ │                 │
│ - distribute()  │ │ - supply()      │ │ - purchase()    │
│ - claim()       │ │ - withdraw()    │ │ - verify()      │
│ - setRates()    │ │ - borrow()      │ │ - refund()      │
└─────────────────┘ │ - repay()       │ └─────────────────┘
                    │ - liquidate()   │         │
                    └────────┬────────┘         │
                             │                  │
                    ┌────────▼────────┐         │
                    │    XPxToken     │         │
                    │ (Interest-      │         │
                    │  bearing)       │         │
                    └─────────────────┘         │
                                               │
                    ┌─────────────────┐         │
                    │  USDT (Tether)  │◄────────┘
                    │  (External)     │
                    └─────────────────┘
```

---

## 2. XPToken.sol

ERC-20 token representing the native XP cryptocurrency.

### Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract XPToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion XP

    constructor() ERC20("Xphere Token", "XP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
```

### Key Features
- Maximum supply: 1,000,000,000 XP
- Mintable by authorized addresses (MiningRewards contract)
- Burnable by any holder
- Role-based access control

---

## 3. XPxToken.sol

Interest-bearing token representing supplied XP in the lending pool (similar to aTokens).

### Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract XPxToken is ERC20, Ownable {
    address public lendingPool;

    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "Only lending pool");
        _;
    }

    constructor() ERC20("Xphere Interest Token", "XPx") Ownable(msg.sender) {}

    function setLendingPool(address _lendingPool) external onlyOwner {
        lendingPool = _lendingPool;
    }

    function mint(address to, uint256 amount) external onlyLendingPool {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyLendingPool {
        _burn(from, amount);
    }

    // XPx balance grows automatically based on liquidity index
    // Actual balance = xpxBalance * currentLiquidityIndex / entryIndex
}
```

---

## 4. LendingPool.sol

Main lending pool contract implementing Aave-style mechanics.

### Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILendingPool {
    // Events
    event Supplied(address indexed user, uint256 amount, uint256 xpxMinted);
    event Withdrawn(address indexed user, uint256 amount, uint256 xpxBurned);
    event Borrowed(address indexed user, uint256 amount, uint256 collateral);
    event Repaid(address indexed user, uint256 amount);
    event Liquidated(
        address indexed user,
        address indexed liquidator,
        uint256 debtCovered,
        uint256 collateralSeized
    );

    // Core functions
    function supply(uint256 amount) external;
    function withdraw(uint256 xpxAmount) external;
    function borrow(
        uint256 amount,
        address collateralAsset,
        uint256 collateralAmount
    ) external;
    function repay(uint256 amount) external;
    function liquidate(address borrower) external;

    // View functions
    function getHealthFactor(address user) external view returns (uint256);
    function getCurrentDebt(address user) external view returns (uint256);
    function getAvailableLiquidity() external view returns (uint256);
    function getUtilizationRate() external view returns (uint256);
    function getSupplyAPY() external view returns (uint256);
    function getBorrowAPY() external view returns (uint256);
}
```

### Implementation Details

```solidity
contract LendingPool is ILendingPool, Ownable, ReentrancyGuard {
    IERC20 public xpToken;
    XPxToken public xpxToken;
    InterestRateModel public interestModel;

    // Pool state
    uint256 public totalSupplied;
    uint256 public totalBorrowed;
    uint256 public reserveFactor = 1000; // 10% in basis points
    uint256 public liquidityIndex = 1e27; // Ray format
    uint256 public borrowIndex = 1e27;
    uint256 public lastUpdateTimestamp;

    // Collateral parameters
    uint256 public ltv = 7500; // 75% in basis points
    uint256 public liquidationThreshold = 8000; // 80%
    uint256 public liquidationBonus = 500; // 5%

    struct BorrowPosition {
        uint256 principal;
        uint256 borrowIndexAtEntry;
        uint256 collateralAmount;
        address collateralAsset;
    }

    mapping(address => BorrowPosition) public borrowPositions;

    function supply(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        _updateIndexes();

        xpToken.transferFrom(msg.sender, address(this), amount);

        uint256 xpxToMint = (amount * 1e27) / liquidityIndex;
        xpxToken.mint(msg.sender, xpxToMint);

        totalSupplied += amount;

        emit Supplied(msg.sender, amount, xpxToMint);
    }

    function withdraw(uint256 xpxAmount) external nonReentrant {
        require(xpxAmount > 0, "Amount must be > 0");
        require(xpxToken.balanceOf(msg.sender) >= xpxAmount, "Insufficient balance");

        _updateIndexes();

        uint256 xpToReturn = (xpxAmount * liquidityIndex) / 1e27;
        require(getAvailableLiquidity() >= xpToReturn, "Insufficient liquidity");

        xpxToken.burn(msg.sender, xpxAmount);
        xpToken.transfer(msg.sender, xpToReturn);

        totalSupplied -= xpToReturn;

        emit Withdrawn(msg.sender, xpToReturn, xpxAmount);
    }

    function borrow(
        uint256 amount,
        address collateralAsset,
        uint256 collateralAmount
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(borrowPositions[msg.sender].principal == 0, "Existing position");

        _updateIndexes();

        uint256 collateralValueUSD = _getAssetValue(collateralAsset, collateralAmount);
        uint256 borrowValueUSD = _getAssetValue(address(xpToken), amount);
        require(
            borrowValueUSD <= (collateralValueUSD * ltv) / 10000,
            "Insufficient collateral"
        );

        IERC20(collateralAsset).transferFrom(msg.sender, address(this), collateralAmount);
        require(getAvailableLiquidity() >= amount, "Insufficient liquidity");
        xpToken.transfer(msg.sender, amount);

        borrowPositions[msg.sender] = BorrowPosition({
            principal: amount,
            borrowIndexAtEntry: borrowIndex,
            collateralAmount: collateralAmount,
            collateralAsset: collateralAsset
        });

        totalBorrowed += amount;

        emit Borrowed(msg.sender, amount, collateralAmount);
    }

    function repay(uint256 amount) external nonReentrant {
        BorrowPosition storage position = borrowPositions[msg.sender];
        require(position.principal > 0, "No position");

        _updateIndexes();

        uint256 currentDebt = getCurrentDebt(msg.sender);
        uint256 repayAmount = amount > currentDebt ? currentDebt : amount;

        xpToken.transferFrom(msg.sender, address(this), repayAmount);

        if (repayAmount >= currentDebt) {
            IERC20(position.collateralAsset).transfer(
                msg.sender,
                position.collateralAmount
            );
            delete borrowPositions[msg.sender];
        } else {
            uint256 newPrincipal = currentDebt - repayAmount;
            position.principal = newPrincipal;
            position.borrowIndexAtEntry = borrowIndex;
        }

        totalBorrowed -= repayAmount;

        emit Repaid(msg.sender, repayAmount);
    }

    function liquidate(address borrower) external nonReentrant {
        require(getHealthFactor(borrower) < 1e18, "Position healthy");

        _updateIndexes();

        BorrowPosition storage position = borrowPositions[borrower];
        uint256 debt = getCurrentDebt(borrower);

        xpToken.transferFrom(msg.sender, address(this), debt);

        uint256 bonus = (position.collateralAmount * liquidationBonus) / 10000;
        uint256 collateralWithBonus = position.collateralAmount + bonus;

        IERC20(position.collateralAsset).transfer(msg.sender, collateralWithBonus);

        totalBorrowed -= debt;
        delete borrowPositions[borrower];

        emit Liquidated(borrower, msg.sender, debt, collateralWithBonus);
    }

    function getHealthFactor(address user) public view returns (uint256) {
        BorrowPosition memory pos = borrowPositions[user];
        if (pos.principal == 0) return type(uint256).max;

        uint256 collateralUSD = _getAssetValue(pos.collateralAsset, pos.collateralAmount);
        uint256 debtUSD = _getAssetValue(address(xpToken), getCurrentDebt(user));

        return (collateralUSD * liquidationThreshold * 1e18) / (debtUSD * 10000);
    }

    function getCurrentDebt(address user) public view returns (uint256) {
        BorrowPosition memory pos = borrowPositions[user];
        return (pos.principal * borrowIndex) / pos.borrowIndexAtEntry;
    }

    function _updateIndexes() internal {
        uint256 elapsed = block.timestamp - lastUpdateTimestamp;
        if (elapsed == 0) return;

        uint256 utilizationRate = getUtilizationRate();
        uint256 borrowRate = interestModel.getBorrowRate(utilizationRate);

        uint256 borrowAccrued = (borrowRate * elapsed) / 365 days;
        borrowIndex += (borrowIndex * borrowAccrued) / 1e27;

        uint256 supplyRate = (borrowRate * utilizationRate * (10000 - reserveFactor))
            / (1e27 * 10000);
        uint256 supplyAccrued = (supplyRate * elapsed) / 365 days;
        liquidityIndex += (liquidityIndex * supplyAccrued) / 1e27;

        lastUpdateTimestamp = block.timestamp;
    }
}
```

---

## 5. InterestRateModel.sol

Calculates interest rates based on utilization.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract InterestRateModel {
    // All rates in Ray (1e27 = 100%)
    uint256 public constant OPTIMAL_UTILIZATION = 8e26; // 80%
    uint256 public constant BASE_RATE = 2e25; // 2%
    uint256 public constant SLOPE1 = 4e25; // 4%
    uint256 public constant SLOPE2 = 75e25; // 75%

    function getBorrowRate(uint256 utilizationRate) external pure returns (uint256) {
        if (utilizationRate <= OPTIMAL_UTILIZATION) {
            return BASE_RATE + (utilizationRate * SLOPE1) / OPTIMAL_UTILIZATION;
        } else {
            uint256 excessUtilization = utilizationRate - OPTIMAL_UTILIZATION;
            uint256 excessRate = (excessUtilization * SLOPE2) / (1e27 - OPTIMAL_UTILIZATION);
            return BASE_RATE + SLOPE1 + excessRate;
        }
    }

    function getSupplyRate(
        uint256 utilizationRate,
        uint256 reserveFactor
    ) external pure returns (uint256) {
        uint256 borrowRate = this.getBorrowRate(utilizationRate);
        return (borrowRate * utilizationRate * (10000 - reserveFactor)) / (1e27 * 10000);
    }
}
```

### Interest Rate Curve

```
    Rate (%)
     │
 100 │                                    ╱
     │                                  ╱
  80 │                                ╱
     │                              ╱
  60 │                            ╱
     │                          ╱
  40 │                        ╱
     │                      ╱
  20 │        ────────────╱
     │       ╱
   0 │─────╱───────────────────────────────
     └─────────────────────────────────────►
       0%   20%   40%   60%   80%   100%
                 Utilization Rate
```

---

## 6. MiningRewards.sol

Manages mining reward distribution.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IXPToken {
    function mint(address to, uint256 amount) external;
}

contract MiningRewards is Ownable, ReentrancyGuard {
    IXPToken public xpToken;

    struct MinerInfo {
        uint256 hashrate; // TH/s
        uint256 lastClaimTime;
        uint256 pendingRewards;
    }

    mapping(address => MinerInfo) public miners;

    uint256 public rewardRatePerHashPerSecond; // XP per TH/s per second
    uint256 public totalHashrate;

    event HashrateUpdated(address indexed miner, uint256 newHashrate);
    event RewardsClaimed(address indexed miner, uint256 amount);

    constructor(address _xpToken) Ownable(msg.sender) {
        xpToken = IXPToken(_xpToken);
        rewardRatePerHashPerSecond = 1e14; // 0.0001 XP per TH/s per second
    }

    function updateMinerHashrate(
        address miner,
        uint256 hashrate
    ) external onlyOwner {
        _updatePendingRewards(miner);

        totalHashrate = totalHashrate - miners[miner].hashrate + hashrate;
        miners[miner].hashrate = hashrate;

        emit HashrateUpdated(miner, hashrate);
    }

    function claimRewards() external nonReentrant {
        _updatePendingRewards(msg.sender);

        uint256 rewards = miners[msg.sender].pendingRewards;
        require(rewards > 0, "No rewards");

        miners[msg.sender].pendingRewards = 0;
        xpToken.mint(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    function getPendingRewards(address miner) external view returns (uint256) {
        MinerInfo memory info = miners[miner];
        if (info.hashrate == 0 || info.lastClaimTime == 0) {
            return info.pendingRewards;
        }

        uint256 elapsed = block.timestamp - info.lastClaimTime;
        uint256 earned = info.hashrate * elapsed * rewardRatePerHashPerSecond;
        return info.pendingRewards + earned;
    }

    function _updatePendingRewards(address miner) internal {
        MinerInfo storage info = miners[miner];
        if (info.hashrate > 0 && info.lastClaimTime > 0) {
            uint256 elapsed = block.timestamp - info.lastClaimTime;
            uint256 earned = info.hashrate * elapsed * rewardRatePerHashPerSecond;
            info.pendingRewards += earned;
        }
        info.lastClaimTime = block.timestamp;
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRatePerHashPerSecond = newRate;
    }
}
```

---

## 7. MachinePayment.sol

Handles USDT payments for machine purchases.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MachinePayment is Ownable, ReentrancyGuard {
    IERC20 public usdt;
    address public treasury;

    struct MachinePlan {
        uint256 priceUSDT;
        uint256 hashrate;
        bool active;
    }

    mapping(uint256 => MachinePlan) public plans;
    mapping(bytes32 => bool) public processedPurchases;

    event MachinePurchased(
        address indexed buyer,
        uint256 indexed planId,
        uint256 price,
        bytes32 purchaseId
    );
    event PlanUpdated(uint256 indexed planId, uint256 price, uint256 hashrate);

    constructor(address _usdt, address _treasury) Ownable(msg.sender) {
        usdt = IERC20(_usdt);
        treasury = _treasury;
    }

    function setPlan(
        uint256 planId,
        uint256 priceUSDT,
        uint256 hashrate
    ) external onlyOwner {
        plans[planId] = MachinePlan({
            priceUSDT: priceUSDT,
            hashrate: hashrate,
            active: true
        });
        emit PlanUpdated(planId, priceUSDT, hashrate);
    }

    function purchase(uint256 planId) external nonReentrant returns (bytes32) {
        MachinePlan memory plan = plans[planId];
        require(plan.active, "Plan not active");
        require(plan.priceUSDT > 0, "Invalid plan");

        usdt.transferFrom(msg.sender, treasury, plan.priceUSDT);

        bytes32 purchaseId = keccak256(
            abi.encodePacked(msg.sender, planId, block.timestamp, block.number)
        );
        processedPurchases[purchaseId] = true;

        emit MachinePurchased(msg.sender, planId, plan.priceUSDT, purchaseId);

        return purchaseId;
    }

    function verifyPurchase(bytes32 purchaseId) external view returns (bool) {
        return processedPurchases[purchaseId];
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function deactivatePlan(uint256 planId) external onlyOwner {
        plans[planId].active = false;
    }
}
```

---

## 8. Deployment Addresses

### Testnet (Sepolia)
| Contract | Address |
|----------|---------|
| XPToken | TBD |
| XPxToken | TBD |
| LendingPool | TBD |
| InterestRateModel | TBD |
| MiningRewards | TBD |
| MachinePayment | TBD |

### Mainnet
| Contract | Address |
|----------|---------|
| XPToken | TBD |
| XPxToken | TBD |
| LendingPool | TBD |
| InterestRateModel | TBD |
| MiningRewards | TBD |
| MachinePayment | TBD |
| USDT | 0xdAC17F958D2ee523a2206206994597C13D831ec7 |

---

## 9. Security Considerations

1. **Reentrancy Protection**: All state-changing functions use `nonReentrant`
2. **Access Control**: Role-based permissions for minting and admin functions
3. **Overflow Protection**: Solidity 0.8+ built-in overflow checks
4. **Oracle Dependency**: Price feeds should use Chainlink for production
5. **Upgrade Pattern**: Consider using UUPS proxy for upgradeability
6. **Audit Required**: Full security audit before mainnet deployment
