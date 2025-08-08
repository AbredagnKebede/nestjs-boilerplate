import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtBlacklistService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async blacklistToken(token: string): Promise<void> {
    try {
      // Decode token to get expiration
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded?.exp) {
        return;
      }

      // Calculate TTL (time until expiration)
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl > 0) {
        // Store token in blacklist with TTL
        await this.cacheManager.set(
          `blacklist:${token}`, 
          'true', 
          ttl * 1000 // Convert to milliseconds
        );
      }
    } catch (error) {
      // If token is invalid, we don't need to blacklist it
      console.error('Error blacklisting token:', error.message);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.cacheManager.get(`blacklist:${token}`);
      return !!result;
    } catch (error) {
      console.error('Error checking blacklist:', error.message);
      return false;
    }
  }

  async blacklistAllUserTokens(userId: string): Promise<void> {
    // Store user in global blacklist with long TTL
    const accessTokenTtl = this.parseDuration(
      this.configService.get('JWT_EXPIRES_IN') || '15m'
    );
    
    await this.cacheManager.set(
      `user_blacklist:${userId}`,
      Date.now().toString(),
      accessTokenTtl
    );
  }

  async isUserBlacklisted(userId: string, tokenIssuedAt: number): Promise<boolean> {
    try {
      const blacklistTimestamp = await this.cacheManager.get(`user_blacklist:${userId}`);
      if (!blacklistTimestamp) {
        return false;
      }
      
      // If token was issued before blacklist timestamp, it's invalid
      return tokenIssuedAt < parseInt(blacklistTimestamp as string);
    } catch (error) {
      console.error('Error checking user blacklist:', error.message);
      return false;
    }
  }

  private parseDuration(duration: string): number {
    const regex = /^(\d+)([smhd])$/;
    const match = duration.match(regex);
    
    if (!match) {
      return 15 * 60 * 1000; // Default 15 minutes
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }
}