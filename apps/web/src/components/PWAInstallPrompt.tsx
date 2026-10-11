'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button, Card } from '@/components/ui';

export function PWAInstallPrompt() {
  const { canInstall, showInstallPrompt, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    // Show prompt after 5 seconds if can install
    if (canInstall && !isInstalled && !wasDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    await showInstallPrompt();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed || isInstalled || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-slide-in-right">
      <Card className="shadow-2xl border-2 border-primary-200">
        <div className="p-5">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Install App
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Install Krypton Parent Portal for quick access and offline support
              </p>

              <div className="flex space-x-2">
                <Button size="sm" onClick={handleInstall} fullWidth>
                  Install
                </Button>
                <Button size="sm" variant="outline" onClick={handleDismiss} fullWidth>
                  Maybe Later
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 tap-area"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
