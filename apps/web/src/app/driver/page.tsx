'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bus,
  Play,
  Square,
  Pause,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Smartphone,
  Navigation,
  Compass,
} from 'lucide-react';
import {
  transportApi,
  DEFAULT_TRANSPORT_ROUTES,
  calculateDistanceKm,
} from '@/lib/transport-client';
import {
  TransportTrip,
  TransportRoute,
  StudentTransitStatus,
  RouteDirection,
} from '@krypton/types';
import { LiveBusMap } from '@/components/transport/LiveBusMap';

export default function DriverAppPage() {
  const [routes, setRoutes] = useState<TransportRoute[]>(DEFAULT_TRANSPORT_ROUTES);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-01');
  const [direction, setDirection] = useState<RouteDirection>('MORNING_PICKUP');
  const [trip, setTrip] = useState<TransportTrip | null>(null);

  // GPS Beacon state
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentHeading, setCurrentHeading] = useState<number>(65);
  const [accuracy, setAccuracy] = useState<number>(3);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [delayNotice, setDelayNotice] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simStepRef = useRef(0);

  const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const currentStop = currentRoute.stops[activeStopIndex] || currentRoute.stops[0];

  // Load or initialize trip
  const refreshTrip = useCallback(async () => {
    try {
      const active = await transportApi.getActiveTrip(selectedRouteId);
      setTrip(active);
      if (active.status === 'IN_TRANSIT') {
        setIsBroadcasting(true);
      }
    } catch {
      // fallback
    }
  }, [selectedRouteId]);

  useEffect(() => {
    refreshTrip();
  }, [refreshTrip]);

  // Handle Real Device HTML5 Geolocation Watch
  const startRealGpsWatch = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError(null);

    try {
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, speed, heading, accuracy: acc } = position.coords;
          const spdKmH = speed ? Math.round(speed * 3.6) : 32;
          const headDeg = heading !== null && !isNaN(heading) ? Math.round(heading) : 70;

          setCurrentSpeed(spdKmH);
          setCurrentHeading(headDeg);
          setAccuracy(Math.round(acc || 4));
          setLastPingTime(new Date());

          if (trip) {
            const updated = await transportApi.sendLocationPing({
              tripId: trip.id,
              latitude,
              longitude,
              speed: spdKmH,
              heading: headDeg,
              accuracy: Math.round(acc || 4),
              timestamp: new Date().toISOString(),
            });
            setTrip(updated);
          }
        },
        (error) => {
          console.warn('Geolocation watch error:', error.message);
          setGpsError(`GPS Notice: ${error.message}. You can switch to Simulated Drive.`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );

      watchIdRef.current = id;
    } catch (e: any) {
      setGpsError(`GPS activation error: ${e?.message}`);
    }
  }, [trip]);

  // Handle Simulation Mode
  const startSimulation = useCallback(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    const stops = currentRoute.stops;
    let step = simStepRef.current;

    simIntervalRef.current = setInterval(async () => {
      step = (step + 1) % 40;
      simStepRef.current = step;

      const stopIdx = Math.min(Math.floor((step / 40) * stops.length), stops.length - 1);
      const nextIdx = Math.min(stopIdx + 1, stops.length - 1);

      const fromStop = stops[stopIdx];
      const toStop = stops[nextIdx];

      const fraction = (step % (40 / stops.length)) / (40 / stops.length);

      const lat = fromStop.latitude + (toStop.latitude - fromStop.latitude) * fraction;
      const lng = fromStop.longitude + (toStop.longitude - fromStop.longitude) * fraction;

      const simSpeed = step % 8 === 0 ? 0 : 38 + (step % 5) * 2;
      const simHeading = 68 + (step % 12);

      setCurrentSpeed(simSpeed);
      setCurrentHeading(simHeading);
      setAccuracy(3);
      setLastPingTime(new Date());

      if (trip) {
        const updated = await transportApi.sendLocationPing({
          tripId: trip.id,
          latitude: lat,
          longitude: lng,
          speed: simSpeed,
          heading: simHeading,
          accuracy: 3,
          timestamp: new Date().toISOString(),
        });
        setTrip(updated);
      }
    }, 2500);
  }, [currentRoute, trip]);

  // Start Route Button Handler
  const handleStartRoute = async () => {
    try {
      const newTrip = await transportApi.startTrip({
        routeId: selectedRouteId,
        direction,
        driverName: currentRoute.driverName,
        driverPhone: currentRoute.driverPhone,
        vehicleRegistration: currentRoute.vehicleRegistration,
      });

      setTrip(newTrip);
      setIsBroadcasting(true);

      if (isSimulated) {
        startSimulation();
      } else {
        startRealGpsWatch();
      }
    } catch (err: any) {
      alert(`Error starting route: ${err?.message}`);
    }
  };

  // End Route Button Handler
  const handleEndRoute = async () => {
    if (!confirm('Are you sure you want to end this route trip? (യാത്ര അവസാനിപ്പിക്കണോ?)')) {
      return;
    }

    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    setIsBroadcasting(false);

    if (trip) {
      const ended = await transportApi.endTrip(trip.id);
      setTrip(ended);
    }
  };

  // Toggle student boarding status
  const handleStudentStatus = async (studentId: string, status: StudentTransitStatus) => {
    if (!trip) return;
    try {
      const updated = await transportApi.updateStudentStatus({
        tripId: trip.id,
        studentId,
        stopId: currentStop.id,
        status,
      });
      setTrip(updated);
    } catch {}
  };

  // Mark all students at current stop as boarded
  const handleMarkAllStopBoarded = async () => {
    if (!trip) return;
    const studentsAtStop = trip.students.filter((s) => s.stopId === currentStop.id);
    for (const student of studentsAtStop) {
      await handleStudentStatus(student.id, 'BOARDED');
    }
  };

  // Cleanup watchers on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  // Filter students for currently selected stop
  const studentsAtCurrentStop = trip?.students.filter((s) => s.stopId === currentStop.id) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Mobile App Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/school/transport"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Back to Transport Center"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-base font-bold text-white tracking-tight">
                  Krypton Bus Pilot
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  സീറോ ഹാർഡ്വെയർ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentRoute.vehicleRegistration} • {currentRoute.driverName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/transport"
              target="_blank"
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <span>Parent View</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        {/* GPS Mode & Route Selector Card */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 uppercase tracking-wider">
              1. റൂട്ട് തിരഞ്ഞെടുക്കുക (Route)
            </span>
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setDirection('MORNING_PICKUP')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                  direction === 'MORNING_PICKUP'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Morning Pickup
              </button>
              <button
                onClick={() => setDirection('EVENING_DROPOFF')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                  direction === 'EVENING_DROPOFF'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Evening Drop
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {routes.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  if (isBroadcasting) {
                    alert('Please end the current route before switching routes.');
                    return;
                  }
                  setSelectedRouteId(r.id);
                  setActiveStopIndex(0);
                }}
                className={`text-left p-3 rounded-xl border transition ${
                  selectedRouteId === r.id
                    ? 'bg-blue-600/15 border-blue-500/80 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">{r.code}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {r.vehicleRegistration}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-300 mt-1 truncate">{r.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{r.nameMl}</p>
              </button>
            ))}
          </div>

          {/* GPS Mode Toggle: Real Smartphone vs Simulation */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Smartphone size={15} className="text-blue-400" />
              <span>GPS Beacon Mode:</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setIsSimulated(false)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  !isSimulated ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                📡 Device GPS (HTML5)
              </button>
              <button
                onClick={() => setIsSimulated(true)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  isSimulated ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Automated route traversal for demonstration/testing"
              >
                🚗 Demo Simulator
              </button>
            </div>
          </div>
        </div>

        {/* GPS Broadcast & Big Beacon Control Action */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Status Indicator Pill */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isBroadcasting
                    ? 'bg-emerald-500 animate-ping'
                    : 'bg-slate-700'
                }`}
              />
              <span className="text-sm font-bold tracking-wide">
                {isBroadcasting
                  ? '🟢 GPS BROADCASTING LIVE (യാത്ര പുരോഗമിക്കുന്നു)'
                  : '⚪ ROUTE STANDBY (യാത്ര ആരംഭിച്ചിട്ടില്ല)'}
              </span>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              {isSimulated ? 'TEST SIMULATOR' : 'HARDWARE-FREE GPS'}
            </span>
          </div>

          {/* Speed & Beacon Metrics HUD */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-400 block mb-0.5">SPEED</span>
              <div className="text-2xl font-black text-white font-mono">
                {isBroadcasting ? currentSpeed : 0}
                <span className="text-xs font-normal text-slate-400 ml-1">km/h</span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-400 block mb-0.5">HEADING</span>
              <div className="text-2xl font-black text-blue-400 font-mono">
                {isBroadcasting ? `${currentHeading}°` : '--'}
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-400 block mb-0.5">ACCURACY</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ±{accuracy}m
              </div>
            </div>
          </div>

          {gpsError && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Big High-Contrast Action Button */}
          {!isBroadcasting ? (
            <button
              onClick={handleStartRoute}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-lg shadow-xl shadow-emerald-900/40 active:scale-[0.98] transition flex items-center justify-center gap-3"
            >
              <Play size={24} className="fill-white" />
              <span>START ROUTE / യാത്ര ആരംഭിക്കുക</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleEndRoute}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-lg shadow-xl shadow-rose-900/40 active:scale-[0.98] transition flex items-center justify-center gap-3"
              >
                <Square size={22} className="fill-white" />
                <span>END ROUTE / യാത്ര അവസാനിപ്പിക്കുക</span>
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1 font-mono">
                <span>Beacon active via navigator.geolocation</span>
                <span>
                  Ping: {lastPingTime ? lastPingTime.toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Route Map Preview */}
        {trip && (
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                ലൈവ് മാപ്പ് (Live Route Map)
              </span>
              <span className="text-slate-500">
                Next Stop: {currentStop.name}
              </span>
            </div>
            <LiveBusMap
              trip={trip}
              stops={currentRoute.stops}
              childStopId={currentStop.id}
              height="300px"
              interactive={true}
            />
          </div>
        )}

        {/* Stop Navigator Pills */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. ബസ് സ്റ്റോപ്പ് ലിസ്റ്റ് (Bus Stops)
            </span>
            <span className="text-xs text-blue-400 font-medium">
              Stop {activeStopIndex + 1} of {currentRoute.stops.length}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {currentRoute.stops.map((stop, idx) => {
              const isSelected = idx === activeStopIndex;
              const studentsForThisStop =
                trip?.students.filter((s) => s.stopId === stop.id) || [];
              const boardedCount = studentsForThisStop.filter(
                (s) => s.transitStatus === 'BOARDED' || s.transitStatus === 'DROPPED'
              ).length;

              return (
                <button
                  key={stop.id}
                  onClick={() => setActiveStopIndex(idx)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span>#{stop.sequence}</span>
                    <span className="truncate max-w-[120px]">{stop.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px] opacity-80 mt-1">
                    <span>{stop.scheduledTime}</span>
                    <span>
                      {boardedCount}/{studentsForThisStop.length} onboard
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Student Attendance & Single-Tap Boarding Manifest at Current Stop */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={17} className="text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  {currentStop.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {currentStop.nameMl} • scheduled {currentStop.scheduledTime}
              </p>
            </div>

            <button
              onClick={handleMarkAllStopBoarded}
              disabled={studentsAtCurrentStop.length === 0}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold transition active:scale-95 disabled:opacity-40"
            >
              ⚡ Mark All Boarded (എല്ലാവരും കയറി)
            </button>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            {studentsAtCurrentStop.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No students assigned for pickup at this stop.
              </div>
            ) : (
              studentsAtCurrentStop.map((student) => {
                const isBoarded = student.transitStatus === 'BOARDED';
                const isDropped = student.transitStatus === 'DROPPED';
                const isAbsent = student.transitStatus === 'ABSENT';
                const isWaiting = student.transitStatus === 'WAITING';

                return (
                  <div
                    key={student.id}
                    className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {student.name}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                            {student.grade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {student.admissionNumber} • Parent: {student.guardianName} ({student.guardianPhone})
                        </p>
                      </div>
                    </div>

                    {/* Single-Tap Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStudentStatus(student.id, 'BOARDED')}
                        className={`flex-1 sm:flex-initial text-xs px-3.5 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                          isBoarded
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <CheckCircle size={14} />
                        <span>Boarded (കയറി)</span>
                      </button>

                      <button
                        onClick={() => handleStudentStatus(student.id, 'DROPPED')}
                        className={`flex-1 sm:flex-initial text-xs px-3.5 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                          isDropped
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-2 ring-blue-400'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <MapPin size={14} />
                        <span>Dropped (ഇറങ്ങി)</span>
                      </button>

                      <button
                        onClick={() => handleStudentStatus(student.id, 'ABSENT')}
                        className={`flex-1 sm:flex-initial text-xs px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                          isAbsent
                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 ring-2 ring-amber-400'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <XCircle size={14} />
                        <span>Absent</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Driver Assistance & Delay Alert Actions */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            3. അടിയന്തിര അറിയിപ്പുകൾ (Driver Quick Assistance)
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setDelayNotice('10 min traffic delay notification sent to all parents.');
                setTimeout(() => setDelayNotice(null), 4000);
              }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition"
            >
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Clock size={15} />
                <span>Traffic Delay (+10m)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                രക്ഷിതാക്കൾക്ക് ട്രാഫിക് ഡിലേ മെസ്സേജ് അയക്കുക
              </p>
            </button>

            <a
              href="tel:+254700000000"
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-left transition"
            >
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
                <Phone size={15} />
                <span>Call School Desk</span>
              </div>
              <p className="text-[11px] text-slate-400">
                സ്കൂൾ ട്രാൻസ്പോർട്ട് ഓഫീസുമായി ബന്ധപ്പെടുക
              </p>
            </a>
          </div>

          {delayNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle size={15} />
              <span>{delayNotice}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
