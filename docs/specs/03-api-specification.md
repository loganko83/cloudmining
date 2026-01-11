# API Specification - Xphere Mining Cloud

## 1. Base Configuration

### Base URL
- Development: `http://localhost:4000/api`
- Production: `https://trendy.storydot.kr/xphere-api`

### Authentication
All protected endpoints require JWT Bearer token:
```
Authorization: Bearer <access_token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## 2. Authentication Endpoints

### POST /auth/signup

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "User Name"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "walletAddress": null,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
- `400` - Validation error (invalid email, weak password)
- `409` - Email already registered

---

### POST /auth/login

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
- `401` - Invalid credentials

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST /auth/logout

Invalidate refresh token.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. User Endpoints

### GET /users/me

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "walletAddress": "0x71C...9A21",
    "createdAt": "2024-01-01T00:00:00Z",
    "stats": {
      "totalMachines": 3,
      "totalHashrate": 120,
      "totalMinedXP": 1250.50,
      "stakingAmount": 500.00
    }
  }
}
```

---

### PATCH /users/me

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Name"
}
```

---

### PATCH /users/me/wallet

Link wallet address with signature verification.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "walletAddress": "0x71C...9A21",
  "signature": "0x...",
  "message": "Link wallet to Xphere Mining: <timestamp>"
}
```

---

## 4. Machine Endpoints

### GET /machines/plans

Get all available mining plans.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "p1",
      "name": "Starter Node",
      "machineName": "ASIC XP1 Mini",
      "priceUsdt": 100,
      "hashrate": 10,
      "dailyReturnXp": 1.2,
      "description": "Entry-level mining power",
      "imageUrl": "https://...",
      "isActive": true
    }
  ]
}
```

---

### GET /machines/my-machines

Get user's owned machines.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "m1",
      "planId": "p2",
      "machineName": "ASIC XP1 Standard",
      "hashrate": 55,
      "status": "ONLINE",
      "purchaseDate": "2024-01-01T00:00:00Z",
      "txHash": "0x..."
    }
  ]
}
```

---

### POST /machines/purchase

Purchase a mining machine.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "planId": "p2",
  "txHash": "0x..."
}
```

The backend verifies the USDT payment transaction on-chain before confirming.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "machine": {
      "id": "m-new",
      "planId": "p2",
      "status": "ONLINE",
      "purchaseDate": "2024-01-15T10:30:00Z"
    },
    "transaction": {
      "id": "tx-uuid",
      "type": "PURCHASE",
      "amount": 500,
      "currency": "USDT",
      "status": "COMPLETED"
    }
  }
}
```

---

### GET /machines/stats

Get user's mining statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalHashrate": 120,
    "activeMachines": 3,
    "maintenanceMachines": 0,
    "estimatedDailyXp": 16.2,
    "totalMinedXp": 1250.50,
    "pendingRewards": 8.35
  }
}
```

---

## 5. Rewards Endpoints

### GET /rewards/pending

Get pending mining rewards.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPending": 8.35,
    "machines": [
      {
        "machineId": "m1",
        "machineName": "ASIC XP1 Standard",
        "earned": 7.5,
        "lastCalculated": "2024-01-15T14:00:00Z"
      }
    ],
    "nextDistribution": "2024-01-15T14:00:00Z"
  }
}
```

---

### POST /rewards/claim

Claim pending rewards (triggers on-chain distribution).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "claimedAmount": 8.35,
    "txHash": "0x...",
    "newBalance": 358.47
  }
}
```

---

## 6. Lending Endpoints

### GET /lending/pools

Get lending pool information.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "lp-xp",
      "asset": "XP",
      "totalSupplied": 1500000.00,
      "totalBorrowed": 450000.00,
      "utilizationRate": 0.30,
      "supplyApy": 8.50,
      "borrowApy": 12.50,
      "ltvRatio": 0.75,
      "liquidationThreshold": 0.80,
      "availableLiquidity": 1050000.00
    }
  ]
}
```

---

### GET /lending/my-positions

Get user's lending positions.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "supplies": [
      {
        "id": "sp1",
        "poolId": "lp-xp",
        "asset": "XP",
        "suppliedAmount": 1000.00,
        "currentValue": 1085.00,
        "xpxBalance": 1000.00,
        "earnedInterest": 85.00,
        "apy": 8.50
      }
    ],
    "borrows": [
      {
        "id": "bp1",
        "poolId": "lp-xp",
        "borrowedAmount": 500.00,
        "currentDebt": 525.00,
        "collateralAmount": 750.00,
        "collateralAsset": "USDT",
        "healthFactor": 1.85,
        "liquidationPrice": 0.48
      }
    ],
    "netApy": 5.25,
    "totalSupplyValue": 1085.00,
    "totalBorrowValue": 525.00
  }
}
```

---

### POST /lending/supply

Supply XP to lending pool.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "poolId": "lp-xp",
  "amount": 1000,
  "txHash": "0x..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "position": {
      "id": "sp-new",
      "suppliedAmount": 1000.00,
      "xpxBalance": 1000.00,
      "entryIndex": "1.00000000"
    },
    "transaction": {
      "id": "tx-uuid",
      "type": "LENDING_SUPPLY",
      "amount": 1000,
      "status": "COMPLETED"
    }
  }
}
```

---

### POST /lending/withdraw

Withdraw from lending pool.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "positionId": "sp1",
  "xpxAmount": 500
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "withdrawnAmount": 542.50,
    "remainingXpx": 500.00,
    "txHash": "0x..."
  }
}
```

---

### POST /lending/borrow

Borrow against collateral.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "poolId": "lp-xp",
  "borrowAmount": 500,
  "collateralAsset": "USDT",
  "collateralAmount": 750,
  "collateralTxHash": "0x..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "position": {
      "id": "bp-new",
      "borrowedAmount": 500,
      "collateralAmount": 750,
      "healthFactor": 1.85,
      "liquidationPrice": 0.48
    }
  }
}
```

---

### POST /lending/repay

Repay borrowed amount.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "positionId": "bp1",
  "amount": 250,
  "txHash": "0x..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "remainingDebt": 275.00,
    "healthFactor": 2.35,
    "collateralAmount": 750.00
  }
}
```

---

## 7. Staking Endpoints

### GET /staking/info

Get staking pool information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pool": {
      "totalStaked": 5000000.00,
      "apr": 12.50,
      "tvlUsd": 1810000.00
    },
    "user": {
      "stakedAmount": 500.00,
      "pendingRewards": 15.25,
      "positions": [
        {
          "id": "stk1",
          "amount": 500.00,
          "status": "ACTIVE",
          "startDate": "2024-01-01T00:00:00Z",
          "accumulatedRewards": 15.25
        }
      ]
    }
  }
}
```

---

### POST /staking/stake

Stake XP tokens.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 500,
  "txHash": "0x..."
}
```

---

### POST /staking/unstake

Request unstaking (7-day unlock period).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "positionId": "stk1",
  "amount": 250
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "position": {
      "id": "stk1",
      "amount": 250,
      "status": "UNBONDING",
      "unlockDate": "2024-01-22T00:00:00Z"
    },
    "message": "Unstaking initiated. Funds will be available after 7 days."
  }
}
```

---

## 8. Transaction Endpoints

### GET /transactions

Get user's transaction history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (optional): Filter by transaction type
- `currency` (optional): Filter by currency (XP, USDT)
- `status` (optional): Filter by status
- `limit` (default: 20): Number of results
- `offset` (default: 0): Pagination offset

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx1",
        "type": "MINING_REWARD",
        "amount": 7.50,
        "fee": null,
        "currency": "XP",
        "status": "COMPLETED",
        "txHash": "0x...",
        "createdAt": "2024-01-15T14:00:00Z"
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 9. Network Endpoints

### GET /network/stats

Get network statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalHashrate": "45.2 EH/s",
    "activeMiners": 12402,
    "xpPrice": 0.362,
    "xpPriceChange24h": 2.5,
    "blockTime": 2.4,
    "difficulty": "15.2T",
    "uptime": 99.9
  }
}
```

---

## 10. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `INSUFFICIENT_BALANCE` | 400 | Not enough balance |
| `INVALID_TRANSACTION` | 400 | Transaction verification failed |
| `POSITION_NOT_FOUND` | 404 | Lending/staking position not found |
| `UNHEALTHY_POSITION` | 400 | Health factor too low |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
