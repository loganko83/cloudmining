# Xphere Mining Cloud - Project Overview

## 1. Introduction

Xphere Mining Cloud is a cloud-based cryptocurrency mining platform for the Xphere Layer-1 blockchain. Users can purchase virtual ASIC XP1 mining machines and earn XP tokens through cloud mining without owning physical hardware.

## 2. Project Goals

- **Cloud Mining Service**: Allow users to purchase hashpower and earn XP tokens
- **DeFi Integration**: Provide lending, staking, and DEX functionalities
- **Web3 Native**: Full integration with MetaMask and on-chain transactions
- **Scalable Architecture**: Monorepo structure with separate frontend, backend, and smart contracts

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         XPHERE MINING CLOUD                             │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│     Frontend      │     │      Backend      │     │  Smart Contracts  │
│   (React + Vite)  │────▶│     (NestJS)      │────▶│    (Solidity)     │
│                   │     │                   │     │                   │
│ - Dashboard       │     │ - Auth (JWT)      │     │ - XPToken         │
│ - Market          │     │ - Users           │     │ - LendingPool     │
│ - Wallet          │     │ - Machines        │     │ - MiningRewards   │
│ - Lending         │     │ - Lending         │     │ - MachinePayment  │
│ - Staking         │     │ - Staking         │     │                   │
│ - DEX             │     │ - Rewards         │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
         │                         │                         │
         └─────────────────────────┴─────────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │       MySQL         │
                        │     Database        │
                        └─────────────────────┘
```

## 4. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.8.x | Type Safety |
| Vite | 6.x | Build Tool |
| React Router | 7.x | Client Routing |
| Tailwind CSS | CDN | Styling |
| ethers.js | 6.x | Web3 Integration |
| Recharts | 3.x | Data Visualization |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.x | API Framework |
| TypeScript | 5.x | Type Safety |
| TypeORM | 0.3.x | ORM |
| MySQL | 8.x | Database |
| Passport | 0.7.x | Authentication |
| Swagger | 7.x | API Documentation |

### Smart Contracts
| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | 0.8.20 | Smart Contracts |
| Hardhat | 2.x | Development Framework |
| OpenZeppelin | 5.x | Security Standards |
| ethers.js | 6.x | Contract Interaction |

## 5. Core Features

### 5.1 Cloud Mining
- Purchase ASIC XP1 mining machines with USDT
- Real-time hashrate and reward tracking
- Automatic daily reward distribution
- Machine status monitoring (Online/Maintenance/Offline)

### 5.2 Lending (Aave-style)
- Supply XP to earn interest (XPx tokens)
- Borrow XP against USDT collateral
- Dynamic interest rate based on utilization
- Liquidation mechanism for unhealthy positions

### 5.3 Staking
- Stake XP tokens to earn APR rewards
- 7-day unbonding period for unstaking
- Compound interest calculation

### 5.4 DEX
- Swap XP <-> USDT
- 0.3% swap fee
- 0.5% slippage tolerance

## 6. User Flows

### 6.1 New User Registration
```
1. Visit landing page
2. Click "Sign Up"
3. Enter email, password, name
4. Email verification (optional)
5. Login with credentials
6. Connect MetaMask wallet
7. Start using platform
```

### 6.2 Machine Purchase
```
1. Navigate to Market page
2. Select mining plan
3. Connect wallet if not connected
4. Approve USDT spending
5. Confirm purchase transaction
6. Machine added to user's inventory
7. Mining rewards start accumulating
```

### 6.3 Lending Supply
```
1. Navigate to Lending page
2. Enter XP amount to supply
3. Approve XP token spending
4. Confirm supply transaction
5. Receive XPx tokens (interest-bearing)
6. XPx balance grows over time
7. Withdraw anytime for XP + interest
```

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    trendy.storydot.kr                       │
├─────────────────────────────────────────────────────────────┤
│                         Nginx                               │
│  /xphere-mining/  ──▶  Frontend Static Files                │
│  /xphere-api/     ──▶  NestJS Backend (PM2)                 │
├─────────────────────────────────────────────────────────────┤
│                    MySQL Database                           │
│                    (xphere_mining)                          │
└─────────────────────────────────────────────────────────────┘
```

## 8. Security Considerations

- JWT tokens with short expiration (1 hour)
- Refresh token rotation
- Password hashing with bcrypt
- Wallet signature verification for address linking
- Smart contract reentrancy guards
- Rate limiting on API endpoints
- Input validation with class-validator

## 9. Document Structure

| Document | Description |
|----------|-------------|
| 01-overview.md | This document - project overview |
| 02-database-erd.md | Database schema and relationships |
| 03-api-specification.md | REST API endpoints and schemas |
| 04-smart-contracts.md | Contract interfaces and deployment |
| 05-lending-mechanics.md | Interest rate model and liquidation |
| 06-deployment.md | CI/CD and server configuration |
| 07-frontend-integration.md | API client and Web3 hooks |
| 08-security.md | Security best practices |
