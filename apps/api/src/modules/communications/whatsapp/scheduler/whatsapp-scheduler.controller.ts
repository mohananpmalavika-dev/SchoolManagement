import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsAppSchedulerService } from './whatsapp-scheduler.service';
import { ScheduleJobDto } from './dto/schedule-job.dto';

@ApiTags('WhatsApp - Scheduler')
@Controller('whatsapp/scheduler')
export class WhatsAppSchedulerController {
  constructor(
    private readonly schedulerService: WhatsAppSchedulerService,
  ) {}

  @Post('schedule/fee-reminders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule fee reminders job' })
  @ApiResponse({
    status: 200,
    description: 'Job scheduled successfully',
    schema: {
      example: {
        jobId: '12345',
        message: 'Fee reminders job scheduled successfully',
      },
    },
  })
  async scheduleFeeReminders(@Body() dto: ScheduleJobDto) {
    const jobId = await this.schedulerService.scheduleFeeReminders(
      dto.payload,
      {
        delay: dto.delayMinutes ? dto.delayMinutes * 60 * 1000 : undefined,
        priority: dto.priority,
        language: dto.language,
      },
    );

    return {
      jobId,
      message: 'Fee reminders job scheduled successfully',
    };
  }

  @Post('schedule/attendance-alerts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule attendance alerts job' })
  @ApiResponse({
    status: 200,
    description: 'Job scheduled successfully',
  })
  async scheduleAttendanceAlerts(@Body() dto: ScheduleJobDto) {
    const jobId = await this.schedulerService.scheduleAttendanceAlerts(
      dto.payload,
      {
        delay: dto.delayMinutes ? dto.delayMinutes * 60 * 1000 : undefined,
        priority: dto.priority,
        language: dto.language,
      },
    );

    return {
      jobId,
      message: 'Attendance alerts job scheduled successfully',
    };
  }

  @Post('schedule/report-cards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule report card delivery job' })
  @ApiResponse({
    status: 200,
    description: 'Job scheduled successfully',
  })
  async scheduleReportCards(@Body() dto: ScheduleJobDto) {
    const jobId = await this.schedulerService.scheduleReportCards(
      dto.payload,
      {
        delay: dto.delayMinutes ? dto.delayMinutes * 60 * 1000 : undefined,
        priority: dto.priority,
        language: dto.language,
      },
    );

    return {
      jobId,
      message: 'Report cards job scheduled successfully',
    };
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get job status' })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
  })
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.schedulerService.getJobStatus(jobId);
  }

  @Delete('job/:jobId')
  @ApiOperation({ summary: 'Cancel a scheduled job' })
  @ApiResponse({
    status: 200,
    description: 'Job cancelled successfully',
  })
  async cancelJob(@Param('jobId') jobId: string) {
    const cancelled = await this.schedulerService.cancelJob(jobId);

    return {
      success: cancelled,
      message: cancelled
        ? 'Job cancelled successfully'
        : 'Job not found or already completed',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics',
    schema: {
      example: {
        waiting: 5,
        active: 2,
        completed: 150,
        failed: 3,
        delayed: 10,
        total: 170,
      },
    },
  })
  async getQueueStats() {
    return this.schedulerService.getQueueStats();
  }

  @Get('scheduled-jobs')
  @ApiOperation({ summary: 'Get list of automated scheduled jobs' })
  @ApiResponse({
    status: 200,
    description: 'List of scheduled cron jobs',
  })
  getScheduledJobs() {
    return {
      jobs: this.schedulerService.getScheduledJobs(),
    };
  }
}

