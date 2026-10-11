import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsAppSettingsService } from './whatsapp-settings.service';
import {
  UpdateSettingsDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  GetLogsDto,
  GetStatsDto,
} from './dto/settings.dto';

@ApiTags('WhatsApp - Settings & Admin')
@Controller('whatsapp/settings')
export class WhatsAppSettingsController {
  constructor(
    private readonly settingsService: WhatsAppSettingsService,
  ) {}

  // ==================== SETTINGS ====================

  @Get()
  @ApiOperation({ summary: 'Get WhatsApp settings' })
  @ApiResponse({
    status: 200,
    description: 'WhatsApp settings retrieved',
  })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Update WhatsApp settings' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
  })
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }

  // ==================== TEMPLATES ====================

  @Get('templates')
  @ApiOperation({ summary: 'Get all message templates' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async getTemplates(
    @Query('type') type?: string,
    @Query('language') language?: 'en' | 'sw',
  ) {
    return this.settingsService.getTemplates(type, language);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a single template by ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  async getTemplate(@Param('id') id: string) {
    return this.settingsService.getTemplate(id);
  }

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new message template' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
  })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.settingsService.createTemplate(dto);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a message template' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.settingsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message template' })
  @ApiResponse({
    status: 204,
    description: 'Template deleted successfully',
  })
  async deleteTemplate(@Param('id') id: string) {
    await this.settingsService.deleteTemplate(id);
  }

  @Post('templates/:id/toggle')
  @ApiOperation({ summary: 'Toggle template active status' })
  @ApiResponse({
    status: 200,
    description: 'Template status toggled',
  })
  async toggleTemplate(@Param('id') id: string) {
    return this.settingsService.toggleTemplate(id);
  }

  @Post('templates/create-defaults')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create default templates for tenant' })
  @ApiResponse({
    status: 201,
    description: 'Default templates created',
  })
  async createDefaultTemplates() {
    await this.settingsService.createDefaultTemplates();
    return {
      message: 'Default templates created successfully',
    };
  }

  // ==================== LOGS & STATISTICS ====================

  @Get('logs')
  @ApiOperation({ summary: 'Get communication logs' })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
    schema: {
      example: {
        logs: [
          {
            id: 'uuid',
            type: 'WHATSAPP',
            recipient: '+254712345678',
            subject: 'Fee Reminder',
            status: 'SENT',
            sentAt: '2024-01-15T10:00:00Z',
          },
        ],
        total: 150,
      },
    },
  })
  async getCommunicationLogs(@Query() query: GetLogsDto) {
    const logs = await this.settingsService.getCommunicationLogs({
      type: query.type,
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
    });

    return {
      logs,
      total: logs.length,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get WhatsApp communication statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        total: 1250,
        sent: 1200,
        failed: 50,
        successRate: '96.00',
        byType: [
          { type: 'Fee Reminder', count: 500 },
          { type: 'Attendance Alert', count: 400 },
          { type: 'Report Card Delivery', count: 300 },
        ],
      },
    },
  })
  async getStatistics(@Query() query: GetStatsDto) {
    return this.settingsService.getStatistics(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }
}

