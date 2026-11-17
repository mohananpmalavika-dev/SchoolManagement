'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  registerServiceWorker,
  isPWA,
  isOnline,
  isIOSDevice,
  isAndroidDevice,
  addConnectionListeners,
  BeforeInstallPromptEvent,
} from '@/lib/pwa';

// Cache event at module level so it is not lost before React hydration
let moduleDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    moduleDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('krypton-pwa-ready'));
  });
}

export interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  showInstallPrompt: () => Promise<'accepted' | 'dismissed' | 'manual-ios' | 'unavailable'>;
  updateAvailable: boolean;
}

export function usePWA(): PWAState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(moduleDeferredPrompt);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const installed = isPWA();
    const ios = isIOSDevice();
    const android = isAndroidDevice();

    setIsInstalled(installed);
    setOnline(isOnline());
    setIsIOS(ios);
    setIsAndroid(android);

    if (moduleDeferredPrompt) {
      setInstallPrompt(moduleDeferredPrompt);
      setCanInstall(!installed);
    } else if (ios && !installed) {
      // iOS doesn't fire beforeinstallprompt, but users can add to home screen manually
      setCanInstall(true);
    }

    // Register service worker
    registerServiceWorker().then((registration) => {
      if (registration) {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      }
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      moduleDeferredPrompt = promptEvent;
      setInstallPrompt(promptEvent);
      setCanInstall(true);
    };

    const handlePWAReady = () => {
      if (moduleDeferredPrompt) {
        setInstallPrompt(moduleDeferredPrompt);
        setCanInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('krypton-pwa-ready', handlePWAReady);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
      moduleDeferredPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    const removeConnectionListeners = addConnectionListeners(
      () => setOnline(true),
      () => setOnline(false)
    );

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('krypton-pwa-ready', handlePWAReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      removeConnectionListeners();
    };
  }, []);

  const showInstallPrompt = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual-ios' | 'unavailable'> => {
    if (isIOS) {
      return 'manual-ios';
    }

    const activePrompt = installPrompt || moduleDeferredPrompt;
    if (!activePrompt) {
      return 'unavailable';
    }

    try {
      await activePrompt.prompt();
      const { outcome } = await activePrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        setInstallPrompt(null);
        moduleDeferredPrompt = null;
        return 'accepted';
      } else {
        return 'dismissed';
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      return 'unavailable';
    }
  }, [installPrompt, isIOS]);

  const platform: 'ios' | 'android' | 'desktop' | 'unknown' = isIOS
    ? 'ios'
    : isAndroid
    ? 'android'
    : typeof window !== 'undefined'
    ? 'desktop'
    : 'unknown';

  return {
    isInstalled,
    isOnline: online,
    canInstall,
    isIOS,
    isAndroid,
    platform,
    showInstallPrompt,
    updateAvailable,
  };
}
