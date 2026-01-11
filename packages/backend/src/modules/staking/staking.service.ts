import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StakingPosition, StakingStatus } from './entities/staking-position.entity';

const STAKING_APY = 0.12; // 12% APY
const UNBONDING_DAYS = 7;

@Injectable()
export class StakingService {
  constructor(
    @InjectRepository(StakingPosition)
    private readonly stakingRepository: Repository<StakingPosition>,
  ) {}

  async getPoolInfo() {
    const activePositions = await this.stakingRepository.find({
      where: { status: StakingStatus.ACTIVE },
    });

    const totalStaked = activePositions.reduce(
      (sum, pos) => sum + parseFloat(pos.amount),
      0,
    );

    return {
      totalStaked: totalStaked.toFixed(8),
      apy: (STAKING_APY * 100).toFixed(2) + '%',
      unbondingPeriod: `${UNBONDING_DAYS} days`,
      activeStakers: activePositions.length,
    };
  }

  async getUserPositions(userId: string): Promise<StakingPosition[]> {
    return this.stakingRepository.find({
      where: { userId },
      order: { startDate: 'DESC' },
    });
  }

  async stake(userId: string, amount: string): Promise<StakingPosition> {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const position = this.stakingRepository.create({
      userId,
      amount,
      startDate: new Date(),
      status: StakingStatus.ACTIVE,
    });

    return this.stakingRepository.save(position);
  }

  async unstake(userId: string, positionId: string): Promise<StakingPosition> {
    const position = await this.stakingRepository.findOne({
      where: { id: positionId, userId, status: StakingStatus.ACTIVE },
    });

    if (!position) {
      throw new NotFoundException('Active staking position not found');
    }

    // Calculate accumulated rewards
    const stakingDays = this.getDaysBetween(position.startDate, new Date());
    const dailyRate = STAKING_APY / 365;
    const rewards = parseFloat(position.amount) * dailyRate * stakingDays;

    // Set unlock date (7 days from now)
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + UNBONDING_DAYS);

    position.status = StakingStatus.UNBONDING;
    position.unlockDate = unlockDate;
    position.accumulatedRewards = rewards.toFixed(8);

    return this.stakingRepository.save(position);
  }

  async withdraw(userId: string, positionId: string): Promise<StakingPosition> {
    const position = await this.stakingRepository.findOne({
      where: { id: positionId, userId, status: StakingStatus.UNBONDING },
    });

    if (!position) {
      throw new NotFoundException('Unbonding position not found');
    }

    if (new Date() < position.unlockDate) {
      throw new BadRequestException('Unbonding period not complete');
    }

    position.status = StakingStatus.WITHDRAWN;
    return this.stakingRepository.save(position);
  }

  async calculatePendingRewards(userId: string): Promise<string> {
    const activePositions = await this.stakingRepository.find({
      where: { userId, status: StakingStatus.ACTIVE },
    });

    let totalRewards = 0;
    const dailyRate = STAKING_APY / 365;

    for (const position of activePositions) {
      const stakingDays = this.getDaysBetween(position.startDate, new Date());
      const rewards = parseFloat(position.amount) * dailyRate * stakingDays;
      totalRewards += rewards;
    }

    return totalRewards.toFixed(8);
  }

  private getDaysBetween(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
