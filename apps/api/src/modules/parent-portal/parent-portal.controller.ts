import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
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
  getMyChildren(@Request() req: any) {
    // Assuming guardianId is available from authenticated user
    const guardianId = req.user.guardianId || req.user.id;
    return this.parentPortalService.getMyChildren(guardianId);
  }

  // ===== STUDENT DASHBOARD & PROFILE =====

  @Get('student/:studentId/dashboard')
  getStudentDashboard(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.parentPortalService.getStudentDashboard(studentId, guardianId);
  }

  @Get('student/:studentId/profile')
  getStudentProfile(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.parentPortalService.getStudentProfile(studentId, guardianId);
  }

  // ===== ACTIVITY FEED =====

  @Get('student/:studentId/activities')
  getStudentActivities(
    @Param('studentId') studentId: string,
    @Query() query: QueryActivitiesDto,
    @Request() req: any,
  ) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.activityFeedService.getStudentActivities(studentId, guardianId, query);
  }

  @Get('student/:studentId/activities/summary')
  getActivitySummary(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.activityFeedService.getActivitySummary(studentId, guardianId);
  }

  // ===== MEDIA GALLERY =====

  @Get('student/:studentId/media')
  getStudentMedia(
    @Param('studentId') studentId: string,
    @Query() query: QueryMediaDto,
    @Request() req: any,
  ) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.mediaService.getStudentMedia(studentId, guardianId, query);
  }

  // ===== BEHAVIOR TRACKING =====

  @Get('student/:studentId/behavior')
  getStudentBehavior(
    @Param('studentId') studentId: string,
    @Query() query: QueryBehaviorDto,
    @Request() req: any,
  ) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.behaviorService.getStudentBehavior(studentId, guardianId, query);
  }

  @Get('student/:studentId/behavior/summary')
  getBehaviorSummary(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.behaviorService.getBehaviorSummary(studentId, guardianId);
  }

  // ===== HOMEWORK TRACKING =====

  @Get('student/:studentId/homework')
  getStudentHomework(
    @Param('studentId') studentId: string,
    @Query() query: QueryHomeworkDto,
    @Request() req: any,
  ) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.homeworkService.getStudentHomework(studentId, guardianId, query);
  }

  @Get('student/:studentId/homework/summary')
  getHomeworkSummary(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.homeworkService.getHomeworkSummary(studentId, guardianId);
  }

  @Get('student/:studentId/homework/upcoming')
  getUpcomingHomework(@Param('studentId') studentId: string, @Request() req: any) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.homeworkService.getUpcomingHomework(studentId, guardianId);
  }

  @Get('homework/assignment/:assignmentId/student/:studentId')
  getAssignmentDetails(
    @Param('assignmentId') assignmentId: string,
    @Param('studentId') studentId: string,
    @Request() req: any,
  ) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.homeworkService.getAssignmentDetails(assignmentId, studentId, guardianId);
  }

  // ===== TEACHER BOOKINGS =====

  @Get('bookings')
  getMyBookings(@Request() req: any, @Query('status') status?: string) {
    const guardianId = req.user.guardianId || req.user.id;
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
  createBooking(@Body() createBookingDto: CreateBookingDto, @Request() req: any) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.bookingsService.createBooking(guardianId, createBookingDto);
  }

  @Get('bookings/:id')
  getBooking(@Param('id') id: string) {
    return this.bookingsService.getBooking(id);
  }

  @Post('bookings/:id/cancel')
  cancelBooking(
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Request() req: any,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.id, cancelBookingDto);
  }

  // ===== NOTIFICATIONS =====

  @Get('notifications')
  getNotifications(@Request() req: any, @Query('limit') limit?: number) {
    const guardianId = req.user.guardianId || req.user.id;
    return this.parentPortalService.getParentNotifications(guardianId, limit ? Number(limit) : 10);
  }
}
