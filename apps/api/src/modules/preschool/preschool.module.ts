import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AIProviderService } from '../teacher-ai/ai-provider.service';
import { PreschoolAccessService } from './preschool-access.service';
import { PreschoolService } from './preschool.service';
import { PreschoolContentService } from './preschool-content.service';
import { PreschoolController } from './preschool.controller';
import { ClassroomCameraService } from './classroom-camera.service';
import { PreschoolMediaService } from './preschool-media.service';
import { StorageService } from '../../common/services/storage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PreschoolController],
  providers: [
    PreschoolAccessService,
    PreschoolService,
    PreschoolContentService,
    ClassroomCameraService,
    PreschoolMediaService,
    StorageService,
    AIProviderService,
  ],
})
export class PreschoolModule {}
