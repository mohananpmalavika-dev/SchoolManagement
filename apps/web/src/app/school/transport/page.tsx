'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bus,
  Smartphone,
  Navigation,
  MapPin,
  Users,
  ShieldCheck,
  Phone,
  Clock,
  ArrowRight,
  ExternalLink,
  Plus,
  Radio,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Share2,
} from 'lucide-react';
import {
  transportApi,
  DEFAULT_TRANSPORT_ROUTES,
} from '@/lib/transport-client';
import { TransportTrip, TransportRoute } from '@krypton/types';
import { LiveBusMap } from '@/components/transport/LiveBusMap';
import { ResourceTabs } from '@/components/ResourceTabs';

export default function SchoolTransportPage() {
  const [activeTab, setActiveTab] = useState<'fleet' | 'driver' | 'students' | 'manage'>('fleet');
  const [routes, setRoutes] = useState<TransportRoute[]>(DEFAULT_TRANSPORT_ROUTES);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-01');
  const [activeTrip, setActiveTrip] = useState<TransportTrip | null>(null);
  const [driverLinkCopied, setDriverLinkCopied] = useState(false);

  const fetchTrip = useCallback(async () => {
    try {
      const trip = await transportApi.getActiveTrip(selectedRouteId);
      setActiveTrip(trip);
    } catch {}
  }, [selectedRouteId]);

  useEffect(() => {
    fetchTrip();
    const interval = setInterval(fetchTrip, 3000);
    return () => clearInterval(interval);
  }, [fetchTrip]);

  const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const handleCopyDriverLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/driver`;
      navigator.clipboard.writeText(url);
      setDriverLinkCopied(true);
      setTimeout(() => setDriverLinkCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              ZERO-HARDWARE GPS BUS TRACKING
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            School Transport Command Center
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            ബസ്സുകളിൽ പ്രത്യേക GPS ട്രാക്കറുകൾ ഇല്ലാതെ ഡ്രൈവറുടെ സ്മാർട്ട്ഫോൺ വഴി ലൈവ് ബസ് ട്രാക്കിംഗ്
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/driver"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-95"
          >
            <Smartphone size={15} />
            <span>Open Driver App (ഫോൺ സ്ക്രീൻ)</span>
          </Link>

          <Link
            href="/dashboard/transport"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
          >
            <ExternalLink size={14} />
            <span>Parent Map View</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'fleet'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Radio size={14} />
          <span>Live Fleet Radar (ലൈവ് ഫ്ലീറ്റ്)</span>
        </button>

        <button
          onClick={() => setActiveTab('driver')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'driver'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Smartphone size={14} />
          <span>Driver Phone Portal (ഡ്രൈവർ ആപ്പ് ലിങ്ക്)</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Users size={14} />
          <span>Student Manifest & Boarding</span>
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'manage'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Bus size={14} />
          <span>Manage Vehicles & Routes</span>
        </button>
      </div>

      {/* TAB 1: LIVE FLEET RADAR */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Active Buses
              </span>
              <div className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <span>{routes.length}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  All Pinging
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Students In Transit
              </span>
              <div className="text-2xl font-black text-blue-600 font-mono">
                {activeTrip ? activeTrip.boardedCount : 4}
                <span className="text-xs text-gray-400 font-normal ml-1">/ {activeTrip?.totalStudents || 9}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Average Speed
              </span>
              <div className="text-2xl font-black text-gray-900 font-mono">
                {activeTrip?.currentLocation.speed || 34} <span className="text-xs font-normal text-gray-500">km/h</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                On-Time Rate
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                98.4%
              </div>
            </div>
          </div>

          {/* Active Bus Fleet Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((r) => {
              const isSelected = r.id === selectedRouteId;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`bg-white p-5 rounded-2xl border cursor-pointer transition shadow-sm ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <Bus size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 text-sm">{r.code}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                            {r.vehicleRegistration}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{r.name}</p>
                      </div>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>GPS Live</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Driver</span>
                      <span className="font-bold text-gray-800 truncate block">{r.driverName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Capacity</span>
                      <span className="font-bold text-gray-800">{r.totalCapacity} seats</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Stops</span>
                      <span className="font-bold text-gray-800">{r.stops.length} stops</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Fleet Map View */}
          {activeTrip && (
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Live Tracking: {currentRoute.name} ({currentRoute.vehicleRegistration})
                  </h3>
                  <p className="text-xs text-gray-500">
                    Driver: {currentRoute.driverName} ({currentRoute.driverPhone})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/driver"
                    target="_blank"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    Control as Driver ➔
                  </Link>
                </div>
              </div>

              <LiveBusMap
                trip={activeTrip}
                stops={currentRoute.stops}
                height="460px"
                interactive={true}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DRIVER PHONE PORTAL LAUNCHER */}
      {activeTab === 'driver' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
              ZERO-HARDWARE DEPLOYMENT (സീറോ ഹാർഡ്വെയർ ഇൻസ്റ്റലേഷൻ)
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              ഡ്രൈവർ ഫോൺ സ്ക്രീൻ (Driver Smartphone Beacon)
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              ബസ്സുകളിൽ ഏതെങ്കിലും പ്രത്യേക GPS ഉപകരണം ഫിറ്റ് ചെയ്യേണ്ട ആവശ്യമില്ല. ഡ്രൈവറുടെ മൊബൈൽ ബ്രൗസറിൽ വെബ് ആപ്പ് തുറന്ന് യാത്ര തുടങ്ങുമ്പോൾ &quot;Start Route&quot; ക്ലിക്ക് ചെയ്താൽ മാത്രം മതി. HTML5 Geolocation API വഴി ലൊക്കേഷൻ സെർവറിലേക്ക് തുടർച്ചയായി സ്ട്രീം ചെയ്യപ്പെടും.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Direct Driver Launch Card */}
            <div className="bg-slate-950 text-white p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Direct Driver Web URL</h4>
                  <p className="text-xs text-slate-400">Works on Chrome, Safari, Android & iOS</p>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 break-all">
                /driver
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/driver"
                  target="_blank"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-95"
                >
                  <span>Launch Driver Screen</span>
                  <ArrowRight size={16} />
                </Link>

                <button
                  onClick={handleCopyDriverLink}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Share2 size={14} />
                  <span>{driverLinkCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* How It Works Guide in Malayalam & English */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                  <span>Driver opens mobile web link</span>
                </div>
                <p className="text-xs text-gray-600 pl-8">
                  ഡ്രൈവർ ഫോണിൽ <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">/driver</code> ലിങ്ക് തുറക്കുന്നു.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>Clicks &quot;Start Route&quot;</span>
                </div>
                <p className="text-xs text-gray-600 pl-8">
                  യാത്ര തുടങ്ങുമ്പോൾ &quot;Start Route&quot; ടാപ്പ് ചെയ്യുന്നു. ഫോൺ GPS സ്വയം ആക്റ്റീവ് ആകുന്നു.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                  <span>1-Tap &quot;Boarded&quot; at each stop</span>
                </div>
                <p className="text-xs text-gray-600 pl-8">
                  ഓരോ സ്റ്റോപ്പിലും വിദ്യാർത്ഥികളുടെ പേരുകൾക്ക് നേരെ &quot;Boarded&quot; ഒറ്റ ടാപ്പിൽ മാർക്ക് ചെയ്യുന്നു.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT MANIFEST & BOARDING */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Student Bus Manifest • {currentRoute.name}
              </h3>
              <p className="text-xs text-gray-500">
                {currentRoute.students.length} students assigned to {currentRoute.code}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {activeTrip?.boardedCount || 2} Boarded
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                {activeTrip?.waitingCount || 7} Waiting
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Class/Grade</th>
                  <th className="p-3.5">Bus Stop</th>
                  <th className="p-3.5">Guardian Contact</th>
                  <th className="p-3.5">Transit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(activeTrip?.students || currentRoute.students).map((s) => {
                  const isBoarded = s.transitStatus === 'BOARDED';
                  const isDropped = s.transitStatus === 'DROPPED';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-gray-900">
                        {s.name}
                        <span className="block text-[11px] text-gray-400 font-mono font-normal">
                          {s.admissionNumber}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-700">{s.grade}</td>
                      <td className="p-3.5 font-medium text-blue-700">{s.stopName}</td>
                      <td className="p-3.5 text-gray-600">
                        {s.guardianName}
                        <span className="block text-[11px] text-gray-400">{s.guardianPhone}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                            isBoarded
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDropped
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isBoarded ? '✓ Boarded' : isDropped ? '★ Dropped' : '• Waiting'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VEHICLES & ROUTES MANAGEMENT */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-4">
          <ResourceTabs
            resources={[
              { key: 'vehicles', label: 'Vehicles' },
              { key: 'routes', label: 'Transport routes' },
            ]}
          />
        </div>
      )}
    </div>
  );
}