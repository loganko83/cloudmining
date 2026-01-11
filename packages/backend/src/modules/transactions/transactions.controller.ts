import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactions(@Request() req: RequestWithUser, @Query('limit') limit?: number) {
    const transactions = await this.transactionsService.findByUser(
      req.user.id,
      limit || 50,
    );
    return {
      success: true,
      data: transactions,
    };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user balance' })
  async getBalance(@Request() req: RequestWithUser) {
    const balance = await this.transactionsService.getUserBalance(req.user.id);
    return {
      success: true,
      data: balance,
    };
  }
}
