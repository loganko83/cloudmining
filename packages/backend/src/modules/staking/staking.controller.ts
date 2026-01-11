import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StakingService } from './staking.service';
import { StakeDto } from './dto/staking.dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@ApiTags('staking')
@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get staking pool information' })
  @ApiResponse({ status: 200, description: 'Returns staking pool info with APY' })
  async getPoolInfo() {
    const info = await this.stakingService.getPoolInfo();
    return {
      success: true,
      data: info,
    };
  }

  @Get('my-positions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user staking positions' })
  async getMyPositions(@Request() req: RequestWithUser) {
    const positions = await this.stakingService.getUserPositions(req.user.id);
    const pendingRewards = await this.stakingService.calculatePendingRewards(req.user.id);
    return {
      success: true,
      data: {
        positions,
        pendingRewards,
      },
    };
  }

  @Post('stake')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stake XP tokens' })
  async stake(@Request() req: RequestWithUser, @Body() dto: StakeDto) {
    const position = await this.stakingService.stake(req.user.id, dto.amount);
    return {
      success: true,
      data: position,
    };
  }

  @Post('unstake/:positionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate unstaking (7-day unbonding)' })
  async unstake(@Request() req: RequestWithUser, @Param('positionId') positionId: string) {
    const position = await this.stakingService.unstake(req.user.id, positionId);
    return {
      success: true,
      data: position,
    };
  }

  @Post('withdraw/:positionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw unstaked tokens after unbonding' })
  async withdraw(@Request() req: RequestWithUser, @Param('positionId') positionId: string) {
    const position = await this.stakingService.withdraw(req.user.id, positionId);
    return {
      success: true,
      data: position,
    };
  }
}
