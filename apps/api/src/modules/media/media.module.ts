import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      storage: {
        _handleFile(req, file, cb) {
          // Store in memory for processing
          const chunks: Buffer[] = [];
          file.stream.on('data', (chunk) => chunks.push(chunk));
          file.stream.on('end', () => {
            (file as any).buffer = Buffer.concat(chunks);
            cb(null, {
              buffer: (file as any).buffer,
              size: (file as any).buffer.length,
            });
          });
          file.stream.on('error', cb);
        },
        _removeFile(req, file, cb) {
          delete (file as any).buffer;
          cb(null);
        },
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
