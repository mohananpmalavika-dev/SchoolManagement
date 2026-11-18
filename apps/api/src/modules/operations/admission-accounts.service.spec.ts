import { randomUUID } from 'node:crypto';

import { AdmissionAccountsService } from './admission-accounts.service';
import { OperationsService } from './operations.service';

describe('Admission portal accounts', () => {
  const tenantId = randomUUID(), classId = randomUUID();
  const row = { id: randomUUID(), tenantId, schoolId: randomUUID(), guardianName: 'Anu Parent',
    guardianEmail: 'ANU@example.test', guardianPhone: '9847012345', address: null,
    firstName: 'New', lastName: 'Child', dateOfBirth: new Date('2020-01-01'), gender: 'FEMALE', stage: 'ACCEPTED' };
  const student = { id: randomUUID(), firstName: 'New', lastName: 'Child' };
  const passwords = { parent: 'parent-random-password-hash', student: 'student-random-password-hash' };
  let db: any, service: AdmissionAccountsService, invitations: any;
  beforeEach(() => {
    db = {
      tenant: { update: jest.fn() },
      user: {
        upsert: jest.fn(async ({create}: any) => ({...create, id: 'parent-user', isActive: true})),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(async ({data}: any) => ({...data, id: 'student-user'})),
      },
      guardian: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn(async ({data}: any) => ({...data, id: 'guardian'})), update: jest.fn(async ({data}: any) => ({...data, id: 'guardian'})) },
      student: { create: jest.fn().mockResolvedValue(student), update: jest.fn() },
      guardianStudentLink: { create: jest.fn() },
      admissionRecord: { findFirst: jest.fn().mockResolvedValue(row), update: jest.fn() },
      class: { findFirst: jest.fn().mockResolvedValue({id: classId}) },
      academicYear: { findFirst: jest.fn().mockResolvedValue(null) },
      auditLog: { create: jest.fn() },
    };
    db.$transaction = jest.fn(async (work: any) => work(db));
    invitations = { sendAccountInvitation: jest.fn().mockResolvedValue(true) };
    service = new AdmissionAccountsService(db, {requireTenantContext: () => tenantId} as any, invitations);
    jest.spyOn(service, 'preparePasswords').mockResolvedValue(passwords);
  });

  it('creates separate parent/student logins and links both portals before any email', async () => {
    const access = await service.provision(db, row, student, passwords);
    expect(db.user.upsert.mock.calls[0][0].create).toMatchObject({tenantId, email: 'anu@example.test', role: 'PARENT', mustChangePassword: true});
    expect(db.user.create.mock.calls[0][0].data).toMatchObject({tenantId, role: 'STUDENT', mustChangePassword: true});
    expect(db.student.update).toHaveBeenCalledWith({where: {id: student.id, tenantId}, data: {userId: 'student-user'}});
    expect(db.guardian.create.mock.calls[0][0].data.userId).toBe('parent-user');
    expect(db.guardianStudentLink.create.mock.calls[0][0].data).toMatchObject({studentId: student.id, guardianId: 'guardian', isPrimary: true});
    expect(access.student.recipient).toBe('anu@example.test');
    expect(access.student.loginId).toMatch(/^student\..+@students\.krypton\.invalid$/);
    expect(JSON.stringify(access)).not.toMatch(/passwordHash|token/);
    expect(invitations.sendAccountInvitation).not.toHaveBeenCalled();
  });

  it('reuses an existing parent and guardian without replacing credentials', async () => {
    db.user.upsert.mockResolvedValue({id: 'parent-user', email: 'anu@example.test', role: 'PARENT', isActive: true});
    db.guardian.findFirst.mockResolvedValue({id: 'guardian', userId: 'parent-user'});
    await service.provision(db, row, student, passwords, 'Child@example.test');
    expect(db.user.upsert.mock.calls[0][0].update).not.toHaveProperty('passwordHash');
    expect(db.guardian.create).not.toHaveBeenCalled();
    expect(db.student.update.mock.calls[0][0].data).toEqual({userId: 'student-user', email: 'child@example.test'});
  });

  it.each([{role: 'PRINCIPAL', isActive: true}, {role: 'PARENT', isActive: false}])('rejects an incompatible guardian login: %j', async (user) => {
    db.user.upsert.mockResolvedValue({...user, id: 'parent-user'});
    await expect(service.provision(db, row, student, passwords)).rejects.toThrow('inactive account or another role');
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('rejects a guardian already attached to another user', async () => {
    db.guardian.findFirst.mockResolvedValue({id: 'guardian', userId: 'other-user'});
    await expect(service.provision(db, row, student, passwords)).rejects.toThrow('already linked');
  });

  it('does not attach an existing student login to a new admission', async () => {
    db.user.findFirst.mockResolvedValue({id: 'another-student'});
    await expect(service.provision(db, row, student, passwords, 'used@example.test')).rejects.toThrow('already has a login');
    expect(db.student.update).not.toHaveBeenCalled();
  });

  it('records failed delivery independently and keeps linked accounts retryable', async () => {
    const access = await service.provision(db, row, student, passwords);
    db.user.findFirst.mockImplementation(async ({where}: any) => ({id: where.id, role: where.role}));
    invitations.sendAccountInvitation.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const result = await service.deliver(row.id, access);
    expect(result.parent.status).toBe('FAILED');expect(result.student.status).toBe('SENT');
    expect(db.user.findFirst.mock.calls[1][0].where).toMatchObject({tenantId, isActive: true, role: 'PARENT'});
    expect(db.admissionRecord.update).toHaveBeenCalledTimes(2);
  });

  it('commits enrollment before sending either invitation', async () => {
    let committed = false;
    db.$transaction.mockImplementation(async (work: any) => { const result = await work(db); committed = true; return result; });
    const delivery = jest.spyOn(service, 'deliver').mockImplementation(async (_id, access) => {
      expect(committed).toBe(true);return access;
    });
    const operations = new OperationsService(db, {requireTenantContext: () => tenantId} as any, service);
    const result = await operations.action({userId: 'admin', role: 'PRINCIPAL'}, 'admissions', row.id, 'admit', {classId, admissionNumber: 'ADM-123'});
    expect(result).toHaveProperty('portalAccess');expect(delivery).toHaveBeenCalledTimes(1);
  });

  it('sends nothing if the enrollment transaction fails', async () => {
    db.admissionRecord.update.mockRejectedValueOnce(new Error('transaction failed'));
    const deliver = jest.spyOn(service, 'deliver');
    const operations = new OperationsService(db, {requireTenantContext: () => tenantId} as any, service);
    await expect(operations.action({userId: 'admin', role: 'PRINCIPAL'}, 'admissions', row.id, 'admit', {classId, admissionNumber: 'ADM-123'})).rejects.toThrow('transaction failed');
    expect(deliver).not.toHaveBeenCalled();
  });

  it('resends for completed admissions without creating another student or login', async () => {
    const access = await service.provision(db, row, student, passwords);
    access.attemptedAt = new Date(Date.now() - 120000).toISOString();
    db.admissionRecord.findFirst.mockResolvedValue({...row, stage: 'ADMITTED', portalAccess: access});
    const deliver = jest.spyOn(service, 'deliver').mockImplementation(async (_id, value) => value);
    const operations = new OperationsService(db, {requireTenantContext: () => tenantId} as any, service);
    await operations.action({userId: 'admin', role: 'PRINCIPAL'}, 'admissions', row.id, 'resend-invites', {});
    expect(deliver).toHaveBeenCalledTimes(1);expect(db.student.create).not.toHaveBeenCalled();
    expect(db.user.create).toHaveBeenCalledTimes(1);
  });

  it('restricts resend to managers and enforces a cooldown', async () => {
    const access = await service.provision(db, row, student, passwords);
    db.admissionRecord.findFirst.mockResolvedValue({...row, stage: 'ADMITTED', portalAccess: access});
    const operations = new OperationsService(db, {requireTenantContext: () => tenantId} as any, service);
    await expect(operations.action({userId: 'reception', role: 'RECEPTIONIST'}, 'admissions', row.id, 'resend-invites', {})).rejects.toThrow('not available');
    await expect(operations.action({userId: 'admin', role: 'PRINCIPAL'}, 'admissions', row.id, 'resend-invites', {})).rejects.toThrow('one minute');
  });
});
