import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DatabaseModule } from '../../database/database.module';
import { StorageService } from '../../common/services/storage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ChatController],
  providers: [ChatService, StorageService],
  exports: [ChatService],
})
export class ChatModule {}
