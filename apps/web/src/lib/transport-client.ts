import {
  TransportRoute,
  TransportTrip,
  TransportStudent,
  TransportStop,
  ParentBusTrackingView,
  StudentTransitStatus,
  RouteDirection,
} from '@krypton/types';
import apiClient from './api-client';

export const DEFAULT_TRANSPORT_ROUTES: TransportRoute[] = [
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
        transitStatus: 'BOARDED',
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
        transitStatus: 'BOARDED',
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

// Helper to calculate distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

// Local storage key for fallback/offline persistence
const STORAGE_KEY_TRIPS = 'krypton_transport_active_trips';

function getStoredTrips(): Record<string, TransportTrip> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIPS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredTrips(trips: Record<string, TransportTrip>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
  } catch {}
}

export function getInitialActiveTrip(routeId = 'route-01'): TransportTrip {
  const stored = getStoredTrips();
  if (stored[routeId]) {
    return stored[routeId];
  }

  const route = DEFAULT_TRANSPORT_ROUTES.find((r) => r.id === routeId) || DEFAULT_TRANSPORT_ROUTES[0];
  const initialTrip: TransportTrip = {
    id: `trip-${route.id}`,
    routeId: route.id,
    routeName: route.name,
    vehicleRegistration: route.vehicleRegistration,
    driverName: route.driverName,
    driverPhone: route.driverPhone,
    direction: 'MORNING_PICKUP',
    status: 'IN_TRANSIT',
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    currentLocation: {
      latitude: -1.3005,
      longitude: 36.7885,
      speed: 36,
      heading: 65,
      accuracy: 3,
      lastPingAt: new Date().toISOString(),
    },
    locationHistory: [
      { latitude: -1.3045, longitude: 36.7825, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      { latitude: -1.3025, longitude: 36.7855, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
      { latitude: -1.3005, longitude: 36.7885, timestamp: new Date().toISOString() },
    ],
    currentStopId: 'stop-101',
    nextStopId: 'stop-102',
    estimatedArrivalMinutes: 4,
    totalStudents: route.students.length,
    boardedCount: 2,
    droppedCount: 0,
    absentCount: 0,
    waitingCount: 7,
    students: route.students.map((s, idx) => ({
      ...s,
      transitStatus: idx < 2 ? 'BOARDED' : 'WAITING',
      updatedAt: idx < 2 ? new Date(Date.now() - 10 * 60 * 1000).toISOString() : undefined,
    })),
  };

  stored[routeId] = initialTrip;
  saveStoredTrips(stored);
  return initialTrip;
}

export const transportApi = {
  getRoutes: async (): Promise<TransportRoute[]> => {
    try {
      const res = await apiClient.get('/transport/routes');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {}
    return DEFAULT_TRANSPORT_ROUTES;
  },

  getActiveTrip: async (routeId = 'route-01'): Promise<TransportTrip> => {
    try {
      const res = await apiClient.get(`/transport/route/${routeId}/active`);
      if (res.data && res.data.id) return res.data;
    } catch {}
    return getInitialActiveTrip(routeId);
  },

  startTrip: async (params: {
    routeId: string;
    direction?: RouteDirection;
    driverName?: string;
    driverPhone?: string;
    vehicleRegistration?: string;
  }): Promise<TransportTrip> => {
    try {
      const res = await apiClient.post('/transport/trip/start', params);
      if (res.data && res.data.id) {
        const stored = getStoredTrips();
        stored[params.routeId] = res.data;
        saveStoredTrips(stored);
        return res.data;
      }
    } catch {}

    const route = DEFAULT_TRANSPORT_ROUTES.find((r) => r.id === params.routeId) || DEFAULT_TRANSPORT_ROUTES[0];
    const firstStop = route.stops[0];
    const trip: TransportTrip = {
      id: `trip-${Date.now()}`,
      routeId: route.id,
      routeName: route.name,
      vehicleRegistration: params.vehicleRegistration || route.vehicleRegistration,
      driverName: params.driverName || route.driverName,
      driverPhone: params.driverPhone || route.driverPhone,
      direction: params.direction || 'MORNING_PICKUP',
      status: 'IN_TRANSIT',
      startedAt: new Date().toISOString(),
      currentLocation: {
        latitude: firstStop?.latitude || -1.3045,
        longitude: firstStop?.longitude || 36.7825,
        speed: 0,
        heading: 0,
        accuracy: 4,
        lastPingAt: new Date().toISOString(),
      },
      locationHistory: [
        {
          latitude: firstStop?.latitude || -1.3045,
          longitude: firstStop?.longitude || 36.7825,
          timestamp: new Date().toISOString(),
        },
      ],
      currentStopId: firstStop?.id,
      nextStopId: route.stops[1]?.id,
      estimatedArrivalMinutes: 6,
      totalStudents: route.students.length,
      boardedCount: 0,
      droppedCount: 0,
      absentCount: 0,
      waitingCount: route.students.length,
      students: route.students.map((s) => ({ ...s, transitStatus: 'WAITING' })),
    };

    const stored = getStoredTrips();
    stored[route.id] = trip;
    saveStoredTrips(stored);
    return trip;
  },

  sendLocationPing: async (ping: {
    tripId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp?: string;
  }): Promise<TransportTrip> => {
    try {
      const res = await apiClient.post('/transport/trip/location', ping);
      if (res.data && res.data.id) {
        const stored = getStoredTrips();
        stored[res.data.routeId] = res.data;
        saveStoredTrips(stored);
        return res.data;
      }
    } catch {}

    // Fallback local update
    const stored = getStoredTrips();
    let targetTrip = Object.values(stored).find((t) => t.id === ping.tripId);
    if (!targetTrip) targetTrip = getInitialActiveTrip('route-01');

    const timestamp = ping.timestamp || new Date().toISOString();
    targetTrip.currentLocation = {
      latitude: ping.latitude,
      longitude: ping.longitude,
      speed: ping.speed !== undefined ? Math.round(ping.speed) : targetTrip.currentLocation.speed,
      heading: ping.heading !== undefined ? Math.round(ping.heading) : targetTrip.currentLocation.heading,
      accuracy: ping.accuracy || targetTrip.currentLocation.accuracy,
      lastPingAt: timestamp,
    };

    targetTrip.locationHistory.push({
      latitude: ping.latitude,
      longitude: ping.longitude,
      timestamp,
    });
    if (targetTrip.locationHistory.length > 50) targetTrip.locationHistory.shift();

    stored[targetTrip.routeId] = targetTrip;
    saveStoredTrips(stored);
    return targetTrip;
  },

  updateStudentStatus: async (params: {
    tripId: string;
    studentId: string;
    stopId?: string;
    status: StudentTransitStatus;
  }): Promise<TransportTrip> => {
    try {
      const res = await apiClient.post('/transport/trip/student-status', params);
      if (res.data && res.data.id) {
        const stored = getStoredTrips();
        stored[res.data.routeId] = res.data;
        saveStoredTrips(stored);
        return res.data;
      }
    } catch {}

    // Fallback local update
    const stored = getStoredTrips();
    let targetTrip = Object.values(stored).find((t) => t.id === params.tripId);
    if (!targetTrip) targetTrip = getInitialActiveTrip('route-01');

    const student = targetTrip.students.find((s) => s.id === params.studentId);
    if (student) {
      student.transitStatus = params.status;
      student.updatedAt = new Date().toISOString();
    }

    targetTrip.boardedCount = targetTrip.students.filter((s) => s.transitStatus === 'BOARDED').length;
    targetTrip.droppedCount = targetTrip.students.filter((s) => s.transitStatus === 'DROPPED').length;
    targetTrip.absentCount = targetTrip.students.filter((s) => s.transitStatus === 'ABSENT').length;
    targetTrip.waitingCount = targetTrip.students.filter((s) => s.transitStatus === 'WAITING').length;

    stored[targetTrip.routeId] = targetTrip;
    saveStoredTrips(stored);
    return targetTrip;
  },

  endTrip: async (tripId: string): Promise<TransportTrip> => {
    try {
      const res = await apiClient.post('/transport/trip/end', { tripId });
      if (res.data && res.data.id) {
        const stored = getStoredTrips();
        stored[res.data.routeId] = res.data;
        saveStoredTrips(stored);
        return res.data;
      }
    } catch {}

    const stored = getStoredTrips();
    let targetTrip = Object.values(stored).find((t) => t.id === tripId);
    if (!targetTrip) targetTrip = getInitialActiveTrip('route-01');
    targetTrip.status = 'COMPLETED';
    targetTrip.endedAt = new Date().toISOString();
    stored[targetTrip.routeId] = targetTrip;
    saveStoredTrips(stored);
    return targetTrip;
  },

  getParentTracking: async (studentId = 'stu-003'): Promise<ParentBusTrackingView> => {
    try {
      const res = await apiClient.get(`/transport/parent/${studentId}`);
      if (res.data && res.data.trip) return res.data;
    } catch {}

    const trip = getInitialActiveTrip('route-01');
    const child = trip.students.find((s) => s.id === studentId) || trip.students[2];
    const route = DEFAULT_TRANSPORT_ROUTES[0];
    const childStop = route.stops.find((s) => s.id === child.stopId) || route.stops[1];

    const distKm = calculateDistanceKm(
      trip.currentLocation.latitude,
      trip.currentLocation.longitude,
      childStop.latitude,
      childStop.longitude
    );
    const etaMin = Math.max(1, Math.round((distKm / 30) * 60));

    let busStatusMessage = `Bus is ${etaMin} min away (${distKm} km)`;
    let busStatusMessageMl = `ബസ് ${distKm} കി.മീ അകലെയാണ് (ഏകദേശം ${etaMin} മിനിറ്റ്)`;

    if (child.transitStatus === 'BOARDED') {
      busStatusMessage = `Child boarded bus. En route to school campus.`;
      busStatusMessageMl = `വിദ്യാർത്ഥി ബസ്സിൽ കയറി. സ്കൂളിലേക്ക് യാത്രയിലാണ്.`;
    } else if (child.transitStatus === 'DROPPED') {
      busStatusMessage = `Child dropped off safely.`;
      busStatusMessageMl = `വിദ്യാർത്ഥി സുരക്ഷിതമായി എത്തിച്ചേർന്നു.`;
    } else if (distKm < 0.25) {
      busStatusMessage = `Bus has arrived at ${childStop.name}!`;
      busStatusMessageMl = `ബസ് ${childStop.nameMl || childStop.name} സ്റ്റോപ്പിൽ എത്തിച്ചേർന്നു!`;
    }

    return {
      trip,
      child,
      childStop,
      distanceKmToChildStop: distKm,
      etaMinutesToChildStop: etaMin,
      busStatusMessage,
      busStatusMessageMl,
    };
  },
};
