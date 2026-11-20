import { ConflictException } from '@nestjs/common';
import { Prisma } from '@krypton/database';

// Caller holds the tenant transaction lock, shared by payroll and attendance writers.
export async function assertHrPeriodWritable(
  db: Prisma.TransactionClient,
  tenantId: string,
  from: Date,
  to?: Date
) {
  const lower = {
    OR: [
      { year: { gt: from.getUTCFullYear() } },
      { year: from.getUTCFullYear(), month: { gte: from.getUTCMonth() + 1 } },
    ],
  };
  const upper = to
    ? {
        OR: [
          { year: { lt: to.getUTCFullYear() } },
          { year: to.getUTCFullYear(), month: { lte: to.getUTCMonth() + 1 } },
        ],
      }
    : {};
  if (
    await db.payrollPeriod.findFirst({
      where: {
        tenantId,
        AND: [lower, upper, { OR: [{ status: 'LOCKED' }, { runs: { some: { tenantId } } }] }],
      },
    })
  )
    throw new ConflictException(
      'Payroll already covers this period. Discard its draft before editing; approved periods stay locked.'
    );
}
