import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [ConfigModule, WhatsAppModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService, WhatsAppModule],
})
export class CommunicationsModule {}
