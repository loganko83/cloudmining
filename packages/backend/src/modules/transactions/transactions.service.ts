import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus, Currency } from './entities/transaction.entity';

export interface CreateTransactionDto {
  userId: string;
  type: TransactionType;
  amount: string;
  currency: Currency;
  txHash?: string;
  description?: string;
  fee?: string;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...dto,
      status: TransactionStatus.COMPLETED,
    });
    return this.transactionRepository.save(transaction);
  }

  async findByUser(userId: string, limit = 50): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByUserAndType(userId: string, type: TransactionType): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserBalance(userId: string): Promise<{ xp: string; usdt: string }> {
    const transactions = await this.findByUser(userId, 1000);

    let xpBalance = 0;
    let usdtBalance = 0;

    for (const tx of transactions) {
      if (tx.status !== TransactionStatus.COMPLETED) continue;

      const amount = parseFloat(tx.amount);
      const isCredit = [
        TransactionType.DEPOSIT,
        TransactionType.MINING_REWARD,
        TransactionType.LENDING_WITHDRAW,
      ].includes(tx.type);

      if (tx.currency === Currency.XP) {
        xpBalance += isCredit ? amount : -amount;
      } else {
        usdtBalance += isCredit ? amount : -amount;
      }
    }

    return {
      xp: xpBalance.toFixed(8),
      usdt: usdtBalance.toFixed(6),
    };
  }
}
