import { BadRequestException } from '@nestjs/common';
import { parseRecord, RecordSpec } from '../workspace/records';
import { hrDate } from './hrms.engine';

export const hrMasterSpecs: Record<string, RecordSpec & { booleans?: string[] }> = {
  departments: {
    model: 'department',
    fields: { name: 'text!', code: 'text', description: 'long' },
  },
  designations: {
    model: 'designation',
    fields: { title: 'text!', code: 'text', description: 'long' },
  },
  grades: { model: 'employeeGrade', fields: { name: 'text!', code: 'text' } },
  shifts: {
    model: 'shift',
    fields: {
      name: 'text!',
      startTime: 'time!',
      endTime: 'time!',
      graceMinutes: 'int:0:120!',
      halfDayMinutes: 'int:1:720!',
      fullDayMinutes: 'int:1:1440',
    },
    booleans: ['isDefault'],
  },
  'leave-types': {
    model: 'leaveType',
    fields: {
      name: 'text!',
      code: 'text!',
      daysPerYear: 'int:0:366',
      accrualMethod: 'enum:ANNUAL_UPFRONT,MONTHLY',
      dayBasis: 'enum:CALENDAR,WORKING_DAYS',
      waitingDays: 'int:0:366',
      minNoticeDays: 'int:0:366',
      effectiveFrom: 'date',
      effectiveTo: 'date',
    },
    nullable: ['effectiveTo'],
    booleans: [
      'isPaid',
      'requiresDocument',
      'prorateJoiningYear',
      'allowBackdated',
      'allowHalfDay',
    ],
  },
  'salary-components': {
    model: 'salaryComponent',
    fields: {
      name: 'text!',
      code: 'text!',
      type: 'enum:EARNING,DEDUCTION,EMPLOYER_CONTRIBUTION!',
      calculationType: 'enum:BASE,FIXED,PERCENT_OF_BASIC!',
      percentage: 'int:0:100',
      statutoryType: 'enum:NONE,PF,ESI,OTHER',
    },
    booleans: ['isStatutory'],
  },
};
export function parseHrMaster(resource: string, input: Record<string, unknown>, partial: boolean) {
  const spec = hrMasterSpecs[resource];
  if (!spec) throw new BadRequestException('Unknown HR master');
  const other = { ...input },
    bools: Record<string, boolean> = {};
  let percentage: number | undefined;
  const policy: Record<string, any> = {};
  if (resource === 'leave-types') {
    if (!partial && !Object.hasOwn(other, 'daysPerYear'))
      throw new BadRequestException('Enter annual leave days');
    for (const key of [
      'daysPerYear',
      'carryForwardLimit',
      'maxDaysPerRequest',
      'documentAfterDays',
    ]) {
      if (!Object.hasOwn(other, key)) continue;
      const value = other[key];
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < (key === 'daysPerYear' || key === 'carryForwardLimit' ? 0 : 0.5) ||
        value > 366 ||
        !Number.isInteger(value * 2)
      )
        throw new BadRequestException(
          key + ' must be in half-day increments within the allowed range'
        );
      policy[key] = value;
      delete other[key];
    }
    for (const key of ['workingWeekdays', 'excludedDates']) {
      if (!Object.hasOwn(other, key)) continue;
      const value = other[key];
      if (
        !Array.isArray(value) ||
        new Set(value).size !== value.length ||
        (key === 'workingWeekdays'
          ? !value.length ||
            value.length > 7 ||
            value.some((n) => !Number.isInteger(n) || n < 1 || n > 7)
          : value.length > 1000 || value.some((d) => typeof d !== 'string'))
      )
        throw new BadRequestException(
          'Choose unique policy weekdays (1–7) or valid excluded dates'
        );
      if (key === 'excludedDates') value.forEach((d) => hrDate(d));
      policy[key] = value;
      delete other[key];
    }
  }
  if (resource === 'salary-components' && Object.hasOwn(other, 'percentage')) {
    const value = other.percentage;
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100 ||
      Math.abs(value * 10000 - Math.round(value * 10000)) > 0.000001
    )
      throw new BadRequestException(
        'Percentage must be between 0 and 100 with up to four decimal places'
      );
    percentage = value;
    delete other.percentage;
  }
  for (const key of spec.booleans || [])
    if (key in other) {
      if (typeof other[key] !== 'boolean')
        throw new BadRequestException(key + ' must be true or false');
      bools[key] = other[key] as boolean;
      delete other[key];
    }
  const data: Record<string, any> = {
    ...parseRecord(spec, other, partial),
    ...bools,
    ...policy,
    ...(percentage !== undefined ? { percentage } : {}),
  };
  if (data.code) data.code = data.code.toUpperCase();
  return data;
}
