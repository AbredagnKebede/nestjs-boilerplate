import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected getTracker(req: Request): string {
    // Use IP address and user agent for rate limiting
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}-${userAgent}`;
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.connection.remoteAddress;
    
    // Allow whitelisted IPs
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    if (whitelistedIPs.includes(ip)) {
      return true;
    }

    return super.handleRequest(context, limit, ttl);
  }
}
