import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LendingService } from './lending.service';
import { SupplyDto, WithdrawDto, BorrowDto, RepayDto } from './dto/lending.dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@ApiTags('lending')
@Controller('lending')
export class LendingController {
  constructor(private readonly lendingService: LendingService) {}

  @Get('pools')
  @ApiOperation({ summary: 'Get lending pool information' })
  @ApiResponse({ status: 200, description: 'Returns pool info with APY and TVL' })
  async getPoolInfo() {
    const pool = await this.lendingService.getPoolInfo('XP');
    return {
      success: true,
      data: pool,
    };
  }

  @Get('my-positions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user lending positions' })
  async getMyPositions(@Request() req: RequestWithUser) {
    const positions = await this.lendingService.getUserPositions(req.user.id);
    return {
      success: true,
      data: positions,
    };
  }

  @Post('supply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supply XP to lending pool' })
  @ApiResponse({ status: 201, description: 'XP supplied, XPx tokens received' })
  async supply(@Request() req: RequestWithUser, @Body() dto: SupplyDto) {
    const position = await this.lendingService.supply(
      req.user.id,
      dto.amount,
      dto.txHash,
    );
    return {
      success: true,
      data: position,
    };
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw XP from lending pool' })
  async withdraw(@Request() req: RequestWithUser, @Body() dto: WithdrawDto) {
    const position = await this.lendingService.withdraw(req.user.id, dto.amount);
    return {
      success: true,
      data: position,
    };
  }

  @Post('borrow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Borrow XP with collateral' })
  async borrow(@Request() req: RequestWithUser, @Body() dto: BorrowDto) {
    const position = await this.lendingService.borrow(
      req.user.id,
      dto.borrowAmount,
      dto.collateralAmount,
      dto.collateralAsset,
    );
    return {
      success: true,
      data: position,
    };
  }

  @Post('repay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Repay borrowed XP' })
  async repay(@Request() req: RequestWithUser, @Body() dto: RepayDto) {
    const position = await this.lendingService.repay(
      req.user.id,
      dto.positionId,
      dto.amount,
    );
    return {
      success: true,
      data: position,
    };
  }
}
