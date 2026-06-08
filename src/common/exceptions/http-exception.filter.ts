import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionResponse {
  message?: string;
  details?: unknown;
}

interface ErrorDetails {
  statusCode: number;
  path?: string;
  timestamp?: string;
  details?: unknown;
  originalError?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? typeof exception.getResponse() === 'string'
          ? { message: exception.getResponse() as string }
          : (exception.getResponse() as ExceptionResponse)
        : null;

    let message = 'Something went wrong.';
    let errorDetails: ErrorDetails | null = null;

    // Log unexpected errors or internal server errors to the server console/terminal with stack trace
    if (status >= 500 || !(exception instanceof HttpException)) {
      this.logger.error(
        `${request.method} ${request.url} - Error: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (exceptionResponse && exceptionResponse.details) {
      // Validation error structure
      message = exceptionResponse.message || 'Validation failed.';
      errorDetails = {
        statusCode: status,
        details: exceptionResponse.details,
      };
    } else {
      // Generic error structure
      message =
        exception instanceof HttpException
          ? exceptionResponse?.message || exception.message
          : 'Something went wrong.';

      errorDetails = {
        statusCode: status,
        path: request.url,
        timestamp: new Date().toISOString(),
      };

      // Expose the original error details and stack trace in non-production environments
      if (process.env.NODE_ENV !== 'production') {
        errorDetails.originalError =
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack?.split('\n'), // formatted for better readability in JSON
              }
            : exception;
      }
    }

    response.status(status).json({
      success: false,
      message,
      error: errorDetails,
    });
  }
}
