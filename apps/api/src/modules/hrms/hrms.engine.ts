import { BadRequestException, ConflictException } from '@nestjs/common';

export function hrDate(value: string) {
  const date = new Date(value + 'T00:00:00.000Z');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException('Choose a valid calendar date');
  return date;
}
export const hrDay = (value: Date) => value.toISOString().slice(0, 10);
export function hrLocalDay(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day'].map((key) => parts.find((p) => p.type === key)!.value).join('-');
}
export function hrLocalTime(now: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}
export function hrTimestamp(day: string, time: string, timezone: string) {
  const base = hrDate(day).getTime(),
    [h, m] = time.split(':').map(Number);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new BadRequestException('Choose a valid time');
  let guess = base + (h * 60 + m) * 60000;
  for (let n = 0; n < 3; n++) {
    const localDay = hrLocalDay(new Date(guess), timezone),
      [lh, lm] = hrLocalTime(new Date(guess), timezone).split(':').map(Number);
    guess += base + (h * 60 + m) * 60000 - (hrDate(localDay).getTime() + (lh * 60 + lm) * 60000);
  }
  const result = new Date(guess);
  if (hrLocalDay(result, timezone) !== day || hrLocalTime(result, timezone) !== time)
    throw new BadRequestException('This local time does not exist in the school timezone');
  return result;
}
export function hrLeaveDays(start: string, end: string, halfDay = false) {
  const a = hrDate(start),
    b = hrDate(end);
  if (b < a || a.getUTCFullYear() !== b.getUTCFullYear())
    throw new BadRequestException(
      'Leave must be within one calendar year with end date on or after start date'
    );
  if (halfDay && start !== end)
    throw new BadRequestException('Half-day leave must use a single date');
  return halfDay ? 0.5 : (b.getTime() - a.getTime()) / 86400000 + 1;
}
export function hrPunchState(punches: { punchType: string; punchTime: Date }[]) {
  let state = 'OUT',
    firstIn: Date | null = null,
    lastOut: Date | null = null,
    activeSince: Date | null = null,
    previous: Date | null = null,
    minutes = 0;
  for (const punch of punches) {
    if (!Number.isFinite(punch.punchTime.getTime()) || (previous && punch.punchTime < previous))
      throw new ConflictException('Punch times must be chronological');
    previous = punch.punchTime;
    if (punch.punchType === 'CHECK_IN' && state === 'OUT' && !firstIn) {
      state = 'IN';
      firstIn = activeSince = punch.punchTime;
    } else if (punch.punchType === 'BREAK_OUT' && state === 'IN') {
      minutes += (punch.punchTime.getTime() - activeSince!.getTime()) / 60000;
      state = 'BREAK';
      activeSince = null;
    } else if (punch.punchType === 'BREAK_IN' && state === 'BREAK') {
      state = 'IN';
      activeSince = punch.punchTime;
    } else if (punch.punchType === 'CHECK_OUT' && state === 'IN') {
      minutes += (punch.punchTime.getTime() - activeSince!.getTime()) / 60000;
      lastOut = punch.punchTime;
      state = 'FINISHED';
      activeSince = null;
    } else
      throw new ConflictException(
        'Invalid punch sequence. Check in, finish any break, then check out once.'
      );
  }
  return { state, firstIn, lastOut, totalWorkMinutes: Math.max(0, Math.floor(minutes)) };
}
export const hrRound = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export interface SalaryLine {
  amount: number;
  component: {
    id?: string;
    code: string;
    name: string;
    type: string;
    calculationType: string;
    percentage: number | null;
    isStatutory: boolean;
    statutoryType?: string;
  };
}
export function hrSalary(
  base: number,
  lines: SalaryLine[],
  profile?: { pfApplicable: boolean; esiApplicable: boolean } | null
) {
  if (!Number.isFinite(base) || base <= 0 || !lines.length)
    throw new BadRequestException('Configure a positive base salary and salary structure');
  const codes = new Set<string>();
  if (profile)
    for (const scheme of ['PF', 'ESI'] as const) {
      if (
        profile[scheme === 'PF' ? 'pfApplicable' : 'esiApplicable'] &&
        !lines.some((l) => l.component.isStatutory && l.component.statutoryType === scheme)
      )
        throw new BadRequestException(
          'Configure a reviewed ' + scheme + ' component for this employee'
        );
    }
  const items = lines.map(({ amount, component: c }) => {
    if (codes.has(c.code)) throw new BadRequestException('Salary components cannot be repeated');
    codes.add(c.code);
    if (!['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'].includes(c.type))
      throw new BadRequestException('Unsupported salary component type');
    let value: number;
    if (c.calculationType === 'BASE') value = base;
    else if (c.calculationType === 'FIXED') value = amount;
    else if (
      c.calculationType === 'PERCENT_OF_BASIC' &&
      Number.isFinite(c.percentage) &&
      c.percentage! >= 0 &&
      c.percentage! <= 100
    )
      value = (base * c.percentage!) / 100;
    else
      throw new BadRequestException(
        'Unsupported salary calculation. Configure BASE, FIXED or PERCENT_OF_BASIC.'
      );
    if (!Number.isFinite(value) || value < 0)
      throw new BadRequestException('Salary amounts must be non-negative');
    if (c.calculationType === 'BASE' && (c.code !== 'BASIC' || c.type !== 'EARNING'))
      throw new BadRequestException('BASE is reserved for the BASIC earning component');
    const scheme = c.statutoryType || (c.isStatutory ? 'OTHER' : 'NONE');
    if (
      (c.isStatutory && !['PF', 'ESI', 'OTHER'].includes(scheme)) ||
      (!c.isStatutory && scheme !== 'NONE') ||
      (c.isStatutory && c.type === 'EARNING')
    )
      throw new BadRequestException(
        'Choose a valid statutory deduction or employer contribution scheme'
      );
    if (c.isStatutory && profile === null)
      throw new BadRequestException('Review the employee statutory profile before payroll');
    if (
      profile &&
      ((scheme === 'PF' && !profile.pfApplicable) || (scheme === 'ESI' && !profile.esiApplicable))
    )
      value = 0;
    return {
      code: c.code,
      name: c.name,
      type: c.type,
      amount: hrRound(value),
      isStatutory: c.isStatutory,
      statutoryType: scheme,
    };
  });
  if (
    !items.some((c) => c.code === 'BASIC' && c.type === 'EARNING') ||
    !lines.some((l) => l.component.code === 'BASIC' && l.component.calculationType === 'BASE')
  )
    throw new BadRequestException('Add a BASIC earning component with BASE calculation');
  const sum = (type: string) =>
    hrRound(items.filter((i) => i.type === type).reduce((n, i) => n + i.amount, 0));
  if (sum('DEDUCTION') > sum('EARNING'))
    throw new BadRequestException('Deductions exceed earnings');
  return {
    items,
    gross: sum('EARNING'),
    deductions: sum('DEDUCTION'),
    employerContributions: sum('EMPLOYER_CONTRIBUTION'),
  };
}

export function hrAttendanceRule(
  shift: {
    startTime: string;
    endTime: string;
    graceMinutes: number;
    halfDayMinutes: number;
    fullDayMinutes?: number | null;
  },
  workedMinutes: number,
  firstIn: Date,
  complete: boolean,
  timezone: string
) {
  const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  const duration = minutes(shift.endTime) - minutes(shift.startTime);
  const full = shift.fullDayMinutes ?? duration;
  if (
    !Number.isInteger(full) ||
    full < shift.halfDayMinutes ||
    full > duration ||
    shift.halfDayMinutes <= 0
  )
    throw new BadRequestException('Configure valid half-day and full-day net-work thresholds');
  const late = Math.max(0, minutes(hrLocalTime(firstIn, timezone)) - minutes(shift.startTime));
  const lateMinutes = late > shift.graceMinutes ? late : 0;
  return {
    lateMinutes,
    overtimeMinutes: complete ? Math.max(0, workedMinutes - full) : 0,
    status:
      complete && workedMinutes < shift.halfDayMinutes
        ? 'ABSENT'
        : complete && workedMinutes < full
          ? 'HALF_DAY'
          : lateMinutes
            ? 'LATE'
            : 'PRESENT',
  };
}
