import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const { method, url, ip, userAgent } = request;
    const userId = (request as any).user?.id || 'anonymous';

    this.logger.log(
      `Request: ${method} ${url} - IP: ${ip} - User: ${userId} - User-Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        this.logger.log(
          `Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - User: ${userId}`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        
        this.logger.error(
          `Error: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - User: ${userId} - Error: ${error.message}`,
        );
        
        throw error;
      }),
    );
  }
}
