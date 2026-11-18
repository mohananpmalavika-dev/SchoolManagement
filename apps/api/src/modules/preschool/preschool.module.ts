import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AIProviderService } from '../teacher-ai/ai-provider.service';
import { PreschoolAccessService } from './preschool-access.service';
import { PreschoolService } from './preschool.service';
import { PreschoolContentService } from './preschool-content.service';
import { PreschoolController } from './preschool.controller';
import { ClassroomCameraService } from './classroom-camera.service';
import { PreschoolMediaService } from './preschool-media.service';
import { PreschoolPickupService } from './preschool-pickup.service';
import { StorageService } from '../../common/services/storage.service';
import { EmailService } from '../../common/services/email.service';
import { WhatsAppService } from '../communications/whatsapp/whatsapp.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PreschoolController],
  providers: [
    PreschoolAccessService,
    PreschoolPickupService,
    PreschoolService,
    PreschoolContentService,
    ClassroomCameraService,
    PreschoolMediaService,
    StorageService,
    EmailService,
    WhatsAppService,
    AIProviderService,
  ],
})
export class PreschoolModule {}
