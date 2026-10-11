import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  TransportRoute,
  TransportTrip,
  TransportStudent,
  TransportStop,
  ParentBusTrackingView,
} from '@krypton/types';
import {
  StartTripDto,
  LocationPingDto,
  UpdateStudentStatusDto,
  EndTripDto,
} from './dto/trip.dto';

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
    name: 'Route 1: Green Valley & Nairobi West',
    nameMl: 'റൂട്ട് 1: ഗ്രീൻ വാലി - സ്കൂൾ എക്സ്പ്രസ്സ്',
    code: 'BUS-01',
    vehicleRegistration: 'KCA 421B',
    vehicleModel: 'Toyota Coaster (32-seater)',
    driverName: 'John Mwangi',
    driverPhone: '+254 712 345 678',
    totalCapacity: 32,
    direction: 'MORNING_PICKUP',
    stops: [
      {
        id: 'stop-101',
        routeId: 'route-01',
        name: 'Hill View Gate Stop',
        nameMl: 'ഹിൽ വ്യൂ ഗേറ്റ് സ്റ്റോപ്പ്',
        sequence: 1,
        latitude: -1.3045,
        longitude: 36.7825,
        scheduledTime: '07:15 AM',
        studentIds: ['stu-001', 'stu-002'],
      },
      {
        id: 'stop-102',
        routeId: 'route-01',
        name: 'Green Valley Estate (Main Stop)',
        nameMl: 'ഗ്രീൻ വാലി എസ്റ്റേറ്റ് (മെയിൻ സ്റ്റോപ്പ്)',
        sequence: 2,
        latitude: -1.2982,
        longitude: 36.7915,
        scheduledTime: '07:28 AM',
        studentIds: ['stu-003', 'stu-004', 'stu-005'],
      },
      {
        id: 'stop-103',
        routeId: 'route-01',
        name: 'Valley Arcade Junction',
        nameMl: 'വാലി ആർക്കേഡ് ജംഗ്ഷൻ',
        sequence: 3,
        latitude: -1.2915,
        longitude: 36.7995,
        scheduledTime: '07:42 AM',
        studentIds: ['stu-006', 'stu-007'],
      },
      {
        id: 'stop-104',
        routeId: 'route-01',
        name: 'Silver Springs Gate',
        nameMl: 'സിൽവർ സ്പ്രിംഗ്സ് ഗേറ്റ്',
        sequence: 4,
        latitude: -1.2852,
        longitude: 36.8085,
        scheduledTime: '07:55 AM',
        studentIds: ['stu-008', 'stu-009'],
      },
      {
        id: 'stop-105',
        routeId: 'route-01',
        name: 'Krypton Central Campus (School)',
        nameMl: 'ക്രിപ്റ്റൺ സെൻട്രൽ കാമ്പസ് (സ്കൂൾ ഗേറ്റ്)',
        sequence: 5,
        latitude: -1.2801,
        longitude: 36.8162,
        scheduledTime: '08:10 AM',
        studentIds: [],
      },
    ],
    students: [
      {
        id: 'stu-001',
        name: 'Ethan Mwangi',
        admissionNumber: 'ADM-2024-001',
        grade: 'Grade 4 - Eagle',
        guardianName: 'Grace Mwangi',
        guardianPhone: '+254 722 111 222',
        stopId: 'stop-101',
        stopName: 'Hill View Gate Stop',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-002',
        name: 'Nia Kamau',
        admissionNumber: 'ADM-2024-002',
        grade: 'Grade 3 - Falcon',
        guardianName: 'Peter Kamau',
        guardianPhone: '+254 722 333 444',
        stopId: 'stop-101',
        stopName: 'Hill View Gate Stop',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-003',
        name: 'Malavika Nair',
        admissionNumber: 'ADM-2024-042',
        grade: 'Grade 5 - Bluebell',
        guardianName: 'Dhanya Mohan',
        guardianPhone: '+254 722 555 666',
        stopId: 'stop-102',
        stopName: 'Green Valley Estate (Main Stop)',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-004',
        name: 'Liam Otieno',
        admissionNumber: 'ADM-2024-015',
        grade: 'Grade 5 - Bluebell',
        guardianName: 'Faith Otieno',
        guardianPhone: '+254 722 777 888',
        stopId: 'stop-102',
        stopName: 'Green Valley Estate (Main Stop)',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-005',
        name: 'Sophia Wambui',
        admissionNumber: 'ADM-2024-019',
        grade: 'Grade 2 - Robin',
        guardianName: 'Lucy Wambui',
        guardianPhone: '+254 722 999 000',
        stopId: 'stop-102',
        stopName: 'Green Valley Estate (Main Stop)',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-006',
        name: 'Lucas Kiptoo',
        admissionNumber: 'ADM-2024-022',
        grade: 'Grade 6 - Lion',
        guardianName: 'Daniel Kiptoo',
        guardianPhone: '+254 733 111 222',
        stopId: 'stop-103',
        stopName: 'Valley Arcade Junction',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-007',
        name: 'Amina Ali',
        admissionNumber: 'ADM-2024-025',
        grade: 'Grade 4 - Eagle',
        guardianName: 'Hassan Ali',
        guardianPhone: '+254 733 333 444',
        stopId: 'stop-103',
        stopName: 'Valley Arcade Junction',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-008',
        name: 'Daniel Kiprono',
        admissionNumber: 'ADM-2024-031',
        grade: 'Grade 3 - Falcon',
        guardianName: 'Sarah Kiprono',
        guardianPhone: '+254 733 555 666',
        stopId: 'stop-104',
        stopName: 'Silver Springs Gate',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-009',
        name: 'Chloe Muthoni',
        admissionNumber: 'ADM-2024-037',
        grade: 'Grade 1 - Dove',
        guardianName: 'Joseph Muthoni',
        guardianPhone: '+254 733 777 888',
        stopId: 'stop-104',
        stopName: 'Silver Springs Gate',
        transitStatus: 'WAITING',
      },
    ],
  },
  {
    id: 'route-02',
    name: 'Route 2: Kilimani & Lavington Shuttle',
    nameMl: 'റൂട്ട് 2: കിലിമാനി & ലാവിംഗ്ടൺ ഷട്ടിൽ',
    code: 'BUS-02',
    vehicleRegistration: 'KBZ 189M',
    vehicleModel: 'Isuzu D-Max 28-seater',
    driverName: 'Dennis Omondi',
    driverPhone: '+254 711 987 654',
    totalCapacity: 28,
    direction: 'MORNING_PICKUP',
    stops: [
      {
        id: 'stop-201',
        routeId: 'route-02',
        name: 'Yaya Centre Roundabout',
        nameMl: 'യായ സെന്റർ റൗണ്ട്എബൗട്ട്',
        sequence: 1,
        latitude: -1.2935,
        longitude: 36.7895,
        scheduledTime: '07:20 AM',
        studentIds: ['stu-010', 'stu-011'],
      },
      {
        id: 'stop-202',
        routeId: 'route-02',
        name: 'Lavington Mall Station',
        nameMl: 'ലാവിംഗ്ടൺ മാൾ സ്റ്റേഷൻ',
        sequence: 2,
        latitude: -1.2825,
        longitude: 36.7725,
        scheduledTime: '07:35 AM',
        studentIds: ['stu-012', 'stu-013'],
      },
      {
        id: 'stop-203',
        routeId: 'route-02',
        name: 'Krypton Central Campus (School)',
        nameMl: 'ക്രിപ്റ്റൺ സെൻട്രൽ കാമ്പസ് (സ്കൂൾ ഗേറ്റ്)',
        sequence: 3,
        latitude: -1.2801,
        longitude: 36.8162,
        scheduledTime: '08:05 AM',
        studentIds: [],
      },
    ],
    students: [
      {
        id: 'stu-010',
        name: 'Maya Patel',
        admissionNumber: 'ADM-2024-055',
        grade: 'Grade 5 - Bluebell',
        guardianName: 'Raj Patel',
        guardianPhone: '+254 720 123 456',
        stopId: 'stop-201',
        stopName: 'Yaya Centre Roundabout',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-011',
        name: 'Brian Kipchirchir',
        admissionNumber: 'ADM-2024-058',
        grade: 'Grade 4 - Eagle',
        guardianName: 'Mercy Kipchirchir',
        guardianPhone: '+254 720 234 567',
        stopId: 'stop-201',
        stopName: 'Yaya Centre Roundabout',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-012',
        name: 'Zara Hassan',
        admissionNumber: 'ADM-2024-061',
        grade: 'Grade 3 - Falcon',
        guardianName: 'Fatima Hassan',
        guardianPhone: '+254 720 345 678',
        stopId: 'stop-202',
        stopName: 'Lavington Mall Station',
        transitStatus: 'WAITING',
      },
      {
        id: 'stu-013',
        name: 'Kevine Ochieng',
        admissionNumber: 'ADM-2024-064',
        grade: 'Grade 6 - Lion',
        guardianName: 'Victor Ochieng',
        guardianPhone: '+254 720 456 789',
        stopId: 'stop-202',
        stopName: 'Lavington Mall Station',
        transitStatus: 'WAITING',
      },
    ],
  },
];

@Injectable()
export class TransportService {
  private activeTrips: Map<string, TransportTrip> = new Map();

  constructor(private prisma: PrismaService) {
    // Initialize an active trip for demo/live tracking out-of-the-box
    const defaultRoute = DEFAULT_ROUTES[0];
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
        latitude: -1.2995,
        longitude: 36.7895,
        speed: 34,
        heading: 68,
        accuracy: 4,
        lastPingAt: new Date().toISOString(),
      },
      locationHistory: [
        { latitude: -1.3045, longitude: 36.7825, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
        { latitude: -1.3015, longitude: 36.7865, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
        { latitude: -1.2995, longitude: 36.7895, timestamp: new Date().toISOString() },
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

  async getRoutes(): Promise<TransportRoute[]> {
    return DEFAULT_ROUTES;
  }

  async getRouteById(routeId: string): Promise<TransportRoute | null> {
    const route = DEFAULT_ROUTES.find((r) => r.id === routeId);
    return route || null;
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
    const initialLat = firstStop ? firstStop.latitude : -1.2921;
    const initialLng = firstStop ? firstStop.longitude : 36.7905;

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
}
