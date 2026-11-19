import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@krypton/database';

// Call after acquiring the tenant row lock so competing setup changes are serialized.
export async function prepareAcademicMaster(db: Prisma.TransactionClient, tenantId: string, resource: string, data: Record<string, any>, id?: string) {
  const models = { years: 'academicYear', terms: 'term', classes: 'class', streams: 'stream', subjects: 'subject' } as const;
  const model = models[resource as keyof typeof models];
  if (!model) return;
  const table = db[model] as any;
  const existing = id ? await table.findFirst({ where: { id, tenantId } }) : null;
  if (id && !existing) throw new NotFoundException('Record not found');
  const next = { ...existing, ...data };
  if (['years', 'terms'].includes(resource) && next.startDate > next.endDate) throw new BadRequestException('End date must follow start date');
  const identity = resource === 'subjects' ? { code: { equals: next.code, mode: 'insensitive' } }
    : resource === 'terms' ? { academicYearId: next.academicYearId, termNumber: next.termNumber }
    : { name: { equals: next.name, mode: 'insensitive' }, ...(resource === 'classes' ? { schoolId: next.schoolId } : resource === 'streams' ? { classId: next.classId } : {}) };
  if (await table.findFirst({ where: { tenantId, ...(id ? { id: { not: id } } : {}), ...identity } })) {
    throw new ConflictException(resource === 'terms' ? 'This term number already exists in the selected school year' : 'A record with this name or code already exists');
  }
  if (resource === 'terms') {
    const year = await db.academicYear.findFirst({ where: { id: next.academicYearId, tenantId } });
    if (!year) throw new BadRequestException('Selected school year is unavailable');
    if (next.startDate < year.startDate || next.endDate > year.endDate) throw new BadRequestException('Term dates must fall within the selected school year');
    if (await db.term.findFirst({ where: { tenantId, academicYearId: next.academicYearId, ...(id ? { id: { not: id } } : {}), startDate: { lte: next.endDate }, endDate: { gte: next.startDate } } })) throw new ConflictException('Term dates overlap another term in this school year');
    if (existing?.isCurrent && data.academicYearId && data.academicYearId !== existing.academicYearId) throw new BadRequestException('Set another term current before moving the current term to a different year');
  }
  if (resource === 'years' && id && await db.term.findFirst({ where: { tenantId, academicYearId: id, OR: [{ startDate: { lt: next.startDate } }, { endDate: { gt: next.endDate } }] } })) throw new BadRequestException('School year dates must contain all of its terms');
  if (resource === 'streams') {
    const classroom = await db.class.findFirst({ where: { id: next.classId, tenantId, school: { isActive: true } } });
    if (!classroom || classroom.schoolId !== next.schoolId) throw new BadRequestException('Choose a class from the selected active campus');
    if (id && (next.classId !== existing.classId || next.schoolId !== existing.schoolId) && await db.student.count({ where: { tenantId, currentStreamId: id } })) throw new BadRequestException('Move the students out of this section before changing its class or campus');
    if (id && await db.student.count({ where: { tenantId, currentStreamId: id, status: 'ACTIVE', deletedAt: null } }) > next.capacity) throw new BadRequestException('Section capacity cannot be smaller than its active student count');
  }
}

export async function setCurrentAcademicMaster(db: Prisma.TransactionClient, tenantId: string, resource: 'years' | 'terms', id: string) {
  const table = resource === 'years' ? db.academicYear : db.term;
  const row = await (table as any).findFirst({ where: { id, tenantId } });
  if (!row) throw new NotFoundException('Record not found');
  const yearId = resource === 'years' ? id : row.academicYearId;
  if (!await db.academicYear.findFirst({ where: { id: yearId, tenantId } })) throw new BadRequestException('Selected school year is unavailable');
  await db.academicYear.updateMany({ where: { tenantId }, data: { isCurrent: false } });
  await db.academicYear.update({ where: { id: yearId, tenantId }, data: { isCurrent: true } });
  await db.term.updateMany({ where: { tenantId, ...(resource === 'years' ? { academicYearId: { not: yearId } } : {}) }, data: { isCurrent: false } });
  if (resource === 'terms') await db.term.update({ where: { id, tenantId }, data: { isCurrent: true } });
}
