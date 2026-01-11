import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; name: string; walletAddress?: string };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the current user profile' })
  async getProfile(@Request() req: RequestWithUser) {
    return {
      success: true,
      data: req.user,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Request() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.id, updateUserDto);
    return {
      success: true,
      data: user,
    };
  }

  @Patch('me/wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link wallet address to account' })
  async updateWallet(
    @Request() req: RequestWithUser,
    @Body() body: { walletAddress: string; signature: string; message: string },
  ) {
    // TODO: Verify signature before updating
    const user = await this.usersService.updateWalletAddress(
      req.user.id,
      body.walletAddress,
    );
    return {
      success: true,
      data: user,
    };
  }
}
