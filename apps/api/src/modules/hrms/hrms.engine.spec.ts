import {
  hrDate,
  hrLeaveDays,
  hrLocalDay,
  hrPunchState,
  hrSalary,
  hrTimestamp,
  hrAttendanceRule,
} from './hrms.engine';
import { parseHrMaster } from './hrms-masters';
const component = {
  code: 'BASIC',
  name: 'Basic',
  type: 'EARNING',
  calculationType: 'BASE',
  percentage: null,
  isStatutory: false,
};
describe('HR payroll, attendance and master invariants', () => {
  it('applies explicit net-work thresholds, grace boundaries and overtime after excluding breaks', () => {
    const shift = {
      startTime: '09:00',
      endTime: '17:00',
      graceMinutes: 10,
      halfDayMinutes: 240,
      fullDayMinutes: 420,
    };
    const at = (time: string) => hrTimestamp('2026-10-01', time, 'Asia/Kolkata');
    expect(hrAttendanceRule(shift, 420, at('09:00'), true, 'Asia/Kolkata')).toMatchObject({
      status: 'PRESENT',
      overtimeMinutes: 0,
    });
    expect(hrAttendanceRule(shift, 239, at('09:00'), true, 'Asia/Kolkata').status).toBe('ABSENT');
    expect(hrAttendanceRule(shift, 240, at('09:00'), true, 'Asia/Kolkata').status).toBe('HALF_DAY');
    expect(hrAttendanceRule(shift, 480, at('09:10'), true, 'Asia/Kolkata')).toMatchObject({
      status: 'PRESENT',
      lateMinutes: 0,
      overtimeMinutes: 60,
    });
    expect(hrAttendanceRule(shift, 420, at('09:11'), true, 'Asia/Kolkata')).toMatchObject({
      status: 'LATE',
      lateMinutes: 11,
    });
    expect(() =>
      hrAttendanceRule({ ...shift, fullDayMinutes: 200 }, 420, at('09:00'), true, 'Asia/Kolkata')
    ).toThrow('thresholds');
    expect(() => hrTimestamp('2026-03-08', '02:30', 'America/New_York')).toThrow('does not exist');
  });
  it('requires reviewed statutory applicability and excludes inapplicable PF/ESI without changing employer contributions into deductions', () => {
    const lines = [
      { amount: 0, component },
      ...(['PF', 'ESI'] as const).flatMap((scheme) => [
        {
          amount: 0,
          component: {
            ...component,
            code: scheme,
            name: scheme,
            isStatutory: true,
            statutoryType: scheme,
            type: 'DEDUCTION',
            calculationType: 'PERCENT_OF_BASIC',
            percentage: 10,
          },
        },
        {
          amount: 0,
          component: {
            ...component,
            code: scheme + '_EMPLOYER',
            name: scheme,
            isStatutory: true,
            statutoryType: scheme,
            type: 'EMPLOYER_CONTRIBUTION',
            calculationType: 'PERCENT_OF_BASIC',
            percentage: 5,
          },
        },
      ]),
    ];
    expect(() => hrSalary(30000, lines, null)).toThrow('statutory profile');
    expect(hrSalary(30000, lines, { pfApplicable: true, esiApplicable: false })).toMatchObject({
      gross: 30000,
      deductions: 3000,
      employerContributions: 1500,
    });
    expect(hrSalary(30000, lines, { pfApplicable: false, esiApplicable: false }).deductions).toBe(
      0
    );
    expect(() =>
      hrSalary(30000, [{ amount: 0, component }], { pfApplicable: true, esiApplicable: false })
    ).toThrow('PF component');
  });
  it('rejects impossible dates and applies the school timezone', () => {
    expect(() => hrDate('2026-02-30')).toThrow();
    expect(hrLocalDay(new Date('2026-11-19T20:00:00Z'), 'Asia/Kolkata')).toBe('2026-11-20');
    expect(hrTimestamp('2026-11-20', '09:00', 'Asia/Kolkata').toISOString()).toBe(
      '2026-11-20T03:30:00.000Z'
    );
    expect(hrTimestamp('2026-11-20', '09:00', 'America/New_York').toISOString()).toBe(
      '2026-11-20T14:00:00.000Z'
    );
  });
  it('counts inclusive calendar leave and restricts half-days and year boundaries', () => {
    expect(hrLeaveDays('2026-11-20', '2026-11-22')).toBe(3);
    expect(hrLeaveDays('2026-11-20', '2026-11-20', true)).toBe(0.5);
    expect(() => hrLeaveDays('2026-11-22', '2026-11-20')).toThrow();
    expect(() => hrLeaveDays('2026-12-31', '2027-01-01')).toThrow();
    expect(() => hrLeaveDays('2026-11-20', '2026-11-22', true)).toThrow();
  });
  it('computes time excluding breaks with no checkout on an open day', () => {
    const punch = (punchType: string, hour: number) => ({
      punchType,
      punchTime: new Date(Date.UTC(2026, 10, 20, hour)),
    });
    const start = punch('CHECK_IN', 9);
    expect(hrPunchState([start])).toMatchObject({
      state: 'IN',
      lastOut: null,
      totalWorkMinutes: 0,
    });
    expect(
      hrPunchState([start, punch('BREAK_OUT', 12), punch('BREAK_IN', 13), punch('CHECK_OUT', 18)])
    ).toMatchObject({ state: 'FINISHED', totalWorkMinutes: 480 });
    expect(() => hrPunchState([punch('CHECK_OUT', 9)])).toThrow('sequence');
    expect(() => hrPunchState([start, punch('CHECK_IN', 10)])).toThrow('sequence');
    expect(() => hrPunchState([start, punch('BREAK_OUT', 12), punch('CHECK_OUT', 18)])).toThrow(
      'sequence'
    );
    expect(() => hrPunchState([start, punch('CHECK_OUT', 18), punch('CHECK_IN', 19)])).toThrow(
      'sequence'
    );
  });
  it('uses only configured components and keeps employer contributions separate', () => {
    const calculated = hrSalary(30000, [
      { amount: 0, component },
      { amount: 1000, component: { ...component, code: 'ALLOWANCE', calculationType: 'FIXED' } },
      {
        amount: 0,
        component: {
          ...component,
          code: 'DEDUCTION',
          type: 'DEDUCTION',
          calculationType: 'PERCENT_OF_BASIC',
          percentage: 10,
        },
      },
      {
        amount: 500,
        component: {
          ...component,
          code: 'EMPLOYER',
          type: 'EMPLOYER_CONTRIBUTION',
          calculationType: 'FIXED',
        },
      },
    ]);
    expect(calculated.gross).toBe(31000);
    expect(calculated.deductions).toBe(3000);
    expect(calculated.employerContributions).toBe(500);
    expect(calculated.items.map((c) => c.code)).toEqual([
      'BASIC',
      'ALLOWANCE',
      'DEDUCTION',
      'EMPLOYER',
    ]);
  });
  it('refuses missing salaries, missing base components, unsupported rates and excess deductions', () => {
    expect(() => hrSalary(0, [{ amount: 0, component }])).toThrow();
    expect(() => hrSalary(25000, [])).toThrow();
    expect(() =>
      hrSalary(100, [{ amount: 0, component: { ...component, code: 'OTHER' } }])
    ).toThrow();
    expect(() =>
      hrSalary(100, [
        { amount: 0, component },
        {
          amount: 200,
          component: { ...component, code: 'D', type: 'DEDUCTION', calculationType: 'FIXED' },
        },
      ])
    ).toThrow('exceed');
    expect(() =>
      hrSalary(100, [
        { amount: 0, component },
        {
          amount: 0,
          component: {
            ...component,
            code: 'D',
            type: 'DEDUCTION',
            calculationType: 'PERCENT_OF_BASIC',
            percentage: 200,
          },
        },
      ])
    ).toThrow();
  });
  it('rejects tenant injection and invalid master inputs', () => {
    expect(() => parseHrMaster('departments', { name: 'HR', tenantId: 'foreign' }, false)).toThrow(
      'Unknown'
    );
    expect(() =>
      parseHrMaster('leave-types', { name: 'Paid', code: 'P', daysPerYear: -1 }, false)
    ).toThrow();
    expect(() => parseHrMaster('shifts', { isDefault: 'false' }, true)).toThrow();
    expect(
      parseHrMaster(
        'salary-components',
        {
          name: 'Basic',
          code: 'basic',
          type: 'EARNING',
          calculationType: 'BASE',
          isStatutory: false,
        },
        false
      )
    ).toMatchObject({ code: 'BASIC', isStatutory: false });
    expect(parseHrMaster('salary-components', { percentage: 8.33 }, true)).toEqual({
      percentage: 8.33,
    });
  });
});
