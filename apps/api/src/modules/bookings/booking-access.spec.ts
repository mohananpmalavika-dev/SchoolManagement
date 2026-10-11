import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

describe('Meeting ownership and teaching account links',()=>{
  let service:BookingsService,prisma:any;
  beforeEach(()=>{
    prisma={guardian:{findFirst:jest.fn().mockResolvedValue({id:'guardian-1'})},staff:{findFirst:jest.fn().mockResolvedValue({id:'staff-1'})},parentTeacherBooking:{findFirst:jest.fn().mockResolvedValue({id:'meeting-1',guardianId:'guardian-1',teacherId:'staff-1'})},teacherAvailability:{findFirst:jest.fn().mockResolvedValue(null)}};
    service=new BookingsService(prisma,{requireTenantContext:()=> 'school-1'} as any);
  });
  it('maps parents to their linked guardian and teachers to their staff record',async()=>{
    expect(await service.accountScope({userId:'parent-account',role:'PARENT'})).toEqual({guardianId:'guardian-1'});
    expect(await service.accountScope({userId:'teacher-account',role:'TEACHER'})).toEqual({teacherId:'staff-1'});
    expect(prisma.staff.findFirst).toHaveBeenCalledWith({where:{tenantId:'school-1',userId:'teacher-account',isTeacher:true},select:{id:true}});
  });
  it('denies unlinked parent and teacher accounts',async()=>{
    prisma.guardian.findFirst.mockResolvedValue(null);prisma.staff.findFirst.mockResolvedValue(null);
    await expect(service.accountScope({id:'unlinked',role:'PARENT'})).rejects.toThrow('not linked');
    await expect(service.accountScope({id:'unlinked',role:'TEACHER'})).rejects.toThrow('not linked');
  });
  it.each(['PARENT','TEACHER'])('denies another account’s meeting to %s',async role=>{
    prisma.parentTeacherBooking.findFirst.mockResolvedValue({id:'meeting-1',guardianId:'guardian-2',teacherId:'staff-2'});
    await expect(service.authorizeBooking({userId:'user-1',role},'meeting-1')).rejects.toThrow('another account');
  });
  it('does not allow teachers to change another teacher’s availability',async()=>{
    await expect(service.authorizeAvailability({userId:'teacher-account',role:'TEACHER'},'availability-2')).rejects.toThrow('not found');
    expect(prisma.teacherAvailability.findFirst).toHaveBeenCalledWith({where:{id:'availability-2',tenantId:'school-1',teacherId:'staff-1'}});
  });
  it('ignores a parent’s attempt to list another family’s meetings',async()=>{
    const bookings={accountScope:jest.fn().mockResolvedValue({guardianId:'guardian-1'}),getBookings:jest.fn()};
    const controller=new BookingsController(bookings as any);
    await controller.getBookings({user:{userId:'parent-account',role:'PARENT'}},'guardian-2');
    expect(bookings.getBookings).toHaveBeenCalledWith(expect.objectContaining({guardianId:'guardian-1'}));
  });
  it('does not allow parents to change teacher notes or confirmation status',async()=>{
    const bookings={authorizeBooking:jest.fn().mockResolvedValue({id:'meeting-1'}),updateBooking:jest.fn()};
    const controller=new BookingsController(bookings as any);
    await expect(controller.updateBooking('meeting-1',{teacherNotes:'forged'}, {user:{userId:'parent-account',role:'PARENT'}})).rejects.toThrow('meeting fields');
    expect(bookings.updateBooking).not.toHaveBeenCalled();
  });
});
