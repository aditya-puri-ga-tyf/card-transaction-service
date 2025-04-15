import { PrismaClient } from '@prisma/client';
import { UserRole, TransactionType, TransactionStatus } from '../../../types';

const prisma = new PrismaClient();

async function main() {
  // Cleanup existing data
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const admin = await prisma.user.create({
    data: {
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const user = await prisma.user.create({
    data: {
      role: UserRole.USER,
      isActive: true,
    },
  });

  // Create cards
  const adminCard = await prisma.card.create({
    data: {
      userId: admin.id,
      balance: 5000.00,
      reservedBalance: 0,
      isActive: true,
    },
  });

  const userCard = await prisma.card.create({
    data: {
      userId: user.id,
      balance: 1000.00,
      reservedBalance: 0,
      isActive: true,
    },
  });

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        type: TransactionType.CREDIT,
        status: TransactionStatus.APPROVED,
        amount: 5000.00,
        description: 'Initial deposit',
        cardId: adminCard.id,
        userId: admin.id,
      },
      {
        type: TransactionType.DEBIT,
        status: TransactionStatus.APPROVED,
        amount: 100.00,
        description: 'Purchase at Store',
        cardId: adminCard.id,
        userId: admin.id,
      },
      {
        type: TransactionType.DEBIT,
        status: TransactionStatus.PENDING,
        amount: 50.00,
        description: 'Pending transaction',
        cardId: adminCard.id,
        userId: admin.id,
      },
      {
        type: TransactionType.CREDIT,
        status: TransactionStatus.APPROVED,
        amount: 1000.00,
        description: 'Initial deposit',
        cardId: userCard.id,
        userId: user.id,
      },
      {
        type: TransactionType.DEBIT,
        status: TransactionStatus.FAILED,
        amount: 2000.00,
        description: 'Failed transaction - insufficient funds',
        cardId: userCard.id,
        userId: user.id,
      },
    ],
  });

  console.log('\nSeeded test data successfully!');
  console.log('----------------------------------------');
  console.log('Test Data for API Usage:');
  console.log('Admin User ID:', admin.id);
  console.log('Regular User ID:', user.id);
  console.log('Admin Card ID:', adminCard.id);
  console.log('User Card ID:', userCard.id);
  console.log('----------------------------------------');
  console.log('Example API calls:');
  console.log(`
GET /api/transactions?cardId=${adminCard.id}
Headers: x-user-id: ${admin.id}

POST /api/transactions
Headers: x-user-id: ${user.id}
Body: {
  "cardId": "${userCard.id}",
  "amount": 100,
  "type": "DEBIT",
  "description": "Test transaction"
}
  `);
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });