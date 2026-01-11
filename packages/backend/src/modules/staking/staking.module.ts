import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StakingController } from './staking.controller';
import { StakingService } from './staking.service';
import { StakingPosition } from './entities/staking-position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StakingPosition])],
  controllers: [StakingController],
  providers: [StakingService],
  exports: [StakingService],
})
export class StakingModule {}
