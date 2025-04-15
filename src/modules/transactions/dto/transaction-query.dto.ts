import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TransactionType } from '../../../types';

export class TransactionQueryDto {
  @IsString()
  cardId: string;

  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;
} 