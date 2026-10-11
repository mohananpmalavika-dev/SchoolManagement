import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@krypton/database';
import { createTenantFilterMiddleware } from '@krypton/database';
import { TenantService } from './tenant.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private tenantService: TenantService) {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Set up tenant filtering middleware
    this.$use(
      createTenantFilterMiddleware(() => {
        return this.tenantService.getTenantId();
      })
    );

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore
      this.$on('query' as never, (e: { query: string; duration: number }) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error: any) {
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Execute query without tenant filter (for platform admin operations)
   */
  async executeWithoutTenantFilter<T>(operation: () => Promise<T>): Promise<T> {
    const currentTenantId = this.tenantService.getTenantId();
    
    try {
      // Temporarily clear tenant context
      this.tenantService.setTenantId(null);
      return await operation();
    } finally {
      // Restore tenant context
      this.tenantService.setTenantId(currentTenantId);
    }
  }
}
