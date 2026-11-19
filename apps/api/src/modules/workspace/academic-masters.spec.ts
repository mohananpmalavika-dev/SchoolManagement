import { prepareAcademicMaster, setCurrentAcademicMaster } from './academic-masters';
import { recordSpecs } from './records';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from 'node:vm';
import { ModuleKind, transpileModule } from 'typescript';

// Inspect the actual form contract without pulling web JSX/aliases into the API build.
const resourceExports: { schoolResources?: Record<string, { endpoint: string; fields?: { key: string }[] }> } = {};
new Script(transpileModule(readFileSync(resolve(__dirname, '../../../../web/src/lib/resources.ts'), 'utf8'), { compilerOptions: { module: ModuleKind.CommonJS } }).outputText).runInNewContext({ exports: resourceExports });
const schoolResources = resourceExports.schoolResources!;

const tenantId = 'tenant-a';
const date = (value: string) => new Date(value);
function setup() {
  const model = () => ({ findFirst: jest.fn().mockResolvedValue(null), updateMany: jest.fn(), update: jest.fn() });
  const db: any = { academicYear: model(), term: model(), class: model(), stream: model(), subject: model(), student: { count: jest.fn().mockResolvedValue(0) } };
  return db;
}
const term = { name: 'Term 1', academicYearId: 'year-a', termNumber: 1, startDate: date('2026-06-01'), endDate: date('2026-08-31') };
const year = { id: 'year-a', startDate: date('2026-06-01'), endDate: date('2027-03-31') };

describe('Master setup contracts and invariants', () => {
  for (const [name, config] of Object.entries(schoolResources)) {
    const resource = config.endpoint.replace('/workspace/', '');
    const spec = recordSpecs[resource];
    if (!spec || !config.fields) continue;
    it(`${name} exposes all required server fields with supported names`, () => {
      const keys = config.fields!.map(field => field.key);
      expect(keys.every(key => key in spec.fields)).toBe(true);
      for (const [key, rule] of Object.entries(spec.fields)) if (rule.endsWith('!')) expect(keys).toContain(key);
    });
  }
  it('accepts term dates inside the year and rejects dates outside it', async () => {
    const db = setup(); db.academicYear.findFirst.mockResolvedValue(year);
    await expect(prepareAcademicMaster(db, tenantId, 'terms', term)).resolves.toBeUndefined();
    await expect(prepareAcademicMaster(db, tenantId, 'terms', { ...term, endDate: date('2027-04-01') })).rejects.toThrow('within');
  });
  it('rejects duplicate term numbers and overlapping term dates', async () => {
    const db = setup(); db.academicYear.findFirst.mockResolvedValue(year);
    db.term.findFirst.mockResolvedValueOnce({ id: 'duplicate' });
    await expect(prepareAcademicMaster(db, tenantId, 'terms', term)).rejects.toThrow('term number');
    db.term.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'overlap' });
    await expect(prepareAcademicMaster(db, tenantId, 'terms', term)).rejects.toThrow('overlap');
  });
  it.each(['years', 'classes', 'streams', 'subjects'])('rejects duplicate %s in their own scope', async resource => {
    const db = setup(); const model = recordSpecs[resource].model;
    db[model].findFirst.mockResolvedValue({ id: 'duplicate' });
    await expect(prepareAcademicMaster(db, tenantId, resource, { name: 'A', code: 'A', schoolId: 'school-a', classId: 'class-a' })).rejects.toThrow('already exists');
    expect(db[model].findFirst.mock.calls[0][0].where.tenantId).toBe(tenantId);
  });
  it('prevents shrinking a school year around existing terms', async () => {
    const db = setup(); db.academicYear.findFirst.mockResolvedValueOnce(year).mockResolvedValueOnce(null); db.term.findFirst.mockResolvedValue({ id: 'term-a' });
    await expect(prepareAcademicMaster(db, tenantId, 'years', { endDate: date('2026-07-01') }, year.id)).rejects.toThrow('contain all');
  });
  it('rejects a class from another campus and protects occupied sections', async () => {
    const db = setup(); const section = { id: 'section-a', name: 'A', classId: 'class-a', schoolId: 'school-a', capacity: 30 };
    db.class.findFirst.mockResolvedValue({ schoolId: 'school-b' });
    await expect(prepareAcademicMaster(db, tenantId, 'streams', section)).rejects.toThrow('selected active campus');
    db.class.findFirst.mockResolvedValue({ schoolId: 'school-a' });
    db.stream.findFirst.mockResolvedValueOnce(section).mockResolvedValueOnce(null); db.student.count.mockResolvedValue(31);
    await expect(prepareAcademicMaster(db, tenantId, 'streams', { capacity: 30 }, section.id)).rejects.toThrow('capacity');
    db.stream.findFirst.mockResolvedValueOnce(section).mockResolvedValueOnce(null);
    await expect(prepareAcademicMaster(db, tenantId, 'streams', { classId: 'class-b' }, section.id)).rejects.toThrow('Move the students');
  });
  it('sets a term and its parent year current together', async () => {
    const db = setup(); db.term.findFirst.mockResolvedValue({ ...term, id: 'term-a' }); db.academicYear.findFirst.mockResolvedValue(year);
    await setCurrentAcademicMaster(db, tenantId, 'terms', 'term-a');
    expect(db.academicYear.update).toHaveBeenCalledWith({ where: { id: year.id, tenantId }, data: { isCurrent: true } });
    expect(db.term.updateMany).toHaveBeenCalledWith({ where: { tenantId }, data: { isCurrent: false } });
    expect(db.term.update).toHaveBeenCalledWith({ where: { id: 'term-a', tenantId }, data: { isCurrent: true } });
  });
  it('clears current terms belonging to other years when changing the current year', async () => {
    const db = setup(); db.academicYear.findFirst.mockResolvedValue(year);
    await setCurrentAcademicMaster(db, tenantId, 'years', year.id);
    expect(db.term.updateMany).toHaveBeenCalledWith({ where: { tenantId, academicYearId: { not: year.id } }, data: { isCurrent: false } });
  });
  it('rejects missing and foreign records before changing current settings', async () => {
    const db = setup();
    await expect(setCurrentAcademicMaster(db, tenantId, 'terms', 'foreign')).rejects.toThrow('not found');
    expect(db.academicYear.updateMany).not.toHaveBeenCalled();
  });
});
