import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

@Module({
  imports: [ConfigModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, PrismaService, TenantService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
