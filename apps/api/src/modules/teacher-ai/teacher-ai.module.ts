import { Module } from '@nestjs/common';
import { ExaminationsModule } from '../examinations/examinations.module';
import { PredictiveAnalyticsModule } from '../predictive-analytics/predictive-analytics.module';
import { AIProviderService } from './ai-provider.service';
import { TeacherAIController } from './teacher-ai.controller';
import { TeacherAIService } from './teacher-ai.service';

@Module({ imports: [ExaminationsModule, PredictiveAnalyticsModule], controllers: [TeacherAIController], providers: [AIProviderService, TeacherAIService] })
export class TeacherAIModule {}
