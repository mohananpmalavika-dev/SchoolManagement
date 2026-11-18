import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  SavedTransportService,
  calculateRoadTransportEstimate,
  transportEstimate,
  travelDistanceKm,
} from './transport.service';
import { clearRoadRouteCache, fetchRoadRoute } from './transport-routing';
const actor = { userId: 'driver', role: 'TRANSPORT_OFFICER' };
const studentId = '00000000-0000-4000-8000-000000000001';
function setup() {
  const fn = (value: unknown) => jest.fn().mockResolvedValue(value);
  const db: any = {
    transportJourney: {
      findFirst: fn({
        id: 'trip',
        routeId: 'route',
        tenantId: 'tenant',
        direction: 'MORNING_PICKUP',
        status: 'IN_TRANSIT',
        driverUserId: 'driver',
      }),
      updateMany: fn({ count: 1 }),
    },
    tripPassenger: {
      updateMany: fn({ count: 1 }),
      count: fn(0),
      findMany: fn([{ studentId: 'child' }]),
    },
    transportAlert: { createMany: fn({ count: 1 }) },
    activityFeed: { create: fn({}) },
    travelAssignment: {
      findMany: fn([{ studentId: 'child', stop: { latitude: 10, longitude: 76 } }]),
    },
  };
  db.$transaction = jest.fn(async (work: (tx: any) => unknown) => work(db));
  return {
    db,
    service: new SavedTransportService(
      db,
      { requireTenantContext: () => 'tenant' } as any,
      {} as any
    ),
  };
}
describe('Saved transport and parent alerts', () => {
  it('restricts trips to the assigned driver', async () => {
    const { service } = setup();
    await expect(service.trip({ ...actor, userId: 'other' }, 'trip')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });
  it('creates a durable alert and parent update only after a valid passenger transition', async () => {
    const { db, service } = setup();
    await service.passenger(actor, 'trip', { studentId, status: 'BOARDED' });
    expect(db.transportAlert.createMany.mock.calls[0][0]).toMatchObject({
      data: [{ tenantId: 'tenant', tripId: 'trip', studentId, kind: 'BOARDED' }],
      skipDuplicates: true,
    });
    expect(db.activityFeed.create.mock.calls[0][0].data.studentId).toBe(studentId);
    db.tripPassenger.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.passenger(actor, 'trip', { studentId, status: 'BOARDED' })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.activityFeed.create).toHaveBeenCalledTimes(1);
  });
  it('requires accurate nearby fixes and deduplicates arrival alerts across pings', async () => {
    const { db, service } = setup();
    await service.ping(actor, 'trip', { latitude: 10, longitude: 76, accuracy: 500 });
    expect(db.transportAlert.createMany).not.toHaveBeenCalled();
    await service.ping(actor, 'trip', { latitude: 10, longitude: 76, accuracy: 20 });
    expect(db.activityFeed.create).toHaveBeenCalledTimes(1);
    db.transportAlert.createMany.mockResolvedValue({ count: 0 });
    await service.ping(actor, 'trip', { latitude: 10, longitude: 76, accuracy: 20 });
    expect(db.activityFeed.create).toHaveBeenCalledTimes(1);
  });
  it('rejects ending trips with children still onboard', async () => {
    const { db, service } = setup();
    db.tripPassenger.count.mockResolvedValue(1);
    await expect(service.end(actor, 'trip')).rejects.toBeInstanceOf(ConflictException);
  });
  it('does not fabricate estimates from stale or missing locations and handles zero coordinates', () => {
    expect(travelDistanceKm(0, 0, 0, 0)).toBe(0);
    const trip = { latitude: 0, longitude: 0, lastPingAt: new Date(100000), speed: 36 };
    expect(transportEstimate(trip, { latitude: 0, longitude: 0.01 }, 100001).estimatedMinutes).toBe(
      2
    );
    expect(
      transportEstimate(trip, { latitude: 0, longitude: 0.01 }, 200000).estimatedMinutes
    ).toBeNull();
    expect(
      transportEstimate(trip, { latitude: null, longitude: null }, 100001).estimatedMinutes
    ).toBeNull();
  });
  it('computes road-route ETA and geometry via routing engine with caching and straight-line fallback', async () => {
    clearRoadRouteCache();
    const trip = { latitude: 9.9312, longitude: 76.2673, lastPingAt: new Date(100000), speed: 30 };
    const stop = { latitude: 9.9816, longitude: 76.2999 };
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [
          {
            distance: 7420,
            duration: 810,
            geometry: {
              coordinates: [
                [76.2673, 9.9312],
                [76.281, 9.956],
                [76.2999, 9.9816],
              ],
            },
          },
        ],
      }),
    });

    const road = await fetchRoadRoute([
      { latitude: trip.latitude, longitude: trip.longitude },
      stop,
    ], { fetchImpl: mockFetch as any });
    expect(road).toEqual({
      distanceKm: 7.42,
      durationSeconds: 810,
      geometry: [
        [9.9312, 76.2673],
        [9.956, 76.281],
        [9.9816, 76.2999],
      ],
    });
    // Cached second call should not hit network again
    await fetchRoadRoute([
      { latitude: trip.latitude, longitude: trip.longitude },
      stop,
    ], { fetchImpl: mockFetch as any });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const estimate = await calculateRoadTransportEstimate(
      trip,
      stop,
      100001,
      async () => road,
    );
    expect(estimate.source).toBe('ROAD_ROUTE');
    expect(estimate.distanceKm).toBe(7.42);
    expect(estimate.estimatedMinutes).toBe(14);
    expect(estimate.routeGeometry).toHaveLength(3);

    const fallback = await calculateRoadTransportEstimate(
      trip,
      stop,
      100001,
      async () => null,
    );
    expect(fallback.source).toBe('STRAIGHT_LINE');
    expect(fallback.estimatedMinutes).toBeGreaterThan(0);
    expect(fallback.routeGeometry).toBeUndefined();
  });
});
