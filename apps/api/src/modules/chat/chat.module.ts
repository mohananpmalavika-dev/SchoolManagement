import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DatabaseModule } from '../../database/database.module';
import { StorageService } from '../../common/services/storage.service';
import { CollaborationService } from './collaboration.service';
import { CollaborationController } from './collaboration.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ChatController,CollaborationController],
  providers: [ChatService, StorageService,CollaborationService],
  exports: [ChatService],
})
export class ChatModule {}
