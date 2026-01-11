import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('machine_plans')
export class MachinePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'machine_name', length: 100 })
  machineName: string;

  @Column({ name: 'price_usdt', type: 'decimal', precision: 18, scale: 6 })
  priceUsdt: string;

  @Column({ type: 'int' })
  hashrate: number;

  @Column({ name: 'daily_return_xp', type: 'decimal', precision: 18, scale: 8 })
  dailyReturnXp: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
