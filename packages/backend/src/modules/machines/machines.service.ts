import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MachinePlan } from './entities/machine-plan.entity';
import { UserMachine, MachineStatus } from './entities/user-machine.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType, Currency } from '../transactions/entities/transaction.entity';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(MachinePlan)
    private readonly planRepository: Repository<MachinePlan>,
    @InjectRepository(UserMachine)
    private readonly userMachineRepository: Repository<UserMachine>,
    private readonly transactionsService: TransactionsService,
  ) {}

  async findAllPlans(): Promise<MachinePlan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { priceUsdt: 'ASC' },
    });
  }

  async findPlanById(id: string): Promise<MachinePlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Machine plan not found');
    }
    return plan;
  }

  async getUserMachines(userId: string): Promise<UserMachine[]> {
    return this.userMachineRepository.find({
      where: { userId },
      relations: ['plan'],
      order: { purchaseDate: 'DESC' },
    });
  }

  async purchaseMachine(
    userId: string,
    planId: string,
    txHash: string,
  ): Promise<UserMachine> {
    const plan = await this.findPlanById(planId);

    // Verify transaction on blockchain (simplified - should verify amount and status)
    if (!txHash || txHash.length !== 66) {
      throw new BadRequestException('Invalid transaction hash');
    }

    // Create user machine
    const userMachine = this.userMachineRepository.create({
      userId,
      planId,
      purchaseDate: new Date(),
      status: MachineStatus.ONLINE,
      txHash,
    });

    const savedMachine = await this.userMachineRepository.save(userMachine);

    // Record transaction
    await this.transactionsService.create({
      userId,
      type: TransactionType.PURCHASE,
      amount: plan.priceUsdt,
      currency: Currency.USDT,
      txHash,
      description: `Purchased ${plan.name} mining machine`,
    });

    return savedMachine;
  }

  async getMachineStats(userId: string) {
    const machines = await this.getUserMachines(userId);

    const totalHashrate = machines
      .filter(m => m.status === MachineStatus.ONLINE)
      .reduce((sum, m) => sum + m.plan.hashrate, 0);

    const totalDailyReward = machines
      .filter(m => m.status === MachineStatus.ONLINE)
      .reduce((sum, m) => sum + parseFloat(m.plan.dailyReturnXp), 0);

    return {
      totalMachines: machines.length,
      onlineMachines: machines.filter(m => m.status === MachineStatus.ONLINE).length,
      totalHashrate,
      totalDailyReward: totalDailyReward.toFixed(8),
    };
  }
}
