'use client';

import { useEffect, useState } from 'react';
import {
  registerServiceWorker,
  isPWA,
  isOnline,
  addConnectionListeners,
  BeforeInstallPromptEvent,
} from '@/lib/pwa';

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  showInstallPrompt: () => Promise<void>;
  updateAvailable: boolean;
}

export function usePWA(): PWAState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    setIsInstalled(isPWA());

    // Check online status
    setOnline(isOnline());

    // Register service worker
    registerServiceWorker().then((registration) => {
      if (registration) {
        // Check for updates
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

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for online/offline events
    const removeConnectionListeners = addConnectionListeners(
      () => setOnline(true),
      () => setOnline(false)
    );

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      removeConnectionListeners();
    };
  }, []);

  const showInstallPrompt = async () => {
    if (!installPrompt) {
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setInstallPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  };

  return {
    isInstalled,
    isOnline: online,
    canInstall,
    showInstallPrompt,
    updateAvailable,
  };
}
