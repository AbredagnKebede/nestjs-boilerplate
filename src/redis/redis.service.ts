import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    try {
      await this.set('test-key', 'redis-working', { ttl: 60 });
      const value = await this.get('test-key');
      if (value === 'redis-working') {
        this.logger.log('✅ Successfully connected to Redis!');
      } else {
        this.logger.error('❌ Redis test failed: value mismatch');
      }
    } catch (err) {
      this.logger.error('❌ Redis test failed: ', err);
    }
  }

  async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
    await (this.cacheManager as any).set(key, value, { ttl: options?.ttl }); 
  }

  async get(key: string): Promise<string | null> {
    const value = await this.cacheManager.get<string>(key);
    return value ?? null;
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
