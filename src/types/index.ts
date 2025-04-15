export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
}

export interface Card {
  id: string;
  userId: string;
  balance: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  cardId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface TransactionQuery {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
} 