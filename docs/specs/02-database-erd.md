# Database ERD - Xphere Mining Cloud

## 1. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           XPHERE MINING CLOUD DATABASE ERD                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────────┐       ┌────────────────────┐
│     users       │       │   user_machines     │       │   machine_plans    │
├─────────────────┤       ├─────────────────────┤       ├────────────────────┤
│ id (PK)         │───┐   │ id (PK)             │   ┌───│ id (PK)            │
│ email (UQ)      │   │   │ user_id (FK)        │───┘   │ name               │
│ password_hash   │   └───│ plan_id (FK)        │       │ machine_name       │
│ name            │       │ purchase_date       │       │ price_usdt         │
│ wallet_address  │       │ status              │       │ hashrate           │
│ role            │       │ tx_hash             │       │ daily_return_xp    │
│ created_at      │       │ created_at          │       │ description        │
│ updated_at      │       │ updated_at          │       │ image_url          │
└─────────────────┘       └─────────────────────┘       │ is_active          │
        │                                               │ created_at         │
        │                                               └────────────────────┘
        │
        │         ┌─────────────────────┐       ┌────────────────────────────┐
        │         │   transactions      │       │   staking_positions        │
        │         ├─────────────────────┤       ├────────────────────────────┤
        │         │ id (PK)             │       │ id (PK)                    │
        ├─────────│ user_id (FK)        │       │ user_id (FK)               │────┐
        │         │ type                │       │ amount                     │    │
        │         │ amount              │       │ start_date                 │    │
        │         │ fee                 │       │ unlock_date                │    │
        │         │ currency            │       │ accumulated_rewards        │    │
        │         │ status              │       │ status                     │    │
        │         │ tx_hash             │       │ created_at                 │    │
        │         │ created_at          │       │ updated_at                 │    │
        │         │ updated_at          │       └────────────────────────────┘    │
        │         └─────────────────────┘                                         │
        │                                                                         │
        │                                                                         │
        │         ┌─────────────────────────────────────────────────────┐         │
        │         │                  LENDING SYSTEM                      │         │
        │         └─────────────────────────────────────────────────────┘         │
        │                                                                         │
        │         ┌─────────────────────┐       ┌────────────────────────────┐    │
        │         │   lending_pools     │       │   supply_positions         │    │
        │         ├─────────────────────┤       ├────────────────────────────┤    │
        │         │ id (PK)             │───┐   │ id (PK)                    │    │
        │         │ asset               │   │   │ pool_id (FK)               │────┤
        │         │ total_supplied      │   │   │ user_id (FK)               │────┘
        │         │ total_borrowed      │   │   │ supplied_amount            │
        │         │ liquidity_index     │   │   │ xpx_balance                │
        │         │ borrow_index        │   │   │ entry_index                │
        │         │ supply_apy          │   │   │ created_at                 │
        │         │ borrow_apy          │   │   │ updated_at                 │
        │         │ reserve_factor      │   │   └────────────────────────────┘
        │         │ ltv_ratio           │   │
        │         │ liquidation_threshold│  │   ┌────────────────────────────┐
        │         │ created_at          │   │   │   borrow_positions         │
        │         │ updated_at          │   │   ├────────────────────────────┤
        │         └─────────────────────┘   └───│ id (PK)                    │
        │                                       │ pool_id (FK)               │
        └───────────────────────────────────────│ user_id (FK)               │
                                                │ borrowed_amount            │
                                                │ collateral_amount          │
                                                │ collateral_asset           │
                                                │ entry_index                │
                                                │ health_factor              │
                                                │ created_at                 │
                                                │ updated_at                 │
                                                └────────────────────────────┘

        ┌─────────────────────┐       ┌────────────────────────────┐
        │   mining_rewards    │       │   refresh_tokens           │
        ├─────────────────────┤       ├────────────────────────────┤
        │ id (PK)             │       │ id (PK)                    │
        │ user_id (FK)        │       │ user_id (FK)               │
        │ machine_id (FK)     │       │ token_hash                 │
        │ amount              │       │ expires_at                 │
        │ calculated_at       │       │ created_at                 │
        │ distributed         │       └────────────────────────────┘
        │ distribution_tx     │
        │ created_at          │
        └─────────────────────┘
```

## 2. Table Definitions

### 2.1 users

Core user account information.

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  wallet_address VARCHAR(42),
  role ENUM('user', 'admin') DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_wallet (wallet_address)
);
```

### 2.2 machine_plans

Available mining machine plans for purchase.

```sql
CREATE TABLE machine_plans (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  machine_name VARCHAR(100) NOT NULL,
  price_usdt DECIMAL(18,6) NOT NULL,
  hashrate INT UNSIGNED NOT NULL COMMENT 'TH/s',
  daily_return_xp DECIMAL(18,8) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_active (is_active)
);
```

### 2.3 user_machines

User-owned mining machines.

```sql
CREATE TABLE user_machines (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  purchase_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('ONLINE', 'MAINTENANCE', 'OFFLINE') DEFAULT 'ONLINE',
  tx_hash VARCHAR(66) COMMENT 'Purchase transaction hash',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES machine_plans(id),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);
```

### 2.4 transactions

All financial transactions in the system.

```sql
CREATE TABLE transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  type ENUM(
    'DEPOSIT',
    'WITHDRAWAL',
    'PURCHASE',
    'MINING_REWARD',
    'LENDING_SUPPLY',
    'LENDING_WITHDRAW',
    'BORROW',
    'REPAY',
    'STAKE',
    'UNSTAKE',
    'SWAP'
  ) NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  fee DECIMAL(36,18),
  currency ENUM('XP', 'USDT') NOT NULL,
  status ENUM('COMPLETED', 'PENDING', 'FAILED') DEFAULT 'PENDING',
  tx_hash VARCHAR(66),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, type),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);
```

### 2.5 lending_pools

Lending pool configuration and state.

```sql
CREATE TABLE lending_pools (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  asset VARCHAR(10) NOT NULL COMMENT 'XP, USDT, etc.',
  total_supplied DECIMAL(36,18) DEFAULT 0,
  total_borrowed DECIMAL(36,18) DEFAULT 0,
  liquidity_index DECIMAL(36,27) DEFAULT 1000000000000000000000000000 COMMENT 'Ray format (1e27)',
  borrow_index DECIMAL(36,27) DEFAULT 1000000000000000000000000000,
  supply_apy DECIMAL(10,4) COMMENT 'Annual percentage yield',
  borrow_apy DECIMAL(10,4) COMMENT 'Annual percentage rate',
  reserve_factor DECIMAL(5,4) DEFAULT 0.1000 COMMENT '10%',
  ltv_ratio DECIMAL(5,4) DEFAULT 0.7500 COMMENT '75%',
  liquidation_threshold DECIMAL(5,4) DEFAULT 0.8000 COMMENT '80%',
  liquidation_bonus DECIMAL(5,4) DEFAULT 0.0500 COMMENT '5%',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_asset (asset)
);
```

### 2.6 supply_positions

User supply positions in lending pools.

```sql
CREATE TABLE supply_positions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  pool_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  supplied_amount DECIMAL(36,18) NOT NULL COMMENT 'Original XP supplied',
  xpx_balance DECIMAL(36,18) NOT NULL COMMENT 'Interest-bearing token balance',
  entry_index DECIMAL(36,27) NOT NULL COMMENT 'Liquidity index at entry',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (pool_id) REFERENCES lending_pools(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_user_pool (user_id, pool_id)
);
```

### 2.7 borrow_positions

User borrow positions with collateral.

```sql
CREATE TABLE borrow_positions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  pool_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  borrowed_amount DECIMAL(36,18) NOT NULL,
  collateral_amount DECIMAL(36,18) NOT NULL,
  collateral_asset VARCHAR(10) NOT NULL COMMENT 'USDT, XP, etc.',
  entry_index DECIMAL(36,27) NOT NULL COMMENT 'Borrow index at entry',
  health_factor DECIMAL(10,4),
  liquidation_price DECIMAL(18,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (pool_id) REFERENCES lending_pools(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_health (health_factor)
);
```

### 2.8 staking_positions

User staking positions.

```sql
CREATE TABLE staking_positions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unlock_date TIMESTAMP COMMENT 'Null if not unbonding',
  accumulated_rewards DECIMAL(36,18) DEFAULT 0,
  status ENUM('ACTIVE', 'UNBONDING', 'WITHDRAWN') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status)
);
```

### 2.9 mining_rewards

Mining reward calculations and distributions.

```sql
CREATE TABLE mining_rewards (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  machine_id VARCHAR(36) NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  calculated_at TIMESTAMP NOT NULL,
  distributed BOOLEAN DEFAULT FALSE,
  distribution_tx VARCHAR(66),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (machine_id) REFERENCES user_machines(id) ON DELETE CASCADE,
  INDEX idx_user_distributed (user_id, distributed),
  INDEX idx_calculated (calculated_at)
);
```

### 2.10 refresh_tokens

JWT refresh token storage.

```sql
CREATE TABLE refresh_tokens (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of token',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
);
```

## 3. Initial Seed Data

### 3.1 Machine Plans

```sql
INSERT INTO machine_plans (id, name, machine_name, price_usdt, hashrate, daily_return_xp, description, image_url) VALUES
('p1', 'Starter Node', 'ASIC XP1 Mini', 100.000000, 10, 1.20000000, 'Entry-level mining power for beginners.', 'https://picsum.photos/400/300?random=1'),
('p2', 'Standard Node', 'ASIC XP1 Standard', 500.000000, 55, 7.50000000, 'Most popular plan with stable mining output.', 'https://picsum.photos/400/300?random=2'),
('p3', 'Pro Cluster', 'ASIC XP1 Cluster', 2000.000000, 230, 32.00000000, 'High-capacity cluster for professional miners.', 'https://picsum.photos/400/300?random=3'),
('p4', 'Xphere Master Node', 'ASIC XP1 Ultra', 5000.000000, 650, 92.50000000, 'Enterprise-grade performance with maximum efficiency.', 'https://picsum.photos/400/300?random=4');
```

### 3.2 Lending Pool

```sql
INSERT INTO lending_pools (id, asset, supply_apy, borrow_apy) VALUES
('lp-xp', 'XP', 8.5000, 12.5000);
```

## 4. Indexes and Performance

### Recommended Indexes

```sql
-- For transaction history queries
CREATE INDEX idx_transactions_user_created
ON transactions(user_id, created_at DESC);

-- For mining reward distribution
CREATE INDEX idx_rewards_pending
ON mining_rewards(distributed, calculated_at);

-- For liquidation checks
CREATE INDEX idx_borrow_health
ON borrow_positions(health_factor) WHERE health_factor < 1.0;
```

## 5. Migration Notes

- All IDs use UUID v4 format
- Timestamps are in UTC
- Decimal precision follows blockchain standards (18 decimals for tokens)
- Ray format (27 decimals) used for interest index calculations
