import 'reflect-metadata';
import { ForbiddenException, INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { validate } from 'class-validator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminSchoolProgrammeDto, PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

const admin = { userId: 'platform-admin', role: 'SUPER_ADMIN', tenantId: 'platform-tenant' };
const nonAdmins = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT'];
function setup() {
  const school = { id: 'school-b', tenantId: 'tenant-b', programme: 'STANDARD' };
  const db: any = {
    school: {
      findMany: jest.fn().mockResolvedValue([school]),
      findUnique: jest.fn().mockResolvedValue(school),
      update: jest.fn().mockImplementation(async ({ data }) => ({ id: school.id, ...data })),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    executeWithoutTenantFilter: jest.fn(async work => work()),
    $transaction: jest.fn(async work => work(db)),
  };
  return { db, service: new PlatformService(db) };
}

describe('Platform school type administration', () => {
  it.each(nonAdmins)('rejects %s before reading or changing another school', async role => {
    const { db, service } = setup();
    await expect(service.schoolSetup({ ...admin, role })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.schoolProgramme({ ...admin, role }, 'school-b', 'COMBINED')).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.executeWithoutTenantFilter).not.toHaveBeenCalled();
    expect(db.school.update).not.toHaveBeenCalled();
  });
  it.each(['STANDARD', 'PRESCHOOL', 'COMBINED'] as const)('allows Super Admin to set %s and audits the target school tenant', async programme => {
    const { db, service } = setup();
    expect(await service.schoolProgramme(admin, 'school-b', programme)).toEqual({ id: 'school-b', programme });
    expect(db.school.update).toHaveBeenCalledWith({ where: { id: 'school-b' }, data: { programme }, select: { id: true, programme: true } });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: {
      tenantId: 'tenant-b', userId: 'platform-admin', action: 'SCHOOL_PROGRAMME_UPDATED', entityType: 'school', entityId: 'school-b',
      changes: { programme: { from: 'STANDARD', to: programme } },
    } });
  });
  it('does not update or audit an unknown school', async () => {
    const { db, service } = setup(); db.school.findUnique.mockResolvedValue(null);
    await expect(service.schoolProgramme(admin, 'missing', 'PRESCHOOL')).rejects.toBeInstanceOf(NotFoundException);
    expect(db.school.update).not.toHaveBeenCalled(); expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it.each([undefined, '', 'PRIVATE', 'INVALID'])('validates school type %s', async programme => {
    const dto = Object.assign(new AdminSchoolProgrammeDto(), { programme });
    expect(await validate(dto)).toHaveLength(1);
  });
});

describe('Platform school setup HTTP authorization', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const { service } = setup();
    const module = await Test.createTestingModule({ controllers: [PlatformController], providers: [{ provide: PlatformService, useValue: service }] }).compile();
    app = module.createNestApplication();
    app.use((req: any, _res: any, next: () => void) => { req.user = { ...admin, role: req.headers['x-fixture-role'] }; next(); });
    app.useGlobalGuards(new RolesGuard(new Reflector()));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  afterAll(async () => { await app?.close(); });
  it.each(nonAdmins)('denies both platform setup routes for %s', async role => {
    await request(app.getHttpServer()).get('/admin/school-setup').set('x-fixture-role', role).expect(403);
    await request(app.getHttpServer()).patch('/admin/school-setup/school-b').set('x-fixture-role', role).send({ programme: 'COMBINED' }).expect(403);
  });
  it('serves the explicit setup routes for Super Admin and rejects invalid or extra fields', async () => {
    await request(app.getHttpServer()).get('/admin/school-setup').set('x-fixture-role', 'SUPER_ADMIN').expect(200);
    const saved = await request(app.getHttpServer()).patch('/admin/school-setup/school-b').set('x-fixture-role', 'SUPER_ADMIN').send({ programme: 'COMBINED' }).expect(200);
    expect(saved.body).toEqual({ id: 'school-b', programme: 'COMBINED' });
    for (const body of [{ programme: 'INVALID' }, {}, { programme: 'PRESCHOOL', tenantId: 'injected' }]) {
      await request(app.getHttpServer()).patch('/admin/school-setup/school-b').set('x-fixture-role', 'SUPER_ADMIN').send(body).expect(400);
    }
  });
});
