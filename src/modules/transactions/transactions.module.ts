import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsRepository } from './transactions.repository';
import { RolesGuard } from '../../guards/roles.guard';

@Module({
  controllers: [TransactionsController],
  providers: [
    TransactionsService, 
    TransactionsRepository,
    RolesGuard
  ],
})
export class TransactionsModule {}
