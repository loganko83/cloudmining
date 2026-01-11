import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LendingController } from './lending.controller';
import { LendingService } from './lending.service';
import { LendingPool } from './entities/lending-pool.entity';
import { SupplyPosition } from './entities/supply-position.entity';
import { BorrowPosition } from './entities/borrow-position.entity';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LendingPool, SupplyPosition, BorrowPosition]),
    forwardRef(() => TransactionsModule),
  ],
  controllers: [LendingController],
  providers: [LendingService],
  exports: [LendingService],
})
export class LendingModule {}
