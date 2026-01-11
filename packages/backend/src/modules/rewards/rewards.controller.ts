import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RewardsService } from './rewards.service';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@ApiTags('rewards')
@Controller('rewards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending mining rewards' })
  async getPendingRewards(@Request() req: RequestWithUser) {
    const rewards = await this.rewardsService.getPendingRewards(req.user.id);
    const totalAmount = await this.rewardsService.getTotalPendingAmount(req.user.id);
    return {
      success: true,
      data: {
        rewards,
        totalAmount,
        count: rewards.length,
      },
    };
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim all pending mining rewards' })
  async claimRewards(@Request() req: RequestWithUser) {
    const result = await this.rewardsService.claimRewards(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get reward history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(@Request() req: RequestWithUser, @Query('limit') limit?: number) {
    const history = await this.rewardsService.getRewardHistory(
      req.user.id,
      limit || 30,
    );
    return {
      success: true,
      data: history,
    };
  }
}
