import { ConflictException } from '@nestjs/common';
import { hrDay, hrRound } from './hrms.engine';
export const exitDepartments = ['ACCOUNTS', 'ASSETS_IT', 'LIBRARY', 'PRINCIPAL'] as const;
export function assertExitClearances(row: any) {
  if (
    row.clearances.length !== 4 ||
    exitDepartments.some(
      (d) => row.clearances.filter((c: any) => c.department === d).length !== 1
    ) ||
    row.clearances.some(
      (c: any) =>
        c.tenantId !== row.tenantId ||
        c.resignationId !== row.id ||
        c.employeeId !== row.employeeId ||
        c.status !== 'CLEARED' ||
        c.duesAmount !== 0 ||
        !c.clearedBy ||
        c.clearedBy === row.employee.userId ||
        !c.clearedAt ||
        c.lockedAt
    )
  )
    throw new ConflictException(
      'Complete all four distinct department clearances with zero dues and independent review before settlement'
    );
}
export function exitSnapshot(row: any, amounts: any, preparationId?: string) {
  const values = [
    'workingDaysInFinalMonth',
    'earnedSalary',
    'leaveEncashmentAmount',
    'noticePayRecovery',
  ];
  if (
    !row.approvedExitDate ||
    values.some(
      (k) => typeof amounts[k] !== 'number' || !Number.isFinite(amounts[k]) || amounts[k] < 0
    ) ||
    amounts.workingDaysInFinalMonth > row.approvedExitDate.getUTCDate() ||
    values.slice(1).some((k) => amounts[k] > 10000000) ||
    (amounts.assetDuesDeduction || 0) !== 0
  )
    throw new ConflictException('Review the settlement inputs and approved exit date');
  return {
    ...(preparationId ? { preparationId } : {}),
    employeeId: row.employeeId,
    staffId: row.employee.staffId,
    userId: row.employee.userId,
    approvedExitDate: hrDay(row.approvedExitDate),
    amounts: {
      workingDaysInFinalMonth: amounts.workingDaysInFinalMonth,
      earnedSalary: amounts.earnedSalary,
      leaveEncashmentAmount: amounts.leaveEncashmentAmount,
      noticePayRecovery: amounts.noticePayRecovery,
      assetDuesDeduction: 0,
      netSettlementAmount: hrRound(
        amounts.earnedSalary + amounts.leaveEncashmentAmount - amounts.noticePayRecovery
      ),
    },
    clearances: [...row.clearances]
      .sort((a: any, b: any) => a.department.localeCompare(b.department))
      .map((c: any) => ({
        id: c.id,
        department: c.department,
        status: c.status,
        duesAmount: c.duesAmount,
        clearedBy: c.clearedBy,
        clearedAt: c.clearedAt.toISOString(),
        remarks: c.remarks || null,
      })),
  };
}
