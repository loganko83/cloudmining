import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MiningReward, RewardStatus } from './entities/mining-reward.entity';
import { UserMachine, MachineStatus } from '../machines/entities/user-machine.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, Currency } from '../transactions/entities/transaction.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(MiningReward)
    private readonly rewardRepository: Repository<MiningReward>,
    @InjectRepository(UserMachine)
    private readonly userMachineRepository: Repository<UserMachine>,
    private readonly transactionsService: TransactionsService,
  ) {}

  async getPendingRewards(userId: string): Promise<MiningReward[]> {
    return this.rewardRepository.find({
      where: { userId, status: RewardStatus.PENDING },
      relations: ['machine', 'machine.plan'],
      order: { rewardDate: 'DESC' },
    });
  }

  async getTotalPendingAmount(userId: string): Promise<string> {
    const rewards = await this.getPendingRewards(userId);
    const total = rewards.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    return total.toFixed(8);
  }

  async claimRewards(userId: string): Promise<{ claimed: number; amount: string }> {
    const pendingRewards = await this.getPendingRewards(userId);

    if (pendingRewards.length === 0) {
      throw new NotFoundException('No pending rewards to claim');
    }

    let totalAmount = 0;

    for (const reward of pendingRewards) {
      reward.status = RewardStatus.CLAIMED;
      reward.claimedAt = new Date();
      await this.rewardRepository.save(reward);
      totalAmount += parseFloat(reward.amount);
    }

    // Record transaction
    await this.transactionsService.create({
      userId,
      type: TransactionType.MINING_REWARD,
      amount: totalAmount.toFixed(8),
      currency: Currency.XP,
      description: `Claimed mining rewards for ${pendingRewards.length} days`,
    });

    return {
      claimed: pendingRewards.length,
      amount: totalAmount.toFixed(8),
    };
  }

  async getRewardHistory(userId: string, limit = 30): Promise<MiningReward[]> {
    return this.rewardRepository.find({
      where: { userId },
      relations: ['machine', 'machine.plan'],
      order: { rewardDate: 'DESC' },
      take: limit,
    });
  }

  // Run every day at 00:05 UTC to distribute daily mining rewards
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async distributeDailyRewards() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all online machines with their plans
    const onlineMachines = await this.userMachineRepository.find({
      where: { status: MachineStatus.ONLINE },
      relations: ['plan'],
    });

    for (const machine of onlineMachines) {
      // Check if reward already distributed for today
      const existingReward = await this.rewardRepository.findOne({
        where: {
          machineId: machine.id,
          rewardDate: today,
        },
      });

      if (existingReward) continue;

      // Create daily reward
      const reward = this.rewardRepository.create({
        userId: machine.userId,
        machineId: machine.id,
        amount: machine.plan.dailyReturnXp,
        rewardDate: today,
        status: RewardStatus.PENDING,
      });

      await this.rewardRepository.save(reward);
    }

    console.log(`[Rewards] Distributed rewards for ${onlineMachines.length} machines`);
  }
}
