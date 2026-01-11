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
import { LendingPool } from './lending-pool.entity';

@Entity('supply_positions')
@Index(['userId', 'poolId'], { unique: true })
export class SupplyPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pool_id' })
  poolId: string;

  @ManyToOne(() => LendingPool)
  @JoinColumn({ name: 'pool_id' })
  pool: LendingPool;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'supplied_amount', type: 'decimal', precision: 36, scale: 18 })
  suppliedAmount: string;

  @Column({ name: 'xpx_balance', type: 'decimal', precision: 36, scale: 18 })
  xpxBalance: string;

  @Column({ name: 'entry_index', type: 'decimal', precision: 36, scale: 18 })
  entryIndex: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
