import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
describe('Connected assignment submissions', () => {
  const tenantId = '00000000-0000-4000-8000-000000000001';
  const assignmentId = '00000000-0000-4000-8000-000000000002';
  const studentId = '00000000-0000-4000-8000-000000000003';
  let service: WorkspaceService;
  let prisma: any;
  beforeEach(() => {
    prisma = {
      student: {findFirst:jest.fn().mockResolvedValue({id:studentId,currentClassId:'class-1'})},
      assignment: {findFirst:jest.fn().mockResolvedValue({id:assignmentId})},
      assignmentSubmission: {findUnique:jest.fn().mockResolvedValue(null),upsert:jest.fn().mockResolvedValue({id:'submission-1'}),findFirst:jest.fn(),update:jest.fn()},
      class: {findFirst:jest.fn().mockResolvedValue({id:'class-1'})},
      auditLog: {create:jest.fn().mockResolvedValue({})},
    };
    service = new WorkspaceService(prisma,{requireTenantContext:()=>tenantId} as any,{} as any,{} as any,{} as any,{} as any,{} as any);
  });
  it('routes student writes into the linked student and class submission workflow', async () => {
    expect(await service.write({role:'STUDENT',userId:'user-1'},'submissions',{assignmentId,text:'My reviewed work'})).toEqual({id:'submission-1'});
    expect(prisma.assignment.findFirst).toHaveBeenCalledWith({where:{id:assignmentId,tenantId,classId:'class-1'}});
    expect(prisma.assignmentSubmission.upsert).toHaveBeenCalledWith(expect.objectContaining({create:{tenantId,assignmentId,studentId,text:'My reviewed work'}}));
  });
  it('rejects assignments outside the linked student class', async () => {
    prisma.assignment.findFirst.mockResolvedValue(null);
    await expect(service.write({role:'STUDENT',userId:'user-1'},'submissions',{assignmentId,text:'Work'})).rejects.toThrow(NotFoundException);
    expect(prisma.assignmentSubmission.upsert).not.toHaveBeenCalled();
  });
  it('does not allow students to overwrite graded submissions', async () => {
    prisma.assignmentSubmission.findUnique.mockResolvedValue({status:'GRADED'});
    await expect(service.write({role:'STUDENT',userId:'user-1'},'submissions',{assignmentId,text:'Replacement'})).rejects.toThrow(BadRequestException);
    expect(prisma.assignmentSubmission.upsert).not.toHaveBeenCalled();
  });
  it('rejects unlinked student accounts', async () => {
    prisma.student.findFirst.mockResolvedValue(null);
    await expect(service.write({role:'STUDENT',userId:'user-1'},'submissions',{assignmentId,text:'Work'})).rejects.toThrow(ForbiddenException);
  });
  it('allows school administrators to grade an existing submission', async () => {
    prisma.assignmentSubmission.findFirst.mockResolvedValue({id:'submission-1',assignment:{classId:'class-1',maxMarks:20}});
    prisma.assignmentSubmission.update.mockResolvedValue({id:'submission-1'});
    expect(await service.write({role:'SCHOOL_ADMIN',userId:'admin-1'},'submissions',{score:18,feedback:'Good reasoning'},'submission-1')).toEqual({id:'submission-1'});
    expect(prisma.assignmentSubmission.update).toHaveBeenCalledWith({where:{id:'submission-1',tenantId},data:{score:18,feedback:'Good reasoning',status:'GRADED'}});
  });
  it('rejects marks above the assignment maximum', async () => {
    prisma.assignmentSubmission.findFirst.mockResolvedValue({id:'submission-1',assignment:{classId:'class-1',maxMarks:20}});
    await expect(service.write({role:'SCHOOL_ADMIN',userId:'admin-1'},'submissions',{score:21},'submission-1')).rejects.toThrow('maximum marks');
    expect(prisma.assignmentSubmission.update).not.toHaveBeenCalled();
  });
  it('prevents a parent from grading submissions', async () => {
    await expect(service.write({role:'PARENT',userId:'parent-1'},'submissions',{score:15},'submission-1')).rejects.toThrow(ForbiddenException);
  });
});
