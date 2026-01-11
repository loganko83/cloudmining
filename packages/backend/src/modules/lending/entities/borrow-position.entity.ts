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

@Entity('borrow_positions')
export class BorrowPosition {
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

  @Column({ name: 'borrowed_amount', type: 'decimal', precision: 36, scale: 18 })
  borrowedAmount: string;

  @Column({ name: 'collateral_amount', type: 'decimal', precision: 36, scale: 18 })
  collateralAmount: string;

  @Column({ name: 'collateral_asset', length: 10 })
  collateralAsset: string;

  @Column({ name: 'entry_index', type: 'decimal', precision: 36, scale: 18 })
  entryIndex: string;

  @Column({ name: 'health_factor', type: 'decimal', precision: 10, scale: 4, nullable: true })
  healthFactor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
