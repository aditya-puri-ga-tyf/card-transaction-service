import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { Decimal } from 'decimal.js';
import { TransactionStatus, TransactionType } from '../../types';

@Injectable()
export class TransactionsRepository {
  constructor(private prisma: PrismaService) {}

  async createTransaction(
    data: {
      cardId: string;
      userId: string;
      amount: number;
      type: TransactionType;
      description?: string;
    }
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: new Decimal(data.amount),
          type: data.type,
          description: data.description,
          cardId: data.cardId,
          userId: data.userId,
        }
      });

      return transaction;
    });
  }

  async findCard(cardId: string) {
    return await this.prisma.card.findUnique({
      where: { id: cardId }
    });
  }

  async updateCardBalance(cardId: string, balance: number) {
    return this.prisma.card.update({
      where: { id: cardId },
      data: { balance: new Decimal(balance) }
    });
  }

  async findTransactions(params: {
    cardId: string;
    userId: string;
    startDate?: Date;
    endDate?: Date;
    type?: TransactionType;
  }) {
    return this.prisma.transaction.findMany({
      where: {
        cardId: params.cardId,
        userId: params.userId,
        deletedAt: null,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
        type: params.type,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findTransaction(transactionId: string, userId: string) {
    return this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        deletedAt: null
      }
    });
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus
  ) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });
  }

  async softDeleteTransaction(transactionId: string) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { deletedAt: new Date() }
    });
  }

  async updateCardReservedBalance(cardId: string, reservedBalance: number) {
    return this.prisma.card.update({
      where: { id: cardId },
      data: { reservedBalance: new Decimal(reservedBalance) }
    });
  }
} 