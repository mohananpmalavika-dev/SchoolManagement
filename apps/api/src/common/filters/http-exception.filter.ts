import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : exception?.code === 'P2002' ? HttpStatus.CONFLICT : exception?.code === 'P2003' ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : exception?.code === 'P2002' ? 'A record with this reference already exists' : exception?.code === 'P2003' ? 'A referenced record is unavailable' : 'The request could not be completed';

    const errorResponse = {
      success: false,
      message: this.getErrorMessage(exceptionResponse),
      error: {
        code: this.getErrorCode(status),
        message: this.getErrorMessage(exceptionResponse),
        details: this.getErrorDetails(exceptionResponse),
      },
      timestamp: new Date().toISOString(),
      path: request.path,
    };

    // Log error
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.path}`,
        exception.stack,
        'HttpExceptionFilter'
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.path} - ${status}`,
        'HttpExceptionFilter'
      );
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  private getErrorMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exceptionResponse.message) {
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message[0];
      }
      return exceptionResponse.message;
    }

    return 'An error occurred';
  }

  private getErrorDetails(exceptionResponse: any): any[] | undefined {
    if (typeof exceptionResponse === 'object' && exceptionResponse.message) {
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message.map((msg: string) => ({
          message: msg,
        }));
      }
    }

    return undefined;
  }
}
