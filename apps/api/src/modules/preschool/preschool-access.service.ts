import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { Actor } from '../operations/operations.service';

export const preschoolManagers = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
export const preschoolTeachers = ['TEACHER', 'CLASS_TEACHER'];
@Injectable()
export class PreschoolAccessService {
  constructor(
    private db: PrismaService,
    private tenants: TenantService
  ) {}
  tenant() {
    return this.tenants.requireTenantContext();
  }
  allow(user: Actor, roles = [...preschoolManagers, ...preschoolTeachers]) {
    if (!roles.includes(user.role))
      throw new ForbiddenException('Preschool access is not available to your role');
  }
  async classIds(user: Actor): Promise<string[] | undefined> {
    this.allow(user);
    if (preschoolManagers.includes(user.role)) return undefined;
    const staff = await this.db.staff.findFirst({
      where: { tenantId: this.tenant(), userId: user.userId, status: 'ACTIVE', isTeacher: true },
      select: { id: true },
    });
    if (!staff) return [];
    const [assignments, lessons] = await Promise.all([
      this.db.preschoolStaffAssignment.findMany({
        where: { tenantId: this.tenant(), staffId: staff.id },
        select: { classId: true },
      }),
      this.db.timetableEntry.findMany({
        where: { tenantId: this.tenant(), teacherId: staff.id },
        select: { classId: true },
      }),
    ]);
    return [...new Set([...assignments, ...lessons].map((row) => row.classId))];
  }
  async classroom(user: Actor, classId: string) {
    const ids = await this.classIds(user);
    if (ids && !ids.includes(classId))
      throw new ForbiddenException('This class is not assigned to you');
    const row = await this.db.class.findFirst({
      where: {
        id: classId,
        tenantId: this.tenant(),
        educationLevel: 'PRE_PRIMARY',
        school: { programme: { in: ['PRESCHOOL', 'COMBINED'] }, isActive: true },
      },
      include: { school: true },
    });
    if (!row)
      throw new NotFoundException(
        'Enable preschool mode for this school and select a pre-primary class'
      );
    return row;
  }
  async student(user: Actor, studentId: string) {
    if (user.role !== 'PARENT') this.allow(user);
    const row = await this.db.student.findFirst({
      where: { id: studentId, tenantId: this.tenant(), deletedAt: null, status: 'ACTIVE' },
      include: { currentClass: { include: { school: true } } },
    });
    if (
      !row?.currentClass ||
      row.currentClass.educationLevel !== 'PRE_PRIMARY' ||
      !['PRESCHOOL', 'COMBINED'].includes(row.currentClass.school.programme) ||
      !row.currentClass.school.isActive
    )
      throw new NotFoundException('Preschool student not found');
    if (user.role === 'PARENT') {
      const link = await this.db.guardianStudentLink.findFirst({
        where: {
          studentId,
          guardian: { tenantId: this.tenant(), userId: user.userId },
          student: { tenantId: this.tenant() },
        },
        include: { guardian: true },
      });
      if (!link) throw new ForbiddenException('This child is not linked to your account');
    } else await this.classroom(user, row.currentClassId!);
    return row;
  }
  async guardian(user: Actor, studentId: string) {
    if (user.role !== 'PARENT') throw new ForbiddenException('A linked parent account is required');
    await this.student(user, studentId);
    const link = await this.db.guardianStudentLink.findFirst({
      where: { studentId, guardian: { tenantId: this.tenant(), userId: user.userId } },
      include: { guardian: true },
    });
    if (!link) throw new ForbiddenException('This child is not linked to your account');
    return link;
  }
}
