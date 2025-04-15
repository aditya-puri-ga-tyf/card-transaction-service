import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../../../types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTransactionStatusDto {
  @ApiProperty({
    description: 'New status for the transaction',
    enum: TransactionStatus,
    example: TransactionStatus.APPROVED,
    examples: {
      APPROVED: {
        value: TransactionStatus.APPROVED,
        description: 'Transaction is approved and completed'
      },
      FAILED: {
        value: TransactionStatus.FAILED,
        description: 'Transaction has failed'
      },
      PENDING: {
        value: TransactionStatus.PENDING,
        description: 'Transaction is pending processing'
      },
      REFUNDED: {
        value: TransactionStatus.REFUNDED,
        description: 'Transaction has been refunded'
      }
    }
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
} 