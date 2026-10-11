import { BookingsService } from './bookings.service';

describe('Saved meeting reservation workflow',()=>{
  let service:BookingsService,prisma:any,tx:any;
  const dto={studentId:'student-1',teacherId:'teacher-1',bookingDate:'2026-10-12',startTime:'15:00',endTime:'15:30',topic:'Learning progress'};
  beforeEach(()=>{
    jest.useFakeTimers().setSystemTime(new Date('2026-10-11T10:00:00Z'));
    tx={staff:{update:jest.fn().mockResolvedValue({id:'teacher-1'})},parentTeacherBooking:{findFirst:jest.fn().mockResolvedValue(null),create:jest.fn().mockResolvedValue({id:'saved-meeting'})}};
    prisma={guardianStudentLink:{findFirst:jest.fn().mockResolvedValue({id:'link'})},staff:{findFirst:jest.fn().mockResolvedValue({id:'teacher-1'})},teacherAvailability:{findMany:jest.fn().mockResolvedValue([{startTime:'15:00',endTime:'16:00',slotDuration:30}])},parentTeacherBooking:{findMany:jest.fn().mockResolvedValue([])},$transaction:jest.fn(async callback=>callback(tx))};
    service=new BookingsService(prisma,{requireTenantContext:()=> 'school-1'} as any);
  });
  afterEach(()=>jest.useRealTimers());
  it('saves an available appointment after acquiring the teacher reservation lock',async()=>{
    expect(await service.createBooking('guardian-1',dto)).toEqual({id:'saved-meeting'});
    expect(tx.staff.update.mock.invocationCallOrder[0]).toBeLessThan(tx.parentTeacherBooking.findFirst.mock.invocationCallOrder[0]);
    expect(tx.parentTeacherBooking.create).toHaveBeenCalledWith({data:expect.objectContaining({tenantId:'school-1',guardianId:'guardian-1',studentId:'student-1',bookingDate:new Date('2026-10-12T00:00:00Z'),status:'PENDING',meetingType:'IN_PERSON'})});
  });
  it('rejects a simultaneous reservation detected inside the transaction',async()=>{
    tx.parentTeacherBooking.findFirst.mockResolvedValue({id:'other-meeting'});
    await expect(service.createBooking('guardian-1',dto)).rejects.toThrow('already booked');
    expect(tx.parentTeacherBooking.create).not.toHaveBeenCalled();
  });
  it('rejects a time outside published consultation hours',async()=>{
    await expect(service.createBooking('guardian-1',{...dto,startTime:'12:00',endTime:'12:30'})).rejects.toThrow('not available');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('requires a linked child from the current tenant',async()=>{
    prisma.guardianStudentLink.findFirst.mockResolvedValue(null);
    await expect(service.createBooking('guardian-1',dto)).rejects.toThrow('access');
    expect(prisma.guardianStudentLink.findFirst).toHaveBeenCalledWith({where:{guardianId:'guardian-1',studentId:'student-1',guardian:{tenantId:'school-1'},student:{tenantId:'school-1',deletedAt:null}}});
  });
  it('rejects malformed and past dates',async()=>{
    await expect(service.createBooking('guardian-1',{...dto,bookingDate:'2026-02-30'})).rejects.toThrow('valid meeting date');
    await expect(service.createBooking('guardian-1',{...dto,bookingDate:'2026-10-10'})).rejects.toThrow('future meeting date');
  });
  it('uses UTC weekday for date-only school appointments and removes booked overlapping slots',async()=>{
    prisma.parentTeacherBooking.findMany.mockResolvedValue([{startTime:'15:15',endTime:'15:45'}]);
    expect(await service.getAvailableSlots('teacher-1','2026-10-12')).toEqual([]);
    expect(prisma.teacherAvailability.findMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({tenantId:'school-1',dayOfWeek:1})}));
  });
  it('deduplicates overlapping availability and excludes elapsed times in East Africa time',async()=>{
    prisma.teacherAvailability.findMany.mockResolvedValue([{startTime:'12:00',endTime:'14:00',slotDuration:30},{startTime:'13:00',endTime:'14:00',slotDuration:30}]);
    expect(await service.getAvailableSlots('teacher-1','2026-10-11')).toEqual([{startTime:'13:30',endTime:'14:00',duration:30}]);
  });
});