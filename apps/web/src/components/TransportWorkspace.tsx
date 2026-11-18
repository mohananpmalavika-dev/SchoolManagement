'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPin,
  RefreshCw,
  Navigation,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Radio,
  WifiOff,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { messageFor } from '@/lib/workspace';
import { Button } from './ui';
import { PageHeading, Panel, EmptyState, StatusPill } from './WorkspaceUI';
import { useDriverGpsTracker } from './transport/useDriverGpsTracker';

const EmbeddedLiveBusMap = dynamic(
  () => import('./transport/EmbeddedLiveBusMap').then((mod) => mod.EmbeddedLiveBusMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading live map…
      </div>
    ),
  },
);

export function TransportWorkspace({ family = false }: { family?: boolean }) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ students: [], staff: [] });
  const [studentId, setStudent] = useState('');
  const [tracking, setTracking] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ kind: string; route: any } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [gps, setGps] = useState(false);
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/operations/options');
      setOptions(data);
      if (family) {
        setStudent((current) =>
          data.students.some((s: any) => s.id === current)
            ? current
            : data.students[0]?.id || '',
        );
      } else {
        setRoutes((await apiClient.get('/operations-transport/routes')).data);
      }
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }, [family]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Poll family tracking every 5s
  useEffect(() => {
    if (!family || !studentId) return;
    let active = true;
    const update = async () => {
      try {
        const { data } = await apiClient.get('/operations-transport/tracking/' + studentId);
        if (active) {
          setTracking(data);
          setError('');
        }
      } catch (err) {
        if (active) setError(messageFor(err));
      }
    };
    setTracking(null);
    void update();
    const timer = setInterval(() => void update(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [family, studentId]);

  // Poll active school/driver trip every 5s
  const refreshTrip = useCallback(async (id: string) => {
    try {
      const { data } = await apiClient.get('/operations-transport/trips/' + id);
      setTrip(data);
      if (data.status !== 'IN_TRANSIT') setGps(false);
    } catch (err) {
      setError(messageFor(err));
    }
  }, []);

  useEffect(() => {
    if (!trip?.id) return;
    let active = true;
    const update = async () => {
      try {
        const { data } = await apiClient.get('/operations-transport/trips/' + trip.id);
        if (active) {
          setTrip(data);
          if (data.status !== 'IN_TRANSIT') setGps(false);
        }
      } catch (err) {
        if (active) setError(messageFor(err));
      }
    };
    const timer = setInterval(() => void update(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [trip?.id]);

  // Driver GPS sharing with Screen Wake Lock, visibility recovery, heartbeat & offline retry
  const gpsStatus = useDriverGpsTracker({
    enabled: !family && gps,
    tripId: trip?.id,
    onDisable: () => setGps(false),
    onError: (msg) => setError(msg),
    onPingSuccess: () => {
      if (trip?.id) void refreshTrip(trip.id);
    },
  });

  async function start(route: any, direction: string) {
    setBusy(true);
    setError('');
    try {
      const { data } = await apiClient.post('/operations-transport/trips', {
        data: { routeId: route.id, direction },
      });
      setTrip((await apiClient.get('/operations-transport/trips/' + data.id)).data);
      setNotice('Trip started. Enable GPS sharing on the assigned driver’s device.');
      await load();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function openTrip(id: string) {
    setBusy(true);
    try {
      setTrip((await apiClient.get('/operations-transport/trips/' + id)).data);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function passenger(targetStudentId: string, status: string) {
    setBusy(true);
    try {
      await apiClient.post('/operations-transport/trips/' + trip.id + '/passenger', {
        data: { studentId: targetStudentId, status },
      });
      setTrip((await apiClient.get('/operations-transport/trips/' + trip.id)).data);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    setBusy(true);
    try {
      await apiClient.post('/operations-transport/trips/' + trip.id + '/end', { data: {} });
      setGps(false);
      setTrip(null);
      setNotice('Trip completed. GPS sharing has stopped.');
      await load();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setError('');
    try {
      const data =
        form.kind === 'driver'
          ? { staffId: values.staffId }
          : {
              routeId: form.route.id,
              name: values.name,
              sequence: Number(values.sequence),
              latitude: Number(values.latitude),
              longitude: Number(values.longitude),
              scheduledTime: values.scheduledTime,
            };
      await apiClient.post(
        form.kind === 'driver'
          ? '/operations-transport/routes/' + form.route.id + '/driver'
          : '/operations-transport/stops',
        { data },
      );
      setForm(null);
      setNotice('Transport configuration saved.');
      await load();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  const fix = family ? tracking?.trip : trip;
  const hasFix = fix?.latitude != null && fix?.longitude != null;
  const stale = fix?.lastPingAt ? now - new Date(fix.lastPingAt).getTime() > 60_000 : true;

  const mapStops = family
    ? tracking?.assignment?.stops?.length
      ? tracking.assignment.stops
      : tracking?.assignment?.stop
        ? [tracking.assignment.stop]
        : []
    : trip?.route?.stops || [];

  const routeGeometry = family ? tracking?.assignment?.routeGeometry : trip?.routeGeometry;
  const estimate = family ? tracking?.estimate : null;
  const lastSentSecondsAgo =
    gpsStatus.lastSentAt != null ? Math.max(0, Math.round((now - gpsStatus.lastSentAt) / 1000)) : null;

  return (
    <>
      <PageHeading
        eyebrow={family ? 'FAMILY TRANSPORT' : 'SCHOOL TRANSPORT'}
        title={family ? 'Your child’s journey' : 'Live transport'}
        description="Saved routes, live bus map, road-route arrival estimates, and driver-reported GPS locations."
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={loading || busy}
            leftIcon={<RefreshCw size={15} />}
            onClick={() => void load()}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="state-box" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="state-box success" role="status">
          {notice}
        </div>
      )}

      {family && (
        <div className="panel panel-body field mb-6">
          <label htmlFor="transport-child">Your child</label>
          <select
            id="transport-child"
            value={studentId}
            onChange={(event) => setStudent(event.target.value)}
          >
            {options.students.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {fix && (
        <Panel
          title={family ? tracking.assignment.routeName : trip.route.name}
          subtitle={family ? tracking.assignment.vehicle : trip.route.vehicle?.registrationNumber}
        >
          <div className="panel-body space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusPill value={fix.status} />
              {hasFix && (
                <a
                  className="panel-link text-xs"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={
                    'https://www.openstreetmap.org/?mlat=' +
                    fix.latitude +
                    '&mlon=' +
                    fix.longitude +
                    '#map=16/' +
                    fix.latitude +
                    '/' +
                    fix.longitude
                  }
                >
                  Open in OpenStreetMap
                  <MapPin size={15} />
                </a>
              )}
            </div>

            {hasFix ? (
              <>
                <EmbeddedLiveBusMap
                  busLocation={{
                    latitude: fix.latitude,
                    longitude: fix.longitude,
                    accuracy: fix.accuracy,
                    speed: fix.speed,
                    heading: fix.heading,
                    lastPingAt: fix.lastPingAt,
                  }}
                  stale={stale}
                  vehicleLabel={
                    family ? tracking?.assignment?.vehicle : trip?.route?.vehicle?.registrationNumber
                  }
                  stops={mapStops}
                  highlightStopId={family ? tracking?.assignment?.stop?.id : null}
                  routeGeometry={routeGeometry}
                  etaRouteGeometry={estimate?.routeGeometry || null}
                  etaSummary={estimate}
                />

                <div className="state-box">
                  {stale
                    ? 'Location report is over a minute old. The driver’s phone may have gone to sleep or lost signal.'
                    : 'Live driver location report active.'}
                  <p className="mt-1.5 text-sm">
                    Last update: {new Date(fix.lastPingAt).toLocaleTimeString()} · Accuracy:{' '}
                    {fix.accuracy != null ? Math.round(fix.accuracy) + ' m' : 'not provided'}
                    {typeof fix.speed === 'number' && Number.isFinite(fix.speed)
                      ? ` · Speed: ${Math.round(fix.speed)} km/h`
                      : ''}
                  </p>
                </div>
              </>
            ) : (
              <EmptyState
                title="Waiting for the first GPS report"
                description="The assigned driver must enable location sharing. Live map and road ETA will appear as soon as the first GPS fix arrives."
              />
            )}

            {family ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {stale
                      ? 'ETA unavailable until a fresh location report arrives.'
                      : estimate?.estimatedMinutes != null
                        ? estimate.estimatedMinutes === 0
                          ? `Bus is arriving at your stop · ${estimate.distanceKm} km away.`
                          : `Approximate arrival: ${estimate.estimatedMinutes} min · ${estimate.distanceKm} km from the stop.`
                        : 'ETA unavailable for this stop.'}
                  </p>
                  {!stale && estimate?.source === 'ROAD_ROUTE' && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Road route
                    </span>
                  )}
                  {!stale && estimate?.source === 'STRAIGHT_LINE' && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      Straight-line fallback
                    </span>
                  )}
                </div>
                <p className="muted text-xs">
                  {estimate?.estimateMethod ||
                    'Road-route estimate via OpenStreetMap routing; actual travel time varies with live traffic.'}
                </p>
                <p className="text-sm pt-1">
                  Passenger status: <StatusPill value={fix.passenger?.status || 'WAITING'} />
                </p>
              </div>
            ) : (
              <>
                {/* Driver Keep-Awake & GPS Telemetry Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {gpsStatus.active ? (
                      gpsStatus.backgroundPaused ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-900">
                          <AlertTriangle size={13} />
                          GPS paused while tab/screen is hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                          <Radio size={13} />
                          GPS live{lastSentSecondsAgo != null ? ` · sent ${lastSentSecondsAgo}s ago` : ''}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 font-medium text-slate-700">
                        GPS sharing off
                      </span>
                    )}

                    {gpsStatus.active && gpsStatus.wakeLock === 'active' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-800">
                        <ShieldCheck size={13} />
                        Screen Wake Lock active
                      </span>
                    )}

                    {gpsStatus.active &&
                      (gpsStatus.wakeLock === 'unsupported' || gpsStatus.wakeLock === 'unavailable') && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-900">
                          <AlertTriangle size={13} />
                          Wake Lock unavailable — keep screen awake manually
                        </span>
                      )}

                    {gpsStatus.active && gpsStatus.retrying && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-800">
                        <WifiOff size={13} />
                        Reconnecting GPS upload…
                      </span>
                    )}
                  </div>

                  <p className="text-xs muted leading-relaxed">
                    Keep this screen open on the driver’s phone with location permission enabled. Screen Wake Lock
                    automatically prevents auto-sleep while open, and GPS resumes immediately if you switch back.
                    Note: mobile web browsers pause GPS if the phone screen is manually locked or put in the
                    background; keep the phone plugged in on the dashboard during the trip.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={gps ? 'primary' : 'outline'}
                    disabled={busy}
                    onClick={() => setGps((current) => !current)}
                    leftIcon={<Navigation size={16} />}
                  >
                    {gps ? 'Stop GPS sharing' : 'Enable GPS sharing'}
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => void end()}>
                    Complete trip
                  </Button>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trip.passengers.map((p: any) => (
                        <tr key={p.id}>
                          <td>
                            {p.student.firstName} {p.student.lastName}
                          </td>
                          <td>
                            <StatusPill value={p.status} />
                          </td>
                          <td>
                            <div className="flex gap-2">
                              {p.status === 'WAITING' && (
                                <>
                                  <Button
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => void passenger(p.studentId, 'BOARDED')}
                                  >
                                    Boarded
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => void passenger(p.studentId, 'ABSENT')}
                                  >
                                    Absent
                                  </Button>
                                </>
                              )}
                              {p.status === 'BOARDED' && (
                                <Button
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => void passenger(p.studentId, 'DROPPED')}
                                >
                                  Dropped off
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </Panel>
      )}

      {loading ? (
        <div className="skeleton h-48" />
      ) : family ? (
        <Panel title="Transport assignment">
          <div className="panel-body">
            {tracking?.assignment ? (
              <>
                <strong>{tracking.assignment.routeName}</strong>
                <p>
                  {tracking.assignment.stop.name} · Scheduled{' '}
                  {tracking.assignment.stop.scheduledTime || 'time not configured'}
                </p>
                {!tracking.trip && (
                  <p className="muted text-sm mt-3">No active trip on this route.</p>
                )}
              </>
            ) : (
              <EmptyState
                title="No transport assignment"
                description="Ask the school office to link your child to a saved route and stop."
              />
            )}
          </div>
        </Panel>
      ) : (
        <div className="content-stack mt-6">
          <div className="flex flex-wrap gap-3">
            <Link className="panel-link" href="/school/transport/setup">
              Vehicles &amp; routes
            </Link>
            <Link className="panel-link" href="/school/transport/assignments">
              Assign students to stops
            </Link>
          </div>
          {routes.length ? (
            routes.map((route) => (
              <Panel
                key={route.id}
                title={route.name}
                subtitle={
                  (route.vehicle?.registrationNumber || 'Vehicle not configured') +
                  ' · ' +
                  (route.vehicle?.capacity || 0) +
                  ' seats'
                }
              >
                <div className="panel-body space-y-4">
                  <p className="text-sm">
                    {route.stops.map((s: any) => s.name).join(' → ') || 'No stops configured'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({ kind: 'stop', route });
                        setValues({});
                      }}
                      leftIcon={<Plus size={15} />}
                    >
                      Add stop
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({ kind: 'driver', route });
                        setValues({});
                      }}
                    >
                      Assign driver
                    </Button>
                    {route.trips.length ? (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void openTrip(route.trips[0].id)}
                      >
                        Open active trip
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void start(route, 'MORNING_PICKUP')}
                        >
                          Start pickup trip
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void start(route, 'EVENING_DROPOFF')}
                        >
                          Start drop-off trip
                        </Button>
                      </>
                    )}
                  </div>
                  {form?.route.id === route.id && (
                    <form className="space-y-4 border-t pt-4" onSubmit={save}>
                      {form.kind === 'driver' ? (
                        <div className="field">
                          <label htmlFor="route-driver">Linked staff account</label>
                          <select
                            id="route-driver"
                            required
                            value={values.staffId || ''}
                            onChange={(event) =>
                              setValues((current) => ({ ...current, staffId: event.target.value }))
                            }
                          >
                            <option value="">Choose transport staff</option>
                            {options.staff
                              .filter((s: any) => s.userId)
                              .map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      ) : (
                        <div className="form-grid">
                          {[
                            ['name', 'Stop name', 'text'],
                            ['sequence', 'Stop order', 'number'],
                            ['latitude', 'Latitude', 'number'],
                            ['longitude', 'Longitude', 'number'],
                            ['scheduledTime', 'Scheduled time', 'time'],
                          ].map(([key, label, type]) => (
                            <div className="field" key={key}>
                              <label htmlFor={'stop-' + key}>{label}</label>
                              <input
                                id={'stop-' + key}
                                required
                                type={type}
                                step={key === 'latitude' || key === 'longitude' ? 'any' : undefined}
                                value={values[key] || ''}
                                onChange={(event) =>
                                  setValues((current) => ({ ...current, [key]: event.target.value }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button type="submit" isLoading={busy}>
                          Save
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </Panel>
            ))
          ) : (
            <EmptyState
              title="No routes configured"
              description="Add a vehicle and route in transport setup."
            />
          )}
        </div>
      )}
    </>
  );
}
