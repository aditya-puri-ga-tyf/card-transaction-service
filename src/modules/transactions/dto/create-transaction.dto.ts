import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { TransactionType } from '../../../types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Card ID to perform transaction on',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  cardId: string;

  @ApiProperty({
    description: 'Transaction amount (positive number)',
    example: 100.50,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Type of transaction',
    enum: TransactionType,
    example: TransactionType.CREDIT
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Monthly salary deposit',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
} 