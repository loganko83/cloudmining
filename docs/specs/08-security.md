# Security Specification - Xphere Mining Cloud

## 1. Authentication Security

### 1.1 Password Requirements

| Requirement | Value |
|-------------|-------|
| Minimum Length | 8 characters |
| Uppercase Required | Yes (1+) |
| Lowercase Required | Yes (1+) |
| Number Required | Yes (1+) |
| Special Character | Recommended |

### 1.2 Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 1.3 JWT Configuration

```typescript
// Access Token
{
  secret: process.env.JWT_SECRET,
  expiresIn: '1h',
  algorithm: 'HS256'
}

// Refresh Token
{
  secret: process.env.JWT_REFRESH_SECRET,
  expiresIn: '7d',
  algorithm: 'HS256'
}
```

### 1.4 Token Payload

```typescript
interface JwtPayload {
  sub: string;      // User ID
  email: string;
  role: 'user' | 'admin';
  iat: number;      // Issued at
  exp: number;      // Expiration
}
```

### 1.5 Refresh Token Rotation

```typescript
// On refresh token use:
1. Validate refresh token
2. Check if token exists in database
3. Generate new access + refresh tokens
4. Invalidate old refresh token in database
5. Store new refresh token hash
6. Return new tokens
```

---

## 2. API Security

### 2.1 Rate Limiting

```typescript
// @nestjs/throttler
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,     // 1 minute window
      limit: 100,     // 100 requests per window
    }]),
  ],
})

// Stricter limits for auth endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 per minute
@Post('login')
async login() {}
```

### 2.2 Input Validation

```typescript
// Use class-validator decorators
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsString()
  @MinLength(2)
  name: string;
}
```

### 2.3 SQL Injection Prevention

```typescript
// Use TypeORM parameterized queries
// NEVER use string interpolation for SQL

// GOOD
const user = await this.userRepository.findOne({
  where: { email: email }
});

// BAD - Never do this!
const user = await this.userRepository.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### 2.4 CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'https://trendy.storydot.kr',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400, // 24 hours
});
```

### 2.5 Security Headers

```typescript
// Use helmet middleware
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://trendy.storydot.kr"],
  },
}));
```

---

## 3. Wallet Security

### 3.1 Address Verification

```typescript
import { ethers } from 'ethers';

// Verify wallet ownership via signature
async function verifyWalletOwnership(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

// Message format for signing
function getSignMessage(timestamp: number): string {
  return `Link wallet to Xphere Mining Cloud\n\nTimestamp: ${timestamp}\n\nThis signature proves ownership of your wallet.`;
}
```

### 3.2 Address Validation

```typescript
import { ethers } from 'ethers';

function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

function checksumAddress(address: string): string {
  return ethers.getAddress(address);
}
```

### 3.3 Transaction Verification

```typescript
// Verify on-chain transaction before crediting
async function verifyTransaction(
  txHash: string,
  expectedFrom: string,
  expectedTo: string,
  expectedAmount: bigint
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(process.env.WEB3_RPC_URL);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt || receipt.status !== 1) {
    return false; // Transaction failed or not found
  }

  const tx = await provider.getTransaction(txHash);

  return (
    tx.from.toLowerCase() === expectedFrom.toLowerCase() &&
    tx.to?.toLowerCase() === expectedTo.toLowerCase() &&
    tx.value >= expectedAmount
  );
}
```

---

## 4. Smart Contract Security

### 4.1 Access Control

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LendingPool is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
        _;
    }
}
```

### 4.2 Reentrancy Protection

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LendingPool is ReentrancyGuard {
    function withdraw(uint256 amount) external nonReentrant {
        // Safe from reentrancy
    }
}
```

### 4.3 Integer Overflow Protection

Solidity 0.8+ has built-in overflow checks. For older versions:

```solidity
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

using SafeMath for uint256;
```

### 4.4 Flash Loan Protection

```solidity
// Prevent flash loan manipulation
modifier noFlashLoan() {
    require(lastBlockNumber[msg.sender] < block.number, "Same block");
    lastBlockNumber[msg.sender] = block.number;
    _;
}
```

### 4.5 Oracle Manipulation Protection

```solidity
// Use time-weighted average price (TWAP)
// Or Chainlink price feeds

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

function getLatestPrice() public view returns (int) {
    (
        uint80 roundID,
        int price,
        uint startedAt,
        uint timeStamp,
        uint80 answeredInRound
    ) = priceFeed.latestRoundData();

    require(timeStamp > block.timestamp - 1 hours, "Stale price");
    return price;
}
```

---

## 5. Data Protection

### 5.1 Sensitive Data Handling

```typescript
// Never log sensitive data
// WRONG
console.log(`User login: ${email}, password: ${password}`);

// RIGHT
console.log(`User login attempt: ${email}`);

// Mask sensitive data in responses
function maskWalletAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```

### 5.2 Environment Variables

```bash
# Never commit .env files
# Add to .gitignore:
.env
.env.local
.env.production

# Use secrets management in production
# AWS Secrets Manager / HashiCorp Vault
```

### 5.3 Database Encryption

```sql
-- Encrypt sensitive columns
ALTER TABLE users
ADD COLUMN wallet_address_encrypted VARBINARY(255);

-- Use application-level encryption for sensitive data
```

---

## 6. Error Handling

### 6.1 Safe Error Messages

```typescript
// Don't expose internal errors to users
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log full error internally
    this.logger.error(exception);

    // Return safe message to user
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({
        success: false,
        error: {
          message: exception.message,
        },
      });
    } else {
      response.status(500).json({
        success: false,
        error: {
          message: 'An unexpected error occurred',
        },
      });
    }
  }
}
```

### 6.2 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid JWT |
| `FORBIDDEN` | 403 | No permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `INSUFFICIENT_BALANCE` | 400 | Not enough funds |
| `RATE_LIMITED` | 429 | Too many requests |

---

## 7. Audit Logging

### 7.1 Critical Actions to Log

```typescript
enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  WALLET_LINKED = 'WALLET_LINKED',
  MACHINE_PURCHASE = 'MACHINE_PURCHASE',
  WITHDRAWAL_REQUEST = 'WITHDRAWAL_REQUEST',
  LENDING_SUPPLY = 'LENDING_SUPPLY',
  LENDING_BORROW = 'LENDING_BORROW',
  ADMIN_ACTION = 'ADMIN_ACTION',
}

interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  timestamp: Date;
}
```

### 7.2 Audit Table

```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);
```

---

## 8. Security Checklist

### 8.1 Pre-Deployment

- [ ] All dependencies updated to latest secure versions
- [ ] Security audit completed for smart contracts
- [ ] Penetration testing performed
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Admin accounts use strong 2FA

### 8.2 Ongoing

- [ ] Monitor for suspicious activity
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate JWT secrets quarterly
- [ ] Perform security scans regularly
- [ ] Review access permissions

### 8.3 Incident Response

```
1. Detect - Monitor for anomalies
2. Contain - Isolate affected systems
3. Eradicate - Remove threat
4. Recover - Restore services
5. Learn - Post-mortem analysis
```

---

## 9. Third-Party Security

### 9.1 Dependency Scanning

```bash
# Run npm audit regularly
npm audit

# Fix vulnerabilities
npm audit fix

# Use Snyk for continuous monitoring
npx snyk test
```

### 9.2 Contract Verification

```bash
# Verify contracts on Etherscan
npx hardhat verify --network mainnet CONTRACT_ADDRESS "constructor args"
```

---

## 10. Compliance Considerations

### 10.1 Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| User accounts | Until deletion request |
| Transaction logs | 7 years |
| Audit logs | 3 years |
| Session data | 30 days |
| Refresh tokens | 7 days |

### 10.2 User Rights

- Right to access personal data
- Right to rectification
- Right to erasure (with limitations for financial data)
- Right to data portability

### 10.3 KYC/AML (if applicable)

For larger transactions, consider implementing:
- Identity verification
- Address verification
- Source of funds verification
- Transaction monitoring
