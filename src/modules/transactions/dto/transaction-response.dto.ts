import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, TransactionStatus } from '../../../types';

export class TransactionResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  cardId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string;

  @ApiProperty({
    example: 100.50
  })
  amount: number;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.CREDIT
  })
  type: TransactionType;

  @ApiProperty({
    enum: TransactionStatus,
    example: TransactionStatus.APPROVED
  })
  status: TransactionStatus;

  @ApiProperty({
    example: 'Monthly salary deposit'
  })
  description: string;

  @ApiProperty({
    example: 1000.75,
    description: 'Updated card balance after transaction'
  })
  updatedBalance: number;

  @ApiProperty({
    example: '2024-01-20T12:34:56.789Z'
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-20T12:34:56.789Z'
  })
  updatedAt: Date;
} 