import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get the exception response
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message:
              exception instanceof Error ? exception.message : 'Unknown error',
          };

    // Extract message content
    const messageContent =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in (exceptionResponse as any)
        ? (exceptionResponse as any).message
        : exceptionResponse;

    const isArray = Array.isArray(messageContent);
    const message = isArray ? messageContent[0] : messageContent;

    // Safely resolve the error name from unknown exception type
    const errorName =
      exception instanceof Error
        ? exception.constructor.name
        : typeof exception === 'object' && exception !== null
          ? (Object.getPrototypeOf(exception)?.constructor?.name ??
            'UnknownError')
          : 'UnknownError';

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorCode: (HttpStatus[status] || 'INTERNAL_SERVER_ERROR')
        .toString()
        .toUpperCase(),
      message: message,
      error: errorName,
    };

    response.status(status).json(errorResponse);
  }
}
