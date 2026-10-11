import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole as Role } from '@krypton/types';
import {
  CreateTimetableEntryDto,
  UpdateTimetableEntryDto,
  BulkCreateTimetableDto,
  QueryTimetableDto,
} from './dto/create-timetable-entry.dto';
import {
  CreateSchoolEventDto,
  UpdateSchoolEventDto,
  QuerySchoolEventsDto,
} from './dto/create-school-event.dto';
import { AutoGenerateTimetableDto } from './dto/auto-generate-timetable.dto';

@ApiTags('Timetable & Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // ==================== TIMETABLE ENTRIES ====================

  @Post('entries')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Create a single timetable entry' })
  @ApiResponse({
    status: 201,
    description: 'Timetable entry created successfully',
  })
  async createEntry(@Body() dto: CreateTimetableEntryDto) {
    return this.timetableService.createEntry(dto);
  }

  @Post('entries/bulk')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Create multiple timetable entries at once' })
  @ApiResponse({
    status: 201,
    description: 'Bulk creation completed',
  })
  async bulkCreate(@Body() dto: BulkCreateTimetableDto) {
    return this.timetableService.bulkCreate(dto);
  }

  @Get('entries')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
  )
  @ApiOperation({ summary: 'Get all timetable entries with filters' })
  @ApiResponse({
    status: 200,
    description: 'Timetable entries retrieved successfully',
  })
  async findAll(@Query() query: QueryTimetableDto) {
    return this.timetableService.findAll(query);
  }

  @Get('entries/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
  )
  @ApiOperation({ summary: 'Get a single timetable entry' })
  @ApiResponse({
    status: 200,
    description: 'Timetable entry retrieved successfully',
  })
  async findOne(@Param('id') id: string) {
    return this.timetableService.findOne(id);
  }

  @Patch('entries/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Update a timetable entry' })
  @ApiResponse({
    status: 200,
    description: 'Timetable entry updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTimetableEntryDto,
  ) {
    return this.timetableService.update(id, dto);
  }

  @Delete('entries/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Delete a timetable entry' })
  @ApiResponse({
    status: 200,
    description: 'Timetable entry deleted successfully',
  })
  async remove(@Param('id') id: string) {
    return this.timetableService.remove(id);
  }

  @Get('class/:classId')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
    Role.STUDENT,
  )
  @ApiOperation({ summary: 'Get timetable for a specific class' })
  @ApiResponse({
    status: 200,
    description: 'Class timetable retrieved successfully',
  })
  async getClassTimetable(
    @Param('classId') classId: string,
    @Query('streamId') streamId?: string,
  ) {
    return this.timetableService.getClassTimetable(classId, streamId);
  }

  @Get('teacher/:teacherId')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
  )
  @ApiOperation({ summary: 'Get timetable for a specific teacher' })
  @ApiResponse({
    status: 200,
    description: 'Teacher timetable retrieved successfully',
  })
  async getTeacherTimetable(@Param('teacherId') teacherId: string) {
    return this.timetableService.getTeacherTimetable(teacherId);
  }

  // ==================== SCHOOL CALENDAR / EVENTS ====================
  // Note: These endpoints require SchoolEvent model to be added to schema

  @Post('events')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Create a school event' })
  @ApiResponse({
    status: 201,
    description: 'School event created successfully',
  })
  async createEvent(@Body() dto: CreateSchoolEventDto) {
    return this.timetableService.createEvent(dto);
  }

  @Get('events')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  @ApiOperation({ summary: 'Get all school events with filters' })
  @ApiResponse({
    status: 200,
    description: 'School events retrieved successfully',
  })
  async findAllEvents(@Query() query: QuerySchoolEventsDto) {
    return this.timetableService.findAllEvents(query);
  }

  @Get('events/upcoming')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  @ApiOperation({ summary: 'Get upcoming events (next 30 days by default)' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming events retrieved successfully',
  })
  async getUpcomingEvents(@Query('days') days?: number) {
    return this.timetableService.getUpcomingEvents(days);
  }

  @Get('events/holidays')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  @ApiOperation({ summary: 'Get school holidays for a specific year' })
  @ApiResponse({
    status: 200,
    description: 'Holidays retrieved successfully',
  })
  async getHolidays(@Query('year') year?: number) {
    return this.timetableService.getHolidays(year);
  }

  @Get('events/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
    Role.TEACHER,
    Role.PARENT,
    Role.STUDENT,
  )
  @ApiOperation({ summary: 'Get a single school event by ID' })
  @ApiResponse({
    status: 200,
    description: 'School event retrieved successfully',
  })
  async findOneEvent(@Param('id') id: string) {
    return this.timetableService.findOneEvent(id);
  }

  @Patch('events/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Update a school event' })
  @ApiResponse({
    status: 200,
    description: 'School event updated successfully',
  })
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolEventDto,
  ) {
    return this.timetableService.updateEvent(id, dto);
  }

  @Delete('events/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Delete a school event' })
  @ApiResponse({
    status: 200,
    description: 'School event deleted successfully',
  })
  async removeEvent(@Param('id') id: string) {
    return this.timetableService.removeEvent(id);
  }

  // ==================== AUTO GENERATE & AUDIT ====================

  @Post('auto-generate')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Auto-generate conflict-free timetable using constraint engine' })
  @ApiResponse({
    status: 200,
    description: 'Conflict-free timetable generated successfully',
  })
  async autoGenerate(@Body() dto: AutoGenerateTimetableDto) {
    return this.timetableService.autoGenerateTimetable(dto);
  }

  @Get('conflicts/audit')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Perform 3-way conflict collision audit on timetable' })
  @ApiResponse({
    status: 200,
    description: 'Collision audit completed',
  })
  async auditConflicts() {
    return this.timetableService.auditConflicts();
  }
}
