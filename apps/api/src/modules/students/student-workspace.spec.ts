import { StudentsService } from './students.service';

describe('Student workspace privacy and saved learning records', () => {
  const student = {id:'student-1',tenantId:'school-1',userId:'user-1',currentClassId:'class-1',currentClass:null,currentStream:null};
  let prisma:any, service:StudentsService;
  beforeEach(() => {
    prisma = {
      student:{findFirst:jest.fn().mockResolvedValue(student),findMany:jest.fn()},
      guardian:{findFirst:jest.fn()}, assignment:{findMany:jest.fn()},
      learningMaterial:{findMany:jest.fn().mockResolvedValue([])},bookBorrowing:{findMany:jest.fn().mockResolvedValue([])},
    };
    service=new StudentsService(prisma,{requireTenantContext:()=> 'school-1'} as any);
  });
  it('resolves the authenticated account link inside the current tenant',async()=>{
    await service.resolveStudentForUser({userId:'user-1',email:'other@example.test',tenantId:'other-school'});
    expect(prisma.student.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:{tenantId:'school-1',userId:'user-1',deletedAt:null}}));
  });
  it('does not show another student when the account has no linked profile',async()=>{
    prisma.student.findFirst.mockResolvedValue(null);
    await expect(service.resolveStudentForUser({id:'unlinked'})).rejects.toThrow('Student profile not found');
    expect(prisma.student.findFirst).toHaveBeenCalledTimes(1);
  });
  it('does not query records without an authenticated user identifier',async()=>{
    await expect(service.resolveStudentForUser({email:'student@example.test'})).rejects.toThrow();
    expect(prisma.student.findFirst).not.toHaveBeenCalled();
  });
  it('returns no children for an unlinked parent instead of a sample school roster',async()=>{
    prisma.guardian.findFirst.mockResolvedValue(null);
    expect(await service.getMyChildren({userId:'parent-1'})).toEqual([]);
    expect(prisma.student.findMany).not.toHaveBeenCalled();
    expect(prisma.guardian.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:{tenantId:'school-1',userId:'parent-1'}}));
  });
  it('hides withdrawn deleted and cross-tenant children from the linked family list',async()=>{
    prisma.guardian.findFirst.mockResolvedValue({studentLinks:[{student:{...student,firstName:'Linked'}},{student:{...student,id:'deleted',deletedAt:new Date()}},{student:{...student,id:'other',tenantId:'school-2'}}]});
    expect((await service.getMyChildren({userId:'parent-1'})).map(child=>child.id)).toEqual(['student-1']);
  });
  it('loads class assignments and only this student’s submitted work',async()=>{
    const base={subject:{name:'Math'},createdAt:new Date(),dueDate:new Date(),description:'Complete task',maxMarks:20};
    prisma.assignment.findMany.mockResolvedValue([{...base,id:'pending',title:'New task',submissions:[]},{...base,id:'done',title:'Saved task',submissions:[{status:'GRADED',score:18}]}]);
    const result=await service.getMeAssignments({userId:'user-1'});
    expect(result.pending.map(item=>item.id)).toEqual(['pending']);
    expect(result.completed[0].submission.score).toBe(18);
    expect(prisma.assignment.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{tenantId:'school-1',classId:'class-1'},include:{subject:true,submissions:{where:{tenantId:'school-1',studentId:'student-1'}}}}));
  });
  it('returns an empty assignment list when no class is assigned',async()=>{
    prisma.student.findFirst.mockResolvedValue({...student,currentClassId:null});
    expect(await service.getMeAssignments({userId:'user-1'})).toEqual({pending:[],completed:[]});
    expect(prisma.assignment.findMany).not.toHaveBeenCalled();
  });
  it('loads shared and class resources and saved library loans without invented downloads',async()=>{
    const material={id:'saved-resource',title:'Teacher notes',url:'https://example.test/notes'};
    prisma.learningMaterial.findMany.mockResolvedValue([material]);
    const result=await service.getMeMaterials({userId:'user-1'});
    expect(result.curriculumMaterials).toEqual([material]);
    expect(prisma.learningMaterial.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{tenantId:'school-1',OR:[{classId:null},{classId:'class-1'}]}}));
    expect(result.borrowedBooks).toEqual([]);
  });
});
