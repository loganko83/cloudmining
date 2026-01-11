import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplyDto {
  @ApiProperty({
    example: '1000.00000000',
    description: 'Amount of XP to supply',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({
    example: '0x1234...',
    description: 'Transaction hash for on-chain verification',
  })
  @IsString()
  @IsOptional()
  txHash?: string;
}

export class WithdrawDto {
  @ApiProperty({
    example: '500.00000000',
    description: 'Amount of XP to withdraw',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;
}

export class BorrowDto {
  @ApiProperty({
    example: '750.00000000',
    description: 'Amount of XP to borrow',
  })
  @IsString()
  @IsNotEmpty()
  borrowAmount: string;

  @ApiProperty({
    example: '1000.00000000',
    description: 'Amount of collateral to provide',
  })
  @IsString()
  @IsNotEmpty()
  collateralAmount: string;

  @ApiPropertyOptional({
    example: 'XP',
    description: 'Collateral asset type',
  })
  @IsString()
  @IsOptional()
  collateralAsset?: string;
}

export class RepayDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Borrow position ID to repay',
  })
  @IsUUID()
  @IsNotEmpty()
  positionId: string;

  @ApiProperty({
    example: '500.00000000',
    description: 'Amount of XP to repay',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;
}
