import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StakeDto {
  @ApiProperty({
    example: '1000.00000000',
    description: 'Amount of XP to stake',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;
}
