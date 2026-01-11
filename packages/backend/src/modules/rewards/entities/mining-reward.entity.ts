import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserMachine } from '../../machines/entities/user-machine.entity';

export enum RewardStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
}

@Entity('mining_rewards')
export class MiningReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'machine_id' })
  machineId: string;

  @ManyToOne(() => UserMachine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'machine_id' })
  machine: UserMachine;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: string;

  @Column({ name: 'reward_date', type: 'date' })
  rewardDate: Date;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    default: RewardStatus.PENDING,
  })
  status: RewardStatus;

  @Column({ name: 'claimed_at', type: 'timestamp', nullable: true })
  claimedAt: Date;

  @Column({ name: 'tx_hash', length: 66, nullable: true })
  txHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
