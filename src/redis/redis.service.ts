import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
    await this.cacheManager.set(key, value, options?.ttl);
  }

  async get(key: string): Promise<string | null> {
    const value = await this.cacheManager.get<string>(key); 
    return value ?? null;
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
