'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bus, MapPin, Navigation, Compass, School, CheckCircle2, Clock } from 'lucide-react';
import { TransportTrip, TransportStop } from '@krypton/types';

interface LiveBusMapProps {
  trip: TransportTrip;
  stops: TransportStop[];
  childStopId?: string;
  height?: string;
  interactive?: boolean;
  showStopsList?: boolean;
}

export function LiveBusMap({
  trip,
  stops,
  childStopId,
  height = '420px',
  interactive = true,
  showStopsList = false,
}: LiveBusMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [pulse, setPulse] = useState(true);

  // Pulse animation effect
  useEffect(() => {
    const timer = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(timer);
  }, []);

  // Compute map bounding box to project GPS (lat, lng) to SVG (x, y) coordinates
  const bounds = useMemo(() => {
    const allLats = stops.map((s) => s.latitude).concat(trip.currentLocation.latitude);
    const allLngs = stops.map((s) => s.longitude).concat(trip.currentLocation.longitude);

    const minLat = Math.min(...allLats) - 0.005;
    const maxLat = Math.max(...allLats) + 0.005;
    const minLng = Math.min(...allLngs) - 0.005;
    const maxLng = Math.max(...allLngs) + 0.005;

    return { minLat, maxLat, minLng, maxLng };
  }, [stops, trip.currentLocation.latitude, trip.currentLocation.longitude]);

  // Project lat/lng to 0-1000 SVG coordinate system
  const project = (lat: number, lng: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 0.01;
    const lngSpan = bounds.maxLng - bounds.minLng || 0.01;

    // Invert lat because higher lat is North (top)
    const y = 80 + (1 - (lat - bounds.minLat) / latSpan) * 640;
    const x = 90 + ((lng - bounds.minLng) / lngSpan) * 780;

    return { x, y };
  };

  const busPos = project(trip.currentLocation.latitude, trip.currentLocation.longitude);

  const stopPositions = useMemo(() => {
    return stops.map((stop) => ({
      ...stop,
      pos: project(stop.latitude, stop.longitude),
      isChildStop: stop.id === childStopId,
    }));
  }, [stops, childStopId, bounds]);

  // Build SVG path data for route connecting stops
  const routePathD = useMemo(() => {
    if (stopPositions.length === 0) return '';
    return stopPositions.reduce((acc, curr, index) => {
      return index === 0 ? `M ${curr.pos.x} ${curr.pos.y}` : `${acc} L ${curr.pos.x} ${curr.pos.y}`;
    }, '');
  }, [stopPositions]);

  // Center on Bus
  const handleCenterBus = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1.1);
  };

  // Center on Child Stop
  const handleCenterChildStop = () => {
    const target = stopPositions.find((s) => s.isChildStop);
    if (target) {
      setPan({ x: (480 - target.pos.x) * 0.3, y: (400 - target.pos.y) * 0.3 });
      setZoom(1.3);
    }
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-gray-200 bg-slate-950 shadow-inner select-none"
      style={{ height }}
    >
      {/* Top Map HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-emerald-300 tracking-wide">
            LIVE GPS BEACON
          </span>
          <span className="text-slate-500 text-xs">|</span>
          <span className="text-xs text-slate-300 font-mono">
            {trip.vehicleRegistration} • {trip.currentLocation.speed} km/h
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {childStopId && (
            <button
              onClick={handleCenterChildStop}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-slate-950 transition shadow-md flex items-center gap-1.5"
              title="Focus on Child's Stop"
            >
              <MapPin size={13} className="text-slate-950" />
              <span>Child&apos;s Stop</span>
            </button>
          )}

          <button
            onClick={handleCenterBus}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white transition shadow-md flex items-center gap-1.5"
            title="Focus on Bus"
          >
            <Bus size={13} />
            <span>Recenter Bus</span>
          </button>

          <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/60 overflow-hidden shadow">
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-bold"
            >
              +
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-bold border-l border-slate-700/50"
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <svg
        viewBox="0 0 960 800"
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onMouseDown={(e) => {
          if (!interactive) return;
          setIsDragging(true);
          dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <defs>
          {/* Street grid patterns */}
          <pattern id="street-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(51, 65, 85, 0.25)"
              strokeWidth="1"
            />
          </pattern>

          {/* Route Line Gradient */}
          <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="bus-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="pin-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Map Background with Road Grid */}
        <rect width="960" height="800" fill="#090d16" />
        <rect width="960" height="800" fill="url(#street-grid)" />

        {/* Major District Highway Visual Arteries */}
        <path
          d="M 20 280 C 260 270, 480 340, 940 310"
          stroke="rgba(71, 85, 105, 0.35)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 280 20 C 310 320, 390 560, 420 780"
          stroke="rgba(71, 85, 105, 0.35)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 700 40 C 680 290, 720 540, 760 770"
          stroke="rgba(71, 85, 105, 0.35)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />

        {/* Park & Campus Zones */}
        <rect
          x="720"
          y="180"
          width="180"
          height="140"
          rx="18"
          fill="rgba(16, 185, 129, 0.08)"
          stroke="rgba(16, 185, 129, 0.25)"
          strokeDasharray="4 4"
        />
        <text x="810" y="255" fill="#34d399" fontSize="12" textAnchor="middle" fontWeight="bold">
          ★ SCHOOL CAMPUS ZONE
        </text>

        <rect
          x="60"
          y="480"
          width="200"
          height="130"
          rx="18"
          fill="rgba(56, 189, 248, 0.06)"
          stroke="rgba(56, 189, 248, 0.2)"
          strokeDasharray="4 4"
        />
        <text x="160" y="550" fill="#38bdf8" fontSize="11" textAnchor="middle" opacity="0.8">
          Green Valley Residential Zone
        </text>

        {/* Route Path (Underlay Glow) */}
        <path
          d={routePathD}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="10"
          strokeOpacity="0.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Route Path (Active Line) */}
        <path
          d={routePathD}
          fill="none"
          stroke="url(#route-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 4"
        />

        {/* Stop Markers */}
        {stopPositions.map((stop, idx) => {
          const isDestination = idx === stopPositions.length - 1;
          const isChild = stop.isChildStop;

          return (
            <g key={stop.id} className="cursor-pointer group">
              {/* Child Stop Highlight Halo */}
              {isChild && (
                <circle
                  cx={stop.pos.x}
                  cy={stop.pos.y}
                  r="28"
                  fill="rgba(245, 158, 11, 0.2)"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  className="animate-spin"
                  style={{ transformOrigin: `${stop.pos.x}px ${stop.pos.y}px` }}
                />
              )}

              {/* Stop Marker Node */}
              <circle
                cx={stop.pos.x}
                cy={stop.pos.y}
                r={isDestination ? 14 : isChild ? 12 : 9}
                fill={isDestination ? '#10b981' : isChild ? '#f59e0b' : '#1e293b'}
                stroke={isDestination ? '#34d399' : isChild ? '#fbbf24' : '#64748b'}
                strokeWidth={isChild || isDestination ? 3 : 2}
                filter={isChild ? 'url(#pin-glow)' : undefined}
              />

              {/* Stop Sequence Number / Icon */}
              <text
                x={stop.pos.x}
                y={stop.pos.y + 4}
                fill={isDestination || isChild ? '#0f172a' : '#f1f5f9'}
                fontSize={isChild ? '11' : '10'}
                fontWeight="bold"
                textAnchor="middle"
              >
                {isDestination ? '🏫' : isChild ? '★' : stop.sequence}
              </text>

              {/* Stop Label Banner */}
              <g transform={`translate(${stop.pos.x}, ${stop.pos.y + 24})`}>
                <rect
                  x="-90"
                  y="-12"
                  width="180"
                  height={isChild ? '34' : '24'}
                  rx="6"
                  fill={isChild ? '#78350f' : 'rgba(15, 23, 42, 0.88)'}
                  stroke={isChild ? '#f59e0b' : 'rgba(71, 85, 105, 0.5)'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y={isChild ? '2' : '3'}
                  fill={isChild ? '#fef3c7' : '#e2e8f0'}
                  fontSize={isChild ? '11' : '10'}
                  fontWeight={isChild ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {stop.name}
                </text>
                {isChild && (
                  <text x="0" y="16" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle">
                    📍 YOUR CHILD&apos;S STOP ({stop.scheduledTime})
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {/* Live School Bus Marker */}
        <g
          transform={`translate(${busPos.x}, ${busPos.y})`}
          className="transition-transform duration-1000 ease-linear"
        >
          {/* Radar Beacon Pulse Wave */}
          <circle
            cx="0"
            cy="0"
            r={pulse ? 42 : 28}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            opacity={pulse ? 0.15 : 0.4}
            className="transition-all duration-1000 ease-out"
          />
          <circle
            cx="0"
            cy="0"
            r={pulse ? 26 : 18}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Yellow Bus Outer Badge */}
          <circle
            cx="0"
            cy="0"
            r="20"
            fill="#eab308"
            stroke="#fef08a"
            strokeWidth="3"
            filter="url(#bus-glow)"
          />

          {/* Directional Heading Needle */}
          <g transform={`rotate(${trip.currentLocation.heading || 0})`}>
            <polygon points="0,-27 -5,-21 5,-21" fill="#38bdf8" />
          </g>

          {/* Bus Icon */}
          <g transform="translate(-10, -10)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <path d="M8 6v6" />
              <path d="M15 6v6" />
              <path d="M2 12h19.6" />
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-4.2C20.1 7.6 19.2 7 18.2 7H4.8c-1 0-1.9.6-2.2 1.6l-1.4 4.2c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
          </g>

          {/* Bus Badge Callout */}
          <g transform="translate(0, -32)">
            <rect
              x="-48"
              y="-12"
              width="96"
              height="20"
              rx="10"
              fill="#0f172a"
              stroke="#eab308"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="2"
              fill="#fef08a"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              className="tracking-tight"
            >
              🚌 {trip.vehicleRegistration}
            </text>
          </g>
        </g>
      </svg>

      {/* Bottom Map Status Strip */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs text-slate-300 shadow-md flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1.5 text-blue-400 font-medium">
            <Compass size={13} />
            <span>Heading {trip.currentLocation.heading}°</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <Clock size={13} />
            <span>GPS Ping Active</span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {trip.currentLocation.latitude.toFixed(4)}, {trip.currentLocation.longitude.toFixed(4)}
          </span>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/50 text-[11px] text-slate-400 pointer-events-auto hidden sm:block">
          Scroll to zoom • Drag to pan
        </div>
      </div>
    </div>
  );
}
