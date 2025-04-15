import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Headers,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiSecurity,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ApiErrorResponse } from '../../types/api-response.types';
import { TransactionType, UserRole } from '../../types';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Roles } from '../../decorators/roles.decorator';

@ApiTags('transactions')
@ApiSecurity('x-user-id')
@Controller('transactions')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cardId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 100.50,
        type: 'CREDIT',
        status: 'APPROVED',
        description: 'Monthly salary deposit',
        updatedBalance: 1000.75,
        createdAt: '2024-01-20T12:34:56.789Z',
        updatedAt: '2024-01-20T12:34:56.789Z'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    type: ApiErrorResponse
  })
  @ApiUnauthorizedResponse({
    description: 'User not authorized',
    type: ApiErrorResponse
  })
  async createTransaction(
    @Headers('x-user-id') userId: string,
    @Body() data: CreateTransactionDto,
  ) {
    return this.transactionsService.createTransaction(
      data.cardId,
      userId,
      data.amount,
      data.type,
      data.description,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions for a card' })
  @ApiQuery({
    name: 'cardId',
    required: true,
    description: 'ID of the card to get transactions for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filter by transaction type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Filter by start date (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'Filter by end date (ISO string)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'List of transactions',
    type: [TransactionResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Card not found',
    type: ApiErrorResponse,
  })
  async getTransactions(
    @Headers('x-user-id') userId: string,
    @Query('cardId') cardId: string,
    @Query('type') type?: TransactionType,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.transactionsService.getTransactions(cardId, userId, {
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction details',
    type: TransactionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Transaction not found',
    type: ApiErrorResponse,
  })
  async getTransaction(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
  ) {
    return this.transactionsService.getTransaction(id, userId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update transaction status (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction status updated successfully',
    type: TransactionResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid status',
    type: ApiErrorResponse
  })
  @ApiNotFoundResponse({
    description: 'Transaction not found',
    type: ApiErrorResponse
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin privileges',
    type: ApiErrorResponse
  })
  async updateTransactionStatus(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTransactionStatusDto
  ) {
    return this.transactionsService.updateTransactionStatus(id, userId, updateStatusDto.status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Soft delete a transaction (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted successfully',
    type: TransactionResponseDto
  })
  @ApiNotFoundResponse({
    description: 'Transaction not found',
    type: ApiErrorResponse
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin privileges',
    type: ApiErrorResponse
  })
  async deleteTransaction(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string
  ) {
    return this.transactionsService.deleteTransaction(id, userId);
  }
}
