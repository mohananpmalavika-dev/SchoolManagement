import { ParentPortalService } from './parent-portal.service';
import { ParentPortalController } from './parent-portal.controller';

describe('Parent account links and booking ownership', () => {
  const request={user:{userId:'account-1',id:'account-1'}};
  it('uses a tenant-scoped account link instead of treating the user ID as a guardian ID',async()=>{
    const prisma={guardian:{findFirst:jest.fn().mockResolvedValue({id:'guardian-1'})}};
    const service=new ParentPortalService(prisma as any,{requireTenantContext:()=> 'school-1'} as any,{} as any,{} as any,{} as any,{} as any,{} as any);
    expect(await service.guardianForUser(request.user)).toBe('guardian-1');
    expect(prisma.guardian.findFirst).toHaveBeenCalledWith({where:{tenantId:'school-1',userId:'account-1'},select:{id:true}});
  });
  it('rejects an unlinked parent account',async()=>{
    const prisma={guardian:{findFirst:jest.fn().mockResolvedValue(null)}};
    const service=new ParentPortalService(prisma as any,{requireTenantContext:()=> 'school-1'} as any,{} as any,{} as any,{} as any,{} as any,{} as any);
    await expect(service.guardianForUser(request.user)).rejects.toThrow('Parent account is not linked');
  });
  function controller(guardianId:string) {
    const bookings={getBooking:jest.fn().mockResolvedValue({id:'booking-1',guardianId}),cancelBooking:jest.fn().mockResolvedValue({status:'CANCELLED'})};
    const portal={guardianForUser:jest.fn().mockResolvedValue('guardian-1')};
    return {bookings,controller:new ParentPortalController(portal as any,{} as any,{} as any,{} as any,{} as any,bookings as any)};
  }
  it('does not reveal another family’s meeting details in the same school',async()=>{
    await expect(controller('other-family').controller.getBooking('booking-1',request)).rejects.toThrow('another family');
  });
  it('does not cancel another family’s meeting',async()=>{
    const {controller:parent,bookings}=controller('other-family');
    await expect(parent.cancelBooking('booking-1',{cancellationReason:'test'},request)).rejects.toThrow('another family');
    expect(bookings.cancelBooking).not.toHaveBeenCalled();
  });
  it('allows the linked family to read and cancel its own meeting',async()=>{
    const {controller:parent,bookings}=controller('guardian-1');
    expect((await parent.getBooking('booking-1',request)).id).toBe('booking-1');
    await parent.cancelBooking('booking-1',{cancellationReason:'Unavailable'},request);
    expect(bookings.cancelBooking).toHaveBeenCalledWith('booking-1','account-1',{cancellationReason:'Unavailable'});
  });
});
