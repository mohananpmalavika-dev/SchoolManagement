import { Prisma } from '@prisma/client';

/** Keep allocation history in the transaction that saves the student's current class. */
export async function recordEnrollment(tx: Prisma.TransactionClient, tenantId: string, student: {id:string;currentClassId:string|null;currentStreamId:string|null}) {
  if (!student.currentClassId) return;
  const year = await tx.academicYear.findFirst({where:{tenantId,isCurrent:true}})
    || await tx.academicYear.findFirst({where:{tenantId},orderBy:{startDate:'desc'}});
  if (!year) return;
  const allocation = {tenantId,studentId:student.id,academicYearId:year.id,classId:student.currentClassId,streamId:student.currentStreamId};
  if (!await tx.enrollment.findFirst({where:allocation})) {
    await tx.enrollment.create({data:{...allocation,enrollmentDate:new Date()}});
  }
}
