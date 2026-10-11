import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Use the Redis type from Bull's ioredis dependency
type Redis = any;

/**
 * Redis Service
 * 
 * Provides Redis client for caching and temporary data storage.
 * Used for:
 * - Account lockout tracking
 * - Rate limiting
 * - Session management
 * - Temporary token storage
 * 
 * Note: This service lazily imports ioredis from Bull's dependencies
 * to avoid adding it as a direct dependency.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private Redis: any;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Redis client (lazy loading)
   */
  private async initClient(): Promise<Redis> {
    if (this.client) {
      return this.client;
    }

    try {
      // Import ioredis from Bull's dependencies
      const ioredis = await import('ioredis');
      this.Redis = ioredis.default || ioredis;

      const redisConfig = {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      };

      this.client = new this.Redis(redisConfig);

      this.client.on('connect', () => {
        this.logger.log('Redis client connected');
      });

      this.client.on('error', (error: Error) => {
        this.logger.error('Redis client error', error);
      });

      this.client.on('close', () => {
        this.logger.warn('Redis client connection closed');
      });

      return this.client;
    } catch (error: any) {
      this.logger.error('Failed to initialize Redis client', error);
      throw new Error('Redis initialization failed. Ensure Bull queue is configured correctly.');
    }
  }

  /**
   * Get Redis client instance
   */
  async getClient(): Promise<Redis> {
    return await this.initClient();
  }

  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = await this.initClient();
    if (ttlSeconds) {
      await client.set(key, value, 'EX', ttlSeconds);
    } else {
      await client.set(key, value);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const client = await this.initClient();
    return await client.get(key);
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    const client = await this.initClient();
    return await client.del(key);
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const client = await this.initClient();
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    return await client.del(...keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = await this.initClient();
    const result = await client.exists(key);
    return result === 1;
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    const client = await this.initClient();
    return await client.incr(key);
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    const client = await this.initClient();
    return await client.decr(key);
  }

  /**
   * Set expiry on an existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const client = await this.initClient();
    const result = await client.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    const client = await this.initClient();
    return await client.ttl(key);
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const client = await this.initClient();
    return await client.keys(pattern);
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis client disconnected');
    }
  }
}
