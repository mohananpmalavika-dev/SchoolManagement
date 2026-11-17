import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { RedisService } from './common/services/redis.service';
@Injectable()
export class AppService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}
  getHealth() {
    return {status:'ok', timestamp:new Date().toISOString(), service:'Krypton School ERP API', version:'1.0.0'};
  }
  private async bounded<T>(operation: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([operation, new Promise<never>((_resolve,reject) => {timer=setTimeout(()=>reject(new Error('Health check timed out')),3000);})]);
    } finally { if (timer) clearTimeout(timer); }
  }
  async getDetailedHealth() {
    const results = await Promise.allSettled([
      this.bounded(this.prisma.$queryRawUnsafe('SELECT 1')),
      this.bounded(this.redis.ping()),
    ]);
    const checks = {
      database: results[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      redis: results[1].status === 'fulfilled' && results[1].value === 'PONG' ? 'healthy' : 'unhealthy',
    };
    if (Object.values(checks).some(status => status !== 'healthy')) throw new ServiceUnavailableException('A required service is unavailable');
    return {...this.getHealth(), checks};
  }
}
