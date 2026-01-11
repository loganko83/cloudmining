# Deployment Guide - Xphere Mining Cloud

## 1. Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    trendy.storydot.kr                       │
│                     (AWS EC2 Ubuntu)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                      Nginx                           │   │
│  │  :80/:443                                            │   │
│  │                                                      │   │
│  │  /xphere-mining/  ──▶  Static Files (dist/)         │   │
│  │  /cloudmining-api/     ──▶  localhost:4100 (NestJS)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│              ┌────────────┴────────────┐                   │
│              ▼                         ▼                   │
│  ┌─────────────────────┐   ┌─────────────────────┐        │
│  │   Frontend (Vite)   │   │   Backend (NestJS)  │        │
│  │   /mnt/storage/     │   │   /mnt/storage/     │        │
│  │   xphere-mining/    │   │   xphere-mining/    │        │
│  │   frontend/         │   │   backend/          │        │
│  └─────────────────────┘   └─────────────────────┘        │
│                                      │                     │
│                                      ▼                     │
│                            ┌─────────────────────┐        │
│                            │   MySQL Database    │        │
│                            │   xphere_mining     │        │
│                            └─────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Server Setup

### 2.1 Prerequisites

```bash
# SSH into server
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install MySQL
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

### 2.2 Directory Structure

```bash
# Create project directories
sudo mkdir -p /mnt/storage/cloudmining/{frontend,backend,logs}
sudo chown -R ubuntu:ubuntu /mnt/storage/cloudmining
```

### 2.3 MySQL Database Setup

```bash
# Login to MySQL
sudo mysql

# Create database and user
CREATE DATABASE xphere_mining CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'xphere_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON xphere_mining.* TO 'xphere_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 3. Nginx Configuration

### 3.1 Site Configuration

```nginx
# /etc/nginx/sites-available/cloudmining
# Add this to your existing server block configuration

# Frontend - Static Files
location /cloudmining/ {
    alias /mnt/storage/cloudmining/frontend/;
    try_files $uri $uri/ /cloudmining/index.html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
location /cloudmining-api/ {
    proxy_pass http://127.0.0.1:4100/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# Swagger Documentation
location /cloudmining-api/docs {
    proxy_pass http://127.0.0.1:4100/docs;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 3.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/cloudmining /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. CI/CD with GitHub Actions

### 4.1 Repository Secrets

Configure these secrets in GitHub repository settings:

| Secret Name | Description |
|-------------|-------------|
| `SSH_PRIVATE_KEY` | Content of `firstkeypair.pem` |
| `SSH_HOST` | `trendy.storydot.kr` |
| `SSH_USER` | `ubuntu` |
| `DB_PASSWORD` | MySQL password |
| `JWT_SECRET` | JWT signing secret |

### 4.2 CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm run lint

      - name: Type check
        run: pnpm run typecheck

      - name: Test
        run: pnpm run test

  test-contracts:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/contracts
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Compile contracts
        run: npx hardhat compile

      - name: Run tests
        run: npx hardhat test
```

### 4.3 Frontend Deployment

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'packages/frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build frontend
        run: pnpm --filter frontend build
        env:
          VITE_API_URL: https://trendy.storydot.kr/cloudmining-api
          VITE_CHAIN_ID: 1

      - name: Deploy to server
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "packages/frontend/dist/*"
          target: "/mnt/storage/cloudmining/frontend"
          strip_components: 3
          overwrite: true

      - name: Clear nginx cache
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            sudo nginx -t && sudo systemctl reload nginx
```

### 4.4 Backend Deployment

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'packages/backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build backend
        run: |
          cd packages/backend
          npm ci
          npm run build

      - name: Deploy to server
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "packages/backend/dist/*,packages/backend/package.json,packages/backend/package-lock.json"
          target: "/mnt/storage/cloudmining/backend"
          strip_components: 2
          overwrite: true

      - name: Install and restart
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /mnt/storage/cloudmining/backend
            npm ci --production
            pm2 restart cloudmining-backend || pm2 start dist/main.js --name cloudmining-backend
            pm2 save
```

---

## 5. PM2 Configuration

### 5.1 Ecosystem File

```javascript
// /mnt/storage/cloudmining/backend/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cloudmining-backend',
    script: 'dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4100
    },
    error_file: '/mnt/storage/cloudmining/logs/backend-error.log',
    out_file: '/mnt/storage/cloudmining/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### 5.2 PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# View logs
pm2 logs cloudmining-backend

# Monitor
pm2 monit

# Restart
pm2 restart cloudmining-backend

# Save current process list
pm2 save

# Setup startup script
pm2 startup
```

---

## 6. Environment Variables

### 6.1 Backend (.env.production)

```env
# Server
NODE_ENV=production
PORT=4100

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=xphere_user
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=xphere_mining

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=7d

# Web3
WEB3_RPC_URL=https://mainnet.infura.io/v3/${INFURA_KEY}
CHAIN_ID=1
PRIVATE_KEY=${DEPLOYER_PRIVATE_KEY}

# Contract Addresses
XP_TOKEN_ADDRESS=0x...
LENDING_POOL_ADDRESS=0x...
MINING_REWARDS_ADDRESS=0x...
MACHINE_PAYMENT_ADDRESS=0x...
USDT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7

# CORS
CORS_ORIGIN=https://trendy.storydot.kr
```

### 6.2 Frontend (.env.production)

```env
VITE_API_URL=https://trendy.storydot.kr/cloudmining-api
VITE_CHAIN_ID=1
VITE_XP_TOKEN_ADDRESS=0x...
VITE_LENDING_POOL_ADDRESS=0x...
VITE_MINING_REWARDS_ADDRESS=0x...
VITE_MACHINE_PAYMENT_ADDRESS=0x...
VITE_USDT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7
```

---

## 7. Database Migrations

### 7.1 Run Migrations

```bash
# SSH into server
ssh -i C:\server\firstkeypair.pem ubuntu@trendy.storydot.kr

# Navigate to backend
cd /mnt/storage/cloudmining/backend

# Run migrations
npm run migration:run
```

### 7.2 TypeORM Migration Commands

```bash
# Generate migration from entity changes
npm run migration:generate -- src/database/migrations/AddLendingTables

# Create empty migration
npm run migration:create -- src/database/migrations/SeedMachinePlans

# Revert last migration
npm run migration:revert
```

---

## 8. Monitoring & Logging

### 8.1 Log Locations

| Log Type | Location |
|----------|----------|
| Backend stdout | `/mnt/storage/cloudmining/logs/backend-out.log` |
| Backend stderr | `/mnt/storage/cloudmining/logs/backend-error.log` |
| Nginx access | `/var/log/nginx/access.log` |
| Nginx error | `/var/log/nginx/error.log` |
| PM2 logs | `~/.pm2/logs/` |

### 8.2 Log Rotation

```bash
# /etc/logrotate.d/xphere-mining
/mnt/storage/cloudmining/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
```

### 8.3 Health Check Endpoint

```bash
# Check API health
curl https://trendy.storydot.kr/cloudmining-api/health

# Expected response
{"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

---

## 9. Backup Strategy

### 9.1 Database Backup

```bash
#!/bin/bash
# /mnt/storage/cloudmining/scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/mnt/storage/cloudmining/backups"
mkdir -p $BACKUP_DIR

mysqldump -u xphere_user -p'password' xphere_mining > $BACKUP_DIR/xphere_mining_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

### 9.2 Cron Job

```bash
# Add to crontab
crontab -e

# Daily backup at 3 AM
0 3 * * * /mnt/storage/cloudmining/scripts/backup-db.sh
```

---

## 10. Rollback Procedure

### 10.1 Frontend Rollback

```bash
# Keep previous build
mv /mnt/storage/cloudmining/frontend /mnt/storage/cloudmining/frontend-backup

# Restore from backup
mv /mnt/storage/cloudmining/frontend-previous /mnt/storage/cloudmining/frontend

sudo nginx -t && sudo systemctl reload nginx
```

### 10.2 Backend Rollback

```bash
# Stop current
pm2 stop cloudmining-backend

# Restore from backup
mv /mnt/storage/cloudmining/backend /mnt/storage/cloudmining/backend-failed
mv /mnt/storage/cloudmining/backend-previous /mnt/storage/cloudmining/backend

# Restart
pm2 start cloudmining-backend
```

### 10.3 Database Rollback

```bash
# Revert last migration
cd /mnt/storage/cloudmining/backend
npm run migration:revert

# Or restore from backup
mysql -u xphere_user -p xphere_mining < /mnt/storage/cloudmining/backups/xphere_mining_YYYYMMDD.sql
```
