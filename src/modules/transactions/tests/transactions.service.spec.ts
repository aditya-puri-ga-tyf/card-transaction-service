import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from '../transactions.service';
import { TransactionsRepository } from '../transactions.repository';
import { PrismaService } from '../../../db/prisma.service';
import { TransactionType, TransactionStatus, UserRole } from '../../../types';
import { NotFoundError, ValidationError } from '../../../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: TransactionsRepository;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'user@test.com',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCard = {
    id: 'card-123',
    userId: 'user-123',
    balance: new Decimal(1000),
    reservedBalance: new Decimal(0),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTransaction = {
    id: 'transaction-123',
    cardId: 'card-123',
    userId: 'user-123',
    amount: new Decimal(100),
    type: TransactionType.CREDIT,
    status: TransactionStatus.PENDING,
    description: 'Test transaction',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: {
            findCard: jest.fn(),
            createTransaction: jest.fn(),
            updateCardReservedBalance: jest.fn(),
            findTransaction: jest.fn(),
            softDeleteTransaction: jest.fn(),
            updateTransactionStatus: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            card: {
              update: jest.fn(),
            },
            transaction: {
              update: jest.fn(),
            },
            $transaction: jest.fn(async (callback) => {
              return callback({
                card: { update: jest.fn().mockResolvedValue(mockCard) },
                transaction: { update: jest.fn().mockResolvedValue(mockTransaction) }
              });
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repository = module.get<TransactionsRepository>(TransactionsRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createTransaction', () => {
    it('should create a credit transaction successfully', async () => {
      jest.spyOn(repository, 'findCard').mockResolvedValue(mockCard);
      jest.spyOn(repository, 'createTransaction').mockResolvedValue(mockTransaction);

      const result = await service.createTransaction(
        'card-123',
        'user-123',
        100,
        TransactionType.CREDIT,
        'Test transaction'
      );

      expect(result).toEqual({
        transactionId: mockTransaction.id,
        status: mockTransaction.status,
        currentBalance: mockCard.balance.toNumber(),
        availableBalance: mockCard.balance.toNumber() - mockCard.reservedBalance.toNumber(),
        reservedAmount: 0,
        updatedBalance: mockCard.balance.toNumber() + 100,
      });
    });

    it('should throw error for inactive card', async () => {
      jest.spyOn(repository, 'findCard').mockResolvedValue({
        ...mockCard,
        isActive: false,
      });

      await expect(
        service.createTransaction(
          'card-123',
          'user-123',
          100,
          TransactionType.CREDIT,
          'Test transaction'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for insufficient balance on debit', async () => {
      jest.spyOn(repository, 'findCard').mockResolvedValue(mockCard);

      await expect(
        service.createTransaction(
          'card-123',
          'user-123',
          2000,
          TransactionType.DEBIT,
          'Test transaction'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should handle non-existent card', async () => {
      jest.spyOn(repository, 'findCard').mockResolvedValue(null);

      await expect(
        service.createTransaction(
          'non-existent-card',
          'user-123',
          100,
          TransactionType.CREDIT,
          'Test transaction'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle card belonging to different user', async () => {
      jest.spyOn(repository, 'findCard').mockResolvedValue({
        ...mockCard,
        userId: 'different-user',
      });

      await expect(
        service.createTransaction(
          'card-123',
          'user-123',
          100,
          TransactionType.CREDIT,
          'Test transaction'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should handle zero amount transaction', async () => {
      jest.spyOn(repository, 'findCard').mockResolvedValue(mockCard);

      await expect(
        service.createTransaction(
          'card-123',
          'user-123',
          0,
          TransactionType.CREDIT,
          'Test transaction'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should handle negative amount transaction', async () => {
      jest.spyOn(repository, 'findCard').mockResolvedValue(mockCard);

      await expect(
        service.createTransaction(
          'card-123',
          'user-123',
          -100,
          TransactionType.CREDIT,
          'Test transaction'
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction for owner', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'findTransaction').mockResolvedValue(mockTransaction);

      const result = await service.getTransaction('transaction-123', 'user-123');
      expect(result).toEqual(mockTransaction);
    });

    it('should return transaction for admin', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser);
      jest.spyOn(repository, 'findTransaction').mockResolvedValue(mockTransaction);

      const result = await service.getTransaction('transaction-123', 'admin-123');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw error for non-existent transaction', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'findTransaction').mockResolvedValue(null);

      await expect(
        service.getTransaction('non-existent', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.getTransaction('transaction-123', 'non-existent-user')
      ).rejects.toThrow(NotFoundError);
    });

    it('should not allow regular user to access other user\'s transaction', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'findTransaction').mockResolvedValue(null);
      
      await expect(
        service.getTransaction('transaction-123', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTransaction', () => {
    it('should allow admin to delete transaction', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser);
      jest.spyOn(repository, 'findTransaction').mockResolvedValue(mockTransaction);
      jest.spyOn(repository, 'softDeleteTransaction').mockResolvedValue(mockTransaction);

      await service.deleteTransaction('transaction-123', 'admin-123');
      expect(repository.softDeleteTransaction).toHaveBeenCalledWith('transaction-123');
    });

    it('should not allow regular user to delete transaction', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.deleteTransaction('transaction-123', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle non-existent transaction for deletion', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser);
      jest.spyOn(repository, 'findTransaction').mockResolvedValue(null);

      await expect(
        service.deleteTransaction('non-existent', 'admin-123')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should allow admin to update transaction status', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.APPROVED
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser);
      jest.spyOn(repository, 'findTransaction').mockResolvedValue(mockTransaction);
      jest.spyOn(repository, 'findCard').mockResolvedValue(mockCard);
      jest.spyOn(repository, 'updateTransactionStatus').mockResolvedValue(updatedTransaction);
      jest.spyOn(prisma, '$transaction').mockImplementation((callback: any) => 
        Promise.resolve(callback({
            
          transaction: {
            update: jest.fn().mockResolvedValue(updatedTransaction)
          },
          card: {
            update: jest.fn().mockResolvedValue(mockCard)
          }
        }))
      );

      const result = await service.updateTransactionStatus(
        'transaction-123',
        'admin-123',
        TransactionStatus.APPROVED
      );

      expect(result).toEqual(updatedTransaction);
    });

    it('should not allow regular user to update transaction status', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.updateTransactionStatus(
          'transaction-123',
          'user-123',
          TransactionStatus.APPROVED
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should refund an approved transaction', async () => {
      const approvedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.APPROVED
      };

      const refundedTransaction = {
        ...approvedTransaction,
        status: TransactionStatus.REFUNDED
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockAdminUser);
      jest.spyOn(repository, 'findTransaction').mockResolvedValue(approvedTransaction);
      jest.spyOn(repository, 'findCard').mockResolvedValue(mockCard);
      jest.spyOn(prisma, '$transaction').mockImplementation((callback: any) => 
        Promise.resolve(callback({
          transaction: {
            update: jest.fn().mockResolvedValue(refundedTransaction)
          },
          card: {
            update: jest.fn().mockResolvedValue(mockCard)
          }
        }))
      );

      const result = await service.updateTransactionStatus(
        'transaction-123',
        'admin-123',
        TransactionStatus.REFUNDED
      );

      expect(result).toEqual(refundedTransaction);
    });
  });
}); 