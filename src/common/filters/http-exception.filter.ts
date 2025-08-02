import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors = null;
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      // Handle class-validator errors
      if (Array.isArray(exceptionResponse.message)) {
        message = 'Validation failed';
        errors = exceptionResponse.message;
      } else if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || message;
        errors = exceptionResponse.errors || null;
      } else {
        message = exceptionResponse || message;
      }
    } else if (exception.name === 'QueryFailedError') {
      // Handle database errors
      status = HttpStatus.BAD_REQUEST;
      message = 'Database query failed';
      
      // Unique constraint violation
      if (exception.code === '23505') {
        message = 'Duplicate entry';
      }
    }
    
    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception.stack,
    );
    
    // Send the error response
    response.status(status).json({
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.id,
    });
  }
}