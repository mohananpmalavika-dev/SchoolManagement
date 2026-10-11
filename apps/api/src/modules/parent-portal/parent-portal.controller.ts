import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ParentPortalService } from './parent-portal.service';
import { ActivityFeedService } from '../activity-feed/activity-feed.service';
import { MediaService } from '../media/media.service';
import { BehaviorService } from '../behavior/behavior.service';
import { HomeworkService } from '../homework/homework.service';
import { BookingsService } from '../bookings/bookings.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';
import { QueryActivitiesDto } from '../activity-feed/dto/query-activities.dto';
import { QueryMediaDto } from '../media/dto/query-media.dto';
import { QueryBehaviorDto } from '../behavior/dto/query-behavior.dto';
import { QueryHomeworkDto } from '../homework/dto/query-homework.dto';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';
import { CancelBookingDto } from '../bookings/dto/update-booking.dto';

@Controller('parent-portal')
@Roles(UserRole.PARENT)
export class ParentPortalController {
  constructor(
    private readonly parentPortalService: ParentPortalService,
    private readonly activityFeedService: ActivityFeedService,
    private readonly mediaService: MediaService,
    private readonly behaviorService: BehaviorService,
    private readonly homeworkService: HomeworkService,
    private readonly bookingsService: BookingsService,
  ) {}

  // ===== GUARDIAN & CHILDREN =====

  @Get('my-children')
  async getMyChildren(@Request() req: any) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.parentPortalService.getMyChildren(guardianId);
  }

  // ===== STUDENT DASHBOARD & PROFILE =====

  @Get('student/:studentId/dashboard')
  async getStudentDashboard(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.parentPortalService.getStudentDashboard(studentId, guardianId);
  }

  @Get('student/:studentId/profile')
  async getStudentProfile(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.parentPortalService.getStudentProfile(studentId, guardianId);
  }

  // ===== ACTIVITY FEED =====

  @Get('student/:studentId/activities')
  async getStudentActivities(
    @Param('studentId') studentId: string,
    @Query() query: QueryActivitiesDto,
    @Request() req: any,
  ) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.activityFeedService.getStudentActivities(studentId, guardianId, query);
  }

  @Get('student/:studentId/activities/summary')
  async getActivitySummary(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.activityFeedService.getActivitySummary(studentId, guardianId);
  }

  // ===== MEDIA GALLERY =====

  @Get('student/:studentId/media')
  async getStudentMedia(
    @Param('studentId') studentId: string,
    @Query() query: QueryMediaDto,
    @Request() req: any,
  ) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.mediaService.getStudentMedia(studentId, guardianId, query);
  }

  // ===== BEHAVIOR TRACKING =====

  @Get('student/:studentId/behavior')
  async getStudentBehavior(
    @Param('studentId') studentId: string,
    @Query() query: QueryBehaviorDto,
    @Request() req: any,
  ) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.behaviorService.getStudentBehavior(studentId, guardianId, query);
  }

  @Get('student/:studentId/behavior/summary')
  async getBehaviorSummary(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.behaviorService.getBehaviorSummary(studentId, guardianId);
  }

  // ===== HOMEWORK TRACKING =====

  @Get('student/:studentId/homework')
  async getStudentHomework(
    @Param('studentId') studentId: string,
    @Query() query: QueryHomeworkDto,
    @Request() req: any,
  ) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.homeworkService.getStudentHomework(studentId, guardianId, query);
  }

  @Get('student/:studentId/homework/summary')
  async getHomeworkSummary(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.homeworkService.getHomeworkSummary(studentId, guardianId);
  }

  @Get('student/:studentId/homework/upcoming')
  async getUpcomingHomework(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.homeworkService.getUpcomingHomework(studentId, guardianId);
  }

  @Get('homework/assignment/:assignmentId/student/:studentId')
  async getAssignmentDetails(
    @Param('assignmentId') assignmentId: string,
    @Param('studentId') studentId: string,
    @Request() req: any,
  ) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.homeworkService.getAssignmentDetails(assignmentId, studentId, guardianId);
  }

  // ===== TEACHER BOOKINGS =====

  @Get('bookings')
  async getMyBookings(@Request() req: any, @Query('status') status?: string) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.bookingsService.getBookings({
      guardianId,
      status: status as any,
    });
  }

  @Get('bookings/teacher/:teacherId/slots/:date')
  getAvailableSlots(
    @Param('teacherId') teacherId: string,
    @Param('date') date: string,
  ) {
    return this.bookingsService.getAvailableSlots(teacherId, date);
  }

  @Post('bookings')
  async createBooking(@Body() createBookingDto: CreateBookingDto, @Request() req: any) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.bookingsService.createBooking(guardianId, createBookingDto);
  }

  @Get('bookings/:id')
  async getBooking(@Param('id') id: string, @Request() req: any) {
    return this.ownBooking(req, id);
  }

  @Post('bookings/:id/cancel')
  async cancelBooking(
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Request() req: any,
  ) {
    await this.ownBooking(req, id);
    return this.bookingsService.cancelBooking(id, req.user.userId || req.user.id, cancelBookingDto);
  }

  // ===== NOTIFICATIONS =====

  @Get('notifications')
  async getNotifications(@Request() req: any, @Query('limit') limit?: number) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    return this.parentPortalService.getParentNotifications(guardianId, limit ? Number(limit) : 10);
  }

  private async ownBooking(req: any, id: string) {
    const guardianId = await this.parentPortalService.guardianForUser(req.user);
    const booking = await this.bookingsService.getBooking(id);
    if (booking.guardianId !== guardianId) throw new ForbiddenException('This booking belongs to another family');
    return booking;
  }
}
