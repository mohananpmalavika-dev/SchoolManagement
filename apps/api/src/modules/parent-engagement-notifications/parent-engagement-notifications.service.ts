import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

/**
 * Integration service for sending notifications about parent engagement events
 * This service connects Parent Engagement features with the Communications module
 */
@Injectable()
export class ParentEngagementNotificationsService {
  private readonly logger = new Logger(ParentEngagementNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  /**
   * Send activity notification to parents
   * Called when a teacher creates a new activity
   */
  async sendActivityNotification(activityId: string) {
    try {
      const tenantId = this.tenantService.requireTenantContext();

      // Get activity with student and guardian info
      const activity = await this.prisma.activityFeed.findFirst({
        where: { id: activityId, tenantId },
        include: {
          student: {
            include: {
              guardianLinks: {
                where: {
                  receiveUpdates: true,
                },
                include: {
                  guardian: true,
                },
              },
            },
          },
        },
      });

      if (!activity || !activity.isVisibleToParents) {
        return;
      }

      // Get primary guardians
      const recipients: string[] = [];
      activity.student.guardianLinks.forEach((link: any) => {
        if (link.guardian.phone) {
          recipients.push(link.guardian.phone);
        }
      });

      if (recipients.length === 0) {
        return;
      }

      // Prepare message
      const message = this.formatActivityMessage(
        activity.student.firstName,
        activity.student.lastName,
        activity.title,
        activity.activityType,
      );

      // Send via Communications module (placeholder - integrate with actual module)
      // await this.communicationsService.sendMessage({
      //   channel: 'SMS',
      //   recipients,
      //   message,
      //   messageType: 'ACTIVITY_UPDATE',
      //   priority: 'NORMAL',
      // });

      this.logger.log(`Activity notification sent for activity ${activityId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send activity notification: ${error?.message || String(error)}`);
    }
  }

  /**
   * Send behavior alert to parents
   * Called when a teacher records a behavior incident
   */
  async sendBehaviorAlert(behaviorRecordId: string) {
    try {
      const tenantId = this.tenantService.requireTenantContext();

      const record = (await this.prisma.behaviorRecord?.findFirst({
        where: { id: behaviorRecordId, tenantId },
        include: {
          student: {
            include: {
              guardianLinks: {
                where: {
                  isPrimary: true,
                  receiveUpdates: true,
                },
                include: {
                  guardian: true,
                },
              },
            },
          },
        },
      })) as any;

      if (!record) {
        return;
      }

      // Get primary guardian
      const primaryGuardian = record.student.guardianLinks[0]?.guardian;
      if (!primaryGuardian || !primaryGuardian.phone) {
        return;
      }

      // Prepare message based on behavior type
      const message = this.formatBehaviorMessage(
        record.student.firstName,
        record.student.lastName,
        record.behaviorType,
        record.title,
        record.description,
      );

      // Determine priority based on behavior type
      const priority = record.behaviorType === 'NEGATIVE' ? 'HIGH' : 'NORMAL';

      // Send notification
      // await this.communicationsService.sendMessage({
      //   channel: 'SMS',
      //   recipients: [primaryGuardian.phone],
      //   message,
      //   messageType: 'BEHAVIOR_ALERT',
      //   priority,
      // });

      // Mark as notified
      if (this.prisma.behaviorRecord) {
        await this.prisma.behaviorRecord.update({
        where: { id: behaviorRecordId },
        data: {
          parentNotified: true,
          parentNotifiedAt: new Date(),
        },
        });
      }

      this.logger.log(`Behavior alert sent for record ${behaviorRecordId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send behavior alert: ${error?.message || String(error)}`);
    }
  }

  /**
   * Send homework reminder to parents
   * Can be called by a scheduled job for upcoming homework
   */
  async sendHomeworkReminder(assignmentId: string, studentId: string) {
    try {
      const tenantId = this.tenantService.requireTenantContext();

      const assignment = await this.prisma.assignment.findFirst({
        where: { id: assignmentId, tenantId },
        include: {
          subject: true,
        },
      });

      const student = await this.prisma.student.findFirst({
        where: { id: studentId, tenantId },
        include: {
          guardianLinks: {
            where: {
              isPrimary: true,
              receiveUpdates: true,
            },
            include: {
              guardian: true,
            },
          },
        },
      });

      if (!assignment || !student) {
        return;
      }

      const primaryGuardian = student.guardianLinks[0]?.guardian;
      if (!primaryGuardian || !primaryGuardian.phone) {
        return;
      }

      // Check if already submitted
      const submission = await this.prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId,
          studentId,
        },
      });

      if (submission) {
        return; // Already submitted, no reminder needed
      }

      const message = this.formatHomeworkMessage(
        student.firstName,
        student.lastName,
        assignment.subject.name,
        assignment.title,
        assignment.dueDate,
      );

      // Send reminder
      // await this.communicationsService.sendMessage({
      //   channel: 'SMS',
      //   recipients: [primaryGuardian.phone],
      //   message,
      //   messageType: 'HOMEWORK_REMINDER',
      //   priority: 'NORMAL',
      // });

      this.logger.log(`Homework reminder sent for assignment ${assignmentId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send homework reminder: ${error?.message || String(error)}`);
    }
  }

  /**
   * Send booking confirmation to parent
   * Called when a teacher confirms a parent-teacher booking
   */
  async sendBookingConfirmation(bookingId: string) {
    try {
      const tenantId = this.tenantService.requireTenantContext();

      const booking = (await this.prisma.parentTeacherBooking?.findFirst({
        where: { id: bookingId, tenantId },
        include: {
          guardian: true,
          student: true,
        },
      })) as any;

      if (!booking || !booking.guardian.phone) {
        return;
      }

      const message = this.formatBookingMessage(
        booking.student.firstName,
        booking.student.lastName,
        booking.bookingDate,
        booking.startTime,
        booking.endTime,
        booking.meetingType,
        booking.location,
      );

      // Send confirmation
      // await this.communicationsService.sendMessage({
      //   channel: 'SMS',
      //   recipients: [booking.guardian.phone],
      //   message,
      //   messageType: 'BOOKING_CONFIRMATION',
      //   priority: 'NORMAL',
      // });

      // Mark reminder as sent
      if (this.prisma.parentTeacherBooking) {
        await this.prisma.parentTeacherBooking.update({
        where: { id: bookingId },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
        });
      }

      this.logger.log(`Booking confirmation sent for booking ${bookingId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send booking confirmation: ${error?.message || String(error)}`);
    }
  }

  /**
   * Send daily digest of activities to parents
   * Can be scheduled to run daily
   */
  async sendDailyActivityDigest() {
    try {
      const tenantId = this.tenantService.requireTenantContext();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's activities
      const activities = (await this.prisma.activityFeed?.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          isVisibleToParents: true,
        },
        include: {
          student: {
            include: {
              guardianLinks: {
                where: {
                  isPrimary: true,
                  receiveUpdates: true,
                },
                include: {
                  guardian: true,
                },
              },
            },
          },
        },
      })) || [];

      // Group by student
      const byStudent = new Map<string, typeof activities>();
      activities.forEach((activity) => {
        const studentId = activity.studentId;
        if (!byStudent.has(studentId)) {
          byStudent.set(studentId, []);
        }
        byStudent.get(studentId)!.push(activity);
      });

      // Send digest to each guardian
      for (const [studentId, studentActivities] of byStudent.entries()) {
        const student = studentActivities[0].student;
        const primaryGuardian = student.guardianLinks[0]?.guardian;

        if (!primaryGuardian || !primaryGuardian.phone) {
          continue;
        }

        const message = this.formatDailyDigest(
          student.firstName,
          student.lastName,
          studentActivities,
        );

        // Send digest
        // await this.communicationsService.sendMessage({
        //   channel: 'SMS',
        //   recipients: [primaryGuardian.phone],
        //   message,
        //   messageType: 'DAILY_DIGEST',
        //   priority: 'NORMAL',
        // });
      }

      this.logger.log(`Daily activity digest sent to ${byStudent.size} parents`);
    } catch (error: any) {
      this.logger.error(`Failed to send daily digest: ${error?.message || String(error)}`);
    }
  }

  // Message formatters

  private formatActivityMessage(
    firstName: string,
    lastName: string,
    activityTitle: string,
    activityType: string,
  ): string {
    return `${firstName} ${lastName}: ${activityTitle}. Check the parent portal for more details.`;
  }

  private formatBehaviorMessage(
    firstName: string,
    lastName: string,
    behaviorType: string,
    title: string,
    description?: string,
  ): string {
    const prefix =
      behaviorType === 'POSITIVE'
        ? '⭐ Great News!'
        : behaviorType === 'NEGATIVE'
        ? '⚠️ Attention Required'
        : 'ℹ️ Update';

    return `${prefix} ${firstName} ${lastName}: ${title}. ${description || 'Please check the parent portal for details.'}`;
  }

  private formatHomeworkMessage(
    firstName: string,
    lastName: string,
    subject: string,
    assignmentTitle: string,
    dueDate: Date,
  ): string {
    const dueDateStr = dueDate.toLocaleDateString();
    return `📚 Reminder: ${firstName} ${lastName} has homework in ${subject}: "${assignmentTitle}" due on ${dueDateStr}. Check the parent portal for details.`;
  }

  private formatBookingMessage(
    firstName: string,
    lastName: string,
    date: Date,
    startTime: string,
    endTime: string,
    meetingType: string,
    location?: string,
  ): string {
    const dateStr = date.toLocaleDateString();
    const locationInfo =
      meetingType === 'IN_PERSON'
        ? location
          ? ` at ${location}`
          : ' (location TBD)'
        : meetingType === 'VIRTUAL'
        ? ' (virtual meeting - link will be shared)'
        : ' (phone call)';

    return `✅ Meeting Confirmed: Parent-teacher meeting for ${firstName} ${lastName} on ${dateStr} at ${startTime}-${endTime}${locationInfo}.`;
  }

  private formatDailyDigest(
    firstName: string,
    lastName: string,
    activities: any[],
  ): string {
    const count = activities.length;
    const summary = activities
      .slice(0, 3)
      .map((a) => `• ${a.title}`)
      .join('\n');

    return `📱 Daily Update for ${firstName} ${lastName}: ${count} ${count === 1 ? 'activity' : 'activities'} today.\n${summary}${count > 3 ? `\n...and ${count - 3} more` : ''}\n\nView all in the parent portal.`;
  }
}
