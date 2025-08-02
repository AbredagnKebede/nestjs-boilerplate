import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const userAgent = req.headers['user-agent'] || '';
    const { ip, method, originalUrl } = req;
    
    // Add request ID to the request object
    req.id = requestId as string;
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);
    
    // Log the request
    this.logger.log(
      `${method} ${originalUrl} - ${ip} - ${userAgent} - RequestID: ${requestId}`,
    );
    
    // Log the response time when the response is finished
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      
      this.logger.log(
        `${method} ${originalUrl} - ${statusCode} - ${contentLength} - RequestID: ${requestId}`,
      );
    });
    
    next();
  }
}