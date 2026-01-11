import { IsString, IsNotEmpty, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseMachineDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Machine plan ID to purchase',
  })
  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    example: '0x1234567890abcdef...',
    description: 'USDT payment transaction hash',
  })
  @IsString()
  @Length(66, 66, { message: 'Transaction hash must be 66 characters' })
  txHash: string;
}
