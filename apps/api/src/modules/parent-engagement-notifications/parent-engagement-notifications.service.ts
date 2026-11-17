import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

/** Durable inbox delivery. External SMS/email delivery is a separate operation. */
@Injectable()
export class ParentEngagementNotificationsService {
  constructor(private db: PrismaService, private tenants: TenantService) {}

  private async deliver(studentId: string, key: string, subject: string, body: string, finish?: (tx: any) => Promise<unknown>) {
    const tenantId = this.tenants.requireTenantContext();
    return this.db.$transaction(async tx => {
      const lock = await tx.student.updateMany({ where: { id: studentId, tenantId, deletedAt: null }, data: { updatedAt: new Date() } });
      if (!lock.count) return { delivered: 0 };
      if (await tx.communication.findFirst({ where: { tenantId, deliveryKey: key } })) return { delivered: 0, duplicate: true };
      const guardians = await tx.guardian.findMany({ where: { tenantId, userId: { not: null }, studentLinks: { some: { studentId, receiveUpdates: true } } }, select: { userId: true } });
      const users = await tx.user.findMany({ where: { tenantId, id: { in: guardians.map(g => g.userId!) }, role: 'PARENT', isActive: true }, select: { id: true } });
      const ids = [...new Set(users.map(u => u.id))];
      if (!ids.length) return { delivered: 0 };
      const now = new Date();
      await tx.communication.create({ data: { tenantId, deliveryKey: key, channel: 'IN_APP', messageType: 'GENERAL', subject, body, status: 'SENT', recipientCount: ids.length, deliveredCount: ids.length, sentAt: now, logs: { create: ids.map(recipient => ({ recipient, channel: 'IN_APP', status: 'SENT', sentAt: now })) } } });
      if (finish) await finish(tx);
      return { delivered: ids.length };
    });
  }

  async sendActivityNotification(activityId: string) {
    const row = await this.db.activityFeed.findFirst({ where: { id: activityId, tenantId: this.tenants.requireTenantContext(), isVisibleToParents: true } });
    if (!row) return { delivered: 0 };
    return this.deliver(row.studentId, 'activity:' + row.id, 'Classroom activity', row.title + '. Open the activity feed for details.');
  }

  async sendBehaviorAlert(id: string) {
    const tenantId = this.tenants.requireTenantContext();
    const row = await this.db.behaviorRecord.findFirst({ where: { id, tenantId, parentNotified: false } });
    if (!row) return { delivered: 0 };
    return this.deliver(row.studentId, 'behavior:' + id, 'Student wellbeing update', row.title + '. Open the wellbeing record for details.', tx => tx.behaviorRecord.update({ where: { id, tenantId }, data: { parentNotified: true, parentNotifiedAt: new Date() } }));
  }

  async sendHomeworkReminder(assignmentId: string, studentId: string) {
    const tenantId = this.tenants.requireTenantContext();
    const student = await this.db.student.findFirst({ where: { id: studentId, tenantId, deletedAt: null } });
    if (!student) return { delivered: 0 };
    const row = await this.db.assignment.findFirst({ where: { id: assignmentId, tenantId, classId: student.currentClassId || '' } });
    if (!row || await this.db.assignmentSubmission.findFirst({ where: { tenantId, studentId, assignmentId } })) return { delivered: 0 };
    return this.deliver(studentId, 'homework:' + assignmentId + ':' + studentId, 'Homework reminder', row.title + ' is due ' + row.dueDate.toISOString().slice(0, 10) + '. Open Homework for details.');
  }

  async sendBookingConfirmation(id: string) {
    const tenantId = this.tenants.requireTenantContext();
    const row = await this.db.parentTeacherBooking.findFirst({ where: { id, tenantId, status: 'CONFIRMED', reminderSent: false }, include: { guardian: true } });
    if (!row?.guardian.userId) return { delivered: 0 };
    return this.db.$transaction(async tx => {
      const user = await tx.user.findFirst({ where: { id: row.guardian.userId!, tenantId, role: 'PARENT', isActive: true } });
      if (!user) return { delivered: 0 };
      const changed = await tx.parentTeacherBooking.updateMany({ where: { id, tenantId, status: 'CONFIRMED', reminderSent: false }, data: { reminderSent: true, reminderSentAt: new Date() } });
      if (!changed.count) return { delivered: 0 };
      const now = new Date();
      await tx.communication.create({ data: { tenantId, channel: 'IN_APP', messageType: 'GENERAL', subject: 'Parent meeting confirmed', body: `Your meeting on ${row.bookingDate.toISOString().slice(0, 10)} at ${row.startTime}-${row.endTime} is confirmed. Open Parent meetings for details.`, status: 'SENT', recipientCount: 1, deliveredCount: 1, sentAt: now, logs: { create: { recipient: user.id, channel: 'IN_APP', status: 'SENT', sentAt: now } } } });
      return { delivered: 1 };
    });
  }

  async sendAttendanceAlert(id: string) {
    const row = await this.db.attendanceRecord.findFirst({ where: { id, tenantId: this.tenants.requireTenantContext(), status: 'ABSENT' } });
    if (!row) return { delivered: 0 };
    return this.deliver(row.studentId, 'absence:' + id, 'Attendance update', `Your child was marked absent on ${row.date.toISOString().slice(0, 10)}. Contact the class teacher if this is incorrect.`);
  }

  async sendDailyActivityDigest() {
    const rows = await this.db.activityFeed.findMany({ where: { tenantId: this.tenants.requireTenantContext(), isVisibleToParents: true, createdAt: { gte: new Date(Date.now() - 86400000) } }, select: { id: true } });
    let delivered = 0;
    for (const row of rows) delivered += (await this.sendActivityNotification(row.id)).delivered;
    return { delivered };
  }
}
