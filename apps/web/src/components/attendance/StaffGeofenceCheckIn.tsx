'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  LogOut,
  Sliders,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import {
  smartAttendanceApi,
  calculateHaversineDistanceMeters,
  MOCK_STAFF_MEMBERS,
  MockStaffMember,
} from '@/lib/smart-attendance-client';
import {
  GeofenceConfig,
  StaffSmartAttendanceRecord,
  StaffCheckInResult,
} from '@krypton/types';

export function StaffGeofenceCheckIn() {
  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>(() =>
    smartAttendanceApi.getGeofenceConfig()
  );
  const [selectedStaff, setSelectedStaff] = useState<MockStaffMember>(
    MOCK_STAFF_MEMBERS[0]
  );
  const [staffRecords, setStaffRecords] = useState<StaffSmartAttendanceRecord[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    isSimulated?: boolean;
    locationName?: string;
  }>({
    latitude: 10.02615,
    longitude: 76.31248,
    accuracy: 12,
    isSimulated: true,
    locationName: 'School Main Administrative Block (28m inside)',
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [checkInResult, setCheckInResult] = useState<StaffCheckInResult | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [customRadius, setCustomRadius] = useState<number>(geofenceConfig.radiusMeters);

  // Load records
  const loadRecords = useCallback(() => {
    setStaffRecords(smartAttendanceApi.getStaffRecords());
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Haversine distance from school center
  const currentDistance = calculateHaversineDistanceMeters(
    userLocation.latitude,
    userLocation.longitude,
    geofenceConfig.latitude,
    geofenceConfig.longitude
  );

  const isWithinGeofence = currentDistance <= geofenceConfig.radiusMeters;

  // Real GPS lookup using browser navigator
  const detectLiveGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          isSimulated: false,
          locationName: 'Actual Mobile GPS Coordinate',
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS lookup error or permission denied:', err.message);
        setIsLocating(false);
        alert(
          `Could not get GPS location (${err.message}). Using campus simulation for testing.`
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Pre-set simulation spots for instant testing
  const SIMULATION_PRESETS = [
    {
      name: 'Campus Main Block',
      nameMl: 'മെയിൻ അഡ്മിൻ ബ്ലോക്ക്',
      lat: 10.02615,
      lng: 76.31248,
      desc: '28m from center (Well inside)',
      inside: true,
    },
    {
      name: 'Senior Science Lab',
      nameMl: 'സയൻസ് ലാബ് & ലൈബ്രറി',
      lat: 10.0269,
      lng: 76.3132,
      desc: '135m from center (Inside)',
      inside: true,
    },
    {
      name: 'School Sports Ground Gate',
      nameMl: 'സ്കൂൾ പ്ലേഗ്രൗണ്ട് ഗേറ്റ്',
      lat: 10.0278,
      lng: 76.3139,
      desc: '240m from center (Border)',
      inside: true,
    },
    {
      name: 'Outside Main Gate Cafe',
      nameMl: 'സ്കൂൾ ഗേറ്റിന് പുറത്ത്',
      lat: 10.0292,
      lng: 76.3155,
      desc: '480m away (Outside fence)',
      inside: false,
    },
    {
      name: 'Home / Metro Station',
      nameMl: 'വീട്ടിൽ / മെട്രോ സ്റ്റേഷൻ',
      lat: 10.045,
      lng: 76.33,
      desc: '2.8 km away (Completely outside)',
      inside: false,
    },
  ];

  const handleSimulate = (preset: (typeof SIMULATION_PRESETS)[0]) => {
    setUserLocation({
      latitude: preset.lat,
      longitude: preset.lng,
      accuracy: 8,
      isSimulated: true,
      locationName: `${preset.name} - ${preset.desc}`,
    });
    setCheckInResult(null);
  };

  // Check-In or Check-Out action
  const handleAction = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setIsCheckingIn(true);
    setCheckInResult(null);

    setTimeout(() => {
      const res = smartAttendanceApi.checkInStaff({
        staffId: selectedStaff.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        accuracyMeters: userLocation.accuracy || 10,
        deviceInfo: userLocation.isSimulated
          ? 'Mobile Browser (Simulated GPS)'
          : 'Smartphone GPS Beacon (Verified)',
        type,
      });

      setCheckInResult(res);
      setIsCheckingIn(false);
      loadRecords();
    }, 600);
  };

  const handleUpdateRadius = () => {
    const updated = smartAttendanceApi.updateGeofenceConfig({
      radiusMeters: Number(customRadius),
    });
    setGeofenceConfig(updated);
    setShowConfigModal(false);
  };

  // Find selected staff's current record today
  const selectedStaffRecord = staffRecords.find((r) => r.staffId === selectedStaff.id);

  return (
    <div className="space-y-6">
      {/* Geofence Status Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                GEOFENCED GPS MOBILE ATTENDANCE • ജിയോ-ഫെൻസ്ഡ് മൊബൈൽ അറ്റൻഡൻസ്
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {geofenceConfig.schoolName}
            </h2>
            <p className="text-sm text-indigo-200 mt-1 max-w-2xl">
              {geofenceConfig.schoolNameMl} • {geofenceConfig.address}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                <Compass size={14} className="text-indigo-300" />
                Center: {geofenceConfig.latitude.toFixed(4)}°N, {geofenceConfig.longitude.toFixed(4)}°E
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-400" />
                Allowed Radius: {geofenceConfig.radiusMeters}m
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30 flex items-center gap-1.5">
                <Clock size={14} />
                Shift: {geofenceConfig.allowedCheckInStart} - {geofenceConfig.allowedCheckOutStart} (Late after {geofenceConfig.lateThresholdTime})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/20 transition flex items-center gap-2 shadow-lg"
            >
              <Sliders size={15} />
              <span>Configure Geofence</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Interactive Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mobile Staff Check-In Card & GPS Radar */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header with Staff Selector */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone size={18} className="text-indigo-600" />
                  Staff Mobile Check-In Terminal
                </h3>
                <p className="text-xs text-gray-500">
                  അധ്യാപകരുടെയും ജീവനക്കാരുടെയും ഫോൺ വഴി ചെക്ക്-ഇൻ
                </p>
              </div>

              {/* Staff Switcher */}
              <div className="flex items-center gap-2">
                <label htmlFor="staff-select" className="text-xs font-medium text-gray-500">
                  Select Staff:
                </label>
                <select
                  id="staff-select"
                  value={selectedStaff.id}
                  onChange={(e) => {
                    const st = MOCK_STAFF_MEMBERS.find((s) => s.id === e.target.value);
                    if (st) {
                      setSelectedStaff(st);
                      setCheckInResult(null);
                    }
                  }}
                  className="text-xs font-semibold bg-white border border-gray-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                >
                  {MOCK_STAFF_MEMBERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Selected Staff Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <img
                  src={selectedStaff.avatarUrl}
                  alt={selectedStaff.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-300 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {selectedStaff.name}
                    </h4>
                    <span className="text-xs text-indigo-700 bg-indigo-100 font-medium px-2 py-0.5 rounded-full">
                      {selectedStaff.staffNumber}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {selectedStaff.designation} • {selectedStaff.department}
                  </p>
                  <p className="text-xs text-indigo-900/70 font-medium mt-0.5">
                    {selectedStaff.nameMl}
                  </p>
                </div>
                {selectedStaffRecord && (
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        selectedStaffRecord.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedStaffRecord.status === 'LATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedStaffRecord.status}
                    </span>
                    <p className="text-[11px] text-gray-500 mt-1">
                      In: {selectedStaffRecord.checkInTime || '--'}
                    </p>
                  </div>
                )}
              </div>

              {/* Geofence Radar & Distance Visualizer */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={18}
                      className={isWithinGeofence ? 'text-emerald-400' : 'text-rose-400'}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Geofence Proximity Radar
                    </span>
                  </div>
                  <button
                    onClick={detectLiveGPS}
                    disabled={isLocating}
                    className="text-xs px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium transition flex items-center gap-1.5 border border-slate-700"
                  >
                    <RefreshCw size={12} className={isLocating ? 'animate-spin' : ''} />
                    <span>{isLocating ? 'Detecting GPS...' : 'Use My Phone GPS'}</span>
                  </button>
                </div>

                {/* Radar Circle Visualization */}
                <div className="relative py-6 flex flex-col items-center justify-center">
                  <div
                    className={`relative w-48 h-48 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
                      isWithinGeofence
                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
                        : 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_40px_rgba(244,63,94,0.2)]'
                    }`}
                  >
                    {/* Inner Geofence Target */}
                    <div className="w-28 h-28 rounded-full border border-dashed border-indigo-400/40 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600/30 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-indigo-400 animate-pulse" />
                      </div>
                    </div>

                    {/* Staff Position Dot */}
                    <div
                      className={`absolute w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                        isWithinGeofence
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-rose-500 text-white animate-bounce'
                      }`}
                      style={{
                        transform: isWithinGeofence
                          ? `translate(${Math.min(currentDistance / 3, 40)}px, ${-Math.min(
                              currentDistance / 4,
                              30
                            )}px)`
                          : 'translate(85px, -70px)',
                      }}
                    >
                      <UserCheck size={14} />
                    </div>
                  </div>

                  {/* Status Indicator Tag */}
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black tracking-tight">
                        {currentDistance} <span className="text-sm font-normal text-slate-400">meters</span>
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          isWithinGeofence
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isWithinGeofence ? 'Inside Campus Zone' : 'Outside Geofence'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {userLocation.locationName || 'Current GPS coordinates'} (Radius allowed: {geofenceConfig.radiusMeters}m)
                    </p>
                  </div>
                </div>

                {/* Location Simulation Quick Buttons for Demonstration */}
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Test GPS Locations (ഡെമോ ലൊക്കേഷൻ മാറ്റുക):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SIMULATION_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSimulate(p)}
                        className={`text-left p-2 rounded-xl text-xs border transition ${
                          userLocation.locationName?.startsWith(p.name)
                            ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.inside ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {p.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Check In & Check Out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction('CHECK_IN')}
                  disabled={isCheckingIn || !isWithinGeofence}
                  className={`py-3.5 px-6 rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                    isWithinGeofence
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 active:scale-95'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {isCheckingIn
                      ? 'Verifying GPS...'
                      : isWithinGeofence
                      ? '1-Tap Geofence Check-In'
                      : 'Outside Fence (Check-In Disabled)'}
                  </span>
                </button>

                <button
                  onClick={() => handleAction('CHECK_OUT')}
                  disabled={isCheckingIn || !selectedStaffRecord?.checkInTime}
                  className={`py-3.5 px-6 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    selectedStaffRecord?.checkInTime
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  <LogOut size={18} />
                  <span>Mark Shift Check-Out</span>
                </button>
              </div>

              {/* Check-In Response Notification */}
              {checkInResult && (
                <div
                  className={`p-4 rounded-2xl border transition-all animate-in fade-in-50 ${
                    checkInResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {checkInResult.success ? (
                      <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className="text-sm font-bold">
                        {checkInResult.success ? 'Verification Successful' : 'Check-In Blocked'}
                      </h5>
                      <p className="text-xs mt-0.5 text-gray-700">{checkInResult.message}</p>
                      <p className="text-xs font-medium mt-1 text-indigo-900">{checkInResult.messageMl}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-600">
                        <span>Staff: {checkInResult.staffName}</span>
                        <span>•</span>
                        <span>Distance: {checkInResult.distanceMeters}m</span>
                        <span>•</span>
                        <span>Time: {checkInResult.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Today's Staff Attendance Ledger & Audit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Today&apos;s Staff Log (ഹാജർ പട്ടിക)
                </h3>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={loadRecords}
                className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 text-center">
                <span className="text-xs text-gray-500 font-medium">Total Staff</span>
                <p className="text-xl font-black text-indigo-900 mt-0.5">
                  {MOCK_STAFF_MEMBERS.length}
                </p>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-center">
                <span className="text-xs text-emerald-700 font-medium">Checked In</span>
                <p className="text-xl font-black text-emerald-800 mt-0.5">
                  {staffRecords.length}
                </p>
              </div>
              <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3 text-center">
                <span className="text-xs text-amber-700 font-medium">Late Marks</span>
                <p className="text-xl font-black text-amber-800 mt-0.5">
                  {staffRecords.filter((r) => r.status === 'LATE').length}
                </p>
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {staffRecords.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <UserCheck size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">No staff check-ins recorded yet today.</p>
                </div>
              ) : (
                staffRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {r.staffName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {r.department} • Dist: {r.distanceMeters ?? 25}m from center
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <ShieldCheck size={11} className="text-emerald-600" />
                        Verified via Geofence GPS
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-800">
                        {r.checkInTime || '--'}
                      </p>
                      {r.checkOutTime && (
                        <p className="text-[10px] text-indigo-600 font-medium">
                          Out: {r.checkOutTime}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Geofence Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">
              Configure Campus Geofence Perimeter
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              സ്കൂൾ കോമ്പൗണ്ട് മാപ്പിലെ ജിയോ-ഫെൻസ് പരിധി ക്രമീകരിക്കുക
            </p>

            <div className="space-y-4 my-5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  School Center Latitude:
                </label>
                <input
                  type="text"
                  readOnly
                  value={geofenceConfig.latitude}
                  className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  School Center Longitude:
                </label>
                <input
                  type="text"
                  readOnly
                  value={geofenceConfig.longitude}
                  className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Geofence Allowed Radius (Meters):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="25"
                    value={customRadius}
                    onChange={(e) => setCustomRadius(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-sm font-bold text-indigo-700 w-16 text-right">
                    {customRadius} m
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Any mobile check-in further than {customRadius}m will be rejected automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRadius}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-md"
              >
                Save Geofence Radius
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
