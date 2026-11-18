import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { OperationsService, Actor } from './operations.service';
import { parseRecord } from '../workspace/records';
import {
  calculateRoadTransportEstimate,
  fetchRoadRoute,
  transportEstimate,
  travelDistanceKm,
} from './transport-routing';
export { calculateRoadTransportEstimate, fetchRoadRoute, transportEstimate, travelDistanceKm };
const managers=['SUPER_ADMIN','SCHOOL_OWNER','PRINCIPAL','DEPUTY_PRINCIPAL','SCHOOL_ADMIN'];
const STOP_ROUTE_TTL_MS = 10 * 60_000;

async function routeStopsGeometry(
  stops: Array<{ latitude: number | null; longitude: number | null }> | undefined,
): Promise<[number, number][] | null> {
  if (!stops || stops.length < 2) return null;
  const waypoints = stops
    .filter((s): s is { latitude: number; longitude: number } => s.latitude != null && s.longitude != null)
    .map((s) => ({ latitude: s.latitude, longitude: s.longitude }));
  if (waypoints.length < 2) return null;
  const road = await fetchRoadRoute(waypoints, { ttlMs: STOP_ROUTE_TTL_MS });
  return road && road.geometry.length >= 2 ? road.geometry : null;
}
@Injectable()
export class SavedTransportService {
 constructor(private db:PrismaService,private tenants:TenantService,private operations:OperationsService){}
 private tenant(){return this.tenants.requireTenantContext();}
 private staff(user:Actor){if(![...managers,'TRANSPORT_OFFICER'].includes(user.role))throw new ForbiddenException('Transport access required');}
 async routes(user:Actor){this.staff(user);return this.db.route.findMany({where:{tenantId:this.tenant()},include:{vehicle:true,stops:{orderBy:{sequence:'asc'}},trips:{where:{status:'IN_TRANSIT'},select:{id:true,driverUserId:true,lastPingAt:true},take:1}}});}
 async saveStop(user:Actor,input:Record<string,unknown>){this.staff(user);const {latitude,longitude,...rest}=input;this.location(latitude,longitude);const data=parseRecord({model:'stop',fields:{routeId:'ref:route!',name:'text!',sequence:'int:1:100!',scheduledTime:'time!'}},rest);if(!await this.db.route.findFirst({where:{id:data.routeId,tenantId:this.tenant()}}))throw new NotFoundException('Route not found');return this.db.routeStop.create({data:{...data,latitude,longitude} as any});}
 async driver(user:Actor,routeId:string,input:Record<string,unknown>){this.staff(user);const data=parseRecord({model:'driver',fields:{staffId:'ref:staff!'}},input);const staff=await this.db.staff.findFirst({where:{id:data.staffId,tenantId:this.tenant(),status:'ACTIVE'}});if(!staff?.userId||!await this.db.user.findFirst({where:{id:staff.userId,tenantId:this.tenant(),role:'TRANSPORT_OFFICER',isActive:true}}))throw new BadRequestException('Choose an active transport officer with a linked staff account');const result=await this.db.route.updateMany({where:{id:routeId,tenantId:this.tenant()},data:{driverId:staff.id}});if(!result.count)throw new NotFoundException('Route not found');return {id:routeId};}
 private location(latitude:unknown,longitude:unknown){if(typeof latitude!=='number'||!Number.isFinite(latitude)||latitude < -90||latitude > 90||typeof longitude!=='number'||!Number.isFinite(longitude)||longitude < -180||longitude > 180)throw new BadRequestException('Invalid GPS coordinates');}
 private async permitted(user:Actor,id:string){this.staff(user);const trip=await this.db.transportJourney.findFirst({where:{id,tenantId:this.tenant()}});if(!trip)throw new NotFoundException('Trip not found');if(!managers.includes(user.role)&&trip.driverUserId!==user.userId)throw new ForbiddenException('Trip is assigned to another driver');return trip;}
 async start(user:Actor,input:Record<string,unknown>){this.staff(user);const data=parseRecord({model:'trip',fields:{routeId:'ref:route!',direction:'enum:MORNING_PICKUP,EVENING_DROPOFF!'}},input);const tenantId=this.tenant();return this.db.$transaction(async tx=>{
  const route=await tx.route.findFirst({where:{id:data.routeId,tenantId},include:{vehicle:true,travelAssignments:{include:{student:true}}}});if(!route||!route.vehicle||route.vehicle.status!=='ACTIVE')throw new BadRequestException('Route must have an active vehicle');const driver=route.driverId?await tx.staff.findFirst({where:{id:route.driverId,tenantId,status:'ACTIVE'}}):null;
  if(!managers.includes(user.role)&&driver?.userId!==user.userId)throw new ForbiddenException('You are not assigned to this route');const driverUserId=driver?.userId||user.userId;
  await tx.route.update({where:{id:route.id,tenantId},data:{updatedAt:new Date()}});if(await tx.transportJourney.findFirst({where:{tenantId,routeId:route.id,status:'IN_TRANSIT'}}))throw new ConflictException('A trip is already active on this route');
  const students=route.travelAssignments.filter(a=>!a.student.deletedAt&&a.student.status==='ACTIVE');if(students.length>route.vehicle.capacity)throw new ConflictException('Assigned students exceed vehicle capacity');const trip=await tx.transportJourney.create({data:{tenantId,routeId:route.id,driverUserId,direction:data.direction,passengers:{create:students.map(s=>({tenantId,studentId:s.studentId}))}}});return {id:trip.id};
 });}
 async trip(user:Actor,id:string){
  await this.permitted(user,id);
  const record=await this.db.transportJourney.findFirst({where:{id,tenantId:this.tenant()},include:{route:{include:{vehicle:true,stops:{orderBy:{sequence:'asc'}}}},passengers:{include:{student:{select:{firstName:true,lastName:true,admissionNumber:true}}}}}});
  if(!record)return null;
  const routeGeometry=await routeStopsGeometry(record.route?.stops);
  return {...record,routeGeometry};
 }
 private async alert(tx:any,user:Actor,tripId:string,studentId:string,kind:string){
  const result=await tx.transportAlert.createMany({data:[{tenantId:this.tenant(),tripId,studentId,kind}],skipDuplicates:true});
  if(result.count){const descriptions:Record<string,string>={ARRIVING:'The bus reported a location close to your child’s stop. Check the latest location before pickup.',BOARDED:'School transport staff recorded that your child boarded the bus.',DROPPED:'School transport staff recorded that your child was dropped off.',ABSENT:'School transport staff marked your child absent for this trip.'};await tx.activityFeed.create({data:{tenantId:this.tenant(),studentId,activityType:'TRANSPORT',title:kind==='ARRIVING'?'Bus approaching your stop':'School bus: '+kind.toLowerCase(),description:descriptions[kind],isVisibleToParents:true,createdBy:user.userId,metadata:{tripId,kind}}});}
 }
 async ping(user:Actor,id:string,input:Record<string,unknown>){
  const trip=await this.permitted(user,id);if(trip.status!=='IN_TRANSIT')throw new ConflictException('Trip has ended');
  if(Object.keys(input).some(k=>!['latitude','longitude','accuracy','speed','heading'].includes(k)))throw new BadRequestException('Unknown GPS field');this.location(input.latitude,input.longitude);
  for(const key of ['accuracy','speed','heading'])if(input[key]!==undefined&&(typeof input[key]!=='number'||!Number.isFinite(input[key])||Number(input[key])<0||Number(input[key])>({accuracy:1000,speed:100,heading:360}[key]!)))throw new BadRequestException('Invalid '+key);
  return this.db.$transaction(async tx=>{
   const result=await tx.transportJourney.updateMany({where:{id,tenantId:this.tenant(),status:'IN_TRANSIT'},data:{...input,lastPingAt:new Date()} as any});if(!result.count)throw new ConflictException('Trip has ended');
   if(typeof input.accuracy==='number'&&input.accuracy<=100){
    const assignments=await tx.travelAssignment.findMany({where:{tenantId:this.tenant(),routeId:trip.routeId},include:{stop:true}});
    const passengers=await tx.tripPassenger.findMany({where:{tenantId:this.tenant(),tripId:id,status:trip.direction==='MORNING_PICKUP'?'WAITING':'BOARDED'}});
    for(const a of assignments)if(a.stop.latitude!=null&&a.stop.longitude!=null&&passengers.some(p=>p.studentId===a.studentId)&&travelDistanceKm(Number(input.latitude),Number(input.longitude),a.stop.latitude,a.stop.longitude)<=0.3)await this.alert(tx,user,id,a.studentId,'ARRIVING');
   }
   return {id};
  });
 }
 async passenger(user:Actor,id:string,input:Record<string,unknown>){
  await this.permitted(user,id);const data=parseRecord({model:'passenger',fields:{studentId:'ref:student!',status:'enum:BOARDED,DROPPED,ABSENT!'}},input);const expected=data.status==='DROPPED'?'BOARDED':'WAITING';
  return this.db.$transaction(async tx=>{
   const lock=await tx.transportJourney.updateMany({where:{id,tenantId:this.tenant(),status:'IN_TRANSIT'},data:{status:'IN_TRANSIT'}});if(!lock.count)throw new ConflictException('Trip has ended');
   const result=await tx.tripPassenger.updateMany({where:{tenantId:this.tenant(),tripId:id,studentId:data.studentId,status:expected},data:{status:data.status}});if(!result.count)throw new ConflictException('Passenger is not in the expected boarding state');
   await this.alert(tx,user,id,data.studentId,data.status);return {id};
  });
 }
 async end(user:Actor,id:string){await this.permitted(user,id);return this.db.$transaction(async tx=>{
  const result=await tx.transportJourney.updateMany({where:{id,tenantId:this.tenant(),status:'IN_TRANSIT'},data:{status:'COMPLETED',endedAt:new Date()}});if(!result.count)throw new ConflictException('Trip has already ended');
  if(await tx.tripPassenger.count({where:{tenantId:this.tenant(),tripId:id,status:'BOARDED'}}))throw new ConflictException('Confirm drop-off for every boarded child before completing the trip');
  return {id};
 });}
 async tracking(user:Actor,studentId:string){
  await this.operations.studentAccess(user,studentId);
  const assignment=await this.db.travelAssignment.findFirst({
   where:{tenantId:this.tenant(),studentId},
   include:{
    route:{
     include:{
      vehicle:true,
      stops:{orderBy:{sequence:'asc'},select:{id:true,name:true,sequence:true,latitude:true,longitude:true,scheduledTime:true}},
     },
    },
    stop:true,
   },
  });
  if(!assignment)return {assignment:null,trip:null};
  const trip=await this.db.transportJourney.findFirst({where:{tenantId:this.tenant(),routeId:assignment.routeId,status:'IN_TRANSIT'},orderBy:{startedAt:'desc'},include:{passengers:{where:{studentId},select:{status:true,updatedAt:true}}}});
  const [estimate,routeGeometry]=await Promise.all([
   trip?calculateRoadTransportEstimate(trip,assignment.stop):Promise.resolve(null),
   routeStopsGeometry(assignment.route.stops),
  ]);
  return {
   assignment:{
    routeName:assignment.route.name,
    vehicle:assignment.route.vehicle?.registrationNumber,
    stop:assignment.stop,
    stops:assignment.route.stops||[],
    routeGeometry,
   },
   estimate,
   trip:trip?{
    id:trip.id,
    direction:trip.direction,
    status:trip.status,
    latitude:trip.latitude,
    longitude:trip.longitude,
    accuracy:trip.accuracy,
    speed:trip.speed,
    heading:trip.heading,
    lastPingAt:trip.lastPingAt,
    passenger:trip.passengers[0]||null,
   }:null,
  };
 }
}
