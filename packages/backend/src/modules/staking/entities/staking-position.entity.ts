import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum StakingStatus {
  ACTIVE = 'ACTIVE',
  UNBONDING = 'UNBONDING',
  WITHDRAWN = 'WITHDRAWN',
}

@Entity('staking_positions')
export class StakingPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'unlock_date', type: 'timestamp', nullable: true })
  unlockDate: Date;

  @Column({ name: 'accumulated_rewards', type: 'decimal', precision: 36, scale: 18, default: '0' })
  accumulatedRewards: string;

  @Column({
    type: 'enum',
    enum: StakingStatus,
    default: StakingStatus.ACTIVE,
  })
  status: StakingStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
