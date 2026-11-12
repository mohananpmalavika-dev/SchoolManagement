/**
 * Zero-Hardware GPS Bus Tracking Types
 */

export type TripStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'PAUSED' | 'COMPLETED';

export type StudentTransitStatus = 'WAITING' | 'BOARDED' | 'DROPPED' | 'ABSENT';

export type RouteDirection = 'MORNING_PICKUP' | 'EVENING_DROPOFF';

export interface GPSLocationPing {
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // degrees 0-360
  accuracy?: number; // meters
  timestamp: string; // ISO string
}

export interface TransportStop {
  id: string;
  routeId: string;
  name: string;
  nameMl?: string; // Malayalam name
  sequence: number;
  latitude: number;
  longitude: number;
  scheduledTime: string;
  studentIds: string[];
  distanceFromSchoolKm?: number;
  estimatedMinutesToSchool?: number;
}

export interface SchoolCampusLocation {
  schoolName: string;
  schoolNameMl?: string;
  address: string;
  addressMl?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  campusGate: string;
  morningReportingTime: string; // e.g. "08:15 AM"
  eveningDepartureTime: string; // e.g. "03:30 PM"
}

export interface CreateRouteRequest {
  name: string;
  nameMl?: string;
  code: string;
  vehicleRegistration: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
  totalCapacity: number;
  direction: RouteDirection;
  stops: Array<{
    name: string;
    nameMl?: string;
    sequence: number;
    latitude: number;
    longitude: number;
    scheduledTime?: string;
  }>;
}

export interface AutoRouteGeneratorRequest {
  name: string;
  nameMl?: string;
  code: string;
  vehicleRegistration: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
  totalCapacity: number;
  direction: RouteDirection;
  corridorPresetId?: string;
  originStop: {
    name: string;
    nameMl?: string;
    latitude: number;
    longitude: number;
  };
  intermediateStops?: Array<{
    name: string;
    nameMl?: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface TransportStudent {
  id: string;
  name: string;
  admissionNumber: string;
  grade: string;
  guardianName: string;
  guardianPhone: string;
  stopId: string;
  stopName: string;
  transitStatus: StudentTransitStatus;
  updatedAt?: string;
  photo?: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  nameMl?: string;
  code: string;
  vehicleRegistration: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
  totalCapacity: number;
  direction: RouteDirection;
  stops: TransportStop[];
  students: TransportStudent[];
}

export interface TransportTrip {
  id: string;
  routeId: string;
  routeName: string;
  vehicleRegistration: string;
  driverName: string;
  driverPhone: string;
  direction: RouteDirection;
  status: TripStatus;
  startedAt?: string;
  endedAt?: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    accuracy?: number;
    lastPingAt: string;
  };
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  currentStopId?: string;
  nextStopId?: string;
  estimatedArrivalMinutes?: number;
  totalStudents: number;
  boardedCount: number;
  droppedCount: number;
  absentCount: number;
  waitingCount: number;
  students: TransportStudent[];
}

export interface ParentBusTrackingView {
  trip: TransportTrip;
  child: TransportStudent;
  childStop: TransportStop;
  distanceKmToChildStop: number;
  etaMinutesToChildStop: number;
  busStatusMessage: string;
  busStatusMessageMl: string;
}
