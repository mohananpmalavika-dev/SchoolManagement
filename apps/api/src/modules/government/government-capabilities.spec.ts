import { ConfigService } from '@nestjs/config';

import { BoardExamService } from './services/board-exam.service';
import { UdiseService } from './services/udise.service';

describe('Official government capabilities', () => {
  const db: any = {
    udiseIntegration: { findFirst: jest.fn(), upsert: jest.fn() },
    boardIntegration: { findFirst: jest.fn(), upsert: jest.fn() },
  };
  const udise = new UdiseService(db, new ConfigService(), {} as any);
  const board = new BoardExamService(db, new ConfigService(), {} as any);
  it.each([
    'syncStudentEnrollment',
    'syncTeacherData',
    'syncSchoolProfile',
    'syncAttendanceData',
    'performFullSync',
  ])('rejects unconfigured UDISE %s before storing fabricated official records', async (method) => {
    await expect((udise as any)[method]('tenant', new Date(), new Date())).rejects.toMatchObject({
      status: 501,
    });
  });
  it.each([
    'registerCandidates',
    'downloadResults',
    'getExamTimetable',
    'submitIrregularityReport',
  ])('rejects unconfigured board %s before storing fabricated results', async (method) => {
    await expect((board as any)[method]('tenant', 2026, 'CBSE_AISSE')).rejects.toMatchObject({
      status: 501,
    });
  });
  it('omits encrypted credentials and reports unavailable external integrations', async () => {
    const row = {
      id: 'integration',
      tenantId: 'tenant',
      apiKey: 'encrypted-key',
      apiSecret: 'encrypted-secret',
    };
    db.udiseIntegration.findFirst.mockResolvedValue(row);
    db.boardIntegration.findFirst.mockResolvedValue(row);
    for (const service of [udise, board]) {
      const result = await service.getIntegration('tenant');
      expect(result).toMatchObject({ id: 'integration', externalApiAvailable: false });
      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('apiSecret');
    }
  });
  it.each([
    [udise, db.udiseIntegration, 'udiseSchoolCode'],
    [board, db.boardIntegration, 'affiliationNumber'],
  ])('scopes integration initialization to its school even for a globally unique code', async (service, model, field) => {
    model.upsert.mockResolvedValue({ tenantId: 'tenant', apiKey: 'secret', apiSecret: 'secret' });
    const result = await service.initializeIntegration('tenant', '12345678901');
    expect(model.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { [field]: '12345678901', tenantId: 'tenant' },
      create: expect.objectContaining({ tenantId: 'tenant', isEnabled: false }),
      update: expect.objectContaining({ isEnabled: false }),
    }));
    expect(result).not.toHaveProperty('apiKey');
    expect(result).not.toHaveProperty('apiSecret');
    expect(result.externalApiAvailable).toBe(false);
  });
});
