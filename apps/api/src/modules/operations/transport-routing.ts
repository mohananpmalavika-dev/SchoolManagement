export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface RoadRouteResult {
  distanceKm: number;
  durationSeconds: number;
  geometry: [number, number][];
}

export interface TransportEstimateResult {
  stale: boolean;
  estimatedMinutes: number | null;
  distanceKm: number | null;
  source: 'ROAD_ROUTE' | 'STRAIGHT_LINE' | 'UNAVAILABLE';
  estimateMethod: string;
  routeGeometry?: [number, number][];
}

interface CacheEntry {
  expiresAt: number;
  value: RoadRouteResult | null;
}

const MAX_CACHE_ENTRIES = 500;
const DEFAULT_ROUTE_TTL_MS = 25_000;
const FAILURE_TTL_MS = 15_000;
const DEFAULT_TIMEOUT_MS = 2_500;

const routeCache = new Map<string, CacheEntry>();

export function clearRoadRouteCache() {
  routeCache.clear();
}

export function travelDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radians = (n: number) => (n * Math.PI) / 180;
  const a =
    Math.sin(radians(lat2 - lat1) / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function transportEstimate(
  trip: {
    latitude: number | null;
    longitude: number | null;
    lastPingAt: Date | null;
    speed?: number | null;
  },
  stop: { latitude: number | null; longitude: number | null },
  now = Date.now(),
): TransportEstimateResult {
  const stale = !trip.lastPingAt || now - trip.lastPingAt.getTime() > 60_000;
  if (
    stale ||
    trip.latitude == null ||
    trip.longitude == null ||
    stop.latitude == null ||
    stop.longitude == null
  ) {
    return {
      stale,
      estimatedMinutes: null,
      distanceKm: null,
      source: 'UNAVAILABLE',
      estimateMethod: 'Straight-line distance; actual travel time varies',
    };
  }
  const distanceKm = travelDistanceKm(trip.latitude, trip.longitude, stop.latitude, stop.longitude);
  // The driver client converts Geolocation speed to km/h before posting it.
  // Use a labelled 20 km/h planning speed when measured speed is unavailable.
  const speedKmh = trip.speed != null && trip.speed >= 7 ? Math.min(trip.speed, 80) : 20;
  return {
    stale,
    estimatedMinutes: distanceKm < 0.15 ? 0 : Math.max(1, Math.ceil((distanceKm / speedKmh) * 60)),
    distanceKm: Math.round(distanceKm * 100) / 100,
    source: 'STRAIGHT_LINE',
    estimateMethod: 'Straight-line distance; actual travel time varies',
  };
}

function buildCacheKey(waypoints: GeoPoint[]): string {
  return waypoints.map((p) => `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`).join('|');
}

function setCached(key: string, value: RoadRouteResult | null, ttlMs: number) {
  if (routeCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = routeCache.keys().next().value;
    if (oldestKey !== undefined) routeCache.delete(oldestKey);
  }
  routeCache.set(key, { expiresAt: Date.now() + ttlMs, value });
}

export async function fetchRoadRoute(
  waypoints: GeoPoint[],
  options?: {
    timeoutMs?: number;
    ttlMs?: number;
    baseUrl?: string;
    fetchImpl?: typeof fetch;
  },
): Promise<RoadRouteResult | null> {
  if (waypoints.length < 2) return null;
  if (process.env.TRANSPORT_ROUTING_DISABLED === 'true') return null;
  if (
    waypoints.some(
      (p) =>
        !Number.isFinite(p.latitude) ||
        !Number.isFinite(p.longitude) ||
        p.latitude < -90 ||
        p.latitude > 90 ||
        p.longitude < -180 ||
        p.longitude > 180,
    )
  ) {
    return null;
  }

  const key = buildCacheKey(waypoints);
  const now = Date.now();
  const cached = routeCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const fetchFn = options?.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') return null;

  const baseUrl = (
    options?.baseUrl ||
    process.env.OSRM_BASE_URL ||
    'https://router.project-osrm.org'
  ).replace(/\/$/, '');
  const coords = waypoints.map((p) => `${p.longitude},${p.latitude}`).join(';');
  const url = `${baseUrl}/route/v1/driving/${coords}?overview=simplified&geometries=geojson`;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ttlMs = options?.ttlMs ?? DEFAULT_ROUTE_TTL_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      setCached(key, null, FAILURE_TTL_MS);
      return null;
    }

    const payload = (await response.json()) as {
      code?: string;
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: unknown[] };
      }>;
    };

    const route = payload?.code === 'Ok' ? payload.routes?.[0] : undefined;
    if (
      !route ||
      typeof route.distance !== 'number' ||
      !Number.isFinite(route.distance) ||
      typeof route.duration !== 'number' ||
      !Number.isFinite(route.duration)
    ) {
      setCached(key, null, FAILURE_TTL_MS);
      return null;
    }

    const rawCoords = Array.isArray(route.geometry?.coordinates) ? route.geometry.coordinates : [];
    const geometry: [number, number][] = [];
    for (const pair of rawCoords) {
      if (
        Array.isArray(pair) &&
        pair.length >= 2 &&
        typeof pair[0] === 'number' &&
        typeof pair[1] === 'number' &&
        Number.isFinite(pair[0]) &&
        Number.isFinite(pair[1])
      ) {
        geometry.push([pair[1], pair[0]]);
      }
    }

    const result: RoadRouteResult = {
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationSeconds: Math.max(0, route.duration),
      geometry,
    };
    setCached(key, result, ttlMs);
    return result;
  } catch {
    setCached(key, null, FAILURE_TTL_MS);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function calculateRoadTransportEstimate(
  trip: {
    latitude: number | null;
    longitude: number | null;
    lastPingAt: Date | null;
    speed?: number | null;
  },
  stop: { latitude: number | null; longitude: number | null },
  now = Date.now(),
  routeFetcher: (waypoints: GeoPoint[]) => Promise<RoadRouteResult | null> = fetchRoadRoute,
): Promise<TransportEstimateResult> {
  const fallback = transportEstimate(trip, stop, now);
  if (
    fallback.stale ||
    trip.latitude == null ||
    trip.longitude == null ||
    stop.latitude == null ||
    stop.longitude == null
  ) {
    return fallback;
  }

  const straightKm = travelDistanceKm(trip.latitude, trip.longitude, stop.latitude, stop.longitude);
  if (straightKm < 0.08) {
    return {
      stale: false,
      estimatedMinutes: 0,
      distanceKm: Math.round(straightKm * 100) / 100,
      source: 'ROAD_ROUTE',
      estimateMethod: 'Bus is at or arriving at the stop.',
      routeGeometry: [
        [trip.latitude, trip.longitude],
        [stop.latitude, stop.longitude],
      ],
    };
  }

  const road = await routeFetcher([
    { latitude: trip.latitude, longitude: trip.longitude },
    { latitude: stop.latitude, longitude: stop.longitude },
  ]);

  if (!road) {
    return {
      ...fallback,
      source: 'STRAIGHT_LINE',
      estimateMethod: 'Straight-line fallback (road routing unavailable); actual travel time varies.',
    };
  }

  const estimatedMinutes =
    road.distanceKm < 0.15 ? 0 : Math.max(1, Math.ceil(road.durationSeconds / 60));

  return {
    stale: false,
    estimatedMinutes,
    distanceKm: road.distanceKm,
    source: 'ROAD_ROUTE',
    estimateMethod: 'Road-route estimate via OpenStreetMap routing; actual arrival varies with live traffic.',
    routeGeometry: road.geometry.length >= 2 ? road.geometry : undefined,
  };
}
