import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
    constructor(@Inject('CACHE_MANAGER') private cacheManager: any) {}

    async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
        await this.cacheManager.set(key, value, options?.ttl);
    }

    async get(key: string): Promise<string | null> {
        return await this.cacheManager.get(key);
    }   

    async del(key: string): Promise<void> {
        await this.cacheManager.del(key);
    } 
}
