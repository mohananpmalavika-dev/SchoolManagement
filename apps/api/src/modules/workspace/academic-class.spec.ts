import 'reflect-metadata';
import { prepareAcademicClass } from './academic-class';
import { schoolEducationLevels } from '../preschool/school-programme';
import { WorkspaceService } from './workspace.service';
import { parseRecord, recordSpecs } from './records';

const tenantId = '11111111-1111-4111-8111-111111111111';
const schoolId = '22222222-2222-4222-8222-222222222222';
const user = { userId: 'principal', role: 'PRINCIPAL' };
function setup(programme = 'PRESCHOOL') {
  const db: any = {
    school: { findFirst: jest.fn().mockResolvedValue({ id: schoolId, programme }), findMany: jest.fn().mockResolvedValue([{ programme, educationLevel: ['PRIMARY'] }]), create: jest.fn().mockResolvedValue({ id: schoolId }) },
    class: { findFirst: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'class-1' }), update: jest.fn().mockResolvedValue({ id: 'class-1' }) },
    tenant: { update: jest.fn() }, auditLog: { create: jest.fn() },
  };
  db.$transaction = jest.fn(async work => work(db));
  return { db, service: new WorkspaceService(db, { requireTenantContext: () => tenantId } as any, {} as any, {} as any, {} as any, {} as any, {} as any) };
}
const classData = { schoolId, name: 'Nursery A', level: 'Nursery', educationLevel: 'PRE_PRIMARY', preschoolStage: 'NURSERY' };
describe('Programme-aware class setup', () => {
  it.each(['PRIMARY', 'MIDDLE', 'SECONDARY', 'SENIOR_SECONDARY'])('rejects %s classes at a preschool campus through workspace writes', async educationLevel => {
    const { db, service } = setup();
    await expect(service.write(user, 'classes', { schoolId, name: 'Wrong class', level: '1', educationLevel })).rejects.toThrow('only have pre-primary');
    expect(db.class.create).not.toHaveBeenCalled();
  });
  it.each(['PLAYGROUP', 'NURSERY', 'LKG', 'UKG'])('creates a usable pre-primary class with %s stage', async preschoolStage => {
    const { db, service } = setup();
    await service.write(user, 'classes', { ...classData, preschoolStage });
    expect(db.class.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tenantId, schoolId, educationLevel: 'PRE_PRIMARY', preschoolStage }) });
    expect(db.school.findFirst).toHaveBeenLastCalledWith({ where: { id: schoolId, tenantId, isActive: true }, select: { programme: true } });
  });
  it('requires a stage, rejects invalid stages and prevents changing school type through the class form', async () => {
    const { service } = setup(); const { preschoolStage, ...withoutStage } = classData;
    await expect(service.write(user, 'classes', withoutStage)).rejects.toThrow('Choose Playgroup');
    expect(() => parseRecord(recordSpecs.classes, { ...classData, preschoolStage: 'CLASS_1' })).toThrow('Invalid preschoolStage');
    expect(() => parseRecord(recordSpecs.classes, { ...classData, programme: 'COMBINED' })).toThrow('Unknown field');
  });
  it('keeps regular classes available in standard and combined schools', async () => {
    for (const programme of ['STANDARD', 'COMBINED']) {
      const { db, service } = setup(programme);
      await service.write(user, 'classes', { schoolId, name: 'Class 1', level: '1', educationLevel: 'PRIMARY' });
      expect(db.class.create).toHaveBeenCalledWith({ data: expect.objectContaining({ educationLevel: 'PRIMARY' }) });
    }
    const { service } = setup('COMBINED'); await expect(service.write(user, 'classes', { ...classData, preschoolStage: undefined })).rejects.toThrow('Choose Playgroup');
  });
  it('uses the saved campus on partial edits and rejects a missing/foreign campus', async () => {
    const { db } = setup(); db.class.findFirst.mockResolvedValue({ ...classData });
    const data = { name: 'Updated nursery' };
    await prepareAcademicClass(db, tenantId, data, 'class-1');
    expect(db.school.findFirst.mock.calls[0][0].where).toEqual({ id: schoolId, tenantId, isActive: true });
    db.school.findFirst.mockResolvedValue(null);
    await expect(prepareAcademicClass(db, tenantId, data, 'class-1')).rejects.toThrow('unavailable');
  });
  it('lets principals create another campus without changing a preschool tenant to regular-school mode', async () => {
    const { db, service } = setup();
    await service.write(user, 'schools', { name: 'Preschool campus', email: 'campus@example.test', phone: '919847000101', address: 'School Road', city: 'Kochi', state: 'Kerala', schoolType: 'PRIVATE' });
    expect(db.school.create).toHaveBeenCalledWith({ data: expect.objectContaining({ programme: 'PRESCHOOL', educationLevel: ['PRE_PRIMARY'], tenantId }) });
  });
  it('keeps programme metadata consistent without losing regular-school levels', () => {
    expect(schoolEducationLevels('PRESCHOOL', ['PRIMARY', 'SECONDARY'])).toEqual(['PRE_PRIMARY']);
    expect(schoolEducationLevels('STANDARD', ['PRE_PRIMARY', 'SECONDARY'])).toEqual(['SECONDARY']);
    expect(schoolEducationLevels('COMBINED', ['SECONDARY'])).toEqual(['PRE_PRIMARY', 'SECONDARY']);
  });
});
