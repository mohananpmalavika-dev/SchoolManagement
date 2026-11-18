import { randomBytes, randomUUID } from 'node:crypto';

import { Prisma } from '@krypton/database';
import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { PasswordResetService } from '../auth/services/password-reset.service';

interface PortalAccount {
  userId: string;
  loginId: string;
  recipient: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
}
export interface AdmissionPortalAccess {
  parent: PortalAccount;
  student: PortalAccount;
  attemptedAt: string;
}

@Injectable()
export class AdmissionAccountsService {
  constructor(private db: PrismaService, private tenants: TenantService,
    private invitations: PasswordResetService) {}

  async preparePasswords() {
    // Password hashing is deliberately outside the enrollment transaction so
    // CPU work cannot hold database locks or exhaust the transaction timeout.
    const [parent, student] = await Promise.all([
      bcrypt.hash(randomBytes(32).toString('hex'), 12),
      bcrypt.hash(randomBytes(32).toString('hex'), 12),
    ]);
    return { parent, student };
  }

  async provision(tx: Prisma.TransactionClient, row: {
    tenantId: string; guardianEmail: string; guardianName: string;
    guardianPhone: string; address: string | null;
  }, student: { id: string; firstName: string; lastName: string },
    passwords: { parent: string; student: string }, studentEmail?: string) {
    const tenantId = row.tenantId;
    const email = row.guardianEmail.trim().toLowerCase();
    const [firstName, ...surname] = row.guardianName.trim().split(/\s+/);
    // Reuse the tenant-scoped parent account for sibling admissions.
    const parent = await tx.user.upsert({
      where: { tenantId_email: { tenantId, email } },
      create: { tenantId, email, firstName, lastName: surname.join(' '),
        phone: row.guardianPhone, role: 'PARENT', mustChangePassword: true,
        passwordHash: passwords.parent },
      update: { updatedAt: new Date() },
    });
    if (parent.role !== 'PARENT' || !parent.isActive)
      throw new ConflictException('Guardian email belongs to an inactive account or another role. Use an active parent account.');
    let guardian = await tx.guardian.findFirst({
      where: { tenantId, OR: [{ userId: parent.id }, { email: { equals: email, mode: 'insensitive' } }] },
      orderBy: { createdAt: 'asc' },
    });
    if (guardian?.userId && guardian.userId !== parent.id)
      throw new ConflictException('Guardian is already linked to another login. Correct the guardian account before admission.');
    if (guardian) guardian = await tx.guardian.update({ where: { id: guardian.id, tenantId }, data: { userId: parent.id } });
    else guardian = await tx.guardian.create({ data: { tenantId, firstName,
      lastName: surname.join(' '), email, phone: row.guardianPhone,
      address: row.address, userId: parent.id } });

    const loginId = studentEmail?.trim().toLowerCase() || `student.${randomUUID()}@students.krypton.invalid`;
    if (await tx.user.findFirst({ where: { tenantId, email: loginId } }))
      throw new ConflictException('Student email already has a login. Choose a separate student email.');
    const studentUser = await tx.user.create({ data: {
      tenantId, email: loginId, firstName: student.firstName, lastName: student.lastName,
      role: 'STUDENT', mustChangePassword: true,
      passwordHash: passwords.student,
    } });
    await tx.student.update({ where: { id: student.id, tenantId }, data: {
      userId: studentUser.id, ...(studentEmail ? { email: loginId } : {}),
    } });
    await tx.guardianStudentLink.create({ data: {
      guardianId: guardian.id, studentId: student.id, relationship: 'GUARDIAN', isPrimary: true,
    } });
    return {
      parent: { userId: parent.id, loginId: parent.email, recipient: email, status: 'PENDING' },
      student: { userId: studentUser.id, loginId, recipient: studentEmail ? loginId : email, status: 'PENDING' },
      attemptedAt: new Date().toISOString(),
    } satisfies AdmissionPortalAccess;
  }

  // Delivery happens after commit: a mail outage must never undo enrollment.
  async deliver(id: string, access: AdmissionPortalAccess) {
    const tenantId = this.tenants.requireTenantContext();
    for (const kind of ['parent', 'student'] as const) {
      const account = access[kind];
      const user = await this.db.user.findFirst({ where: {
        id: account.userId, tenantId, isActive: true, role: kind === 'parent' ? 'PARENT' : 'STUDENT',
      } });
      const sent = user ? await this.invitations.sendAccountInvitation(user, account.recipient) : false;
      access[kind] = { ...account, status: sent ? 'SENT' : 'FAILED', ...(sent ? { sentAt: new Date().toISOString() } : {}) };
      // Save each result so a later failure or restart leaves visible, retryable work.
      await this.db.admissionRecord.update({ where: { id, tenantId }, data: {
        portalAccess: access as unknown as Prisma.InputJsonValue,
      } });
    }
    return access;
  }
}
