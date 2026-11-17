import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  TransportRoute,
  TransportTrip,
  TransportStudent,
  TransportStop,
  ParentBusTrackingView,
  SchoolCampusLocation,
} from '@krypton/types';
import {
  StartTripDto,
  LocationPingDto,
  UpdateStudentStatusDto,
  EndTripDto,
} from './dto/trip.dto';
import {
  UpdateSchoolLocationDto,
  CreateRouteDto,
  AutoGenerateRouteDto,
} from './dto/route-planner.dto';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

const DEFAULT_ROUTES: TransportRoute[] = [
  {
    id: 'route-01',
    name: 'Route 1: Kakkanad & Tripunithura Express',
    nameMl: 'റൂട്ട് 1: കാക്കനാട് - തൃപ്പൂണിത്തുറ എക്സ്പ്രസ്സ്',
    code: 'BUS-01',
    vehicleRegistration: 'KL 07 CQ 4210',
    vehicleModel: 'Tata Starbus Ultra (32-seater)',
    driverName: 'Suresh Kumar',
    driverPhone: '+91 98470 34567',
    totalCapacity: 32,
    direction: 'MORNING_PICKUP',
    stops: [
      {
        id: 'stop-101',
        routeId: 'route-01',
        name: 'Infopark Phase 2 Gate',
        nameMl: 'ഇൻഫോപാർക്ക് ഫേസ് 2 ഗേറ്റ്',
        sequence: 1,
        latitude: 10.0064,
        longitude: 76.3638,
        scheduledTime: '07:15 AM',
        studentIds: ['stu-001', 'stu-002'],
      },
      {
        id: 'stop-102',
        routeId: 'route-01',
        name: 'Kakkanad Civil Station Stop',
        nameMl: 'കാക്കനാട് സിവിൽ സ്റ്റേഷൻ സ്റ്റോപ്പ്',
        sequence: 2,
        latitude: 10.0159,
        longitude: 76.3419,
        scheduledTime: '07:28 AM',
        studentIds: ['stu-003', 'stu-004', 'stu-005'],
      },
      {
        id: 'stop-103',
        routeId: 'route-01',
        name: 'Palarivattom Bypass Junction',
        nameMl: 'പാലാരിവട്ടം ബൈപ്പാസ് ജംഗ്ഷൻ',
        sequence: 3,
        latitude: 10.0014,
        longitude: 76.3106,
        scheduledTime: '07:42 AM',
        studentIds: ['stu-006', 'stu-007'],
      },
      {
        id: 'stop-104',
        routeId: 'route-01',
        name: 'Vyttila Mobility Hub Gate',
        nameMl: 'വൈറ്റില മൊബിലിറ്റി ഹബ് ഗേറ്റ്',
        sequence: 4,
        latitude: 9.9679,
        longitude: 76.3204,
        scheduledTime: '07:55 AM',
        studentIds: ['stu-008', 'stu-009'],
      },
      {
        id: 'stop-105',
        routeId: 'route-01',
        name: 'Krypton Central Campus (Kochi)',
        nameMl: 'ക്രിപ്റ്റൺ സെൻട്രൽ കാമ്പസ് (കൊച്ചി)',
        sequence: 5,
        latitude: 9.9542,
        longitude: 76.3458,
        scheduledTime: '08:10 AM',
        studentIds: [],
      },
    ],
    students: [
      {
        id: 'stu-001',
        name: 'Aarav Menon',
        admissionNumber: 'ADM-2026-001',
        grade: 'Class 4 - A',
        guardianName: 'Rajesh Menon',
        guardianPhone: '+91 98471 11222',
        stopId: 'stop-101',
        stopName: 'Infopark Phase 2 Gate',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-002',
        name: 'Diya Krishnan',
        admissionNumber: 'ADM-2026-002',
        grade: 'Class 3 - B',
        guardianName: 'Pradeep Krishnan',
        guardianPhone: '+91 98472 33444',
        stopId: 'stop-101',
        stopName: 'Infopark Phase 2 Gate',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-003',
        name: 'Malavika Nair',
        admissionNumber: 'ADM-2026-042',
        grade: 'Class 5 - A',
        guardianName: 'Dhanya Mohan',
        guardianPhone: '+91 98473 55666',
        stopId: 'stop-102',
        stopName: 'Kakkanad Civil Station Stop',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-004',
        name: 'Vivaan Varghese',
        admissionNumber: 'ADM-2026-015',
        grade: 'Class 5 - A',
        guardianName: 'Thomas Varghese',
        guardianPhone: '+91 98474 77888',
        stopId: 'stop-102',
        stopName: 'Kakkanad Civil Station Stop',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-005',
        name: 'Ananya Pillai',
        admissionNumber: 'ADM-2026-019',
        grade: 'Class 2 - A',
        guardianName: 'Lakshmi Pillai',
        guardianPhone: '+91 98475 99000',
        stopId: 'stop-102',
        stopName: 'Kakkanad Civil Station Stop',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-006',
        name: 'Rohan Nambiar',
        admissionNumber: 'ADM-2026-022',
        grade: 'Class 6 - B',
        guardianName: 'Sandeep Nambiar',
        guardianPhone: '+91 98951 11222',
        stopId: 'stop-103',
        stopName: 'Palarivattom Bypass Junction',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-007',
        name: 'Fathima Ashraf',
        admissionNumber: 'ADM-2026-025',
        grade: 'Class 4 - A',
        guardianName: 'Ashraf Ali',
        guardianPhone: '+91 98952 33444',
        stopId: 'stop-103',
        stopName: 'Palarivattom Bypass Junction',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-008',
        name: 'Karthik Kurup',
        admissionNumber: 'ADM-2026-031',
        grade: 'Class 3 - B',
        guardianName: 'Meera Kurup',
        guardianPhone: '+91 98953 55666',
        stopId: 'stop-104',
        stopName: 'Vyttila Mobility Hub Gate',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-009',
        name: 'Meenakshi Iyer',
        admissionNumber: 'ADM-2026-037',
        grade: 'Class 1 - A',
        guardianName: 'Subramanian Iyer',
        guardianPhone: '+91 98954 77888',
        stopId: 'stop-104',
        stopName: 'Vyttila Mobility Hub Gate',
        transitStatus: 'WAITING',
      },
    ],
  },
  {
    id: 'route-02',
    name: 'Route 2: Edappally & Kaloor Shuttle',
    nameMl: 'റൂട്ട് 2: ഇടപ്പള്ളി & കലൂർ ഷട്ടിൽ',
    code: 'BUS-02',
    vehicleRegistration: 'KL 07 DA 8819',
    vehicleModel: 'Ashok Leyland Sunshine (28-seater)',
    driverName: 'Manoj Joseph',
    driverPhone: '+91 98460 98765',
    totalCapacity: 28,
    direction: 'MORNING_PICKUP',
    stops: [
      {
        id: 'stop-201',
        routeId: 'route-02',
        name: 'Edappally Metro Junction',
        nameMl: 'ഇടപ്പള്ളി മെട്രോ ജംഗ്ഷൻ',
        sequence: 1,
        latitude: 10.0261,
        longitude: 76.3087,
        scheduledTime: '07:20 AM',
        studentIds: ['stu-010', 'stu-011'],
      },
      {
        id: 'stop-202',
        routeId: 'route-02',
        name: 'Kaloor Stadium Station',
        nameMl: 'കലൂർ സ്റ്റേഡിയം സ്റ്റേഷൻ',
        sequence: 2,
        latitude: 9.9972,
        longitude: 76.3019,
        scheduledTime: '07:35 AM',
        studentIds: ['stu-012', 'stu-013'],
      },
      {
        id: 'stop-203',
        routeId: 'route-02',
        name: 'Krypton Central Campus (Kochi)',
        nameMl: 'ക്രിപ്റ്റൺ സെൻട്രൽ കാമ്പസ് (കൊച്ചി)',
        sequence: 3,
        latitude: 9.9542,
        longitude: 76.3458,
        scheduledTime: '08:05 AM',
        studentIds: [],
      },
    ],
    students: [
      {
        id: 'stu-010',
        name: 'Maya Patel',
        admissionNumber: 'ADM-2026-055',
        grade: 'Class 5 - A',
        guardianName: 'Raj Patel',
        guardianPhone: '+91 94471 12345',
        stopId: 'stop-201',
        stopName: 'Edappally Metro Junction',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-011',
        name: 'Nikhil Mathew',
        admissionNumber: 'ADM-2026-058',
        grade: 'Class 4 - A',
        guardianName: 'Annamma Mathew',
        guardianPhone: '+91 94472 23456',
        stopId: 'stop-201',
        stopName: 'Edappally Metro Junction',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-012',
        name: 'Zara Fathima',
        admissionNumber: 'ADM-2026-061',
        grade: 'Class 3 - B',
        guardianName: 'Salma Rahman',
        guardianPhone: '+91 94473 34567',
        stopId: 'stop-202',
        stopName: 'Kaloor Stadium Station',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-013',
        name: 'Adithya Menon',
        admissionNumber: 'ADM-2026-064',
        grade: 'Class 6 - B',
        guardianName: 'Vikram Menon',
        guardianPhone: '+91 94474 45678',
        stopId: 'stop-202',
        stopName: 'Kaloor Stadium Station',
        transitStatus: 'WAITING',
      },
    ],
  },
];

@Injectable()
export class TransportService {
  private activeTrips: Map<string, TransportTrip> = new Map();
  private routesList: TransportRoute[] = JSON.parse(JSON.stringify(DEFAULT_ROUTES));

  private schoolLocation: SchoolCampusLocation = {
    schoolName: 'Krypton Public School',
    schoolNameMl: 'ക്രിപ്റ്റൺ പബ്ലിക് സ്കൂൾ',
    address: 'Hill Palace Road, Tripunithura, Kochi',
    addressMl: 'ഹിൽ പാലസ് റോഡ്, തൃപ്പൂണിത്തുറ, കൊച്ചി',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pincode: '682301',
    latitude: 9.9542,
    longitude: 76.3458,
    campusGate: 'Main Campus Bus Bay (Gate 2)',
    morningReportingTime: '08:15 AM',
    eveningDepartureTime: '03:30 PM',
  };

  private recalculateRouteDistances(): void {
    for (const route of this.routesList) {
      for (const stop of route.stops) {
        stop.distanceFromSchoolKm = calculateDistanceKm(
          stop.latitude,
          stop.longitude,
          this.schoolLocation.latitude,
          this.schoolLocation.longitude,
        );
        stop.estimatedMinutesToSchool = Math.max(
          3,
          Math.round(stop.distanceFromSchoolKm * 2.5 + (route.stops.length - stop.sequence) * 2),
        );
      }
    }
  }

  constructor(private prisma: PrismaService) {
    this.recalculateRouteDistances();
    // Initialize an active trip for demo/live tracking out-of-the-box
    const defaultRoute = this.routesList[0] || DEFAULT_ROUTES[0];
    const initialTrip: TransportTrip = {
      id: 'trip-active-01',
      routeId: defaultRoute.id,
      routeName: defaultRoute.name,
      vehicleRegistration: defaultRoute.vehicleRegistration,
      driverName: defaultRoute.driverName,
      driverPhone: defaultRoute.driverPhone,
      direction: 'MORNING_PICKUP',
      status: 'IN_TRANSIT',
      startedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      currentLocation: {
        latitude: 10.0112,
        longitude: 76.3521,
        speed: 34,
        heading: 248,
        accuracy: 4,
        lastPingAt: new Date().toISOString(),
      },
      locationHistory: [
        { latitude: 10.0064, longitude: 76.3638, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
        { latitude: 10.0091, longitude: 76.3575, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
        { latitude: 10.0112, longitude: 76.3521, timestamp: new Date().toISOString() },
      ],
      currentStopId: 'stop-101',
      nextStopId: 'stop-102',
      estimatedArrivalMinutes: 5,
      totalStudents: defaultRoute.students.length,
      boardedCount: 2,
      droppedCount: 0,
      absentCount: 0,
      waitingCount: 7,
      students: defaultRoute.students.map((s, idx) => ({
        ...s,
        transitStatus: idx < 2 ? 'BOARDED' : 'WAITING',
        updatedAt: idx < 2 ? new Date(Date.now() - 12 * 60 * 1000).toISOString() : undefined,
      })),
    };

    this.activeTrips.set(initialTrip.id, initialTrip);
    this.activeTrips.set(defaultRoute.id, initialTrip);
  }

  async getSchoolLocation(): Promise<SchoolCampusLocation> {
    return this.schoolLocation;
  }

  async updateSchoolLocation(dto: UpdateSchoolLocationDto): Promise<SchoolCampusLocation> {
    this.schoolLocation = {
      ...this.schoolLocation,
      ...dto,
    };
    // Update campus stop coordinates across existing routes that contain school campus
    for (const route of this.routesList) {
      for (const stop of route.stops) {
        if (
          stop.name.toLowerCase().includes('campus') ||
          stop.name.toLowerCase().includes('school')
        ) {
          stop.latitude = this.schoolLocation.latitude;
          stop.longitude = this.schoolLocation.longitude;
          stop.name = `${this.schoolLocation.schoolName} (${this.schoolLocation.city})`;
          if (this.schoolLocation.schoolNameMl) {
            stop.nameMl = `${this.schoolLocation.schoolNameMl} (${this.schoolLocation.city})`;
          }
        }
      }
    }
    this.recalculateRouteDistances();
    return this.schoolLocation;
  }

  async getRoutes(): Promise<TransportRoute[]> {
    return this.routesList;
  }

  async getRouteById(routeId: string): Promise<TransportRoute | null> {
    const route = this.routesList.find((r) => r.id === routeId);
    return route || null;
  }

  async createRoute(dto: CreateRouteDto): Promise<TransportRoute> {
    const routeId = `route-${Date.now().toString().slice(-4)}`;
    const stops: TransportStop[] = dto.stops.map((s, idx) => ({
      id: `stop-${routeId}-${idx + 1}`,
      routeId,
      name: s.name,
      nameMl: s.nameMl,
      sequence: s.sequence || idx + 1,
      latitude: s.latitude,
      longitude: s.longitude,
      scheduledTime: s.scheduledTime || '07:30 AM',
      studentIds: [],
      distanceFromSchoolKm: calculateDistanceKm(
        s.latitude,
        s.longitude,
        this.schoolLocation.latitude,
        this.schoolLocation.longitude,
      ),
      estimatedMinutesToSchool: Math.max(
        3,
        Math.round(
          calculateDistanceKm(
            s.latitude,
            s.longitude,
            this.schoolLocation.latitude,
            this.schoolLocation.longitude,
          ) * 2.5,
        ),
      ),
    }));

    // If MORNING_PICKUP and the final stop is not school campus, add campus stop
    const lastStop = stops[stops.length - 1];
    if (
      dto.direction === 'MORNING_PICKUP' &&
      (!lastStop ||
        (!lastStop.name.toLowerCase().includes('campus') &&
          !lastStop.name.toLowerCase().includes('school')))
    ) {
      stops.push({
        id: `stop-${routeId}-campus`,
        routeId,
        name: `${this.schoolLocation.schoolName} (${this.schoolLocation.city})`,
        nameMl: `${this.schoolLocation.schoolNameMl || this.schoolLocation.schoolName} (${this.schoolLocation.city})`,
        sequence: stops.length + 1,
        latitude: this.schoolLocation.latitude,
        longitude: this.schoolLocation.longitude,
        scheduledTime: this.schoolLocation.morningReportingTime,
        studentIds: [],
        distanceFromSchoolKm: 0,
        estimatedMinutesToSchool: 0,
      });
    }

    const newRoute: TransportRoute = {
      id: routeId,
      name: dto.name,
      nameMl: dto.nameMl,
      code: dto.code,
      vehicleRegistration: dto.vehicleRegistration,
      vehicleModel: dto.vehicleModel,
      driverName: dto.driverName,
      driverPhone: dto.driverPhone,
      totalCapacity: dto.totalCapacity,
      direction: dto.direction,
      stops,
      students: [],
    };

    this.routesList.push(newRoute);
    return newRoute;
  }

  async updateRoute(routeId: string, dto: Partial<CreateRouteDto>): Promise<TransportRoute> {
    const route = this.routesList.find((r) => r.id === routeId);
    if (!route) {
      throw new NotFoundException(`Route with id ${routeId} not found`);
    }

    if (dto.name) route.name = dto.name;
    if (dto.nameMl) route.nameMl = dto.nameMl;
    if (dto.code) route.code = dto.code;
    if (dto.vehicleRegistration) route.vehicleRegistration = dto.vehicleRegistration;
    if (dto.vehicleModel) route.vehicleModel = dto.vehicleModel;
    if (dto.driverName) route.driverName = dto.driverName;
    if (dto.driverPhone) route.driverPhone = dto.driverPhone;
    if (dto.totalCapacity) route.totalCapacity = dto.totalCapacity;
    if (dto.direction) route.direction = dto.direction;

    if (dto.stops && dto.stops.length > 0) {
      route.stops = dto.stops.map((s, idx) => ({
        id: `stop-${routeId}-${idx + 1}`,
        routeId,
        name: s.name,
        nameMl: s.nameMl,
        sequence: s.sequence || idx + 1,
        latitude: s.latitude,
        longitude: s.longitude,
        scheduledTime: s.scheduledTime || '07:30 AM',
        studentIds: [],
        distanceFromSchoolKm: calculateDistanceKm(
          s.latitude,
          s.longitude,
          this.schoolLocation.latitude,
          this.schoolLocation.longitude,
        ),
        estimatedMinutesToSchool: Math.max(
          3,
          Math.round(
            calculateDistanceKm(
              s.latitude,
              s.longitude,
              this.schoolLocation.latitude,
              this.schoolLocation.longitude,
            ) * 2.5,
          ),
        ),
      }));
    }

    this.recalculateRouteDistances();
    return route;
  }

  async deleteRoute(routeId: string): Promise<{ success: boolean; id: string }> {
    const index = this.routesList.findIndex((r) => r.id === routeId);
    if (index === -1) {
      throw new NotFoundException(`Route with id ${routeId} not found`);
    }
    this.routesList.splice(index, 1);
    this.activeTrips.delete(routeId);
    return { success: true, id: routeId };
  }

  async autoGenerateRoute(dto: AutoGenerateRouteDto): Promise<TransportRoute> {
    const routeId = `route-${Date.now().toString().slice(-4)}`;
    const allStops: Array<{ name: string; nameMl?: string; latitude: number; longitude: number }> = [
      dto.originStop,
      ...(dto.intermediateStops || []),
    ];

    const totalIntermediateCount = allStops.length;
    const stops: TransportStop[] = allStops.map((st, idx) => {
      const distFromSchool = calculateDistanceKm(
        st.latitude,
        st.longitude,
        this.schoolLocation.latitude,
        this.schoolLocation.longitude,
      );
      const estMinutes = Math.round(distFromSchool * 2.6 + (totalIntermediateCount - idx) * 3);
      const pickupHour = 8 - Math.floor(estMinutes / 60);
      const pickupMinute = (60 + 15 - (estMinutes % 60)) % 60;
      const formattedHour = pickupHour < 10 ? `0${pickupHour}` : `${pickupHour}`;
      const formattedMin = pickupMinute < 10 ? `0${pickupMinute}` : `${pickupMinute}`;

      return {
        id: `stop-${routeId}-${idx + 1}`,
        routeId,
        name: st.name,
        nameMl: st.nameMl,
        sequence: idx + 1,
        latitude: st.latitude,
        longitude: st.longitude,
        scheduledTime: `${formattedHour}:${formattedMin} AM`,
        studentIds: [],
        distanceFromSchoolKm: distFromSchool,
        estimatedMinutesToSchool: estMinutes,
      };
    });

    stops.push({
      id: `stop-${routeId}-campus`,
      routeId,
      name: `${this.schoolLocation.schoolName} (${this.schoolLocation.city})`,
      nameMl: `${this.schoolLocation.schoolNameMl || this.schoolLocation.schoolName} (${this.schoolLocation.city})`,
      sequence: stops.length + 1,
      latitude: this.schoolLocation.latitude,
      longitude: this.schoolLocation.longitude,
      scheduledTime: this.schoolLocation.morningReportingTime,
      studentIds: [],
      distanceFromSchoolKm: 0,
      estimatedMinutesToSchool: 0,
    });

    const route: TransportRoute = {
      id: routeId,
      name: dto.name,
      nameMl: dto.nameMl,
      code: dto.code,
      vehicleRegistration: dto.vehicleRegistration,
      vehicleModel: dto.vehicleModel,
      driverName: dto.driverName,
      driverPhone: dto.driverPhone,
      totalCapacity: dto.totalCapacity,
      direction: dto.direction,
      stops,
      students: [],
    };

    this.routesList.push(route);
    return route;
  }

  async getLiveTrips(): Promise<TransportTrip[]> {
    const trips = Array.from(new Set(Array.from(this.activeTrips.values())));
    return trips;
  }

  async getTripById(tripId: string): Promise<TransportTrip | null> {
    return this.activeTrips.get(tripId) || null;
  }

  async getActiveTripByRoute(routeId: string): Promise<TransportTrip | null> {
    const trip = this.activeTrips.get(routeId);
    if (trip && trip.status === 'IN_TRANSIT') {
      return trip;
    }
    for (const t of this.activeTrips.values()) {
      if (t.routeId === routeId && t.status === 'IN_TRANSIT') {
        return t;
      }
    }
    return null;
  }

  async startTrip(dto: StartTripDto): Promise<TransportTrip> {
    const route = await this.getRouteById(dto.routeId);
    if (!route) {
      throw new NotFoundException(`Route with id ${dto.routeId} not found`);
    }

    const firstStop = route.stops[0];
    const initialLat = firstStop ? firstStop.latitude : 9.9816;
    const initialLng = firstStop ? firstStop.longitude : 76.2999;

    const tripId = `trip-${Date.now()}`;
    const newTrip: TransportTrip = {
      id: tripId,
      routeId: route.id,
      routeName: route.name,
      vehicleRegistration: dto.vehicleRegistration || route.vehicleRegistration,
      driverName: dto.driverName || route.driverName,
      driverPhone: dto.driverPhone || route.driverPhone,
      direction: dto.direction || route.direction,
      status: 'IN_TRANSIT',
      startedAt: new Date().toISOString(),
      currentLocation: {
        latitude: initialLat,
        longitude: initialLng,
        speed: 0,
        heading: 0,
        accuracy: 5,
        lastPingAt: new Date().toISOString(),
      },
      locationHistory: [
        {
          latitude: initialLat,
          longitude: initialLng,
          timestamp: new Date().toISOString(),
        },
      ],
      currentStopId: firstStop?.id,
      nextStopId: route.stops[1]?.id,
      estimatedArrivalMinutes: 8,
      totalStudents: route.students.length,
      boardedCount: 0,
      droppedCount: 0,
      absentCount: 0,
      waitingCount: route.students.length,
      students: route.students.map((s) => ({
        ...s,
        transitStatus: 'WAITING',
      })),
    };

    this.activeTrips.set(tripId, newTrip);
    this.activeTrips.set(route.id, newTrip);
    return newTrip;
  }

  async recordLocation(dto: LocationPingDto): Promise<TransportTrip> {
    const trip = this.activeTrips.get(dto.tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${dto.tripId} not found`);
    }

    const timestamp = dto.timestamp || new Date().toISOString();
    trip.currentLocation = {
      latitude: dto.latitude,
      longitude: dto.longitude,
      speed: dto.speed !== undefined ? Math.round(dto.speed) : trip.currentLocation.speed,
      heading: dto.heading !== undefined ? Math.round(dto.heading) : trip.currentLocation.heading,
      accuracy: dto.accuracy || trip.currentLocation.accuracy,
      lastPingAt: timestamp,
    };

    trip.locationHistory.push({
      latitude: dto.latitude,
      longitude: dto.longitude,
      timestamp,
    });

    if (trip.locationHistory.length > 50) {
      trip.locationHistory.shift();
    }

    // Determine nearest and next stop based on coordinates
    const route = await this.getRouteById(trip.routeId);
    if (route && route.stops.length > 0) {
      let closestStop = route.stops[0];
      let minDistance = 9999;
      for (const stop of route.stops) {
        const d = calculateDistanceKm(dto.latitude, dto.longitude, stop.latitude, stop.longitude);
        if (d < minDistance) {
          minDistance = d;
          closestStop = stop;
        }
      }

      if (minDistance < 0.3) {
        trip.currentStopId = closestStop.id;
        const nextIdx = route.stops.findIndex((s) => s.id === closestStop.id) + 1;
        if (nextIdx < route.stops.length) {
          trip.nextStopId = route.stops[nextIdx].id;
        }
      }

      // Calculate ETA to next stop (assuming 30 km/h average city bus speed)
      if (trip.nextStopId) {
        const nextStop = route.stops.find((s) => s.id === trip.nextStopId);
        if (nextStop) {
          const distToNext = calculateDistanceKm(
            dto.latitude,
            dto.longitude,
            nextStop.latitude,
            nextStop.longitude
          );
          trip.estimatedArrivalMinutes = Math.max(1, Math.round((distToNext / 30) * 60));
        }
      }
    }

    return trip;
  }

  async updateStudentStatus(dto: UpdateStudentStatusDto): Promise<TransportTrip> {
    const trip = this.activeTrips.get(dto.tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${dto.tripId} not found`);
    }

    const student = trip.students.find((s) => s.id === dto.studentId);
    if (!student) {
      throw new NotFoundException(`Student ${dto.studentId} not found in trip manifest`);
    }

    student.transitStatus = dto.status;
    student.updatedAt = new Date().toISOString();

    // Recalculate summary counts
    trip.boardedCount = trip.students.filter((s) => s.transitStatus === 'BOARDED').length;
    trip.droppedCount = trip.students.filter((s) => s.transitStatus === 'DROPPED').length;
    trip.absentCount = trip.students.filter((s) => s.transitStatus === 'ABSENT').length;
    trip.waitingCount = trip.students.filter((s) => s.transitStatus === 'WAITING').length;

    return trip;
  }

  async endTrip(dto: EndTripDto): Promise<TransportTrip> {
    const trip = this.activeTrips.get(dto.tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${dto.tripId} not found`);
    }

    trip.status = 'COMPLETED';
    trip.endedAt = new Date().toISOString();
    return trip;
  }

  async getParentTracking(studentIdOrAdmission?: string): Promise<ParentBusTrackingView> {
    // Find active trip and student
    let foundTrip: TransportTrip | undefined;
    let foundStudent: TransportStudent | undefined;

    const trips = Array.from(new Set(Array.from(this.activeTrips.values())));

    for (const t of trips) {
      if (studentIdOrAdmission) {
        const match = t.students.find(
          (s) => s.id === studentIdOrAdmission || s.admissionNumber === studentIdOrAdmission
        );
        if (match) {
          foundTrip = t;
          foundStudent = match;
          break;
        }
      }
    }

    // Default to the first active trip and student (Malavika Nair - 'stu-003')
    if (!foundTrip) {
      foundTrip = trips[0] || (await this.startTrip({ routeId: 'route-01' }));
    }
    if (!foundStudent) {
      foundStudent = foundTrip.students.find((s) => s.id === 'stu-003') || foundTrip.students[0];
    }

    const route = (await this.getRouteById(foundTrip.routeId)) || DEFAULT_ROUTES[0];
    const childStop =
      route.stops.find((s) => s.id === foundStudent?.stopId) || route.stops[1];

    const distKm = calculateDistanceKm(
      foundTrip.currentLocation.latitude,
      foundTrip.currentLocation.longitude,
      childStop.latitude,
      childStop.longitude
    );

    const etaMin = Math.max(1, Math.round((distKm / 30) * 60));

    let busStatusMessage = `Bus is ${etaMin} min away (${distKm} km)`;
    let busStatusMessageMl = `ബസ് ${distKm} കി.മീ അകലെയാണ് (ഏകദേശം ${etaMin} മിനിറ്റ്)`;

    if (foundStudent?.transitStatus === 'BOARDED') {
      busStatusMessage = `Child boarded bus. En route to school campus.`;
      busStatusMessageMl = `വിദ്യാർത്ഥി ബസ്സിൽ കയറി. സ്കൂളിലേക്ക് യാത്രയിലാണ്.`;
    } else if (foundStudent?.transitStatus === 'DROPPED') {
      busStatusMessage = `Child dropped off safely.`;
      busStatusMessageMl = `വിദ്യാർത്ഥി സുരക്ഷിതമായി എത്തിച്ചേർന്നു.`;
    } else if (distKm < 0.25) {
      busStatusMessage = `Bus has arrived at ${childStop.name}!`;
      busStatusMessageMl = `ബസ് ${childStop.nameMl || childStop.name} സ്റ്റോപ്പിൽ എത്തിച്ചേർന്നു!`;
    }

    return {
      trip: foundTrip,
      child: foundStudent!,
      childStop,
      distanceKmToChildStop: distKm,
      etaMinutesToChildStop: etaMin,
      busStatusMessage,
      busStatusMessageMl,
    };
  }

  async searchNearbyPlaces(
    query: string,
    schoolLat?: number,
    schoolLng?: number,
  ): Promise<Array<{ name: string; displayName: string; latitude: number; longitude: number; distanceFromSchoolKm: number; estimatedMinutes: number }>> {
    const lat = schoolLat || this.schoolLocation.latitude;
    const lng = schoolLng || this.schoolLocation.longitude;

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&countrycodes=in`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'KryptonSchoolERP/1.0 (school-transport-routing)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = (await response.json()) as any[];
        if (Array.isArray(data) && data.length > 0) {
          const results = data.map((item) => {
            const itemLat = parseFloat(item.lat);
            const itemLng = parseFloat(item.lon);
            const dist = calculateDistanceKm(itemLat, itemLng, lat, lng);
            const estMin = Math.max(3, Math.round(dist * 2.5));
            const primaryName = item.name || item.display_name.split(',')[0].trim();

            return {
              name: primaryName,
              displayName: item.display_name,
              latitude: Number(itemLat.toFixed(5)),
              longitude: Number(itemLng.toFixed(5)),
              distanceFromSchoolKm: dist,
              estimatedMinutes: estMin,
            };
          });

          // Sort by proximity to the school
          results.sort((a, b) => a.distanceFromSchoolKm - b.distanceFromSchoolKm);
          return results;
        }
      }
    } catch {
      // Fallback if offline or timeout
    }

    // Fallback: Generate intelligent relative landmark based on school coordinates
    const offsetKm = 4.5;
    const degOffset = offsetKm / 111;
    const fallbackDist = offsetKm;
    const estMin = Math.round(fallbackDist * 2.5);

    return [
      {
        name: `${query.trim()} Junction`,
        displayName: `${query.trim()} Junction, near ${this.schoolLocation.schoolName}, ${this.schoolLocation.city}`,
        latitude: Number((lat + degOffset).toFixed(5)),
        longitude: Number((lng + degOffset * 0.8).toFixed(5)),
        distanceFromSchoolKm: fallbackDist,
        estimatedMinutes: estMin,
      },
    ];
  }

  async getNearbySuggestedStops(
    schoolLat?: number,
    schoolLng?: number,
    radiusKm = 15,
  ): Promise<Array<{ name: string; nameMl?: string; latitude: number; longitude: number; distanceFromSchoolKm: number; estimatedMinutes: number }>> {
    const lat = schoolLat || this.schoolLocation.latitude;
    const lng = schoolLng || this.schoolLocation.longitude;
    const city = this.schoolLocation.city || 'Campus Area';
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('bus stop ' + city)}&format=json&limit=10&countrycodes=in`;
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'KryptonSchoolERP/1.0 (school-transport-routing)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = (await response.json()) as any[];
        if (Array.isArray(data) && data.length > 0) {
          const results = data
            .map((item) => {
              const itemLat = parseFloat(item.lat);
              const itemLng = parseFloat(item.lon);
              const dist = calculateDistanceKm(itemLat, itemLng, lat, lng);
              const primaryName = item.name || item.display_name.split(',')[0].trim();
              return {
                name: primaryName,
                latitude: Number(itemLat.toFixed(5)),
                longitude: Number(itemLng.toFixed(5)),
                distanceFromSchoolKm: dist,
                estimatedMinutes: Math.max(3, Math.round(dist * 2.5)),
              };
            })
            .filter((item) => item.distanceFromSchoolKm <= radiusKm);

          if (results.length > 0) {
            results.sort((a, b) => a.distanceFromSchoolKm - b.distanceFromSchoolKm);
            return results;
          }
        }
      }
    } catch {} finally { if(timeout)clearTimeout(timeout); }

    // Fallback radial transit points around the school
    const radialOffsets = [
      { name: 'North Main Junction', nameMl: 'വടക്കേ മെയിൻ ജംഗ്ഷൻ', dLat: 0.035, dLng: 0.01 },
      { name: 'East Market Bus Bay', nameMl: 'കിഴക്കേ മാർക്കറ്റ് ബസ് ബേ', dLat: 0.01, dLng: 0.04 },
      { name: 'South Highway Bypass', nameMl: 'തെക്കേ ബൈപ്പാസ് ജംഗ്ഷൻ', dLat: -0.04, dLng: -0.01 },
      { name: 'West Town Station Road', nameMl: 'പടിഞ്ഞാറേ ടൗൺ സ്റ്റേഷൻ റോഡ്', dLat: -0.015, dLng: -0.045 },
      { name: 'Civil Station Mukku', nameMl: 'സിവിൽ സ്റ്റേഷൻ മുക്ക്', dLat: 0.025, dLng: -0.03 },
    ];

    return radialOffsets.map((pt) => {
      const ptLat = Number((lat + pt.dLat).toFixed(5));
      const ptLng = Number((lng + pt.dLng).toFixed(5));
      const dist = calculateDistanceKm(ptLat, ptLng, lat, lng);
      return {
        name: `${this.schoolLocation.city || 'Nearby'} ${pt.name}`,
        nameMl: pt.nameMl,
        latitude: ptLat,
        longitude: ptLng,
        distanceFromSchoolKm: dist,
        estimatedMinutes: Math.max(3, Math.round(dist * 2.5)),
      };
    });
  }
}
