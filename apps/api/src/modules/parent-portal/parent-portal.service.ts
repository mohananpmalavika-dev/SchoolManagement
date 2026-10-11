import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { ActivityFeedService } from '../activity-feed/activity-feed.service';
import { MediaService } from '../media/media.service';
import { BehaviorService } from '../behavior/behavior.service';
import { HomeworkService } from '../homework/homework.service';
import { BookingsService } from '../bookings/bookings.service';
import { BookingStatus } from '../bookings/dto/create-booking.dto';

@Injectable()
export class ParentPortalService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private activityFeedService: ActivityFeedService,
    private mediaService: MediaService,
    private behaviorService: BehaviorService,
    private homeworkService: HomeworkService,
    private bookingsService: BookingsService,
  ) {}

  // Get guardian's children
  async getMyChildren(guardianId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const guardian = await this.prisma.guardian.findFirst({
      where: { id: guardianId, tenantId },
      include: {
        studentLinks: {
          include: {
            student: {
              select: {
                id: true,
                admissionNumber: true,
                firstName: true,
                lastName: true,
                middleName: true,
                photo: true,
                dateOfBirth: true,
                gender: true,
                status: true,
                currentClass: {
                  select: {
                    name: true,
                    level: true,
                  },
                },
                currentStream: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return guardian.studentLinks.map((link) => ({
      ...link.student,
      relationship: link.relationship,
      isPrimary: link.isPrimary,
    }));
  }

  // Get comprehensive dashboard for a student
  async getStudentDashboard(studentId: string, guardianId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: { guardianId, studentId },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    // Get student details
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        middleName: true,
        photo: true,
        currentClass: {
          select: {
            name: true,
            level: true,
          },
        },
        currentStream: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get summaries in parallel
    const [
      activitySummary,
      behaviorSummary,
      homeworkSummary,
      upcomingBookings,
    ] = await Promise.all([
      this.activityFeedService.getActivitySummary(studentId, guardianId),
      this.behaviorService.getBehaviorSummary(studentId, guardianId),
      this.homeworkService.getHomeworkSummary(studentId, guardianId),
      this.bookingsService.getBookings({
        guardianId,
        studentId,
        status: BookingStatus.CONFIRMED,
        startDate: new Date().toISOString(),
      }),
    ]);

    // Get recent activities (last 5)
    const recentActivities = await this.activityFeedService.getStudentActivities(
      studentId,
      guardianId,
      { page: 1, limit: 5 },
    );

    // Get upcoming homework (due in next 7 days)
    const upcomingHomework = await this.homeworkService.getUpcomingHomework(
      studentId,
      guardianId,
    );

    // Get recent behavior (last 3)
    const recentBehavior = await this.behaviorService.getRecentBehavior(studentId, 3);

    return {
      student,
      summaries: {
        activities: activitySummary,
        behavior: behaviorSummary,
        homework: homeworkSummary,
      },
      recentActivities: recentActivities.data,
      upcomingHomework: upcomingHomework.slice(0, 5),
      recentBehavior,
      upcomingBookings: upcomingBookings.slice(0, 3),
    };
  }

  // Get student profile with extended information
  async getStudentProfile(studentId: string, guardianId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: { guardianId, studentId },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        currentClass: {
          select: {
            name: true,
            level: true,
            educationLevel: true,
          },
        },
        currentStream: {
          select: {
            name: true,
          },
        },
        guardianLinks: {
          include: {
            guardian: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  // Get notifications/alerts for parent
  async getParentNotifications(guardianId: string, limit: number = 10) {
    const tenantId = this.tenantService.requireTenantContext();

    // Get guardian's children
    const links = await this.prisma.guardianStudentLink.findMany({
      where: { guardianId },
      select: { studentId: true },
    });

    const studentIds = links.map((link) => link.studentId);

    if (studentIds.length === 0) {
      return [];
    }

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Collect notifications from various sources
    const notifications: any[] = [];

    // 1. Recent behavior records (especially negative ones)
    const behaviorRecords = (await this.prisma.behaviorRecord?.findMany({
      where: {
        tenantId,
        studentId: { in: studentIds },
        incidentDate: { gte: sevenDaysAgo },
        parentNotified: false,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        incidentDate: 'desc',
      },
      take: limit,
    })) || [];

    behaviorRecords.forEach((record: any) => {
      notifications.push({
        type: 'BEHAVIOR',
        priority: record.behaviorType === 'NEGATIVE' ? 'HIGH' : 'NORMAL',
        title: `${record.behaviorType} Behavior: ${record.title}`,
        message: `${record.student.firstName} ${record.student.lastName} - ${record.description || record.title}`,
        studentId: record.studentId,
        date: record.incidentDate,
        metadata: {
          behaviorId: record.id,
          behaviorType: record.behaviorType,
          category: record.category,
        },
      });
    });

    // 2. Overdue homework
    for (const studentId of studentIds) {
      const student = await this.prisma.student.findFirst({
        where: { id: studentId },
        select: {
          firstName: true,
          lastName: true,
          currentClassId: true,
        },
      });

      if (student && student.currentClassId) {
        const overdueAssignments = await this.prisma.assignment.findMany({
          where: {
            tenantId,
            classId: student.currentClassId,
            dueDate: { lt: today },
          },
          include: {
            submissions: {
              where: { studentId },
              select: { id: true },
            },
            subject: {
              select: { name: true },
            },
          },
        });

        overdueAssignments
          .filter((assignment) => assignment.submissions.length === 0)
          .forEach((assignment) => {
            notifications.push({
              type: 'HOMEWORK_OVERDUE',
              priority: 'HIGH',
              title: 'Overdue Homework',
              message: `${student.firstName} ${student.lastName} has overdue homework in ${assignment.subject.name}: ${assignment.title}`,
              studentId,
              date: assignment.dueDate,
              metadata: {
                assignmentId: assignment.id,
                subject: assignment.subject.name,
              },
            });
          });
      }
    }

    // 3. Upcoming bookings (in next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingBookings = (await this.prisma.parentTeacherBooking?.findMany({
      where: {
        tenantId,
        guardianId,
        studentId: { in: studentIds },
        bookingDate: {
          gte: today,
          lte: threeDaysFromNow,
        },
        status: 'CONFIRMED' as const,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })) || [];

    upcomingBookings.forEach((booking: any) => {
      notifications.push({
        type: 'BOOKING_REMINDER',
        priority: 'NORMAL',
        title: 'Upcoming Teacher Meeting',
        message: `Meeting scheduled for ${booking.student.firstName} ${booking.student.lastName} on ${booking.bookingDate.toDateString()} at ${booking.startTime}`,
        studentId: booking.studentId,
        date: booking.bookingDate,
        metadata: {
          bookingId: booking.id,
          startTime: booking.startTime,
          meetingType: booking.meetingType,
        },
      });
    });

    // Sort by priority and date
    notifications.sort((a, b) => {
      if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
      if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return notifications.slice(0, limit);
  }
}
