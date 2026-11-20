import {
  leaveCharge,
  leaveCovers,
  leaveDocumentUrl,
  leaveEntitlement,
  leavesOverlap,
} from './hrms-leave';
import { parseHrMaster } from './hrms-masters';
const date = (s: string) => new Date(s + 'T00:00:00Z');
const policy = { daysPerYear: 12 };
describe('School leave policy calculations', () => {
  it('starts earning at policy effectivity and rejects requests outside the reviewed period', () => {
    const dated = {
      ...policy,
      accrualMethod: 'MONTHLY',
      effectiveFrom: date('2026-07-01'),
      effectiveTo: date('2026-10-31'),
    };
    expect(leaveEntitlement(dated, date('2025-01-01'), null, 2025, '2026-11-20')).toBe(0);
    expect(leaveEntitlement(dated, date('2025-01-01'), null, 2026, '2026-11-20')).toBe(4);
    expect(() => leaveCharge('2026-06-30', '2026-07-01', false, undefined, dated)).toThrow(
      'effective period'
    );
    expect(() => leaveCharge('2026-10-31', '2026-11-01', false, undefined, dated)).toThrow(
      'effective period'
    );
  });
  it('preserves legacy annual grants and grants nothing before eligibility', () => {
    expect(leaveEntitlement(policy, date('2026-06-01'), null, 2026, '2026-06-01')).toBe(12);
    expect(
      leaveEntitlement({ ...policy, waitingDays: 30 }, date('2026-06-01'), null, 2026, '2026-06-30')
    ).toBe(0);
    expect(leaveEntitlement(policy, date('2026-06-01'), null, 2027, '2026-12-31')).toBe(0);
    expect(
      leaveEntitlement(policy, date('2025-01-01'), date('2025-12-31'), 2026, '2026-01-01')
    ).toBe(0);
  });
  it('credits completed months only and rounds cumulative fractional accrual down to half days', () => {
    const monthly = { daysPerYear: 5, accrualMethod: 'MONTHLY' };
    expect(leaveEntitlement(monthly, date('2026-01-01'), null, 2026, '2026-01-30')).toBe(0);
    expect(leaveEntitlement(monthly, date('2026-01-01'), null, 2026, '2026-01-31')).toBe(0);
    expect(leaveEntitlement(monthly, date('2026-01-01'), null, 2026, '2026-02-28')).toBe(0.5);
    expect(leaveEntitlement(monthly, date('2026-01-01'), null, 2026, '2026-12-31')).toBe(5);
    expect(
      leaveEntitlement(
        { ...policy, accrualMethod: 'MONTHLY' },
        date('2026-01-15'),
        null,
        2026,
        '2026-02-28'
      )
    ).toBe(1);
    expect(
      leaveEntitlement(
        { ...policy, accrualMethod: 'MONTHLY', prorateJoiningYear: true },
        date('2026-01-15'),
        null,
        2026,
        '2026-02-28'
      )
    ).toBe(1.5);
    expect(
      leaveEntitlement(
        { ...policy, accrualMethod: 'MONTHLY' },
        date('2026-01-01'),
        date('2026-02-15'),
        2026,
        '2026-12-31'
      )
    ).toBe(1);
  });
  it('prorates annual joining-year grants by eligible calendar days including leap years', () => {
    expect(
      leaveEntitlement(
        { ...policy, prorateJoiningYear: true },
        date('2024-07-01'),
        null,
        2024,
        '2024-07-01'
      )
    ).toBe(6);
    expect(
      leaveEntitlement(
        { ...policy, prorateJoiningYear: true },
        date('2026-12-31'),
        null,
        2026,
        '2026-12-31'
      )
    ).toBe(0);
  });
  it('charges configured weekdays and excludes explicit holidays, preserving charged dates', () => {
    const working = {
      ...policy,
      dayBasis: 'WORKING_DAYS',
      workingWeekdays: [1, 2, 3, 4, 5],
      excludedDates: ['2026-11-23'],
    };
    expect(leaveCharge('2026-11-20', '2026-11-24', false, undefined, working)).toEqual({
      count: 2,
      dates: ['2026-11-20', '2026-11-24'],
    });
    expect(() => leaveCharge('2026-11-21', '2026-11-22', false, undefined, working)).toThrow(
      'no chargeable'
    );
    expect(() =>
      leaveCharge('2026-11-20', '2026-11-24', false, undefined, {
        ...working,
        maxDaysPerRequest: 1,
      })
    ).toThrow('limit');
  });
  it('requires a single eligible date and a permitted session for half-day leave', () => {
    expect(leaveCharge('2026-11-20', '2026-11-20', true, 'PM', policy).count).toBe(0.5);
    expect(() => leaveCharge('2026-11-20', '2026-11-20', true, undefined, policy)).toThrow(
      'session'
    );
    expect(() => leaveCharge('2026-11-20', '2026-11-20', false, 'AM', policy)).toThrow('session');
    expect(() =>
      leaveCharge('2026-11-20', '2026-11-20', true, 'AM', { ...policy, allowHalfDay: false })
    ).toThrow('allowed');
    expect(() => leaveCharge('2026-11-20', '2026-11-21', true, 'AM', policy)).toThrow('single');
    expect(() => leaveCharge('2026-12-31', '2027-01-01', false, undefined, policy)).toThrow('year');
  });
  it('allows complementary sessions and rejects duplicate, full-day and ambiguous legacy overlaps', () => {
    const row = {
      startDate: date('2026-11-20'),
      endDate: date('2026-11-22'),
      isHalfDay: true,
      halfDaySession: 'AM',
      chargedDates: ['2026-11-20'],
    };
    expect(leavesOverlap(row, ['2026-11-20'], true, 'PM')).toBe(false);
    expect(leavesOverlap(row, ['2026-11-20'], true, 'AM')).toBe(true);
    expect(leavesOverlap(row, ['2026-11-20'], false)).toBe(true);
    expect(leavesOverlap({ ...row, halfDaySession: null }, ['2026-11-20'], true, 'PM')).toBe(true);
    expect(leaveCovers(row, '2026-11-21')).toBe(false);
    expect(leaveCovers({ ...row, chargedDates: [] }, '2026-11-21')).toBe(true);
  });
  it.each([
    'http://example.test/file',
    'javascript:alert(1)',
    'https://',
    'https://user:secret@example.test/file',
  ])('rejects invalid document links: %s', (url) => {
    expect(() => leaveDocumentUrl(url)).toThrow('HTTPS');
  });
  it('accepts an HTTPS evidence link for subsequent manual verification', () =>
    expect(leaveDocumentUrl('https://example.test/medical.pdf')).toBe(
      'https://example.test/medical.pdf'
    ));
  it('validates policy values rather than coercing strings, duplicate weekdays or invalid dates', () => {
    const input = {
      name: 'Personal',
      code: 'pl',
      daysPerYear: 12.5,
      accrualMethod: 'MONTHLY',
      carryForwardLimit: 2.5,
      workingWeekdays: [1, 2, 3],
      excludedDates: ['2026-12-25'],
      allowHalfDay: false,
    };
    expect(parseHrMaster('leave-types', input, false)).toEqual({ ...input, code: 'PL' });
    for (const patch of [
      { daysPerYear: 1.3 },
      { carryForwardLimit: -1 },
      { allowHalfDay: 'true' },
      { workingWeekdays: [1, 1] },
      { workingWeekdays: [] },
      { excludedDates: ['2026-02-30'] },
      { accrualMethod: 'AUTO' },
    ])
      expect(() => parseHrMaster('leave-types', { ...input, ...patch }, false)).toThrow();
  });
});
