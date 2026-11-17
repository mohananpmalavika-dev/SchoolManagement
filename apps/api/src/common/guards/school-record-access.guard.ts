import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

/** Object-level checks for the original school APIs, which predate the scoped workspaces.
 * Restricted users must select a student/class on collection endpoints. A role alone
 * never authorizes reading another family's records or another teacher's class.
 */
@Injectable()
export class SchoolRecordAccessGuard implements CanActivate {
  constructor(
    private db: PrismaService,
    private tenants: TenantService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Sign in required');
    const controller = context.getClass().name,
      handler = context.getHandler().name;
    const tenantId = this.tenants.requireTenantContext();
    const family = ['PARENT', 'STUDENT'].includes(user.role);
    const teacher = ['TEACHER', 'CLASS_TEACHER', 'EXAM_OFFICER'].includes(user.role);
    if (!family && !teacher) return true; // RolesGuard still enforces endpoint roles.
    const p = req.params || {},
      q = req.query || {},
      b = req.body || {};
    const classAccess = async (id: unknown) => {
      if (typeof id !== 'string' || !id)
        throw new ForbiddenException('Select an assigned class or student');
      const staff = await this.db.staff.findFirst({
        where: { tenantId, userId: user.userId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (
        !staff ||
        !(await this.db.class.findFirst({
          where: {
            id,
            tenantId,
            OR: [
              { timetableEntries: { some: { tenantId, teacherId: staff.id } } },
              { preschoolAssignments: { some: { tenantId, staffId: staff.id } } },
            ],
          },
          select: { id: true },
        }))
      )
        throw new ForbiddenException('Class is not assigned to you');
    };
    const studentAccess = async (id: unknown) => {
      if (typeof id !== 'string' || !id) throw new ForbiddenException('Select a student');
      const student = await this.db.student.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, currentClassId: true, userId: true },
      });
      if (!student) throw new NotFoundException('Student not found');
      if (user.role === 'STUDENT') {
        if (student.userId !== user.userId) throw new ForbiddenException('Student access denied');
      } else if (user.role === 'PARENT') {
        if (
          !(await this.db.guardianStudentLink.findFirst({
            where: { studentId: id, guardian: { tenantId, userId: user.userId } },
          }))
        )
          throw new ForbiddenException('Student access denied');
      } else await classAccess(student.currentClassId);
      return student;
    };
    const record = async (
      model:
        | 'attendanceRecord'
        | 'examination'
        | 'grade'
        | 'reportCard'
        | 'activityFeed'
        | 'behaviorRecord'
        | 'invoice'
        | 'payment'
        | 'timetableEntry',
      id: unknown
    ) => {
      if (typeof id !== 'string' || !id) throw new ForbiddenException('Select a record');
      const row = await (this.db[model] as any).findFirst({ where: { id, tenantId } });
      if (!row) throw new NotFoundException('Record not found');
      if (row.studentId) await studentAccess(row.studentId);
      else if (row.invoiceId) {
        const invoice = await this.db.invoice.findFirstOrThrow({
          where: { id: row.invoiceId, tenantId },
        });
        await studentAccess(invoice.studentId);
      } else await classAccess(row.classId);
      return row;
    };
    const selected = async () => {
      if (q.studentId || b.studentId || p.studentId)
        await studentAccess(q.studentId || b.studentId || p.studentId);
      else if (!family) await classAccess(q.classId || b.classId);
      else throw new ForbiddenException('Select a linked student');
    };

    if (controller === 'GuardiansController') {
      if (!teacher || !['findAll', 'findOne', 'getStudents'].includes(handler))
        throw new ForbiddenException('Guardian management access required');
      const staff = await this.db.staff.findFirst({
        where: { tenantId, userId: user.userId, status: 'ACTIVE' },
      });
      const entries = staff
        ? await this.db.timetableEntry.findMany({
            where: { tenantId, teacherId: staff.id },
            select: { classId: true },
          })
        : [];
      const assignments = staff
        ? await this.db.preschoolStaffAssignment.findMany({
            where: { tenantId, staffId: staff.id },
            select: { classId: true },
          })
        : [];
      req.accessibleClasses = [...new Set([...entries, ...assignments].map((e) => e.classId))];
      if (
        p.id &&
        !(await this.db.guardian.findFirst({
          where: {
            id: p.id,
            tenantId,
            studentLinks: {
              some: { student: { tenantId, currentClassId: { in: req.accessibleClasses } } },
            },
          },
        }))
      )
        throw new NotFoundException('Guardian not found');
    } else if (controller === 'HomeworkController') {
      const student = await studentAccess(p.studentId);
      if (
        !(await this.db.guardian.findFirst({
          where: { id: p.guardianId, tenantId, userId: user.userId },
        }))
      )
        throw new ForbiddenException('Guardian access denied');
      if (
        p.assignmentId &&
        !(await this.db.assignment.findFirst({
          where: { id: p.assignmentId, tenantId, classId: student.currentClassId || '' },
        }))
      )
        throw new NotFoundException('Assignment not found');
    } else if (controller === 'PaymentsGatewayController') {
      if (handler === 'initiate') await record('invoice', b.invoiceId);
      else if (['verify', 'queryStatus'].includes(handler)) {
        const transaction = await this.db.paymentGatewayTransaction.findFirst({
          where: { tenantId, gatewayOrderId: b.razorpayOrderId || b.gatewayOrderId },
        });
        if (!transaction?.invoiceId) throw new NotFoundException('Payment order not found');
        await record('invoice', transaction.invoiceId);
      } else throw new ForbiddenException('School finance management access required');
    } else if (controller === 'FeesController') {
      if (handler === 'findOneInvoice') await record('invoice', p.id);
      else if (handler === 'findOnePayment') await record('payment', p.id);
      else if (handler === 'findAllInvoices') await studentAccess(q.studentId);
      else if (handler === 'findAllPayments') await record('invoice', q.invoiceId);
      else throw new ForbiddenException('School finance management access required');
    } else if (controller === 'TimetableController') {
      if (['findAllEvents', 'findOneEvent', 'getUpcomingEvents', 'getHolidays'].includes(handler))
        return true;
      if (handler === 'getClassTimetable' && user.role === 'STUDENT') {
        if (
          !(await this.db.student.findFirst({
            where: { tenantId, userId: user.userId, currentClassId: p.classId, deletedAt: null },
          }))
        )
          throw new ForbiddenException('Class access denied');
      } else if (handler === 'getClassTimetable') await classAccess(p.classId);
      else if (handler === 'getTeacherTimetable') {
        if (
          !(await this.db.staff.findFirst({
            where: { id: p.teacherId, tenantId, userId: user.userId, status: 'ACTIVE' },
          }))
        )
          throw new ForbiddenException('Teacher schedule access denied');
      } else if (handler === 'findOne') await record('timetableEntry', p.id);
      else if (handler === 'findAll') await classAccess(q.classId);
      else throw new ForbiddenException('School timetable management access required');
    } else if (controller === 'AttendanceController') {
      if (handler === 'updateAttendance') await record('attendanceRecord', p.id);
      else if (handler === 'scanQRCode') await studentAccess(b.studentId);
      // Session metadata checks are also enforced inside the QR service.
      else if (['getQRSession', 'getQRSessionStats', 'invalidateQRSession'].includes(handler))
        return true;
      else if (!handler.toLowerCase().includes('staff')) await selected();
      else throw new ForbiddenException('Staff attendance requires management access');
    } else if (controller === 'ExaminationsController') {
      if (
        handler === 'updateReportCard' &&
        (b.principalComments !== undefined ||
          (b.status && !['DRAFT', 'PENDING_APPROVAL'].includes(b.status)))
      )
        throw new ForbiddenException('Only school management can approve or publish reports');
      if (['findOneReportCard', 'updateReportCard'].includes(handler)) {
        const row = await record('reportCard', p.id);
        if (family && row.status !== 'PUBLISHED')
          throw new NotFoundException('Published report not found');
      } else if (handler === 'updateGrade') await record('grade', p.id);
      else if (
        [
          'findOneExamination',
          'updateExamination',
          'deleteExamination',
          'getExaminationStats',
        ].includes(handler)
      )
        await record('examination', p.id);
      else if (['enterGrade', 'bulkEnterGrades'].includes(handler)) {
        await record('examination', b.examinationId);
        if (b.studentId) await studentAccess(b.studentId);
      } else await selected();
    } else if (controller === 'BehaviorController' || controller === 'ActivityFeedController') {
      if (p.id)
        await record(controller === 'BehaviorController' ? 'behaviorRecord' : 'activityFeed', p.id);
      else await selected();
    } else if (controller === 'StudentsController') {
      if (
        [
          'getMyChildren',
          'getMe',
          'getMeDashboard',
          'getMeTimetable',
          'getMeAttendance',
          'getMeGrades',
          'getMeReportCards',
          'getMeAssignments',
          'getMeMaterials',
        ].includes(handler)
      )
        return true;
      if (p.id) await studentAccess(p.id);
      else await selected();
    } else throw new ForbiddenException('School record scope has not been configured');
    return true;
  }
}
