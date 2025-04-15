import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponse {
  @ApiProperty({ example: 'ValidationError' })
  error: string;

  @ApiProperty({ example: 'Invalid input data' })
  message: string;

  @ApiProperty({
    example: {
      field: 'amount',
      expected: '<= 2000',
      received: 3000
    }
  })
  details?: Record<string, any>;

  @ApiProperty({ example: '2024-01-20T12:34:56.789Z' })
  timestamp: string;
} 