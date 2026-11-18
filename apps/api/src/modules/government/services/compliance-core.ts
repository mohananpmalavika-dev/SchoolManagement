import { createHash, randomUUID } from 'node:crypto';

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

export type Db = Prisma.TransactionClient;
export type Issue = {
  severity: 'ERROR' | 'WARNING';
  entityId?: string;
  entityType?: string;
  field: string;
  message: string;
};
export const REPORTS = [
  'ENROLLMENT_STATISTICS',
  'ATTENDANCE_SUMMARY',
  'TEACHER_DATA_REPORT',
  'EXAMINATION_ANALYSIS',
  'FINANCIAL_SUMMARY',
];
export const TEMPLATES = [
  'SCHOOL_REPORT',
  'CBSE_OASIS_LOC',
  'ICSE_COUNCIL_RETURN',
  'STATE_BOARD_ANNUAL_RETURN',
  'UDISE_PLUS_SDMIS',
  'APAAR_PEN_REGISTRY',
  'TEACHER_MANDATORY_DISCLOSURE',
  'EXAM_BOARD_REGISTER',
];
export const GENESIS = '0'.repeat(64);
export const json = (value: unknown): any => JSON.parse(JSON.stringify(value));
export const stable = (value: any): string =>
  value === null || typeof value !== 'object'
    ? JSON.stringify(value)
    : Array.isArray(value)
      ? '[' + value.map(stable).join(',') + ']'
      : '{' +
        Object.keys(value)
          .sort()
          .map((k) => JSON.stringify(k) + ':' + stable(value[k]))
          .join(',') +
        '}';
export const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export const round = (value: number) => Math.round(value * 100) / 100;
export const day = (value: Date | string) => new Date(value).toISOString().slice(0, 10);
export const fullName = (row: any) =>
  [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ');
export const countBy = (rows: any[], key: string): Record<string, number> =>
  rows.reduce((a, row) => {
    const k = String(row[key] ?? 'UNSPECIFIED');
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
export function parseDate(value: string) {
  const text = value.slice(0, 10),
    date = new Date(text + 'T00:00:00.000Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(date.getTime()) || day(date) !== text)
    throw new BadRequestException('Choose a valid calendar date');
  return date;
}
export function bounds(dto: {
  reportYear: number;
  reportMonth?: number;
  reportQuarter?: number;
  startDate?: string;
  endDate?: string;
}) {
  if (!Number.isInteger(dto.reportYear) || dto.reportYear < 2020 || dto.reportYear > 2100)
    throw new BadRequestException('Choose a reporting year from 2020 to 2100');
  if (dto.reportMonth && dto.reportQuarter)
    throw new BadRequestException('Choose a month or quarter, not both');
  if (
    dto.reportMonth &&
    (!Number.isInteger(dto.reportMonth) || dto.reportMonth < 1 || dto.reportMonth > 12)
  )
    throw new BadRequestException('Invalid reporting month');
  if (
    dto.reportQuarter &&
    (!Number.isInteger(dto.reportQuarter) || dto.reportQuarter < 1 || dto.reportQuarter > 4)
  )
    throw new BadRequestException('Invalid reporting quarter');
  if (!!dto.startDate !== !!dto.endDate)
    throw new BadRequestException('Both period dates are required');
  const month = dto.reportMonth
    ? dto.reportMonth - 1
    : dto.reportQuarter
      ? (dto.reportQuarter - 1) * 3
      : 0;
  const start = dto.startDate
    ? parseDate(dto.startDate)
    : new Date(Date.UTC(dto.reportYear, month, 1));
  const end = dto.endDate
    ? parseDate(dto.endDate)
    : new Date(
        Date.UTC(
          dto.reportYear,
          dto.reportMonth ? month + 1 : dto.reportQuarter ? month + 3 : 12,
          0
        )
      );
  if (start > end || end.getTime() - start.getTime() > 366 * 86400000)
    throw new BadRequestException('Choose an ordered reporting period of at most 367 days');
  if (start.getUTCFullYear() !== dto.reportYear)
    throw new BadRequestException('Reporting year must match the first day of the period');
  return { start, end, exclusive: new Date(end.getTime() + 86400000) };
}
export function limit<T>(rows: T[]): T[] {
  if (rows.length > 50000)
    throw new BadRequestException(
      'Choose a smaller reporting period; reports support at most 50,000 records'
    );
  return rows;
}
export async function atomic<T>(
  db: PrismaService,
  tenantId: string,
  work: (tx: Db) => Promise<T>
): Promise<T> {
  if (!tenantId) throw new ForbiddenException('School context is required');
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`compliance:${tenantId}`}))`;
      return work(tx);
    },
    { maxWait: 15000, timeout: 30000 }
  );
}
// Call only while holding the tenant transaction lock; the chain and mutation commit together.
export async function append(
  tx: Db,
  tenantId: string,
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  payload: unknown
) {
  const last = await tx.complianceLedger.findFirst({
    where: { tenantId },
    orderBy: { sequence: 'desc' },
  });
  const event = {
    id: randomUUID(),
    tenantId,
    sequence: (last?.sequence || 0) + 1,
    actorId,
    entityType,
    entityId,
    action,
    payload: json(payload),
    previousHash: last?.currentHash || GENESIS,
    createdAt: new Date(),
  };
  return tx.complianceLedger.create({ data: { ...event, currentHash: sha(stable(json(event))) } });
}
export async function calendar(db: Db, tenantId: string, start: Date, end: Date) {
  const [terms, holidays] = await Promise.all([
    db.term.findMany({ where: { tenantId, startDate: { lte: end }, endDate: { gte: start } } }),
    db.schoolEvent.findMany({
      where: {
        tenantId,
        isHoliday: true,
        startDate: { lte: new Date(end.getTime() + 86399999) },
        endDate: { gte: start },
      },
    }),
  ]);
  if (!terms.length)
    throw new BadRequestException(
      'Configure school terms for this period before assessing attendance'
    );
  const dates: string[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += 86400000) {
    const date = new Date(time),
      k = day(date),
      weekday = date.getUTCDay();
    if (
      weekday &&
      weekday !== 6 &&
      terms.some((t) => day(t.startDate) <= k && day(t.endDate) >= k) &&
      !holidays.some((h) => day(h.startDate) <= k && day(h.endDate) >= k)
    )
      dates.push(k);
  }
  return { dates, basis: 'Monday–Friday within configured terms, excluding saved school holidays' };
}
