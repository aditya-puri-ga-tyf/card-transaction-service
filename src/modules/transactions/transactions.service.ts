import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionType, TransactionStatus } from '../../types';
import { TransactionsRepository } from './transactions.repository';
import { PrismaService } from '../../db/prisma.service';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { UserRole } from '../../types';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly prisma: PrismaService
  ) {}

  async createTransaction(
    cardId: string,
    userId: string,
    amount: number,
    type: TransactionType,
    description?: string
  ) {
    console.log('createTransaction', cardId, userId, amount, type, description);
    // Validate card
    const card = await this.transactionsRepository.findCard(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }
    if (!card.isActive) {
      throw new ValidationError('Card is inactive');
    }
    if (card.userId !== userId) {
      throw new ValidationError('Card does not belong to user');
    }

    // Validate amount
    if (amount <= 0) {
      throw new ValidationError('Invalid transaction amount', {
        field: 'amount',
        expected: '> 0',
        received: amount
      });
    }

    // For DEBIT transactions, check both current balance and pending transactions
    if (type === TransactionType.DEBIT) {
      const availableBalance = card.balance.toNumber() - card.reservedBalance.toNumber();
      if (availableBalance < amount) {
        throw new ValidationError('Insufficient balance for debit transaction', {
          field: 'amount',
          expected: `<= ${availableBalance}`,
          received: amount,
          details: {
            totalBalance: card.balance.toNumber(),
            reservedAmount: card.reservedBalance.toNumber(),
            availableBalance: availableBalance
          }
        });
      }
    }

    // Create transaction in PENDING status
    const transaction = await this.transactionsRepository.createTransaction({
      cardId,
      userId,
      amount,
      type,
      description
    });

    // For DEBIT transactions, reserve the amount
    if (type === TransactionType.DEBIT) {
      await this.transactionsRepository.updateCardReservedBalance(
        cardId, 
        card.reservedBalance.toNumber() + amount
      );
    }

    // Calculate the updated balance based on transaction type
    const updatedBalance = type === TransactionType.CREDIT 
      ? card.balance.toNumber() + amount 
      : card.balance.toNumber();

    return {
      transactionId: transaction.id,
      status: transaction.status,
      currentBalance: card.balance.toNumber(),
      availableBalance: card.balance.toNumber() - card.reservedBalance.toNumber(),
      reservedAmount: type === TransactionType.DEBIT ? amount : 0,
      updatedBalance: updatedBalance
    };
  }

  async getTransactions(
    cardId: string,
    userId: string,
    query: {
      startDate?: Date;
      endDate?: Date;
      type?: TransactionType;
    }
  ) {
    return this.transactionsRepository.findTransactions({
      cardId,
      userId,
      startDate: query.startDate,
      endDate: query.endDate,
      type: query.type
    });
  }

  async getTransaction(transactionId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const transaction = await this.transactionsRepository.findTransaction(
      transactionId,
      user.role === UserRole.ADMIN ? undefined : userId  // Skip userId check for admin
    );

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    return transaction;
  }

  async updateTransactionStatus(
    transactionId: string,
    userId: string,
    newStatus: TransactionStatus
  ) {
    const transaction = await this.getTransaction(transactionId, userId);
    const card = await this.transactionsRepository.findCard(transaction.cardId);

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const allowedStatusUpdates = {
      [TransactionStatus.PENDING]: [
        TransactionStatus.APPROVED,
        TransactionStatus.FAILED
      ],
      [TransactionStatus.APPROVED]: [TransactionStatus.REFUNDED]
    };

    const allowedStatuses = allowedStatusUpdates[transaction.status];
    if (!allowedStatuses?.includes(newStatus)) {
      throw new ValidationError('Invalid status transition', {
        field: 'status',
        expected: allowedStatuses?.join(' or '),
        received: newStatus,
        currentStatus: transaction.status
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: newStatus }
      });

      if (transaction.type === TransactionType.DEBIT) {
        switch (newStatus) {
          case TransactionStatus.APPROVED:
            // Release reserved amount and deduct from actual balance
            await tx.card.update({
              where: { id: card.id },
              data: {
                balance: card.balance.minus(transaction.amount),
                reservedBalance: card.reservedBalance.minus(transaction.amount)
              }
            });
            break;
          case TransactionStatus.FAILED:
            // Just release the reserved amount
            await tx.card.update({
              where: { id: card.id },
              data: {
                reservedBalance: card.reservedBalance.minus(transaction.amount)
              }
            });
            break;
          case TransactionStatus.REFUNDED:
            // Add the amount back to balance
            await tx.card.update({
              where: { id: card.id },
              data: {
                balance: card.balance.plus(transaction.amount)
              }
            });
            break;
        }
      } else if (transaction.type === TransactionType.CREDIT) {
        switch (newStatus) {
          case TransactionStatus.APPROVED:
            // Add to balance
            await tx.card.update({
              where: { id: card.id },
              data: {
                balance: card.balance.plus(transaction.amount)
              }
            });
            break;
          case TransactionStatus.REFUNDED:
            // Deduct from balance
            await tx.card.update({
              where: { id: card.id },
              data: {
                balance: card.balance.minus(transaction.amount)
              }
            });
            break;
        }
      }

      return updatedTransaction;
    });
  }

  async deleteTransaction(transactionId: string, userId: string) {
    const transaction = await this.getTransaction(transactionId, userId);

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Only pending transactions can be deleted');
    }

    await this.transactionsRepository.softDeleteTransaction(transactionId);
  }
} 