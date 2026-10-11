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
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateBookingDto, BookingStatus } from './dto/create-booking.dto';
import { UpdateBookingDto, CancelBookingDto } from './dto/update-booking.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ===== TEACHER AVAILABILITY =====

  @Post('availability')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  createAvailability(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
    @Request() req: any,
  ) {
    // In a real implementation, we'd get teacherId from the user's staff record
    // For now, assuming the request body includes it or we derive it from user
    return this.bookingsService.createAvailability(req.user.id, createAvailabilityDto);
  }

  @Get('availability/teacher/:teacherId')
  getTeacherAvailability(@Param('teacherId') teacherId: string) {
    return this.bookingsService.getTeacherAvailability(teacherId);
  }

  @Patch('availability/:id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  updateAvailability(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: Partial<CreateAvailabilityDto>,
  ) {
    return this.bookingsService.updateAvailability(id, updateAvailabilityDto);
  }

  @Delete('availability/:id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  deleteAvailability(@Param('id') id: string) {
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
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN, UserRole.PARENT)
  getBookings(
    @Query('guardianId') guardianId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: BookingStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.bookingsService.getBookings({
      guardianId,
      teacherId,
      studentId,
      status,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  getBooking(@Param('id') id: string) {
    return this.bookingsService.getBooking(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PARENT)
  updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req: any,
  ) {
    return this.bookingsService.updateBooking(id, updateBookingDto, req.user.id);
  }

  @Post(':id/confirm')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER)
  confirmBooking(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.confirmBooking(id, req.user.id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PARENT)
  cancelBooking(
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Request() req: any,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.id, cancelBookingDto);
  }

  @Post(':id/complete')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER)
  completeBooking(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.completeBooking(id, req.user.id);
  }
}
