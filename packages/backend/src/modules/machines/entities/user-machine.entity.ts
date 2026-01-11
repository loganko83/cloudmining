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
import { MachinePlan } from './machine-plan.entity';

export enum MachineStatus {
  ONLINE = 'ONLINE',
  MAINTENANCE = 'MAINTENANCE',
  OFFLINE = 'OFFLINE',
}

@Entity('user_machines')
export class UserMachine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => MachinePlan)
  @JoinColumn({ name: 'plan_id' })
  plan: MachinePlan;

  @Column({ name: 'purchase_date', type: 'timestamp' })
  purchaseDate: Date;

  @Column({
    type: 'enum',
    enum: MachineStatus,
    default: MachineStatus.ONLINE,
  })
  status: MachineStatus;

  @Column({ name: 'tx_hash', length: 66, nullable: true })
  txHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
