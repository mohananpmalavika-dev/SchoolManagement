'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Navigation,
  Compass,
  User,
  Share2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  transportApi,
  DEFAULT_TRANSPORT_ROUTES,
  calculateDistanceKm,
} from '@/lib/transport-client';
import { ParentBusTrackingView, TransportTrip } from '@krypton/types';
import { LiveBusMap } from '@/components/transport/LiveBusMap';

export default function ParentBusTrackingPage() {
  const [trackingView, setTrackingView] = useState<ParentBusTrackingView | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stu-003'); // Malavika Nair
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const [isCopied, setIsCopied] = useState(false);

  const fetchTracking = useCallback(async () => {
    try {
      const data = await transportApi.getParentTracking(selectedStudentId);
      setTrackingView(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 3000); // 3-second live refresh like Uber/Swiggy
    return () => clearInterval(interval);
  }, [fetchTracking]);

  if (loading && !trackingView) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Loading Live Bus Tracking...</h3>
        <p className="text-sm text-gray-500">Connecting to school bus GPS beacon</p>
      </div>
    );
  }

  const trip = trackingView?.trip;
  const child = trackingView?.child;
  const childStop = trackingView?.childStop;
  const route = DEFAULT_TRANSPORT_ROUTES.find((r) => r.id === trip?.routeId) || DEFAULT_TRANSPORT_ROUTES[0];

  // Boarding status helpers
  const isBoarded = child?.transitStatus === 'BOARDED';
  const isDropped = child?.transitStatus === 'DROPPED';
  const isWaiting = child?.transitStatus === 'WAITING';
  const isAbsent = child?.transitStatus === 'ABSENT';

  // ETA and status
  const etaMinutes = trackingView?.etaMinutesToChildStop || 4;
  const distanceKm = trackingView?.distanceKmToChildStop || 1.8;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              LIVE SCHOOL BUS TRACKING • ലൈവ് ബസ് ട്രാക്കിംഗ്
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {child?.name}&apos;s School Bus
          </h1>
          <p className="text-sm text-blue-200 mt-1">
            {route.name} ({route.nameMl}) • {route.vehicleRegistration}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="text-xs px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 font-medium transition flex items-center gap-1.5"
          >
            <Share2 size={14} />
            <span>{isCopied ? 'Link Copied!' : 'Share Tracking'}</span>
          </button>

          <Link
            href="/driver"
            target="_blank"
            className="text-xs px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <Bus size={14} />
            <span>Driver Portal Demo</span>
          </Link>
        </div>
      </div>

      {/* Uber/Swiggy Style Live ETA Hero Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          {/* Main Status Callout */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  isBoarded
                    ? 'bg-emerald-100 text-emerald-800'
                    : isDropped
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isBoarded
                  ? '🟢 ONBOARD BUS (കുട്ടി ബസ്സിലുണ്ട്)'
                  : isDropped
                  ? '✅ SAFELY DROPPED AT SCHOOL'
                  : '🟡 EN ROUTE TO YOUR STOP (വരുന്ന വഴിയിൽ)'}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {trackingView?.busStatusMessage}
            </h2>
            <p className="text-sm font-medium text-gray-600">
              {trackingView?.busStatusMessageMl}
            </p>
          </div>

          {/* Large ETA Badge */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-gray-200/80">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/30">
              {isDropped ? '0' : etaMinutes}
              <span className="text-xs font-normal">m</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
                ESTIMATED ARRIVAL (ETA)
              </span>
              <p className="text-base font-bold text-gray-900">
                {isDropped
                  ? 'Completed'
                  : `Around ${new Date(lastUpdated.getTime() + etaMinutes * 60000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
              </p>
              <span className="text-xs text-blue-600 font-medium">
                {distanceKm} km away from your stop
              </span>
            </div>
          </div>
        </div>

        {/* Live Map Section */}
        {trip && childStop && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Navigation size={14} className="text-blue-600" />
                <span>ലൈവ് ബസ് ലൊക്കേഷൻ മാപ്പ് (Real-Time GPS Map)</span>
              </span>
              <span className="text-emerald-600 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Pinging live at {trip.currentLocation.speed} km/h</span>
              </span>
            </div>

            <LiveBusMap
              trip={trip}
              stops={route.stops}
              childStopId={childStop.id}
              height="450px"
              interactive={true}
            />
          </div>
        )}

        {/* Trip Progress Bar Timeline */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <span>യാത്രാ പുരോഗതി (Trip Timeline)</span>
            <span>Stop: {childStop?.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl border bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>1. Route Started</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">Bus departed 07:15 AM</p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                isBoarded || isDropped
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
                {isBoarded || isDropped ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <Clock size={16} className="text-amber-600 animate-spin" />
                )}
                <span>2. Approaching Stop</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                {childStop?.name} ({childStop?.scheduledTime})
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                isBoarded
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500'
                  : isDropped
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
                {isBoarded || isDropped ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-400" />
                )}
                <span>3. Child Boarded</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                {isBoarded
                  ? `Boarded safely at ${child?.updatedAt ? new Date(child.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'time not recorded'}`
                  : 'Awaiting student boarding'}
              </p>
            </div>

            {/* Step 4 */}
            <div
              className={`p-3.5 rounded-2xl border transition ${
                isDropped
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
                {isDropped ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-400" />
                )}
                <span>4. Arrived at School</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                {isDropped ? 'Dropped safely at school gate' : 'Krypton Central Campus'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Profile, Vehicle Details & Safety Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Driver Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
            ഡ്രൈവർ വിവരങ്ങൾ (Driver Info)
          </span>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {route.driverName.charAt(0)}
            </div>
            <div>
              <h4 className="font-extrabold text-gray-900 text-base">
                {route.driverName}
              </h4>
              <p className="text-xs text-gray-500">School Certified Bus Pilot</p>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold mt-0.5">
                <span>★ 4.9 Rating</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 font-normal">8 yrs experience</span>
              </div>
            </div>
          </div>

          <a
            href={`tel:${route.driverPhone}`}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Phone size={16} />
            <span>Call Driver ({route.driverPhone})</span>
          </a>
        </div>

        {/* Vehicle Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
            വാഹന വിവരങ്ങൾ (Vehicle Details)
          </span>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shadow-sm">
              <Bus size={28} />
            </div>
            <div>
              <h4 className="font-extrabold text-gray-900 text-base font-mono">
                {route.vehicleRegistration}
              </h4>
              <p className="text-xs text-gray-500">{route.vehicleModel}</p>
              <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                ✓ Inspected & Speed Governed
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-gray-200/70 text-xs text-gray-600 flex justify-between items-center">
            <span>Capacity</span>
            <span className="font-bold text-gray-900">{route.totalCapacity} Passengers</span>
          </div>
        </div>

        {/* Safety & School Hotline Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
            സുരക്ഷാ ഹെൽപ്പ്‌ഡെസ്ക് (Safety Help)
          </span>

          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <ShieldCheck size={16} />
              <span>Zero-Hardware Live GPS Tracking</span>
            </div>
            <p className="text-gray-500 text-[11px]">
              Driver updates attendance upon student boarding and drop-off with instant time logs.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <a
              href="tel:+254700000000"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-900 font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <Phone size={15} />
              <span>Transport Desk Hotline</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
