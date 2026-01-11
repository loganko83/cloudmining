import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lending_pools')
export class LendingPool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 10, unique: true })
  asset: string;

  @Column({ name: 'total_supplied', type: 'decimal', precision: 36, scale: 18, default: '0' })
  totalSupplied: string;

  @Column({ name: 'total_borrowed', type: 'decimal', precision: 36, scale: 18, default: '0' })
  totalBorrowed: string;

  @Column({ name: 'liquidity_index', type: 'decimal', precision: 36, scale: 27, default: '1000000000000000000000000000' })
  liquidityIndex: string;

  @Column({ name: 'borrow_index', type: 'decimal', precision: 36, scale: 27, default: '1000000000000000000000000000' })
  borrowIndex: string;

  @Column({ name: 'supply_apy', type: 'decimal', precision: 10, scale: 4, default: '0' })
  supplyApy: string;

  @Column({ name: 'borrow_apy', type: 'decimal', precision: 10, scale: 4, default: '0' })
  borrowApy: string;

  @Column({ name: 'ltv_ratio', type: 'decimal', precision: 5, scale: 4, default: '0.75' })
  ltvRatio: string;

  @Column({ name: 'liquidation_threshold', type: 'decimal', precision: 5, scale: 4, default: '0.80' })
  liquidationThreshold: string;

  @Column({ name: 'liquidation_bonus', type: 'decimal', precision: 5, scale: 4, default: '0.05' })
  liquidationBonus: string;

  @Column({ name: 'reserve_factor', type: 'decimal', precision: 5, scale: 4, default: '0.10' })
  reserveFactor: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
