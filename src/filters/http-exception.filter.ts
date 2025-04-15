import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError, NotFoundError } from '../utils/errors';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = exception.name;
    let message = exception.message;
    let details = undefined;

    // Handle custom errors
    if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      details = exception.details;
    } else if (exception instanceof NotFoundError) {
      status = HttpStatus.NOT_FOUND;
    }

    // Log unexpected errors
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Unexpected error:', exception);
    }

    response.status(status).json({
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
} 