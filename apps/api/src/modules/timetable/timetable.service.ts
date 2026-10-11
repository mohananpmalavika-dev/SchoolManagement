import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
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

@Injectable()
export class TimetableService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  // ==================== TIMETABLE ENTRIES ====================

  async createEntry(dto: CreateTimetableEntryDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate class exists
    const classExists = await this.prisma.class.findFirst({
      where: { id: dto.classId, tenantId },
    });

    if (!classExists) {
      throw new NotFoundException('Class not found');
    }

    // Validate stream if provided
    if (dto.streamId) {
      const streamExists = await this.prisma.stream.findFirst({
        where: { id: dto.streamId, tenantId, classId: dto.classId },
      });

      if (!streamExists) {
        throw new NotFoundException('Stream not found or does not belong to class');
      }
    }

    // Validate subject exists
    const subjectExists = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, tenantId },
    });

    if (!subjectExists) {
      throw new NotFoundException('Subject not found');
    }

    // Validate teacher exists
    const teacherExists = await this.prisma.staff.findFirst({
      where: { id: dto.teacherId, tenantId },
    });

    if (!teacherExists) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate time order
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for conflicts
    await this.checkConflicts(
      dto.classId,
      dto.streamId,
      dto.teacherId,
      dto.dayOfWeek,
      dto.period,
      dto.startTime,
      dto.endTime,
      dto.room,
    );

    // Create entry
    const entry = await this.prisma.timetableEntry.create({
      data: {
        tenantId,
        classId: dto.classId,
        streamId: dto.streamId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        period: dto.period,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
      include: {
        class: {
          select: { name: true },
        },
        stream: {
          select: { name: true },
        },
        subject: {
          select: { name: true, code: true },
        },
        teacher: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return entry;
  }

  async bulkCreate(dto: BulkCreateTimetableDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const entryDto of dto.entries) {
      try {
        await this.createEntry(entryDto);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          entry: entryDto,
          error: error.message,
        });
      }
    }

    return results;
  }

  async findAll(query: QueryTimetableDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (query.classId) where.classId = query.classId;
    if (query.streamId) where.streamId = query.streamId;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.dayOfWeek) where.dayOfWeek = query.dayOfWeek;

    const entries = await this.prisma.timetableEntry.findMany({
      where,
      include: {
        class: {
          select: { name: true },
        },
        stream: {
          select: { name: true },
        },
        subject: {
          select: { name: true, code: true },
        },
        teacher: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return entries;
  }

  async findOne(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const entry = await this.prisma.timetableEntry.findFirst({
      where: { id, tenantId },
      include: {
        class: {
          select: { name: true },
        },
        stream: {
          select: { name: true },
        },
        subject: {
          select: { name: true, code: true },
        },
        teacher: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Timetable entry not found');
    }

    return entry;
  }

  async update(id: string, dto: UpdateTimetableEntryDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const existing = await this.prisma.timetableEntry.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Timetable entry not found');
    }

    // Validate subject if changed
    if (dto.subjectId) {
      const subjectExists = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, tenantId },
      });

      if (!subjectExists) {
        throw new NotFoundException('Subject not found');
      }
    }

    // Validate teacher if changed
    if (dto.teacherId) {
      const teacherExists = await this.prisma.staff.findFirst({
        where: { id: dto.teacherId, tenantId },
      });

      if (!teacherExists) {
        throw new NotFoundException('Teacher not found');
      }
    }

    // Validate time order if times are being updated
    const startTime = dto.startTime || existing.startTime;
    const endTime = dto.endTime || existing.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for conflicts if relevant fields changed
    if (dto.teacherId || dto.startTime || dto.endTime || dto.room) {
      await this.checkConflicts(
        existing.classId,
        existing.streamId || undefined,
        dto.teacherId || existing.teacherId,
        existing.dayOfWeek,
        existing.period,
        startTime,
        endTime,
        dto.room || existing.room || undefined,
        id, // Exclude current entry
      );
    }

    const entry = await this.prisma.timetableEntry.update({
      where: { id },
      data: dto,
      include: {
        class: { select: { name: true } },
        stream: { select: { name: true } },
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    return entry;
  }

  async remove(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const entry = await this.prisma.timetableEntry.findFirst({
      where: { id, tenantId },
    });

    if (!entry) {
      throw new NotFoundException('Timetable entry not found');
    }

    await this.prisma.timetableEntry.delete({ where: { id } });

    return { success: true, message: 'Timetable entry deleted' };
  }

  async getClassTimetable(classId: string, streamId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = {
      tenantId,
      classId,
    };

    if (streamId) {
      where.streamId = streamId;
    }

    const entries = await this.prisma.timetableEntry.findMany({
      where,
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Group by day of week
    const timetable = this.groupByDay(entries);

    return timetable;
  }

  async getTeacherTimetable(teacherId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const entries = await this.prisma.timetableEntry.findMany({
      where: { tenantId, teacherId },
      include: {
        class: { select: { name: true } },
        stream: { select: { name: true } },
        subject: { select: { name: true, code: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const timetable = this.groupByDay(entries);

    return timetable;
  }

  private groupByDay(entries: any[]) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const grouped: Record<string, any[]> = {};

    for (let i = 1; i <= 7; i++) {
      grouped[days[i - 1]] = entries.filter((e) => e.dayOfWeek === i);
    }

    return grouped;
  }

  private async checkConflicts(
    classId: string,
    streamId: string | undefined,
    teacherId: string,
    dayOfWeek: number,
    period: string,
    startTime: string,
    endTime: string,
    room: string | undefined,
    excludeId?: string,
  ) {
    const tenantId = this.tenantService.requireTenantContext();

    // Check class/stream conflict (same period, same day)
    const classConflict = await this.prisma.timetableEntry.findFirst({
      where: {
        tenantId,
        classId,
        ...(streamId && { streamId }),
        dayOfWeek,
        period,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (classConflict) {
      throw new ConflictException(
        `Class/Stream already has another subject scheduled for this period`,
      );
    }

    // Check teacher conflict (overlapping time slots)
    const teacherConflicts = await this.prisma.timetableEntry.findMany({
      where: {
        tenantId,
        teacherId,
        dayOfWeek,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    for (const conflict of teacherConflicts) {
      if (this.timesOverlap(startTime, endTime, conflict.startTime, conflict.endTime)) {
        throw new ConflictException(
          `Teacher already has a class scheduled during this time (${conflict.startTime} - ${conflict.endTime})`,
        );
      }
    }

    // Check room conflict if room is specified
    if (room) {
      const roomConflicts = await this.prisma.timetableEntry.findMany({
        where: {
          tenantId,
          room,
          dayOfWeek,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      for (const conflict of roomConflicts) {
        if (this.timesOverlap(startTime, endTime, conflict.startTime, conflict.endTime)) {
          throw new ConflictException(
            `Room ${room} is already booked during this time (${conflict.startTime} - ${conflict.endTime})`,
          );
        }
      }
    }
  }

  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    // Convert HH:MM to minutes for comparison
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    // Check if intervals overlap
    return s1 < e2 && s2 < e1;
  }

  // ==================== SCHOOL CALENDAR / EVENTS ====================

  async createEvent(dto: CreateSchoolEventDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    const event = await this.prisma.schoolEvent.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        eventType: dto.eventType,
        category: dto.category,
        startDate,
        endDate,
        isAllDay: dto.isAllDay !== false,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        isHoliday: dto.isHoliday || false,
      },
    });

    return event;
  }

  async findAllEvents(query: QuerySchoolEventsDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (query.startDate) {
      where.startDate = { gte: new Date(query.startDate) };
    }

    if (query.endDate) {
      where.endDate = { lte: new Date(query.endDate) };
    }

    if (query.eventType) {
      where.eventType = query.eventType;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.holidaysOnly) {
      where.isHoliday = true;
    }

    const events = await this.prisma.schoolEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return events;
  }

  async findOneEvent(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const event = await this.prisma.schoolEvent.findFirst({
      where: { id, tenantId },
    });

    if (!event) {
      throw new NotFoundException('School event not found');
    }

    return event;
  }

  async updateEvent(id: string, dto: UpdateSchoolEventDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const existing = await this.prisma.schoolEvent.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('School event not found');
    }

    // Validate dates if both are being updated
    if (dto.startDate && dto.endDate) {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before or equal to end date');
      }
    }

    const event = await this.prisma.schoolEvent.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.eventType && { eventType: dto.eventType }),
        ...(dto.category && { category: dto.category }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isAllDay !== undefined && { isAllDay: dto.isAllDay }),
        ...(dto.startTime !== undefined && { startTime: dto.startTime }),
        ...(dto.endTime !== undefined && { endTime: dto.endTime }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.isHoliday !== undefined && { isHoliday: dto.isHoliday }),
      },
    });

    return event;
  }

  async removeEvent(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const event = await this.prisma.schoolEvent.findFirst({
      where: { id, tenantId },
    });

    if (!event) {
      throw new NotFoundException('School event not found');
    }

    await this.prisma.schoolEvent.delete({ where: { id } });

    return { success: true, message: 'School event deleted' };
  }

  async getUpcomingEvents(days: number = 30) {
    const tenantId = this.tenantService.requireTenantContext();

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const events = await this.prisma.schoolEvent.findMany({
      where: {
        tenantId,
        startDate: {
          gte: today,
          lte: futureDate,
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return events;
  }

  async getHolidays(year?: number) {
    const tenantId = this.tenantService.requireTenantContext();

    const currentYear = year || new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);
    const endDate = new Date(`${currentYear}-12-31`);

    const holidays = await this.prisma.schoolEvent.findMany({
      where: {
        tenantId,
        isHoliday: true,
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
      orderBy: { startDate: 'asc' },
    });

    return holidays;
  }
}
