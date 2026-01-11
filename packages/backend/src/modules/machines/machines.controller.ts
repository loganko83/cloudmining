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
import { MachinesService } from './machines.service';
import { PurchaseMachineDto } from './dto/purchase-machine.dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string };
}

@ApiTags('machines')
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available mining machine plans' })
  @ApiResponse({ status: 200, description: 'Returns list of machine plans' })
  async getPlans() {
    const plans = await this.machinesService.findAllPlans();
    return {
      success: true,
      data: plans,
    };
  }

  @Get('my-machines')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user machines' })
  async getMyMachines(@Request() req: RequestWithUser) {
    const machines = await this.machinesService.getUserMachines(req.user.id);
    return {
      success: true,
      data: machines,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user mining statistics' })
  async getStats(@Request() req: RequestWithUser) {
    const stats = await this.machinesService.getMachineStats(req.user.id);
    return {
      success: true,
      data: stats,
    };
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a mining machine with USDT' })
  @ApiResponse({ status: 201, description: 'Machine purchased successfully' })
  async purchaseMachine(@Request() req: RequestWithUser, @Body() dto: PurchaseMachineDto) {
    const machine = await this.machinesService.purchaseMachine(
      req.user.id,
      dto.planId,
      dto.txHash,
    );
    return {
      success: true,
      data: machine,
    };
  }
}
