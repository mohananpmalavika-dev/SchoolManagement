import { BadRequestException } from '@nestjs/common';
import { hrDate, hrDay, hrLeaveDays } from './hrms.engine';

export interface LeavePolicy {
  daysPerYear: number;
  accrualMethod?: string;
  prorateJoiningYear?: boolean;
  waitingDays?: number;
  dayBasis?: string;
  workingWeekdays?: number[];
  excludedDates?: string[];
  allowHalfDay?: boolean;
  maxDaysPerRequest?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
}
const dayMs = 86400000;
export function leaveDates(start: string, end: string, policy: LeavePolicy) {
  hrLeaveDays(start, end);
  const dates: string[] = [];
  for (let t = hrDate(start).getTime(); t <= hrDate(end).getTime(); t += dayMs) {
    const date = new Date(t),
      day = hrDay(date);
    if (policy.excludedDates?.includes(day)) continue;
    if (
      policy.dayBasis === 'WORKING_DAYS' &&
      !(policy.workingWeekdays || [1, 2, 3, 4, 5]).includes(date.getUTCDay() || 7)
    )
      continue;
    dates.push(day);
  }
  return dates;
}
export function leaveCharge(
  start: string,
  end: string,
  half: boolean,
  session: string | undefined,
  policy: LeavePolicy
) {
  hrLeaveDays(start, end, half);
  if (
    (policy.effectiveFrom && hrDate(start) < policy.effectiveFrom) ||
    (policy.effectiveTo && hrDate(end) > policy.effectiveTo)
  )
    throw new BadRequestException('Selected dates are outside the leave policy effective period');
  if (
    (half && (policy.allowHalfDay === false || !['AM', 'PM'].includes(session || ''))) ||
    (!half && session)
  )
    throw new BadRequestException(
      'Half-day leave requires an allowed AM or PM session; full days have no session'
    );
  const dates = leaveDates(start, end, policy),
    count = half ? (dates.length ? 0.5 : 0) : dates.length;
  if (!count || count > (policy.maxDaysPerRequest ?? 366))
    throw new BadRequestException(
      'Selected dates have no chargeable leave or exceed the policy request limit'
    );
  return { dates, count };
}
type RequestDays = {
  startDate: Date;
  endDate: Date;
  isHalfDay: boolean;
  halfDaySession?: string | null;
  chargedDates?: string[];
};
export function leaveCovers(row: RequestDays, day: string) {
  return row.chargedDates?.length
    ? row.chargedDates.includes(day)
    : hrDay(row.startDate) <= day && hrDay(row.endDate) >= day;
}
export function leavesOverlap(row: RequestDays, dates: string[], half: boolean, session?: string) {
  return dates.some(
    (day) =>
      leaveCovers(row, day) &&
      (!half || !row.isHalfDay || !row.halfDaySession || row.halfDaySession === session)
  );
}
export function leaveEntitlement(
  policy: LeavePolicy,
  joining: Date,
  exit: Date | null,
  year: number,
  asOf: string
) {
  const start = hrDate(`${year}-01-01`),
    end = hrDate(`${year}-12-31`),
    today = hrDate(asOf);
  const eligible = new Date(
    Math.max(
      joining.getTime() + (policy.waitingDays || 0) * dayMs,
      policy.effectiveFrom?.getTime() ?? -Infinity
    )
  );
  if (policy.effectiveTo && (policy.effectiveTo < start || eligible > policy.effectiveTo)) return 0;
  if (today < start || eligible > end || eligible > today || (exit && exit < start)) return 0;
  const halfFloor = (n: number) => Math.floor((n + 1e-9) * 2) / 2;
  if (policy.accrualMethod !== 'MONTHLY') {
    if (policy.prorateJoiningYear && eligible > start)
      return halfFloor(
        (policy.daysPerYear * (end.getTime() - eligible.getTime() + dayMs)) /
          (end.getTime() - start.getTime() + dayMs)
      );
    return policy.daysPerYear;
  }
  const through = new Date(
    Math.min(
      today.getTime(),
      end.getTime(),
      exit?.getTime() ?? Infinity,
      policy.effectiveTo?.getTime() ?? Infinity
    )
  );
  let units = 0;
  for (let month = 0; month < 12; month++) {
    const first = new Date(Date.UTC(year, month, 1)),
      last = new Date(Date.UTC(year, month + 1, 0));
    if (last > through || eligible > last) continue;
    if (eligible <= first) units++;
    else if (policy.prorateJoiningYear)
      units +=
        (last.getTime() - eligible.getTime() + dayMs) / (last.getTime() - first.getTime() + dayMs);
  }
  return halfFloor((policy.daysPerYear * units) / 12);
}
export function leaveDocumentUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return value;
  } catch {}
  throw new BadRequestException('Use a valid HTTPS document link without embedded credentials');
}
