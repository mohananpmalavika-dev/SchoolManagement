'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus,
  MapPin,
  Plus,
  Navigation,
  School,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Route as RouteIcon,
  Compass,
  ArrowRight,
  ExternalLink,
  Users,
  Search,
  Loader2,
} from 'lucide-react';
import {
  TransportRoute,
  TransportStop,
  SchoolCampusLocation,
  CreateRouteRequest,
  AutoRouteGeneratorRequest,
} from '@krypton/types';
import {
  transportApi,
  DEFAULT_SCHOOL_LOCATION,
  POPULAR_CORRIDOR_PRESETS,
  calculateDistanceKm,
} from '@/lib/transport-client';

const CAMPUS_PRESETS: Array<{ label: string; district: string; city: string; lat: number; lng: number; address: string }> = [
  // Kollam District Presets
  {
    label: 'Kollam Central Campus (Chinnakada)',
    district: 'Kollam',
    city: 'Kollam',
    lat: 8.8895,
    lng: 76.5912,
    address: 'Residency Road, Chinnakada, Kollam - 691001',
  },
  {
    label: 'Kollam Coastal Campus (Tangasseri)',
    district: 'Kollam',
    city: 'Kollam',
    lat: 8.8876,
    lng: 76.5784,
    address: 'Bishop Jerome Nagar, Tangasseri, Kollam - 691007',
  },
  {
    label: 'Kottarakkara Campus',
    district: 'Kollam',
    city: 'Kollam',
    lat: 8.9987,
    lng: 76.7681,
    address: 'Near Pulamon Junction, MC Road, Kottarakkara, Kollam - 691506',
  },
  {
    label: 'Karunagappally Campus',
    district: 'Kollam',
    city: 'Kollam',
    lat: 9.0544,
    lng: 76.5342,
    address: 'NH 66 High School Road, Karunagappally, Kollam - 690518',
  },

  // Ernakulam / Kochi District Presets
  {
    label: 'Kochi Central (Tripunithura)',
    district: 'Ernakulam',
    city: 'Kochi',
    lat: 9.9542,
    lng: 76.3458,
    address: 'Green Valley Campus, Hill Palace Road, Tripunithura, Kochi - 682301',
  },
  {
    label: 'Kakkanad InfoPark Campus',
    district: 'Ernakulam',
    city: 'Kochi',
    lat: 10.0159,
    lng: 76.3419,
    address: 'Smart City Road, Kakkanad, Ernakulam - 682030',
  },
  {
    label: 'Aluva - Kalamassery Campus',
    district: 'Ernakulam',
    city: 'Kochi',
    lat: 10.0524,
    lng: 76.3245,
    address: 'Near Kalamassery Premier Junction, NH 544, Kochi - 683104',
  },
  {
    label: 'Edappally Bypass Campus',
    district: 'Ernakulam',
    city: 'Kochi',
    lat: 10.0261,
    lng: 76.3087,
    address: 'NH 66 Bypass, Edappally Metro Station, Kochi - 682024',
  },
];

export function SchoolTransportSetupHub() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [schoolLocation, setSchoolLocation] = useState<SchoolCampusLocation>(DEFAULT_SCHOOL_LOCATION);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Modals
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = useState(false);
  const [isCorridorModalOpen, setIsCorridorModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [corridorDistrictFilter, setCorridorDistrictFilter] = useState<'ALL' | 'Kollam' | 'Ernakulam'>('ALL');
  const [campusDistrictFilter, setCampusDistrictFilter] = useState<'ALL' | 'Kollam' | 'Ernakulam'>('ALL');

  // Location form state
  const [locForm, setLocForm] = useState<SchoolCampusLocation>(DEFAULT_SCHOOL_LOCATION);

  // Route form state
  const [routeForm, setRouteForm] = useState<{
    id?: string;
    name: string;
    nameMl: string;
    code: string;
    vehicleRegistration: string;
    vehicleModel: string;
    driverName: string;
    driverPhone: string;
    totalCapacity: number;
    direction: 'MORNING_PICKUP' | 'EVENING_DROPOFF';
    stops: Array<{
      name: string;
      nameMl: string;
      latitude: number;
      longitude: number;
      scheduledTime: string;
    }>;
  }>({
    name: '',
    nameMl: '',
    code: 'BUS-03',
    vehicleRegistration: 'KL 07 DF 8910',
    vehicleModel: 'Tata Starbus Ultra (34-seater)',
    driverName: 'Mohanan P.',
    driverPhone: '+91 98471 23456',
    totalCapacity: 34,
    direction: 'MORNING_PICKUP',
    stops: [
      {
        name: 'Vyttila Mobility Hub Gate',
        nameMl: 'വൈറ്റില മൊബിലിറ്റി ഹബ്ബ്',
        latitude: 9.9679,
        longitude: 76.3204,
        scheduledTime: '07:30 AM',
      },
      {
        name: 'Maradu Junction Stop',
        nameMl: 'മരട് ജംഗ്ഷൻ സ്റ്റോപ്പ്',
        latitude: 9.9515,
        longitude: 76.3312,
        scheduledTime: '07:45 AM',
      },
    ],
  });

  // Place search state for route builder
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<Array<{
    name: string;
    displayName: string;
    latitude: number;
    longitude: number;
    distanceFromSchoolKm: number;
    estimatedMinutes: number;
  }>>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [suggestedStops, setSuggestedStops] = useState<Array<{
    name: string;
    nameMl?: string;
    latitude: number;
    longitude: number;
    distanceFromSchoolKm: number;
    estimatedMinutes: number;
  }>>([]);

  // Place search state for school campus location
  const [campusSearchQuery, setCampusSearchQuery] = useState('');
  const [campusSearchResults, setCampusSearchResults] = useState<Array<{
    name: string;
    displayName: string;
    latitude: number;
    longitude: number;
  }>>([]);
  const [isSearchingCampus, setIsSearchingCampus] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedLoc, fetchedRoutes, fetchedSuggestions] = await Promise.all([
        transportApi.getSchoolLocation(),
        transportApi.getRoutes(),
        transportApi.getNearbySuggestedStops(),
      ]);
      setSchoolLocation(fetchedLoc);
      setLocForm(fetchedLoc);
      setRoutes(fetchedRoutes);
      setSuggestedStops(fetchedSuggestions);
      if (fetchedRoutes.length > 0 && !selectedRouteId) {
        setSelectedRouteId(fetchedRoutes[0].id);
      }
    } catch (e) {
      console.error('Failed to load transport setup data', e);
    } finally {
      setLoading(false);
    }
  }, [selectedRouteId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSearchNearbyPlaces = async (q: string) => {
    setPlaceQuery(q);
    if (!q || q.length < 2) {
      setPlaceResults([]);
      return;
    }
    setIsSearchingPlaces(true);
    try {
      const res = await transportApi.searchPlaces(q, schoolLocation.latitude, schoolLocation.longitude);
      setPlaceResults(res);
    } catch {
      setPlaceResults([]);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleAddFoundPlaceToRoute = (place: {
    name: string;
    nameMl?: string;
    latitude: number;
    longitude: number;
    distanceFromSchoolKm: number;
    estimatedMinutes: number;
  }) => {
    const estMin = place.estimatedMinutes || Math.round(place.distanceFromSchoolKm * 2.5);
    const pickupHour = 8 - Math.floor(estMin / 60);
    const pickupMin = (60 + 15 - (estMin % 60)) % 60;
    const formattedHour = pickupHour < 10 ? `0${pickupHour}` : `${pickupHour}`;
    const formattedMin = pickupMin < 10 ? `0${pickupMin}` : `${pickupMin}`;

    setRouteForm((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          name: place.name,
          nameMl: place.nameMl || '',
          latitude: place.latitude,
          longitude: place.longitude,
          scheduledTime: `${formattedHour}:${formattedMin} AM`,
        },
      ],
    }));

    setPlaceQuery('');
    setPlaceResults([]);
    showNotification(`Added "${place.name}" (${place.distanceFromSchoolKm} km from campus) to route.`);
  };

  const handleSearchCampusLocation = async (q: string) => {
    setCampusSearchQuery(q);
    if (!q || q.length < 2) {
      setCampusSearchResults([]);
      return;
    }
    setIsSearchingCampus(true);
    try {
      const res = await transportApi.searchPlaces(q);
      setCampusSearchResults(res);
    } catch {
      setCampusSearchResults([]);
    } finally {
      setIsSearchingCampus(false);
    }
  };

  const handleSelectCampusSearchResult = (item: {
    name: string;
    displayName: string;
    latitude: number;
    longitude: number;
  }) => {
    const parts = item.displayName.split(',');
    const city = parts[parts.length - 4]?.trim() || parts[0]?.trim();
    const district = parts[parts.length - 3]?.trim() || city;

    setLocForm((prev) => ({
      ...prev,
      address: item.displayName,
      city: city,
      district: district,
      latitude: item.latitude,
      longitude: item.longitude,
    }));
    setCampusSearchQuery('');
    setCampusSearchResults([]);
  };

  // Save School Location
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await transportApi.saveSchoolLocation(locForm);
      setSchoolLocation(updated);
      setIsLocationModalOpen(false);
      showNotification('School campus location saved! Stop distances and travel times updated.');
      void loadData();
    } catch {
      showNotification('Failed to update campus location.');
    }
  };

  // Add a stop to current route draft
  const handleAddStopToForm = () => {
    const lastStop = routeForm.stops[routeForm.stops.length - 1];
    const defaultLat = lastStop ? lastStop.latitude + 0.005 : schoolLocation.latitude + 0.01;
    const defaultLng = lastStop ? lastStop.longitude - 0.005 : schoolLocation.longitude - 0.01;

    setRouteForm((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          name: `Pickup Point ${prev.stops.length + 1}`,
          nameMl: `സ്റ്റോപ്പ് ${prev.stops.length + 1}`,
          latitude: Number(defaultLat.toFixed(4)),
          longitude: Number(defaultLng.toFixed(4)),
          scheduledTime: '07:40 AM',
        },
      ],
    }));
  };

  const handleRemoveStopFromForm = (index: number) => {
    setRouteForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= routeForm.stops.length) return;

    const copy = [...routeForm.stops];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setRouteForm((prev) => ({ ...prev, stops: copy }));
  };

  // Save New or Updated Route
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (routeForm.stops.length === 0) {
      alert('Please add at least one pickup stop.');
      return;
    }

    try {
      const routePayload: CreateRouteRequest = {
        name: routeForm.name,
        nameMl: routeForm.nameMl || routeForm.name,
        code: routeForm.code,
        vehicleRegistration: routeForm.vehicleRegistration,
        vehicleModel: routeForm.vehicleModel,
        driverName: routeForm.driverName,
        driverPhone: routeForm.driverPhone,
        totalCapacity: routeForm.totalCapacity,
        direction: routeForm.direction,
        stops: routeForm.stops.map((s, idx) => ({
          name: s.name,
          nameMl: s.nameMl,
          sequence: idx + 1,
          latitude: s.latitude,
          longitude: s.longitude,
          scheduledTime: s.scheduledTime,
        })),
      };

      if (routeForm.id) {
        await transportApi.updateRoute(routeForm.id, routePayload);
        showNotification(`Route "${routeForm.name}" updated successfully!`);
      } else {
        await transportApi.createRoute(routePayload);
        showNotification(`New Route "${routeForm.name}" created and anchored to School Campus!`);
      }

      setIsNewRouteModalOpen(false);
      void loadData();
    } catch {
      showNotification('Failed to save route configuration.');
    }
  };

  // Quick Corridor 1-Click Generator
  const handleSelectCorridor = async (preset: (typeof POPULAR_CORRIDOR_PRESETS)[0]) => {
    try {
      const regPrefix = preset.district === 'Kollam' ? 'KL 02' : 'KL 07';
      const driverName = preset.district === 'Kollam' ? 'Radhakrishnan Pillai' : 'Suresh Kumar V.';
      const payload: AutoRouteGeneratorRequest = {
        name: `Route: ${preset.name}`,
        nameMl: `റൂട്ട്: ${preset.nameMl}`,
        code: `BUS-0${routes.length + 1}`,
        vehicleRegistration: `${regPrefix} BG ${4000 + routes.length * 110}`,
        vehicleModel: 'Tata Starbus Ultra (32-seater)',
        driverName,
        driverPhone: '+91 98470 34567',
        totalCapacity: 32,
        direction: 'MORNING_PICKUP',
        corridorPresetId: preset.id,
        originStop: preset.origin,
        intermediateStops: preset.intermediate,
      };

      await transportApi.autoGenerateRoute(payload);
      setIsCorridorModalOpen(false);
      showNotification(`Corridor route "${preset.name}" generated with automatic distance calculation from School Campus!`);
      void loadData();
    } catch {
      showNotification('Failed to auto-generate corridor route.');
    }
  };

  // Delete Route
  const handleDeleteRoute = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await transportApi.deleteRoute(id);
      showNotification(`Route "${name}" deleted.`);
      void loadData();
    } catch {
      showNotification('Failed to delete route.');
    }
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  return (
    <div className="space-y-6">
      {/* Top Banner / School Location Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" /> School Campus Location Anchor
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                GPS Based Route Planner
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              {schoolLocation.schoolName}
              {schoolLocation.schoolNameMl && (
                <span className="text-lg font-normal text-indigo-300 hidden lg:inline">
                  ({schoolLocation.schoolNameMl})
                </span>
              )}
            </h1>

            <p className="text-indigo-200/90 text-sm max-w-2xl flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                {schoolLocation.address}, {schoolLocation.city}, {schoolLocation.state} - {schoolLocation.pincode}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-300 pt-1 font-mono">
              <span className="bg-black/30 px-3 py-1 rounded-xl border border-white/10 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Lat: {schoolLocation.latitude.toFixed(4)}°, Lng: {schoolLocation.longitude.toFixed(4)}°
              </span>
              <span className="bg-black/30 px-3 py-1 rounded-xl border border-white/10 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Bell Timing: {schoolLocation.morningReportingTime} (Morning) • {schoolLocation.eveningDepartureTime} (Evening)
              </span>
              <span className="bg-black/30 px-3 py-1 rounded-xl border border-white/10">
                Gate: {schoolLocation.campusGate}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="bg-white/15 hover:bg-white/25 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl border border-white/20 transition-all shadow-sm flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
              Change School Location
            </button>

            <button
              onClick={() => setIsCorridorModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Corridor Generator
            </button>

            <button
              onClick={() => {
                setRouteForm({
                  name: `Route ${routes.length + 1}: Suburban Express`,
                  nameMl: `റൂട്ട് ${routes.length + 1}: സബർബൻ എക്സ്പ്രസ്സ്`,
                  code: `BUS-0${routes.length + 1}`,
                  vehicleRegistration: 'KL 07 DF 9120',
                  vehicleModel: 'Tata Starbus Ultra (32-seater)',
                  driverName: 'Ramesh Babu',
                  driverPhone: '+91 98471 23456',
                  totalCapacity: 32,
                  direction: 'MORNING_PICKUP',
                  stops: [
                    {
                      name: 'Starting Point Stop',
                      nameMl: 'ആദ്യ സ്റ്റോപ്പ്',
                      latitude: Number((schoolLocation.latitude + 0.05).toFixed(4)),
                      longitude: Number((schoolLocation.longitude - 0.04).toFixed(4)),
                      scheduledTime: '07:20 AM',
                    },
                    {
                      name: 'Intermediate Town Junction',
                      nameMl: 'ടൗൺ ജംഗ്ഷൻ സ്റ്റോപ്പ്',
                      latitude: Number((schoolLocation.latitude + 0.02).toFixed(4)),
                      longitude: Number((schoolLocation.longitude - 0.02).toFixed(4)),
                      scheduledTime: '07:45 AM',
                    },
                  ],
                });
                setIsNewRouteModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Custom Route
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className="bg-emerald-900/90 border border-emerald-500/50 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Route List and Interactive Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Routes List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Bus className="w-4 h-4 text-indigo-600" />
              Configured School Bus Routes ({routes.length})
            </h2>
            <span className="text-xs text-gray-500">Click to inspect</span>
          </div>

          <div className="space-y-3">
            {routes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              const totalStops = route.stops.length;
              const firstStop = route.stops[0];
              const maxDist = Math.max(
                ...route.stops.map(
                  (s) =>
                    s.distanceFromSchoolKm ||
                    calculateDistanceKm(s.latitude, s.longitude, schoolLocation.latitude, schoolLocation.longitude)
                ),
                0
              );

              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          {route.code}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          {route.direction === 'MORNING_PICKUP' ? '🌅 Morning Pickup' : '🌆 Evening Drop-off'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 mt-1">{route.name}</h3>
                      {route.nameMl && (
                        <p className="text-xs text-emerald-700 font-medium">{route.nameMl}</p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoute(route.id, route.name);
                      }}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                      title="Delete Route"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Vehicle</span>
                      <span className="font-medium text-gray-800">{route.vehicleRegistration}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Max Corridor Span</span>
                      <span className="font-bold text-emerald-700">{maxDist} km from campus</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Stops</span>
                      <span className="font-medium text-gray-800">{totalStops} stops</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Driver</span>
                      <span className="font-medium text-gray-800 truncate block">{route.driverName}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {routes.length === 0 && !loading && (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center space-y-3">
                <Bus className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-600">No bus routes configured yet</p>
                <button
                  onClick={() => setIsCorridorModalOpen(true)}
                  className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-xl font-semibold shadow-sm"
                >
                  Generate First Route
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Route Map and Sequential Stop Planner based on School Location */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRoute ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/90 space-y-6">
              {/* Route Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white">
                      {selectedRoute.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                      {selectedRoute.vehicleRegistration} • {selectedRoute.vehicleModel}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedRoute.name}</h2>
                  {selectedRoute.nameMl && (
                    <p className="text-sm text-emerald-700 font-medium">{selectedRoute.nameMl}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRouteForm({
                        id: selectedRoute.id,
                        name: selectedRoute.name,
                        nameMl: selectedRoute.nameMl || '',
                        code: selectedRoute.code,
                        vehicleRegistration: selectedRoute.vehicleRegistration,
                        vehicleModel: selectedRoute.vehicleModel,
                        driverName: selectedRoute.driverName,
                        driverPhone: selectedRoute.driverPhone,
                        totalCapacity: selectedRoute.totalCapacity,
                        direction: selectedRoute.direction,
                        stops: selectedRoute.stops.map((s) => ({
                          name: s.name,
                          nameMl: s.nameMl || '',
                          latitude: s.latitude,
                          longitude: s.longitude,
                          scheduledTime: s.scheduledTime,
                        })),
                      });
                      setIsNewRouteModalOpen(true);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Stops & Vehicle
                  </button>
                  <a
                    href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${selectedRoute.stops[0]?.latitude},${selectedRoute.stops[0]?.longitude};${schoolLocation.latitude},${schoolLocation.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs px-3 py-2 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View in OpenStreetMap
                  </a>
                </div>
              </div>

              {/* Driver & Capacity Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Assigned Driver</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedRoute.driverName}</span>
                  <span className="text-xs text-gray-500 block">{selectedRoute.driverPhone}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Seating Capacity</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedRoute.totalCapacity} Seats</span>
                  <span className="text-xs text-emerald-600 block font-medium">Standard Bus</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Corridor Origin</span>
                  <span className="text-sm font-semibold text-gray-800 truncate block">
                    {selectedRoute.stops[0]?.name}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {calculateDistanceKm(
                      selectedRoute.stops[0]?.latitude,
                      selectedRoute.stops[0]?.longitude,
                      schoolLocation.latitude,
                      schoolLocation.longitude
                    )}{' '}
                    km to school
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Destination Anchor</span>
                  <span className="text-sm font-semibold text-emerald-800 truncate block">
                    {schoolLocation.schoolName}
                  </span>
                  <span className="text-xs text-emerald-600 block font-medium">Reporting: {schoolLocation.morningReportingTime}</span>
                </div>
              </div>

              {/* Stops Timeline and Distance Calculation from School Campus */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center justify-between">
                  <span>Sequential Stops & Campus Proximity</span>
                  <span className="text-xs font-normal text-gray-500">
                    Distances calculated from School Campus ({schoolLocation.latitude.toFixed(3)}°, {schoolLocation.longitude.toFixed(3)}°)
                  </span>
                </h3>

                <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-200">
                  {selectedRoute.stops.map((stop, idx) => {
                    const isCampus =
                      idx === selectedRoute.stops.length - 1 ||
                      stop.name.toLowerCase().includes('campus') ||
                      stop.name.toLowerCase().includes('school');

                    const distKm = isCampus
                      ? 0
                      : stop.distanceFromSchoolKm ||
                        calculateDistanceKm(
                          stop.latitude,
                          stop.longitude,
                          schoolLocation.latitude,
                          schoolLocation.longitude
                        );

                    const estMin = isCampus
                      ? 0
                      : stop.estimatedMinutesToSchool || Math.round(distKm * 2.5);

                    return (
                      <div key={stop.id || idx} className="relative flex items-start justify-between gap-4">
                        {/* Timeline Node */}
                        <div
                          className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                            isCampus
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isCampus ? '🏫' : idx + 1}
                        </div>

                        {/* Stop Details */}
                        <div className="flex-1 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                {stop.name}
                                {isCampus && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    School Terminal
                                  </span>
                                )}
                              </h4>
                              {stop.nameMl && (
                                <p className="text-xs text-emerald-700 font-medium">{stop.nameMl}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                {stop.scheduledTime}
                              </span>

                              {!isCampus ? (
                                <span className="bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg border border-emerald-200">
                                  {distKm} km from school (~{estMin} min)
                                </span>
                              ) : (
                                <span className="bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded-lg">
                                  Campus Gate
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 text-[11px] text-gray-500 font-mono flex items-center gap-4">
                            <span>GPS: {stop.latitude.toFixed(4)}° N, {stop.longitude.toFixed(4)}° E</span>
                            {stop.studentIds && stop.studentIds.length > 0 && (
                              <span className="text-indigo-600 font-semibold flex items-center gap-1">
                                <Users className="w-3 h-3" /> {stop.studentIds.length} Assigned Students
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
              <Bus className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 font-medium">Select a route on the left to inspect its stops and distances.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Edit School Campus Location */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-600" />
                Configure School Campus Location
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Search Any School Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                Search School Location (Any Place in Kerala / India)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={campusSearchQuery}
                  onChange={(e) => handleSearchCampusLocation(e.target.value)}
                  placeholder="Type city, town, or area (e.g. Chinnakada, Kollam or Kottarakkara...)"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium pl-9"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                {isSearchingCampus && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-3" />}
              </div>
              {campusSearchResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto divide-y divide-gray-100 z-30">
                  {campusSearchResults.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectCampusSearchResult(res)}
                      className="w-full text-left p-2.5 hover:bg-emerald-50 transition-colors flex items-start gap-2 text-xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 block truncate">{res.name}</span>
                        <span className="text-[11px] text-gray-500 block truncate">{res.displayName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Quick Campus Presets (Kerala)
                </label>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setCampusDistrictFilter('ALL')}
                    className={`px-2 py-0.5 rounded-md transition-all ${campusDistrictFilter === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampusDistrictFilter('Kollam')}
                    className={`px-2 py-0.5 rounded-md transition-all ${campusDistrictFilter === 'Kollam' ? 'bg-emerald-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    🌴 Kollam
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampusDistrictFilter('Ernakulam')}
                    className={`px-2 py-0.5 rounded-md transition-all ${campusDistrictFilter === 'Ernakulam' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Kochi
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CAMPUS_PRESETS.filter((p) =>
                  campusDistrictFilter === 'ALL' ? true : p.district === campusDistrictFilter
                ).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLocForm((prev) => ({
                        ...prev,
                        city: preset.city,
                        district: preset.district,
                        latitude: preset.lat,
                        longitude: preset.lng,
                        address: preset.address,
                      }));
                    }}
                    className="text-left text-xs p-2 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="font-semibold text-gray-800 block truncate">{preset.label}</span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {preset.lat.toFixed(3)}, {preset.lng.toFixed(3)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">School Name</label>
                <input
                  type="text"
                  required
                  value={locForm.schoolName}
                  onChange={(e) => setLocForm({ ...locForm, schoolName: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Malayalam Name (സ്കൂളിന്റെ പേര്)</label>
                <input
                  type="text"
                  value={locForm.schoolNameMl || ''}
                  onChange={(e) => setLocForm({ ...locForm, schoolNameMl: e.target.value })}
                  placeholder="ക്രിപ്റ്റൺ പബ്ലിക് സ്കൂൾ"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Full Campus Address</label>
                <input
                  type="text"
                  required
                  value={locForm.address}
                  onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={locForm.latitude}
                    onChange={(e) => setLocForm({ ...locForm, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={locForm.longitude}
                    onChange={(e) => setLocForm({ ...locForm, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Morning Bell Time</label>
                  <input
                    type="text"
                    required
                    value={locForm.morningReportingTime}
                    onChange={(e) => setLocForm({ ...locForm, morningReportingTime: e.target.value })}
                    placeholder="08:15 AM"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Bus Bay Gate</label>
                  <input
                    type="text"
                    required
                    value={locForm.campusGate}
                    onChange={(e) => setLocForm({ ...locForm, campusGate: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  Save Campus Anchor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: 1-Click Auto-Corridor Generator */}
      {isCorridorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Auto-Generate Route from Popular Corridors
              </h3>
              <button
                onClick={() => setIsCorridorModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Select an established corridor around Kerala (Kollam or Kochi). The system will automatically calculate sequential stops, distance to your school campus ({schoolLocation.schoolName}), and scheduled arrival times based on your school bell timing ({schoolLocation.morningReportingTime}).
            </p>

            {/* District Filter Tabs */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Corridor Region:
              </span>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCorridorDistrictFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${corridorDistrictFilter === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  All Districts
                </button>
                <button
                  type="button"
                  onClick={() => setCorridorDistrictFilter('Kollam')}
                  className={`px-3 py-1 rounded-lg transition-all ${corridorDistrictFilter === 'Kollam' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  🌴 Kollam (4)
                </button>
                <button
                  type="button"
                  onClick={() => setCorridorDistrictFilter('Ernakulam')}
                  className={`px-3 py-1 rounded-lg transition-all ${corridorDistrictFilter === 'Ernakulam' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Kochi (4)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {POPULAR_CORRIDOR_PRESETS.filter((p) =>
                corridorDistrictFilter === 'ALL' ? true : p.district === corridorDistrictFilter
              ).map((preset) => {
                const totalStopsCount = 1 + (preset.intermediate?.length || 0);
                const distFromCampus = calculateDistanceKm(
                  preset.origin.latitude,
                  preset.origin.longitude,
                  schoolLocation.latitude,
                  schoolLocation.longitude
                );

                return (
                  <div
                    key={preset.id}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all cursor-pointer flex items-center justify-between gap-4"
                    onClick={() => handleSelectCorridor(preset)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{preset.name}</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          {totalStopsCount} Stops
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-gray-100 text-gray-600">
                          {preset.district}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 font-medium">{preset.nameMl}</p>
                      <p className="text-[11px] text-gray-500">
                        Origin: {preset.origin.name} • {distFromCampus} km to campus
                      </p>
                    </div>

                    <button
                      type="button"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold shadow-sm flex items-center gap-1.5 flex-shrink-0"
                    >
                      Generate <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsCorridorModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Custom Route Builder */}
      {isNewRouteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Bus className="w-5 h-5 text-indigo-600" />
                {routeForm.id ? 'Edit Bus Route' : 'Create Custom Bus Route'}
              </h3>
              <button
                onClick={() => setIsNewRouteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Route Name</label>
                  <input
                    type="text"
                    required
                    value={routeForm.name}
                    onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                    placeholder="Route 3: Aluva Express"
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Malayalam Name (റൂട്ടിന്റെ പേര്)</label>
                  <input
                    type="text"
                    value={routeForm.nameMl}
                    onChange={(e) => setRouteForm({ ...routeForm, nameMl: e.target.value })}
                    placeholder="റൂട്ട് 3: ആലുവ എക്സ്പ്രസ്സ്"
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Bus Code</label>
                  <input
                    type="text"
                    required
                    value={routeForm.code}
                    onChange={(e) => setRouteForm({ ...routeForm, code: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Registration (KL)</label>
                  <input
                    type="text"
                    required
                    value={routeForm.vehicleRegistration}
                    onChange={(e) => setRouteForm({ ...routeForm, vehicleRegistration: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={routeForm.driverName}
                    onChange={(e) => setRouteForm({ ...routeForm, driverName: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Driver Phone</label>
                  <input
                    type="text"
                    required
                    value={routeForm.driverPhone}
                    onChange={(e) => setRouteForm({ ...routeForm, driverPhone: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 font-mono"
                  />
                </div>
              </div>

              {/* Stops Builder */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Sequential Stops (Destination: {schoolLocation.schoolName})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStopToForm}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Manual Stop Entry
                  </button>
                </div>

                {/* Search & Add Nearby Places to this Route */}
                <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 p-4 rounded-2xl border border-indigo-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-indigo-600" /> Search & Add Any Nearby Place / Stop
                    </span>
                    <span className="text-[10px] text-indigo-700 font-semibold bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                      School: {schoolLocation.city || 'Campus'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={placeQuery}
                      onChange={(e) => handleSearchNearbyPlaces(e.target.value)}
                      placeholder={`Search any junction or area near ${schoolLocation.schoolName} (e.g. Kavanad, Chinnakada, Kundara, Hospital Mukku...)`}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-9 font-medium shadow-sm"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    {isSearchingPlaces && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin absolute right-3 top-3" />}
                  </div>

                  {/* Search Results Dropdown */}
                  {placeResults.length > 0 && (
                    <div className="bg-white border border-indigo-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100 z-20">
                      {placeResults.map((place, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 hover:bg-indigo-50 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 truncate">{place.name}</span>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                {place.distanceFromSchoolKm} km from school (~{place.estimatedMinutes} min)
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate">{place.displayName}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddFoundPlaceToRoute(place)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 flex-shrink-0"
                          >
                            <Plus className="w-3 h-3" /> Add Stop
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Nearby Stops Quick-Pills */}
                  {suggestedStops.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-indigo-900 block">
                        Popular Nearby Transit Points around {schoolLocation.city || 'Campus'}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedStops.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAddFoundPlaceToRoute(s)}
                            className="bg-white hover:bg-indigo-100 text-indigo-800 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <span>{s.name}</span>
                            <span className="text-[9px] text-emerald-700 font-mono">({s.distanceFromSchoolKm} km)</span>
                            <Plus className="w-3 h-3 text-indigo-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {routeForm.stops.map((stop, idx) => {
                    const distKm = calculateDistanceKm(
                      stop.latitude,
                      stop.longitude,
                      schoolLocation.latitude,
                      schoolLocation.longitude
                    );

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-indigo-700">Stop #{idx + 1}</span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            {distKm} km from school
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveStop(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStop(idx, 'down')}
                              disabled={idx === routeForm.stops.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStopFromForm(idx)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Stop Name (English)"
                            value={stop.name}
                            onChange={(e) => {
                              const copy = [...routeForm.stops];
                              copy[idx].name = e.target.value;
                              setRouteForm({ ...routeForm, stops: copy });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-300 font-medium text-xs"
                          />
                          <input
                            type="text"
                            placeholder="മലയാളം പേര്"
                            value={stop.nameMl}
                            onChange={(e) => {
                              const copy = [...routeForm.stops];
                              copy[idx].nameMl = e.target.value;
                              setRouteForm({ ...routeForm, stops: copy });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-300 font-medium text-xs"
                          />
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Latitude"
                            value={stop.latitude}
                            onChange={(e) => {
                              const copy = [...routeForm.stops];
                              copy[idx].latitude = parseFloat(e.target.value) || 0;
                              setRouteForm({ ...routeForm, stops: copy });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-300 font-mono text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Time (07:30 AM)"
                            value={stop.scheduledTime}
                            onChange={(e) => {
                              const copy = [...routeForm.stops];
                              copy[idx].scheduledTime = e.target.value;
                              setRouteForm({ ...routeForm, stops: copy });
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-300 font-mono text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏫</span>
                    <div>
                      <span className="font-bold text-emerald-900 block">
                        Final Stop: {schoolLocation.schoolName} (Campus Gate)
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        Arrival: {schoolLocation.morningReportingTime} • GPS: {schoolLocation.latitude.toFixed(3)}°, {schoolLocation.longitude.toFixed(3)}°
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white">
                    Auto-Anchored
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewRouteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  Save & Land Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

