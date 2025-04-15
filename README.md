# Transaction Management API

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL
- npm or yarn

### Installation Steps

1. Clone the repository

bash
git clone <repository-url>
cd transaction-management-api

2. Install dependencies
```bash
npm install
```

3. Environment Setup
```bash
# Copy example env file
cp .env.example .env

# Update .env with your database credentials
DATABASE_URL="mysql://root:root@localhost:3306/transaction_db"
```

4. Database Setup
```bash
# Run Prisma migrations
npx prisma migrate dev

# Seed the database with test data
npm run seed
```

5. Start the application
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

### Authentication
All endpoints require `x-user-id` header for user identification.

### Endpoints

#### 1. Create Transaction
```http
POST /api/transactions
```
**Headers:**
- x-user-id: string (required)

**Request Body:**
```json
{
  "cardId": "uuid",
  "amount": 100.50,
  "type": "CREDIT" | "DEBIT",
  "description": "Transaction description"
}
```
**Response:** (201 Created)
```json
{
  "id": "uuid",
  "cardId": "uuid",
  "userId": "uuid",
  "amount": 100.50,
  "type": "CREDIT",
  "status": "PENDING",
  "description": "Transaction description",
  "createdAt": "2024-01-20T12:34:56.789Z",
  "updatedAt": "2024-01-20T12:34:56.789Z"
}
```

#### 2. Get Transaction
```http
GET /api/transactions/:id
```
**Headers:**
- x-user-id: string (required)

**Response:** (200 OK)
```json
{
  "id": "uuid",
  "cardId": "uuid",
  "userId": "uuid",
  "amount": 100.50,
  "type": "CREDIT",
  "status": "PENDING",
  "description": "Transaction description",
  "createdAt": "2024-01-20T12:34:56.789Z",
  "updatedAt": "2024-01-20T12:34:56.789Z"
}
```

#### 3. Update Transaction Status (Admin Only)
```http
PATCH /api/transactions/:id/status
```
**Headers:**
- x-user-id: string (required, must be admin)

**Request Body:**
```json
{
  "status": "PENDING" | "APPROVED" | "FAILED" | "REFUNDED"
}
```
**Response:** (200 OK)
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "// ... other transaction fields"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error description"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User not authorized"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### Transaction Status Flow
- CREDIT transactions: PENDING → APPROVED
- DEBIT transactions: PENDING → APPROVED/FAILED
- APPROVED transactions can be REFUNDED

### Business Rules
1. DEBIT transactions require sufficient balance
2. Only admins can update transaction status
3. Users can only access their own transactions
4. Card balance is updated automatically based on transaction status

## Testing

Run the test suite:
```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License
[MIT License](LICENSE)