import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LendingPool } from './entities/lending-pool.entity';
import { SupplyPosition } from './entities/supply-position.entity';
import { BorrowPosition } from './entities/borrow-position.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, Currency } from '../transactions/entities/transaction.entity';

// Interest rate model constants
const BASE_RATE = 0.02; // 2%
const OPTIMAL_UTILIZATION = 0.8; // 80%
const SLOPE1 = 0.04; // 4%
const SLOPE2 = 0.75; // 75%
const RAY = BigInt('1000000000000000000000000000'); // 10^27

@Injectable()
export class LendingService {
  constructor(
    @InjectRepository(LendingPool)
    private readonly poolRepository: Repository<LendingPool>,
    @InjectRepository(SupplyPosition)
    private readonly supplyRepository: Repository<SupplyPosition>,
    @InjectRepository(BorrowPosition)
    private readonly borrowRepository: Repository<BorrowPosition>,
    private readonly transactionsService: TransactionsService,
  ) {}

  async getPool(asset = 'XP'): Promise<LendingPool> {
    let pool = await this.poolRepository.findOne({ where: { asset } });
    if (!pool) {
      // Create default XP pool
      pool = this.poolRepository.create({
        asset: 'XP',
        ltvRatio: '0.75',
        liquidationThreshold: '0.80',
        liquidationBonus: '0.05',
        reserveFactor: '0.10',
      });
      pool = await this.poolRepository.save(pool);
    }
    return pool;
  }

  async getPoolInfo(asset = 'XP') {
    const pool = await this.getPool(asset);
    const utilization = this.calculateUtilization(pool);
    const { supplyRate, borrowRate } = this.calculateInterestRates(utilization);

    return {
      ...pool,
      utilization: (utilization * 100).toFixed(2) + '%',
      supplyApy: (supplyRate * 100).toFixed(2) + '%',
      borrowApy: (borrowRate * 100).toFixed(2) + '%',
      tvl: pool.totalSupplied,
    };
  }

  async getUserPositions(userId: string) {
    const supplyPositions = await this.supplyRepository.find({
      where: { userId },
      relations: ['pool'],
    });

    const borrowPositions = await this.borrowRepository.find({
      where: { userId },
      relations: ['pool'],
    });

    return {
      supplies: supplyPositions,
      borrows: borrowPositions,
    };
  }

  async supply(userId: string, amount: string, txHash?: string): Promise<SupplyPosition> {
    const pool = await this.getPool('XP');
    const amountNum = parseFloat(amount);

    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Calculate XPx tokens to mint (1:1 at initial index)
    const xpxAmount = amount;

    // Update or create position
    let position = await this.supplyRepository.findOne({
      where: { userId, poolId: pool.id },
    });

    if (position) {
      position.suppliedAmount = (parseFloat(position.suppliedAmount) + amountNum).toString();
      position.xpxBalance = (parseFloat(position.xpxBalance) + parseFloat(xpxAmount)).toString();
    } else {
      position = this.supplyRepository.create({
        userId,
        poolId: pool.id,
        suppliedAmount: amount,
        xpxBalance: xpxAmount,
        entryIndex: pool.liquidityIndex,
      });
    }

    await this.supplyRepository.save(position);

    // Update pool totals
    pool.totalSupplied = (parseFloat(pool.totalSupplied) + amountNum).toString();
    await this.poolRepository.save(pool);

    // Record transaction
    await this.transactionsService.create({
      userId,
      type: TransactionType.LENDING_SUPPLY,
      amount,
      currency: Currency.XP,
      txHash,
      description: 'Supplied XP to lending pool',
    });

    return position;
  }

  async withdraw(userId: string, amount: string): Promise<SupplyPosition> {
    const pool = await this.getPool('XP');
    const amountNum = parseFloat(amount);

    const position = await this.supplyRepository.findOne({
      where: { userId, poolId: pool.id },
    });

    if (!position) {
      throw new NotFoundException('No supply position found');
    }

    const availableToWithdraw = parseFloat(position.suppliedAmount);
    if (amountNum > availableToWithdraw) {
      throw new BadRequestException('Insufficient balance');
    }

    // Check pool liquidity
    const availableLiquidity = parseFloat(pool.totalSupplied) - parseFloat(pool.totalBorrowed);
    if (amountNum > availableLiquidity) {
      throw new BadRequestException('Insufficient pool liquidity');
    }

    // Update position
    position.suppliedAmount = (availableToWithdraw - amountNum).toString();
    position.xpxBalance = (parseFloat(position.xpxBalance) - amountNum).toString();
    await this.supplyRepository.save(position);

    // Update pool
    pool.totalSupplied = (parseFloat(pool.totalSupplied) - amountNum).toString();
    await this.poolRepository.save(pool);

    // Record transaction
    await this.transactionsService.create({
      userId,
      type: TransactionType.LENDING_WITHDRAW,
      amount,
      currency: Currency.XP,
      description: 'Withdrew XP from lending pool',
    });

    return position;
  }

  async borrow(
    userId: string,
    borrowAmount: string,
    collateralAmount: string,
    collateralAsset = 'XP',
  ): Promise<BorrowPosition> {
    const pool = await this.getPool('XP');
    const borrowNum = parseFloat(borrowAmount);
    const collateralNum = parseFloat(collateralAmount);

    // Check LTV
    const maxBorrow = collateralNum * parseFloat(pool.ltvRatio);
    if (borrowNum > maxBorrow) {
      throw new BadRequestException(`Borrow amount exceeds LTV limit. Max: ${maxBorrow}`);
    }

    // Check liquidity
    const availableLiquidity = parseFloat(pool.totalSupplied) - parseFloat(pool.totalBorrowed);
    if (borrowNum > availableLiquidity) {
      throw new BadRequestException('Insufficient pool liquidity');
    }

    // Create borrow position
    const healthFactor = this.calculateHealthFactor(collateralNum, borrowNum, pool);
    const position = this.borrowRepository.create({
      userId,
      poolId: pool.id,
      borrowedAmount: borrowAmount,
      collateralAmount,
      collateralAsset,
      entryIndex: pool.borrowIndex,
      healthFactor: healthFactor.toString(),
    });

    await this.borrowRepository.save(position);

    // Update pool
    pool.totalBorrowed = (parseFloat(pool.totalBorrowed) + borrowNum).toString();
    await this.poolRepository.save(pool);

    // Record transaction
    await this.transactionsService.create({
      userId,
      type: TransactionType.BORROW,
      amount: borrowAmount,
      currency: Currency.XP,
      description: `Borrowed XP with ${collateralAmount} ${collateralAsset} collateral`,
    });

    return position;
  }

  async repay(userId: string, positionId: string, amount: string): Promise<BorrowPosition> {
    const position = await this.borrowRepository.findOne({
      where: { id: positionId, userId },
      relations: ['pool'],
    });

    if (!position) {
      throw new NotFoundException('Borrow position not found');
    }

    const amountNum = parseFloat(amount);
    const outstandingDebt = parseFloat(position.borrowedAmount);
    const repayAmount = Math.min(amountNum, outstandingDebt);

    // Update position
    position.borrowedAmount = (outstandingDebt - repayAmount).toString();
    position.healthFactor = this.calculateHealthFactor(
      parseFloat(position.collateralAmount),
      parseFloat(position.borrowedAmount),
      position.pool,
    ).toString();

    await this.borrowRepository.save(position);

    // Update pool
    const pool = position.pool;
    pool.totalBorrowed = (parseFloat(pool.totalBorrowed) - repayAmount).toString();
    await this.poolRepository.save(pool);

    // Record transaction
    await this.transactionsService.create({
      userId,
      type: TransactionType.REPAY,
      amount: repayAmount.toString(),
      currency: Currency.XP,
      description: 'Repaid XP loan',
    });

    return position;
  }

  private calculateUtilization(pool: LendingPool): number {
    const totalSupplied = parseFloat(pool.totalSupplied);
    const totalBorrowed = parseFloat(pool.totalBorrowed);
    if (totalSupplied === 0) return 0;
    return totalBorrowed / totalSupplied;
  }

  private calculateInterestRates(utilization: number): { supplyRate: number; borrowRate: number } {
    let borrowRate: number;

    if (utilization <= OPTIMAL_UTILIZATION) {
      borrowRate = BASE_RATE + (utilization / OPTIMAL_UTILIZATION) * SLOPE1;
    } else {
      const excessUtilization = (utilization - OPTIMAL_UTILIZATION) / (1 - OPTIMAL_UTILIZATION);
      borrowRate = BASE_RATE + SLOPE1 + excessUtilization * SLOPE2;
    }

    const reserveFactor = 0.1;
    const supplyRate = borrowRate * utilization * (1 - reserveFactor);

    return { supplyRate, borrowRate };
  }

  private calculateHealthFactor(collateral: number, debt: number, pool: LendingPool): number {
    if (debt === 0) return 999;
    const liquidationThreshold = parseFloat(pool.liquidationThreshold);
    return (collateral * liquidationThreshold) / debt;
  }
}
