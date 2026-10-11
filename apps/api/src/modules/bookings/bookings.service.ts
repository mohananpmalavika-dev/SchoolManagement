import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateBookingDto, BookingStatus } from './dto/create-booking.dto';
import { UpdateBookingDto, CancelBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  async accountScope(user: any): Promise<{guardianId?: string; teacherId?: string}> {
    const tenantId = this.tenantService.requireTenantContext();
    const userId = user.userId || user.id;
    if (!userId) throw new ForbiddenException('Account is not linked');
    if (user.role === 'PARENT') {
      const guardian = await this.prisma.guardian.findFirst({where:{tenantId,userId},select:{id:true}});
      if (!guardian) throw new ForbiddenException('Parent account is not linked');
      return {guardianId:guardian.id};
    }
    if (['TEACHER','CLASS_TEACHER','EXAM_OFFICER'].includes(user.role)) return {teacherId:await this.teacherForUser(user)};
    if (['SUPER_ADMIN','SCHOOL_OWNER','PRINCIPAL','DEPUTY_PRINCIPAL','SCHOOL_ADMIN'].includes(user.role)) return {};
    throw new ForbiddenException('Meeting access is not available to your role');
  }

  async teacherForUser(user: any): Promise<string> {
    const tenantId = this.tenantService.requireTenantContext();
    const userId = user.userId || user.id;
    if (!userId) throw new ForbiddenException('Teacher account is not linked');
    const staff = await this.prisma.staff.findFirst({where:{tenantId,userId,isTeacher:true},select:{id:true}});
    if (!staff) throw new ForbiddenException('Teacher account is not linked');
    return staff.id;
  }

  async authorizeBooking(user: any, id: string) {
    const scope = await this.accountScope(user);
    const booking = await this.getBooking(id);
    if (scope.guardianId && booking.guardianId !== scope.guardianId || scope.teacherId && booking.teacherId !== scope.teacherId) throw new ForbiddenException('This meeting belongs to another account');
    return booking;
  }

  async authorizeAvailability(user: any, id: string) {
    const scope = await this.accountScope(user);
    if (scope.guardianId) throw new ForbiddenException('Only teachers can change availability');
    const availability = await this.prisma.teacherAvailability.findFirst({where:{id,tenantId:this.tenantService.requireTenantContext(),...(scope.teacherId ? {teacherId:scope.teacherId} : {})}});
    if (!availability) throw new NotFoundException('Availability not found');
    return availability;
  }

  async getOptions(user: any) {
    const scope = await this.accountScope(user);
    const teachers = await this.prisma.staff.findMany({
      where: {tenantId:this.tenantService.requireTenantContext(),isTeacher:true,status:'ACTIVE',...(scope.teacherId ? {id:scope.teacherId} : {})},
      select: {id:true,firstName:true,lastName:true}, orderBy: {firstName:'asc'},
    });
    return {teachers:teachers.map(teacher=>({id:teacher.id,name:teacher.firstName+' '+teacher.lastName})),...scope};
  }

  // ===== TEACHER AVAILABILITY =====

  async createAvailability(teacherId: string, dto: CreateAvailabilityDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify teacher exists
    const teacher = await this.prisma.staff.findFirst({
      where: { id: teacherId, tenantId, isTeacher: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate time format and logic
    this.validateTimeSlot(dto.startTime, dto.endTime);

    const availability = await this.prisma.teacherAvailability.create({
      data: {
        tenantId,
        teacherId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration || 30,
        isActive: dto.isActive ?? true,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
      },
    });

    return availability;
  }

  async getTeacherAvailability(teacherId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const availability = await this.prisma.teacherAvailability.findMany({
      where: {
        tenantId,
        teacherId,
        isActive: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return availability;
  }

  async updateAvailability(id: string, dto: Partial<CreateAvailabilityDto>) {
    const tenantId = this.tenantService.requireTenantContext();

    const availability = await this.prisma.teacherAvailability.findFirst({
      where: { id, tenantId },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    this.validateTimeSlot(dto.startTime ?? availability.startTime, dto.endTime ?? availability.endTime);

    return this.prisma.teacherAvailability.update({
      where: { id },
      data: {
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration,
        isActive: dto.isActive,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
      },
    });
  }

  async deleteAvailability(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const availability = await this.prisma.teacherAvailability.findFirst({
      where: { id, tenantId },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    await this.prisma.teacherAvailability.delete({ where: { id } });

    return { message: 'Availability deleted successfully' };
  }

  // ===== BOOKINGS =====

  async createBooking(guardianId: string, dto: CreateBookingDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access to student
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: { guardianId, studentId: dto.studentId, guardian:{tenantId}, student:{tenantId,deletedAt:null} },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    // Verify teacher exists
    const teacher = await this.prisma.staff.findFirst({
      where: { id: dto.teacherId, tenantId, isTeacher: true, status:'ACTIVE' },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate time slot
    this.validateTimeSlot(dto.startTime, dto.endTime);
    const bookingDate = this.bookingDay(dto.bookingDate);
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi'}).format(new Date());
    if (dto.bookingDate < today) throw new BadRequestException('Choose today or a future meeting date');
    const slots = await this.getAvailableSlots(dto.teacherId,dto.bookingDate);
    if (!slots.some(slot=>slot.startTime===dto.startTime&&slot.endTime===dto.endTime)) throw new ConflictException('This time is not available. Refresh the meeting slots.');

    return this.prisma.$transaction(async tx => {
    // Serialize reservations for this teacher so simultaneous requests cannot double-book.
    await tx.staff.update({where:{id:dto.teacherId,tenantId},data:{updatedAt:new Date()}});

    // Check for conflicts
    const conflict = await tx.parentTeacherBooking.findFirst({
      where: {
        tenantId,
        teacherId: dto.teacherId,
        bookingDate,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: dto.startTime } },
              { endTime: { gt: dto.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: dto.endTime } },
              { endTime: { gte: dto.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: dto.startTime } },
              { endTime: { lte: dto.endTime } },
            ],
          },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('This time slot is already booked');
    }

    const booking = await tx.parentTeacherBooking.create({
      data: {
        tenantId,
        guardianId,
        studentId: dto.studentId,
        teacherId: dto.teacherId,
        bookingDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        purpose: dto.purpose,
        topic: dto.topic,
        status: BookingStatus.PENDING,
        meetingType: 'IN_PERSON',
        parentNotes: dto.parentNotes,
      },
    });

    return booking;
    });
  }

  async getBookings(filters?: {
    guardianId?: string;
    teacherId?: string;
    studentId?: string;
    status?: BookingStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (filters?.guardianId) {
      where.guardianId = filters.guardianId;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.bookingDate = {};
      if (filters.startDate) {
        where.bookingDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.bookingDate.lte = new Date(filters.endDate);
      }
    }

    const bookings = await this.prisma.parentTeacherBooking.findMany({
      where,
      include: {student:{select:{firstName:true,lastName:true}},guardian:{select:{firstName:true,lastName:true}}},
      orderBy: [
        { bookingDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return bookings;
  }

  async getBooking(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const booking = await this.prisma.parentTeacherBooking.findFirst({
      where: { id, tenantId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateBooking(id: string, dto: UpdateBookingDto, userId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const booking = await this.getBooking(id);

    // Only pending or confirmed bookings can be updated
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Cannot update this booking');
    }

    return this.prisma.parentTeacherBooking.update({
      where: { id },
      data: {
        status: dto.status,
        teacherNotes: dto.teacherNotes,
        parentNotes: dto.parentNotes,
        location: dto.location,
        meetingLink: dto.meetingLink,
      },
    });
  }

  async confirmBooking(id: string, teacherId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const booking = await this.getBooking(id);

    // Verify teacher owns this booking
    if (booking.teacherId !== teacherId) {
      throw new ForbiddenException('You can only confirm your own bookings');
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    return this.prisma.parentTeacherBooking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
    });
  }

  async cancelBooking(id: string, userId: string, dto: CancelBookingDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const booking = await this.getBooking(id);

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    return this.prisma.parentTeacherBooking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledBy: userId,
        cancellationReason: dto.cancellationReason,
        cancelledAt: new Date(),
      },
    });
  }

  async completeBooking(id: string, teacherId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const booking = await this.getBooking(id);

    if (booking.teacherId !== teacherId) {
      throw new ForbiddenException('You can only complete your own bookings');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed bookings can be completed');
    }

    return this.prisma.parentTeacherBooking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
    });
  }

  // Get available slots for a teacher on a specific date
  async getAvailableSlots(teacherId: string, date: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const bookingDate = this.bookingDay(date);
    const dayOfWeek = bookingDate.getUTCDay() || 7; // Convert Sunday from 0 to 7

    // Get teacher's availability for this day
    const availability = await this.prisma.teacherAvailability.findMany({
      where: {
        tenantId,
        teacherId,
        dayOfWeek,
        isActive: true,
        OR: [
          { effectiveFrom: null },
          { effectiveFrom: { lte: bookingDate } },
        ],
        AND: [
          {
            OR: [
              { effectiveUntil: null },
              { effectiveUntil: { gte: bookingDate } },
            ],
          },
        ],
      },
    });

    if (availability.length === 0) {
      return [];
    }

    // Get existing bookings for this date
    const existingBookings = await this.prisma.parentTeacherBooking.findMany({
      where: {
        tenantId,
        teacherId,
        bookingDate,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate available slots
    const slots: any[] = [];

    for (const avail of availability) {
      const slotDuration = avail.slotDuration;
      let currentTime = avail.startTime;

      while (this.isTimeBefore(currentTime, avail.endTime)) {
        const slotEnd = this.addMinutes(currentTime, slotDuration);

        if (this.isTimeBefore(slotEnd, avail.endTime) || slotEnd === avail.endTime) {
          // Check if slot conflicts with existing bookings
          const isBooked = existingBookings.some((booking) =>
            this.timeSlotsOverlap(currentTime, slotEnd, booking.startTime, booking.endTime),
          );

          if (!isBooked) {
            slots.push({
              startTime: currentTime,
              endTime: slotEnd,
              duration: slotDuration,
            });
          }
        }

        currentTime = slotEnd;
      }
    }

    const clock = new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Nairobi',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const time = new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Nairobi',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());
    const unique = new Map(slots.filter(slot=>date>clock||date===clock&&slot.startTime>time).map(slot=>[slot.startTime+'-'+slot.endTime,slot]));
    return Array.from(unique.values()).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  }

  // Helper methods

  private bookingDay(date: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('Choose a valid meeting date');
    const result=new Date(date+'T00:00:00.000Z');
    if (!Number.isFinite(result.getTime()) || result.toISOString().slice(0,10)!==date) throw new BadRequestException('Choose a valid meeting date');
    return result;
  }

  private validateTimeSlot(startTime: string, endTime: string) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new BadRequestException('Invalid time format. Use HH:MM');
    }

    if (!this.isTimeBefore(startTime, endTime)) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  private isTimeBefore(time1: string, time2: string): boolean {
    return time1 < time2;
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  private timeSlotsOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
}
