import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Web3Service } from './web3.service';

@ApiTags('web3')
@Controller('web3')
export class Web3Controller {
  constructor(private readonly web3Service: Web3Service) {}

  @Get('contracts')
  @ApiOperation({ summary: 'Get contract addresses' })
  getContractAddresses() {
    const addresses = this.web3Service.getContractAddresses();
    return {
      success: true,
      data: addresses,
    };
  }

  @Get('verify/:txHash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a blockchain transaction' })
  @ApiParam({ name: 'txHash', description: 'Transaction hash to verify' })
  async verifyTransaction(@Param('txHash') txHash: string) {
    const result = await this.web3Service.verifyTransaction(txHash);
    return {
      success: true,
      data: result,
    };
  }

  @Get('balance/:address')
  @ApiOperation({ summary: 'Get native token balance for address' })
  async getBalance(@Param('address') address: string) {
    const balance = await this.web3Service.getBalance(address);
    return {
      success: true,
      data: { address, balance },
    };
  }

  @Get('xp-balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get XP token balance for authenticated user' })
  async getXPBalance(@Request() req) {
    const walletAddress = req.user.walletAddress;
    if (!walletAddress) {
      return {
        success: true,
        data: { balance: '0', walletConnected: false },
      };
    }

    const balance = await this.web3Service.getXPBalance(walletAddress);
    return {
      success: true,
      data: { balance, walletAddress, walletConnected: true },
    };
  }
}
