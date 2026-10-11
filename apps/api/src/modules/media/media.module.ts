import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { DatabaseModule } from '../../database/database.module';
import { StorageService } from '../../common/services/storage.service';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      storage: {
        _handleFile(req: any, file: any, cb: (error: Error | null, info?: any) => void) {
          // Store in memory for processing
          const chunks: Buffer[] = [];
          file.stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          file.stream.on('end', () => {
            (file as any).buffer = Buffer.concat(chunks);
            cb(null, {
              buffer: (file as any).buffer,
              size: (file as any).buffer.length,
            });
          });
          file.stream.on('error', cb);
        },
        _removeFile(req: any, file: any, cb: (error: Error | null) => void) {
          delete (file as any).buffer;
          cb(null);
        },
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, StorageService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
