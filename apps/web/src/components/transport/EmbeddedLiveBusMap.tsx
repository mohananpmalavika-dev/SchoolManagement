'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bus, Crosshair, ExternalLink, MapPin, Maximize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export interface MapStop {
  id: string;
  name: string;
  sequence: number;
  latitude: number | null;
  longitude: number | null;
  scheduledTime?: string | null;
}

export interface EmbeddedLiveBusMapProps {
  busLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
    lastPingAt?: string | null;
  };
  stale: boolean;
  vehicleLabel?: string | null;
  stops?: MapStop[];
  highlightStopId?: string | null;
  routeGeometry?: [number, number][] | null;
  etaRouteGeometry?: [number, number][] | null;
  etaSummary?: {
    estimatedMinutes: number | null;
    distanceKm: number | null;
    source?: 'ROAD_ROUTE' | 'STRAIGHT_LINE' | 'UNAVAILABLE';
  } | null;
  height?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createBusMarkerHtml(heading: number | null | undefined, stale: boolean, label?: string | null): string {
  const safeLabel = label ? escapeHtml(label) : 'School Bus';
  const rotation = typeof heading === 'number' && Number.isFinite(heading) ? Math.round(heading) : null;
  const ringColor = stale ? '#d97706' : '#10b981';
  const pulseStyle = stale
    ? 'opacity:0.25;'
    : 'animation:kryptonBusPulse 1.8s ease-out infinite;';

  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
      <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;inset:-4px;border-radius:9999px;background:${ringColor};${pulseStyle}"></span>
        ${
          rotation !== null
            ? `<div style="position:absolute;inset:-8px;transform:rotate(${rotation}deg);display:flex;justify-content:center;pointer-events:none;">
                <span style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #1d4ed8;"></span>
              </div>`
            : ''
        }
        <div style="position:relative;width:36px;height:36px;border-radius:9999px;background:#eab308;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;color:#0f172a;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-4.2C20.1 7.6 19.2 7 18.2 7H4.8c-1 0-1.9.6-2.2 1.6l-1.4 4.2c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/>
            <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
          </svg>
        </div>
      </div>
      <div style="margin-top:3px;padding:2px 7px;border-radius:9999px;background:#0f172a;color:#fef08a;font-size:10px;font-weight:700;white-space:nowrap;border:1px solid rgba(234,179,8,0.65);box-shadow:0 2px 6px rgba(15,23,42,0.28);">
        ${safeLabel}
      </div>
    </div>
  `;
}

function createStopMarkerHtml(sequence: number, isChildStop: boolean): string {
  if (isChildStop) {
    return `
      <div style="width:28px;height:28px;border-radius:9999px;background:#f59e0b;border:3px solid #ffffff;color:#0f172a;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(245,158,11,0.55);transform:translate(-50%,-50%);">
        ★
      </div>
    `;
  }
  return `
    <div style="width:22px;height:22px;border-radius:9999px;background:#1e3a8a;border:2px solid #ffffff;color:#ffffff;font-weight:700;font-size:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(15,23,42,0.35);transform:translate(-50%,-50%);">
      ${sequence}
    </div>
  `;
}

export function EmbeddedLiveBusMap({
  busLocation,
  stale,
  vehicleLabel,
  stops = [],
  highlightStopId,
  routeGeometry,
  etaRouteGeometry,
  etaSummary,
  height = '380px',
}: EmbeddedLiveBusMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const busMarkerRef = useRef<import('leaflet').Marker | null>(null);
  const accuracyCircleRef = useRef<import('leaflet').Circle | null>(null);
  const stopsLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const routeLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const lastPositionRef = useRef<[number, number] | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const hasFitInitialBoundsRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [followBus, setFollowBus] = useState(true);

  const validStops = useMemo(
    () =>
      stops.filter(
        (s): s is MapStop & { latitude: number; longitude: number } =>
          typeof s.latitude === 'number' &&
          Number.isFinite(s.latitude) &&
          typeof s.longitude === 'number' &&
          Number.isFinite(s.longitude),
      ),
    [stops],
  );

  const highlightedStop = useMemo(
    () => validStops.find((s) => s.id === highlightStopId) || null,
    [validStops, highlightStopId],
  );

  // Initialize Leaflet map once on client
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import('leaflet');
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        center: [busLocation.latitude, busLocation.longitude],
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      routeLayerRef.current = L.layerGroup().addTo(map);
      stopsLayerRef.current = L.layerGroup().addTo(map);

      map.on('dragstart', () => {
        setFollowBus(false);
      });

      mapRef.current = map;
      setReady(true);
    }

    void init();

    return () => {
      cancelled = true;
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      busMarkerRef.current = null;
      accuracyCircleRef.current = null;
      stopsLayerRef.current = null;
      routeLayerRef.current = null;
      lastPositionRef.current = null;
      hasFitInitialBoundsRef.current = false;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render route polylines & stop pins
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    const stopsLayer = stopsLayerRef.current;
    if (!ready || !L || !map || !routeLayer || !stopsLayer) return;

    routeLayer.clearLayers();
    stopsLayer.clearLayers();

    if (routeGeometry && routeGeometry.length >= 2) {
      L.polyline(routeGeometry, {
        color: '#64748b',
        weight: 4,
        opacity: 0.55,
      }).addTo(routeLayer);
    } else if (validStops.length >= 2) {
      L.polyline(
        validStops.map((s) => [s.latitude, s.longitude] as [number, number]),
        {
          color: '#64748b',
          weight: 3,
          opacity: 0.45,
          dashArray: '6 6',
        },
      ).addTo(routeLayer);
    }

    if (etaRouteGeometry && etaRouteGeometry.length >= 2) {
      L.polyline(etaRouteGeometry, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.88,
      }).addTo(routeLayer);
    }

    for (const stop of validStops) {
      const isChild = stop.id === highlightStopId;
      const icon = L.divIcon({
        className: 'krypton-stop-pin',
        html: createStopMarkerHtml(stop.sequence, isChild),
        iconSize: [0, 0],
      });
      const marker = L.marker([stop.latitude, stop.longitude], {
        icon,
        zIndexOffset: isChild ? 500 : 100,
      }).addTo(stopsLayer);

      const safeName = escapeHtml(stop.name);
      const safeTime = stop.scheduledTime ? ` · Scheduled ${escapeHtml(stop.scheduledTime)}` : '';
      marker.bindPopup(
        `<div style="font-size:12px;line-height:1.4;"><strong>${
          isChild ? '★ Your child’s stop: ' : `Stop ${stop.sequence}: `
        }${safeName}</strong>${safeTime}</div>`,
      );
      if (isChild) {
        marker.bindTooltip(`${stop.name} (Child’s stop)`, {
          direction: 'top',
          offset: [0, -14],
        });
      }
    }
  }, [ready, validStops, highlightStopId, routeGeometry, etaRouteGeometry]);

  // Smoothly update bus marker, heading, accuracy circle, and camera
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    const targetLat = busLocation.latitude;
    const targetLng = busLocation.longitude;

    const busIcon = L.divIcon({
      className: 'krypton-bus-pin',
      html: createBusMarkerHtml(busLocation.heading, stale, vehicleLabel),
      iconSize: [0, 0],
    });

    if (!busMarkerRef.current) {
      busMarkerRef.current = L.marker([targetLat, targetLng], {
        icon: busIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      lastPositionRef.current = [targetLat, targetLng];
    } else {
      busMarkerRef.current.setIcon(busIcon);
      const start = lastPositionRef.current || [targetLat, targetLng];
      const deltaLat = targetLat - start[0];
      const deltaLng = targetLng - start[1];

      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
      }

      if (Math.abs(deltaLat) > 0.000005 || Math.abs(deltaLng) > 0.000005) {
        const startTime = performance.now();
        const duration = 900;
        const step = (now: number) => {
          const t = Math.min(1, (now - startTime) / duration);
          const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
          const nextLat = start[0] + deltaLat * eased;
          const nextLng = start[1] + deltaLng * eased;
          busMarkerRef.current?.setLatLng([nextLat, nextLng]);
          accuracyCircleRef.current?.setLatLng([nextLat, nextLng]);
          lastPositionRef.current = [nextLat, nextLng];
          if (t < 1) {
            animFrameRef.current = requestAnimationFrame(step);
          } else {
            animFrameRef.current = null;
          }
        };
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        busMarkerRef.current.setLatLng([targetLat, targetLng]);
        lastPositionRef.current = [targetLat, targetLng];
      }
    }

    const radius =
      typeof busLocation.accuracy === 'number' && Number.isFinite(busLocation.accuracy)
        ? Math.min(Math.max(busLocation.accuracy, 8), 500)
        : 0;

    if (radius > 0) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle([targetLat, targetLng], {
          radius,
          color: '#2563eb',
          weight: 1,
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
        }).addTo(map);
      } else {
        accuracyCircleRef.current.setRadius(radius);
        if (animFrameRef.current == null) {
          accuracyCircleRef.current.setLatLng([targetLat, targetLng]);
        }
      }
    } else if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }

    if (!hasFitInitialBoundsRef.current) {
      hasFitInitialBoundsRef.current = true;
      const points: [number, number][] = [[targetLat, targetLng]];
      if (highlightedStop) {
        points.push([highlightedStop.latitude, highlightedStop.longitude]);
      } else {
        for (const stop of validStops) points.push([stop.latitude, stop.longitude]);
      }
      if (points.length >= 2) {
        map.fitBounds(L.latLngBounds(points), { padding: [44, 44], maxZoom: 16 });
      } else {
        map.setView([targetLat, targetLng], 15);
      }
    } else if (followBus) {
      map.panTo([targetLat, targetLng], { animate: true, duration: 0.6 });
    }
  }, [
    ready,
    busLocation.latitude,
    busLocation.longitude,
    busLocation.accuracy,
    busLocation.heading,
    stale,
    vehicleLabel,
    followBus,
    highlightedStop,
    validStops,
  ]);

  function handleRecenterBus() {
    setFollowBus(true);
    mapRef.current?.setView([busLocation.latitude, busLocation.longitude], 16, { animate: true });
  }

  function handleFocusChildStop() {
    if (!highlightedStop || !mapRef.current) return;
    setFollowBus(false);
    mapRef.current.setView([highlightedStop.latitude, highlightedStop.longitude], 16, { animate: true });
  }

  function handleFitRoute() {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    setFollowBus(false);
    const points: [number, number][] = [[busLocation.latitude, busLocation.longitude]];
    for (const stop of validStops) points.push([stop.latitude, stop.longitude]);
    if (etaRouteGeometry) {
      for (const p of etaRouteGeometry) points.push(p);
    }
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [42, 42], maxZoom: 16 });
    } else {
      map.setView([busLocation.latitude, busLocation.longitude], 15, { animate: true });
    }
  }

  const osmUrl = `https://www.openstreetmap.org/?mlat=${busLocation.latitude}&mlon=${busLocation.longitude}#map=16/${busLocation.latitude}/${busLocation.longitude}`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
      <style>{`
        @keyframes kryptonBusPulse {
          0% { transform: scale(0.9); opacity: 0.55; }
          100% { transform: scale(1.75); opacity: 0; }
        }
        .krypton-bus-pin, .krypton-stop-pin { background: transparent; border: 0; }
      `}</style>

      {/* Top HUD Overlay */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-[400] flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-lg border border-slate-200/90 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm backdrop-blur">
          <span className="relative flex h-2.5 w-2.5">
            {!stale && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                stale ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className={stale ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>
            {stale ? 'Signal Delayed' : 'Live Bus Map'}
          </span>
          {vehicleLabel && (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-slate-700">{vehicleLabel}</span>
            </>
          )}
          {typeof busLocation.speed === 'number' && Number.isFinite(busLocation.speed) && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600">{Math.round(busLocation.speed)} km/h</span>
            </>
          )}
          {!stale && etaSummary?.estimatedMinutes != null && (
            <>
              <span className="text-slate-300">·</span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700">
                {etaSummary.estimatedMinutes === 0 ? 'Arriving now' : `${etaSummary.estimatedMinutes} min`}
                {etaSummary.distanceKm != null ? ` · ${etaSummary.distanceKm} km` : ''}
                {etaSummary.source === 'ROAD_ROUTE' ? ' (road)' : ''}
              </span>
            </>
          )}
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleRecenterBus}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
              followBus
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50'
            }`}
            title="Center and follow the bus"
          >
            <Bus size={13} />
            <span>{followBus ? 'Following' : 'Follow bus'}</span>
          </button>

          {highlightedStop && (
            <button
              type="button"
              onClick={handleFocusChildStop}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50/95 px-2.5 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100"
              title="Center on your child’s stop"
            >
              <MapPin size={13} />
              <span>Child’s stop</span>
            </button>
          )}

          {validStops.length > 0 && (
            <button
              type="button"
              onClick={handleFitRoute}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              title="Fit full route on screen"
            >
              <Maximize2 size={13} />
              <span>Fit route</span>
            </button>
          )}

          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            title="Open location in OpenStreetMap"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Open OSM</span>
          </a>
        </div>
      </div>

      {/* Leaflet Canvas */}
      <div
        ref={containerRef}
        role="region"
        aria-label="Live school bus map"
        style={{ height, width: '100%' }}
      />

      {/* Bottom Coordinates & Accuracy Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700">
            <Crosshair size={12} className="text-blue-600" />
            {busLocation.latitude.toFixed(5)}, {busLocation.longitude.toFixed(5)}
          </span>
          <span className="text-slate-300">·</span>
          <span>
            Accuracy: {busLocation.accuracy != null ? `${Math.round(busLocation.accuracy)} m` : 'not provided'}
          </span>
          {busLocation.lastPingAt && (
            <>
              <span className="text-slate-300">·</span>
              <span>Last update: {new Date(busLocation.lastPingAt).toLocaleTimeString()}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {etaRouteGeometry && etaRouteGeometry.length >= 2 && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-4 rounded-full bg-blue-600" />
              Active road route
            </span>
          )}
          {highlightedStop && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              Child’s stop
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
