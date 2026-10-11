import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole as Role } from '@krypton/types';
import {
  SendMessageDto,
  SendBulkMessageDto,
  SendAbsentAlertDto,
  SendFeeReminderDto,
} from './dto/send-message.dto';
import { CreateTemplateDto } from './dto/message-template.dto';

@ApiTags('Communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post('send')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
  )
  @ApiOperation({ summary: 'Send a message to specific recipients' })
  @ApiResponse({
    status: 201,
    description: 'Message queued/sent successfully',
  })
  async sendMessage(@Body() dto: SendMessageDto, @Request() req: any) {
    return this.communicationsService.sendMessage(dto, req.user.id);
  }

  @Post('send-bulk')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Send bulk message to entire class/stream' })
  @ApiResponse({
    status: 201,
    description: 'Bulk message sent successfully',
  })
  async sendBulkMessage(@Body() dto: SendBulkMessageDto, @Request() req: any) {
    return this.communicationsService.sendBulkMessage(dto, req.user.id);
  }

  @Post('alerts/absence')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
  )
  @ApiOperation({ summary: 'Send automated absence alerts to parents' })
  @ApiResponse({
    status: 201,
    description: 'Absence alerts sent successfully',
  })
  async sendAbsentAlerts(
    @Body() dto: SendAbsentAlertDto,
    @Request() req: any,
  ) {
    return this.communicationsService.sendAbsentAlerts(dto, req.user.id);
  }

  @Post('alerts/fees')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Send automated fee reminders to parents' })
  @ApiResponse({
    status: 201,
    description: 'Fee reminders sent successfully',
  })
  async sendFeeReminders(@Body() dto: SendFeeReminderDto, @Request() req: any) {
    return this.communicationsService.sendFeeReminders(dto, req.user.id);
  }

  @Post('templates')
  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a message template' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
  })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.communicationsService.createTemplate(dto);
  }

  @Get('templates')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
  )
  @ApiOperation({ summary: 'Get all message templates' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async findAllTemplates() {
    return this.communicationsService.findAllTemplates();
  }

  @Get('stats')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Get communication statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getCommunicationStats() {
    return this.communicationsService.getCommunicationStats();
  }
}
