import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateAvailabilityDto, UpdateAvailabilityDto } from './dto/create-availability.dto';
import { CreateBookingDto, BookingStatus } from './dto/create-booking.dto';
import { UpdateBookingDto, CancelBookingDto } from './dto/update-booking.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@Controller('bookings')
@Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN, UserRole.PARENT)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('options')
  getOptions(@Request() req: any) { return this.bookingsService.getOptions(req.user); }

  // ===== TEACHER AVAILABILITY =====

  @Post('availability')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  async createAvailability(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
    @Request() req: any,
  ) {
    const teacherId = await this.bookingsService.teacherForUser(req.user);
    return this.bookingsService.createAvailability(teacherId, createAvailabilityDto);
  }

  @Get('availability/teacher/:teacherId')
  getTeacherAvailability(@Param('teacherId') teacherId: string) {
    return this.bookingsService.getTeacherAvailability(teacherId);
  }

  @Patch('availability/:id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  async updateAvailability(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
    @Request() req: any,
  ) {
    await this.bookingsService.authorizeAvailability(req.user, id);
    return this.bookingsService.updateAvailability(id, updateAvailabilityDto);
  }

  @Delete('availability/:id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  async deleteAvailability(@Param('id') id: string, @Request() req: any) {
    await this.bookingsService.authorizeAvailability(req.user, id);
    return this.bookingsService.deleteAvailability(id);
  }

  @Get('available-slots/:teacherId/:date')
  getAvailableSlots(
    @Param('teacherId') teacherId: string,
    @Param('date') date: string,
  ) {
    return this.bookingsService.getAvailableSlots(teacherId, date);
  }

  // ===== BOOKINGS =====

  @Get()
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN, UserRole.PARENT)
  async getBookings(
    @Request() req: any,
    @Query('guardianId') guardianId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: BookingStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const scope = await this.bookingsService.accountScope(req.user);
    return this.bookingsService.getBookings({
      guardianId,
      teacherId,
      studentId,
      status,
      startDate,
      endDate,
      ...scope,
    });
  }

  @Get(':id')
  getBooking(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.authorizeBooking(req.user, id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER, UserRole.PARENT)
  async updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: any,
  ) {
    await this.bookingsService.authorizeBooking(req.user, id);
    const allowed = req.user.role === 'PARENT' ? ['parentNotes'] : ['teacherNotes','location','meetingLink'];
    if (Object.entries(updateBookingDto).some(([key, value]) => !allowed.includes(key) && value !== undefined)) throw new ForbiddenException('You cannot change these meeting fields');
    return this.bookingsService.updateBooking(id, updateBookingDto, req.user.userId || req.user.id);
  }

  @Post(':id/confirm')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER)
  async confirmBooking(@Param('id') id: string, @Request() req: any) {
    await this.bookingsService.authorizeBooking(req.user, id);
    return this.bookingsService.confirmBooking(id, await this.bookingsService.teacherForUser(req.user));
  }

  @Post(':id/cancel')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER, UserRole.PARENT)
  async cancelBooking(
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Request() req: any,
  ) {
    await this.bookingsService.authorizeBooking(req.user, id);
    return this.bookingsService.cancelBooking(id, req.user.userId || req.user.id, cancelBookingDto);
  }

  @Post(':id/complete')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER)
  async completeBooking(@Param('id') id: string, @Request() req: any) {
    await this.bookingsService.authorizeBooking(req.user, id);
    return this.bookingsService.completeBooking(id, await this.bookingsService.teacherForUser(req.user));
  }
}
