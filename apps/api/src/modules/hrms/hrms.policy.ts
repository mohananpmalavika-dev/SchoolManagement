import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@krypton/types';

export const hrStaffRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_OWNER,
  UserRole.PRINCIPAL,
  UserRole.DEPUTY_PRINCIPAL,
  UserRole.SCHOOL_ADMIN,
  UserRole.ACCOUNTANT,
  UserRole.LIBRARIAN,
  UserRole.TRANSPORT_OFFICER,
  UserRole.RECEPTIONIST,
  UserRole.AUDITOR,
  UserRole.TEACHER,
  UserRole.CLASS_TEACHER,
  UserRole.EXAM_OFFICER,
];
export const hrManagerRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.SCHOOL_OWNER,
  UserRole.PRINCIPAL,
  UserRole.SCHOOL_ADMIN,
];
export const hrPayrollRoles = [...hrManagerRoles, UserRole.ACCOUNTANT];
export interface HrActor {
  tenantId: string;
  userId: string;
  role: string;
  firstName?: string;
  lastName?: string;
}
export const hrManager = (user: HrActor) => hrManagerRoles.includes(user.role as UserRole);
export const hrPayroll = (user: HrActor) => hrPayrollRoles.includes(user.role as UserRole);
export function requireHr(user: HrActor, allowed = hrStaffRoles) {
  if (!user?.userId || !user.tenantId || !allowed.includes(user.role as UserRole))
    throw new ForbiddenException('Staff HR access is required');
}
