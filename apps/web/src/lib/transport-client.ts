import {
  TransportRoute,
  TransportTrip,
  TransportStudent,
  TransportStop,
  ParentBusTrackingView,
  StudentTransitStatus,
  RouteDirection,
  SchoolCampusLocation,
  CreateRouteRequest,
  AutoRouteGeneratorRequest,
} from '@krypton/types';
import apiClient from './api-client';

export const DEFAULT_SCHOOL_LOCATION: SchoolCampusLocation = {
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

export const POPULAR_CORRIDOR_PRESETS = [
  // Kollam District Corridors
  {
    id: 'kollam-karunagappally',
    district: 'Kollam',
    name: 'Karunagappally - Chavara - Kollam NH 66 Corridor',
    nameMl: 'കരുനാഗപ്പള്ളി - ചവറ - കൊല്ലം NH 66 റൂട്ട്',
    origin: { name: 'Karunagappally KSRTC Bus Stand Gate', nameMl: 'കരുനാഗപ്പള്ളി KSRTC ബസ് സ്റ്റാൻഡ്', latitude: 9.0544, longitude: 76.5342 },
    intermediate: [
      { name: 'Chavara KMML / Titan Junction', nameMl: 'ചവറ ടൈറ്റാൻ ജംഗ്ഷൻ', latitude: 8.9975, longitude: 76.5389 },
      { name: 'Neendakara Fishing Harbour Gate', nameMl: 'നീണ്ടകര ഹാർബർ ഗേറ്റ്', latitude: 8.9392, longitude: 76.5412 },
      { name: 'Sakthikulangara Church Stop', nameMl: 'ശക്തികുളങ്ങര ചർച്ച് സ്റ്റോപ്പ്', latitude: 8.9185, longitude: 76.5518 },
      { name: 'Ramankulangara Junction', nameMl: 'രാമൻകുളങ്ങര ജംഗ്ഷൻ', latitude: 8.9056, longitude: 76.5784 },
    ],
  },
  {
    id: 'kottarakkara-kundara',
    district: 'Kollam',
    name: 'Kottarakkara - Kundara MC Road Feeder',
    nameMl: 'കൊട്ടാരക്കര - കുണ്ടറ - കടപ്പാക്കട റൂട്ട്',
    origin: { name: 'Kottarakkara Pulamon Junction', nameMl: 'കൊട്ടാരക്കര പുലമൺ ജംഗ്ഷൻ', latitude: 8.9987, longitude: 76.7681 },
    intermediate: [
      { name: 'Ezhukone Panchayath Stop', nameMl: 'എഴുകോൺ പഞ്ചായത്ത് സ്റ്റോപ്പ്', latitude: 8.9745, longitude: 76.7125 },
      { name: 'Kundara Hospital Mukku Junction', nameMl: 'കുണ്ടറ ആശുപത്രി മുക്ക്', latitude: 8.9612, longitude: 76.6814 },
      { name: 'Kilikollur Railway Gate Stop', nameMl: 'കിളികൊല്ലൂർ റെയിൽവേ ഗേറ്റ്', latitude: 8.9085, longitude: 76.6215 },
      { name: 'Kadappakada Sports Club Junction', nameMl: 'കടപ്പാക്കട ജംഗ്ഷൻ', latitude: 8.8912, longitude: 76.6025 },
    ],
  },
  {
    id: 'paravur-mayyanad',
    district: 'Kollam',
    name: 'Paravur - Mayyanad - Chinnakada Coastal Route',
    nameMl: 'പരവൂർ - മയ്യനാട് - ചിന്നക്കട തീരദേശ റൂട്ട്',
    origin: { name: 'Paravur Municipal Town Stand', nameMl: 'പരവൂർ മുൻസിപ്പൽ ബസ് സ്റ്റാൻഡ്', latitude: 8.8124, longitude: 76.6685 },
    intermediate: [
      { name: 'Mayyanad Railway Station Gate', nameMl: 'മയ്യനാട് റെയിൽവേ സ്റ്റേഷൻ', latitude: 8.8415, longitude: 76.6452 },
      { name: 'Eravipuram Snehatheeram Junction', nameMl: 'ഇരവിപുരം സ്നേഹതീരം', latitude: 8.8624, longitude: 76.6218 },
      { name: 'Pallithottam St. Aloysius Stop', nameMl: 'പള്ളിത്തോട്ടം സെന്റ് അലോഷ്യസ് സ്റ്റോപ്പ്', latitude: 8.8785, longitude: 76.5985 },
      { name: 'Chinnakada Clock Tower Hub', nameMl: 'ചിന്നക്കട ക്ലോക്ക് ടവർ ഹബ്ബ്', latitude: 8.8895, longitude: 76.5912 },
    ],
  },
  {
    id: 'anchalummood-perumon',
    district: 'Kollam',
    name: 'Perumon - Anchalummood Lake Route',
    nameMl: 'പെരുമൺ - അഞ്ചാലുംമൂട് - തേവള്ളി റൂട്ട്',
    origin: { name: 'Perumon Engineering College Gate', nameMl: 'പെരുമൺ എൻജിനീയറിങ് കോളേജ് ഗേറ്റ്', latitude: 8.9712, longitude: 76.6125 },
    intermediate: [
      { name: 'Anchalummood Private Bus Stand', nameMl: 'അഞ്ചാലുംമൂട് പ്രൈവറ്റ് ബസ് സ്റ്റാൻഡ്', latitude: 8.9412, longitude: 76.6185 },
      { name: 'Kadavoor Temple Junction', nameMl: 'കടവൂർ ക്ഷേത്രം ജംഗ്ഷൻ', latitude: 8.9125, longitude: 76.6085 },
      { name: 'Thevally Palace Road Stop', nameMl: 'തേവള്ളി കൊട്ടാരം റോഡ്', latitude: 8.8985, longitude: 76.5824 },
    ],
  },

  // Ernakulam / Kochi District Corridors
  {
    id: 'kakkanad-infopark',
    district: 'Ernakulam',
    name: 'Infopark & Kakkanad IT Corridor',
    nameMl: 'ഇൻഫോപാർക്ക് - കാക്കനാട് ഐടി കോറിഡോർ',
    origin: { name: 'Infopark Phase 2 Gate', nameMl: 'ഇൻഫോപാർക്ക് ഫേസ് 2 ഗേറ്റ്', latitude: 10.0064, longitude: 76.3638 },
    intermediate: [
      { name: 'Kakkanad Civil Station Stop', nameMl: 'കാക്കനാട് സിവിൽ സ്റ്റേഷൻ സ്റ്റോപ്പ്', latitude: 10.0159, longitude: 76.3419 },
      { name: 'Palarivattom Bypass Junction', nameMl: 'പാലാരിവട്ടം ബൈപ്പാസ് ജംഗ്ഷൻ', latitude: 10.0014, longitude: 76.3106 },
      { name: 'Vyttila Mobility Hub Gate', nameMl: 'വൈറ്റില മൊബിലിറ്റി ഹബ് ഗേറ്റ്', latitude: 9.9679, longitude: 76.3204 },
    ],
  },
  {
    id: 'aluva-kalamassery',
    district: 'Ernakulam',
    name: 'Aluva - Kalamassery Metro Corridor',
    nameMl: 'ആലുവ - കളമശ്ശേരി മെട്രോ റൂട്ട്',
    origin: { name: 'Aluva Private Bus Stand Gate', nameMl: 'ആലുവ പ്രൈവറ്റ് ബസ് സ്റ്റാൻഡ്', latitude: 10.1076, longitude: 76.3516 },
    intermediate: [
      { name: 'Companypady Metro Station', nameMl: 'കമ്പനിപ്പടി മെട്രോ സ്റ്റേഷൻ', latitude: 10.0658, longitude: 76.3312 },
      { name: 'Kalamassery Premier Junction', nameMl: 'കളമശ്ശേരി പ്രീമിയർ ജംഗ്ഷൻ', latitude: 10.0489, longitude: 76.3182 },
      { name: 'Edappally Toll Stop', nameMl: 'ഇടപ്പള്ളി ടോൾ സ്റ്റോപ്പ്', latitude: 10.0315, longitude: 76.3102 },
    ],
  },
  {
    id: 'edappally-kaloor',
    district: 'Ernakulam',
    name: 'Edappally - Kaloor Stadium Corridor',
    nameMl: 'ഇടപ്പള്ളി - കലൂർ സ്റ്റേഡിയം കോറിഡോർ',
    origin: { name: 'Edappally Metro Junction', nameMl: 'ഇടപ്പള്ളി മെട്രോ ജംഗ്ഷൻ', latitude: 10.0261, longitude: 76.3087 },
    intermediate: [
      { name: 'Palarivattom Pipeline Road', nameMl: 'പാലാരിവട്ടം പൈപ്പ്‌ലൈൻ റോഡ്', latitude: 10.0085, longitude: 76.3055 },
      { name: 'Kaloor Jawaharlal Nehru Stadium', nameMl: 'കലൂർ ജവഹർലാൽ നെഹ്റു സ്റ്റേഡിയം', latitude: 9.9972, longitude: 76.3019 },
      { name: 'Kadavanthra South Junction', nameMl: 'കടവന്ത്ര സൗത്ത് ജംഗ്ഷൻ', latitude: 9.9674, longitude: 76.2995 },
    ],
  },
  {
    id: 'maradu-thoppumpady',
    district: 'Ernakulam',
    name: 'Maradu - Thoppumpady Coastal Feeder',
    nameMl: 'മരട് - തോപ്പുംപടി തീരദേശ റൂട്ട്',
    origin: { name: 'Thoppumpady BOT Bridge Stop', nameMl: 'തോപ്പുംപടി BOT ബ്രിഡ്ജ്', latitude: 9.9328, longitude: 76.2625 },
    intermediate: [
      { name: 'Thevara Ferry Junction', nameMl: 'തേവര ഫെറി ജംഗ്ഷൻ', latitude: 9.9412, longitude: 76.2954 },
      { name: 'Kundannoor Highway Junction', nameMl: 'കുണ്ടന്നൂർ ഹൈവേ ജംഗ്ഷൻ', latitude: 9.9486, longitude: 76.3168 },
      { name: 'Maradu Market Bus Bay', nameMl: 'മരട് മാർക്കറ്റ് ബസ് ബേ', latitude: 9.9515, longitude: 76.3312 },
    ],
  },
];

export const DEFAULT_TRANSPORT_ROUTES: TransportRoute[] = [
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
        transitStatus: 'BOARDED',
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
        transitStatus: 'BOARDED',
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
const STORAGE_KEY_LOCATION = 'krypton_school_campus_location';
const STORAGE_KEY_ROUTES = 'krypton_transport_custom_routes';

function getStoredLocation(): SchoolCampusLocation {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_LOCATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATION);
    return raw ? JSON.parse(raw) : DEFAULT_SCHOOL_LOCATION;
  } catch {
    return DEFAULT_SCHOOL_LOCATION;
  }
}

function saveStoredLocation(loc: SchoolCampusLocation) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(loc));
  } catch {}
}

function getStoredRoutes(): TransportRoute[] {
  if (typeof window === 'undefined') return DEFAULT_TRANSPORT_ROUTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROUTES);
    return raw ? JSON.parse(raw) : DEFAULT_TRANSPORT_ROUTES;
  } catch {
    return DEFAULT_TRANSPORT_ROUTES;
  }
}

function saveStoredRoutes(routes: TransportRoute[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(routes));
  } catch {}
}

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

  const routes = getStoredRoutes();
  const route = routes.find((r) => r.id === routeId) || routes[0] || DEFAULT_TRANSPORT_ROUTES[0];
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
      latitude: 10.0112,
      longitude: 76.3521,
      speed: 36,
      heading: 245,
      accuracy: 3,
      lastPingAt: new Date().toISOString(),
    },
    locationHistory: [
      { latitude: 10.0064, longitude: 76.3638, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      { latitude: 10.0091, longitude: 76.3575, timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
      { latitude: 10.0112, longitude: 76.3521, timestamp: new Date().toISOString() },
    ],
    currentStopId: 'stop-101',
    nextStopId: 'stop-102',
    estimatedArrivalMinutes: 4,
    totalStudents: route.students.length,
    boardedCount: 2,
    droppedCount: 0,
    absentCount: 0,
    waitingCount: Math.max(0, route.students.length - 2),
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
  getSchoolLocation: async (): Promise<SchoolCampusLocation> => {
    try {
      const res = await apiClient.get('/transport/school-location');
      if (res.data && res.data.latitude) {
        saveStoredLocation(res.data);
        return res.data;
      }
    } catch {}
    return getStoredLocation();
  },

  saveSchoolLocation: async (loc: SchoolCampusLocation): Promise<SchoolCampusLocation> => {
    try {
      const res = await apiClient.post('/transport/school-location', loc);
      if (res.data && res.data.latitude) {
        saveStoredLocation(res.data);
        return res.data;
      }
    } catch {}
    saveStoredLocation(loc);
    return loc;
  },

  getRoutes: async (): Promise<TransportRoute[]> => {
    try {
      const res = await apiClient.get('/transport/routes');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        saveStoredRoutes(res.data);
        return res.data;
      }
    } catch {}
    return getStoredRoutes();
  },

  createRoute: async (routeData: CreateRouteRequest): Promise<TransportRoute> => {
    try {
      const res = await apiClient.post('/transport/routes', routeData);
      if (res.data && res.data.id) {
        const stored = getStoredRoutes();
        stored.push(res.data);
        saveStoredRoutes(stored);
        return res.data;
      }
    } catch {}

    const schoolLoc = getStoredLocation();
    const routeId = `route-${Date.now().toString().slice(-4)}`;
    const stops: TransportStop[] = routeData.stops.map((s, idx) => ({
      id: `stop-${routeId}-${idx + 1}`,
      routeId,
      name: s.name,
      nameMl: s.nameMl,
      sequence: s.sequence || idx + 1,
      latitude: s.latitude,
      longitude: s.longitude,
      scheduledTime: s.scheduledTime || '07:30 AM',
      studentIds: [],
      distanceFromSchoolKm: calculateDistanceKm(s.latitude, s.longitude, schoolLoc.latitude, schoolLoc.longitude),
      estimatedMinutesToSchool: Math.max(3, Math.round(calculateDistanceKm(s.latitude, s.longitude, schoolLoc.latitude, schoolLoc.longitude) * 2.5)),
    }));

    if (routeData.direction === 'MORNING_PICKUP') {
      stops.push({
        id: `stop-${routeId}-campus`,
        routeId,
        name: `${schoolLoc.schoolName} (${schoolLoc.city})`,
        nameMl: `${schoolLoc.schoolNameMl || schoolLoc.schoolName} (${schoolLoc.city})`,
        sequence: stops.length + 1,
        latitude: schoolLoc.latitude,
        longitude: schoolLoc.longitude,
        scheduledTime: schoolLoc.morningReportingTime,
        studentIds: [],
        distanceFromSchoolKm: 0,
        estimatedMinutesToSchool: 0,
      });
    }

    const newRoute: TransportRoute = {
      id: routeId,
      name: routeData.name,
      nameMl: routeData.nameMl,
      code: routeData.code,
      vehicleRegistration: routeData.vehicleRegistration,
      vehicleModel: routeData.vehicleModel,
      driverName: routeData.driverName,
      driverPhone: routeData.driverPhone,
      totalCapacity: routeData.totalCapacity,
      direction: routeData.direction,
      stops,
      students: [],
    };

    const stored = getStoredRoutes();
    stored.push(newRoute);
    saveStoredRoutes(stored);
    return newRoute;
  },

  updateRoute: async (id: string, routeData: Partial<CreateRouteRequest>): Promise<TransportRoute> => {
    try {
      const res = await apiClient.put(`/transport/routes/${id}`, routeData);
      if (res.data && res.data.id) {
        const stored = getStoredRoutes();
        const idx = stored.findIndex((r) => r.id === id);
        if (idx !== -1) stored[idx] = res.data;
        saveStoredRoutes(stored);
        return res.data;
      }
    } catch {}

    const stored = getStoredRoutes();
    const route = stored.find((r) => r.id === id) || stored[0];
    if (routeData.name) route.name = routeData.name;
    if (routeData.nameMl) route.nameMl = routeData.nameMl;
    if (routeData.code) route.code = routeData.code;
    if (routeData.vehicleRegistration) route.vehicleRegistration = routeData.vehicleRegistration;
    if (routeData.vehicleModel) route.vehicleModel = routeData.vehicleModel;
    if (routeData.driverName) route.driverName = routeData.driverName;
    if (routeData.driverPhone) route.driverPhone = routeData.driverPhone;
    if (routeData.totalCapacity) route.totalCapacity = routeData.totalCapacity;
    if (routeData.direction) route.direction = routeData.direction;

    saveStoredRoutes(stored);
    return route;
  },

  deleteRoute: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/transport/routes/${id}`);
    } catch {}
    const stored = getStoredRoutes();
    const filtered = stored.filter((r) => r.id !== id);
    saveStoredRoutes(filtered);
    return true;
  },

  autoGenerateRoute: async (data: AutoRouteGeneratorRequest): Promise<TransportRoute> => {
    try {
      const res = await apiClient.post('/transport/routes/auto-generate', data);
      if (res.data && res.data.id) {
        const stored = getStoredRoutes();
        stored.push(res.data);
        saveStoredRoutes(stored);
        return res.data;
      }
    } catch {}

    const schoolLoc = getStoredLocation();
    const routeId = `route-${Date.now().toString().slice(-4)}`;
    const allStops = [data.originStop, ...(data.intermediateStops || [])];

    const stops: TransportStop[] = allStops.map((st, idx) => {
      const distFromSchool = calculateDistanceKm(st.latitude, st.longitude, schoolLoc.latitude, schoolLoc.longitude);
      const estMinutes = Math.round(distFromSchool * 2.6 + (allStops.length - idx) * 3);
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
      name: `${schoolLoc.schoolName} (${schoolLoc.city})`,
      nameMl: `${schoolLoc.schoolNameMl || schoolLoc.schoolName} (${schoolLoc.city})`,
      sequence: stops.length + 1,
      latitude: schoolLoc.latitude,
      longitude: schoolLoc.longitude,
      scheduledTime: schoolLoc.morningReportingTime,
      studentIds: [],
      distanceFromSchoolKm: 0,
      estimatedMinutesToSchool: 0,
    });

    const route: TransportRoute = {
      id: routeId,
      name: data.name,
      nameMl: data.nameMl,
      code: data.code,
      vehicleRegistration: data.vehicleRegistration,
      vehicleModel: data.vehicleModel,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      totalCapacity: data.totalCapacity,
      direction: data.direction,
      stops,
      students: [],
    };

    const stored = getStoredRoutes();
    stored.push(route);
    saveStoredRoutes(stored);
    return route;
  },

  searchPlaces: async (
    query: string,
    schoolLat?: number,
    schoolLng?: number
  ): Promise<Array<{
    name: string;
    displayName: string;
    latitude: number;
    longitude: number;
    distanceFromSchoolKm: number;
    estimatedMinutes: number;
  }>> => {
    try {
      const res = await apiClient.get('/transport/places/search', {
        params: { q: query, lat: schoolLat, lng: schoolLng },
      });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {}

    // Fallback: direct Nominatim geocoding
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=in`
      );
      if (resp.ok) {
        const list = (await resp.json()) as any[];
        if (Array.isArray(list) && list.length > 0) {
          const lat = schoolLat || DEFAULT_SCHOOL_LOCATION.latitude;
          const lng = schoolLng || DEFAULT_SCHOOL_LOCATION.longitude;
          return list.map((item) => {
            const itemLat = parseFloat(item.lat);
            const itemLng = parseFloat(item.lon);
            const dist = calculateDistanceKm(itemLat, itemLng, lat, lng);
            return {
              name: item.name || item.display_name.split(',')[0].trim(),
              displayName: item.display_name,
              latitude: Number(itemLat.toFixed(5)),
              longitude: Number(itemLng.toFixed(5)),
              distanceFromSchoolKm: dist,
              estimatedMinutes: Math.max(3, Math.round(dist * 2.5)),
            };
          });
        }
      }
    } catch {}

    const lat = schoolLat || DEFAULT_SCHOOL_LOCATION.latitude;
    const lng = schoolLng || DEFAULT_SCHOOL_LOCATION.longitude;
    return [
      {
        name: `${query.trim()} Junction`,
        displayName: `${query.trim()} Junction, near campus`,
        latitude: Number((lat + 0.03).toFixed(5)),
        longitude: Number((lng - 0.02).toFixed(5)),
        distanceFromSchoolKm: 3.8,
        estimatedMinutes: 9,
      },
    ];
  },

  getNearbySuggestedStops: async (
    schoolLat?: number,
    schoolLng?: number
  ): Promise<Array<{
    name: string;
    nameMl?: string;
    latitude: number;
    longitude: number;
    distanceFromSchoolKm: number;
    estimatedMinutes: number;
  }>> => {
    try {
      const res = await apiClient.get('/transport/places/nearby', {
        params: { lat: schoolLat, lng: schoolLng },
      });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {}

    const lat = schoolLat || DEFAULT_SCHOOL_LOCATION.latitude;
    const lng = schoolLng || DEFAULT_SCHOOL_LOCATION.longitude;
    return [
      { name: 'Town Bus Stand Gate', nameMl: 'ടൗൺ ബസ് സ്റ്റാൻഡ്', latitude: Number((lat + 0.02).toFixed(5)), longitude: Number((lng + 0.01).toFixed(5)), distanceFromSchoolKm: 2.5, estimatedMinutes: 6 },
      { name: 'High School Junction', nameMl: 'ഹൈസ്കൂൾ ജംഗ്ഷൻ', latitude: Number((lat - 0.025).toFixed(5)), longitude: Number((lng - 0.015).toFixed(5)), distanceFromSchoolKm: 3.2, estimatedMinutes: 8 },
      { name: 'Railway Station Road', nameMl: 'റെയിൽവേ സ്റ്റേഷൻ റോഡ്', latitude: Number((lat + 0.035).toFixed(5)), longitude: Number((lng - 0.02).toFixed(5)), distanceFromSchoolKm: 4.6, estimatedMinutes: 11 },
      { name: 'Hospital Mukku Stop', nameMl: 'ആശുപത്രി മുക്ക്', latitude: Number((lat - 0.04).toFixed(5)), longitude: Number((lng + 0.03).toFixed(5)), distanceFromSchoolKm: 5.5, estimatedMinutes: 13 },
      { name: 'Temple / Church Junction', nameMl: 'ക്ഷേത്രം / പള്ളി ജംഗ്ഷൻ', latitude: Number((lat + 0.05).toFixed(5)), longitude: Number((lng + 0.025).toFixed(5)), distanceFromSchoolKm: 6.8, estimatedMinutes: 16 },
    ];
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
