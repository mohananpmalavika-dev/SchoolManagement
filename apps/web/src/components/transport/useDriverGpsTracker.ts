'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { messageFor } from '@/lib/workspace';

export type WakeLockState = 'idle' | 'active' | 'unsupported' | 'unavailable';

interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
}

export interface DriverGpsStatus {
  active: boolean;
  wakeLock: WakeLockState;
  backgroundPaused: boolean;
  retrying: boolean;
  lastSentAt: number | null;
  lastAccuracy: number | null;
}

export function useDriverGpsTracker(options: {
  enabled: boolean;
  tripId?: string;
  onDisable: () => void;
  onError: (message: string) => void;
  onPingSuccess?: () => void;
}): DriverGpsStatus {
  const { enabled, tripId, onDisable, onError, onPingSuccess } = options;

  const [wakeLock, setWakeLock] = useState<WakeLockState>('idle');
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);
  const lastPostAtRef = useRef<number>(0);
  const pendingPayloadRef = useRef<LocationPayload | null>(null);
  const inFlightRef = useRef<boolean>(false);

  const onDisableRef = useRef(onDisable);
  const onErrorRef = useRef(onError);
  const onPingSuccessRef = useRef(onPingSuccess);
  useEffect(() => {
    onDisableRef.current = onDisable;
    onErrorRef.current = onError;
    onPingSuccessRef.current = onPingSuccess;
  }, [onDisable, onError, onPingSuccess]);

  const postFix = useCallback(
    async (payload: LocationPayload, force = false) => {
      if (!tripId) return;
      const now = Date.now();
      if (!force && now - lastPostAtRef.current < 3000) {
        pendingPayloadRef.current = payload;
        return;
      }
      if (inFlightRef.current) {
        pendingPayloadRef.current = payload;
        return;
      }

      inFlightRef.current = true;
      lastPostAtRef.current = now;
      pendingPayloadRef.current = null;

      try {
        await apiClient.post(`/operations-transport/trips/${tripId}/location`, {
          data: payload,
        });
        setLastSentAt(Date.now());
        setLastAccuracy(payload.accuracy);
        setRetrying(false);
        onErrorRef.current('');
        onPingSuccessRef.current?.();
      } catch (err) {
        // Keep the latest coordinate queued for retry on transient network drops
        pendingPayloadRef.current = payload;
        setRetrying(true);
        onErrorRef.current(messageFor(err));
      } finally {
        inFlightRef.current = false;
      }
    },
    [tripId],
  );

  const handlePosition = useCallback(
    (position: GeolocationPosition, force = false) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      if (accuracy > 1000) {
        onErrorRef.current('GPS accuracy is too low (>1000 m). Move to an area with a clearer sky signal.');
        return;
      }
      const payload: LocationPayload = {
        latitude,
        longitude,
        accuracy,
        speed: Math.min(100, Math.max(0, (speed || 0) * 3.6)),
        heading: Math.min(360, Math.max(0, heading || 0)),
      };
      void postFix(payload, force);
    },
    [postFix],
  );

  useEffect(() => {
    if (!enabled || !tripId) {
      setWakeLock('idle');
      setBackgroundPaused(false);
      setRetrying(false);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onErrorRef.current('This browser cannot share GPS location.');
      onDisableRef.current();
      return;
    }

    let cancelled = false;

    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator) || typeof navigator.wakeLock?.request !== 'function') {
        if (!cancelled) setWakeLock('unsupported');
        return;
      }
      if (document.visibilityState !== 'visible') return;
      try {
        if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
          if (!cancelled) setWakeLock('active');
          return;
        }
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await sentinel.release().catch(() => undefined);
          return;
        }
        wakeLockSentinelRef.current = sentinel;
        setWakeLock('active');
        sentinel.addEventListener?.('release', () => {
          if (!cancelled) {
            setWakeLock(document.visibilityState === 'hidden' ? 'idle' : 'unavailable');
          }
        });
      } catch {
        if (!cancelled) setWakeLock('unavailable');
      }
    };

    const releaseWakeLock = async () => {
      const sentinel = wakeLockSentinelRef.current;
      wakeLockSentinelRef.current = null;
      if (sentinel && !sentinel.released) {
        await sentinel.release().catch(() => undefined);
      }
    };

    const requestImmediateFix = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) handlePosition(pos, true);
        },
        () => {
          // watchPosition already surfaces fatal geolocation errors
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
    };

    const startWatch = () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!cancelled) handlePosition(pos, false);
        },
        (err) => {
          if (cancelled) return;
          if (err.code === err.PERMISSION_DENIED) {
            onErrorRef.current('Location permission was denied. Enable GPS access in browser settings.');
            onDisableRef.current();
            return;
          }
          onErrorRef.current(err.message || 'Temporary GPS signal interruption. Retrying...');
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
    };

    setBackgroundPaused(document.visibilityState === 'hidden');
    void requestWakeLock();
    startWatch();
    requestImmediateFix();

    // Heartbeat keeps parent feed fresh even when bus is stopped at a signal/stop,
    // and flushes any buffered location fix after a brief cellular drop.
    const heartbeat = window.setInterval(() => {
      if (cancelled || document.visibilityState === 'hidden') return;
      if (pendingPayloadRef.current) {
        void postFix(pendingPayloadRef.current, true);
        return;
      }
      if (Date.now() - lastPostAtRef.current >= 15_000) {
        requestImmediateFix();
      }
    }, 15_000);

    const handleVisibilityChange = () => {
      if (cancelled) return;
      if (document.visibilityState === 'hidden') {
        setBackgroundPaused(true);
      } else {
        setBackgroundPaused(false);
        void requestWakeLock();
        startWatch();
        requestImmediateFix();
      }
    };

    const handleOnline = () => {
      if (cancelled) return;
      if (pendingPayloadRef.current) {
        void postFix(pendingPayloadRef.current, true);
      } else {
        requestImmediateFix();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      pendingPayloadRef.current = null;
      void releaseWakeLock();
    };
  }, [enabled, tripId, handlePosition, postFix]);

  return {
    active: enabled && Boolean(tripId),
    wakeLock,
    backgroundPaused,
    retrying,
    lastSentAt,
    lastAccuracy,
  };
}
