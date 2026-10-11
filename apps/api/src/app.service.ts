import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Krypton School ERP API',
      version: '1.0.0',
    };
  }

  async getDetailedHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Krypton School ERP API',
      version: '1.0.0',
      checks: {
        database: 'unknown',
      },
    };

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.checks.database = 'healthy';
    } catch (error) {
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }

    return health;
  }
}
