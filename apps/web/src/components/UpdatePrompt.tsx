'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button, Alert } from '@/components/ui';

export function UpdatePrompt() {
  const { updateAvailable } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShowPrompt(true);
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <Alert variant="info">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <div className="flex-1">
                <p className="font-medium">Update Available</p>
                <p className="text-sm mt-0.5">
                  A new version is ready. Reload to update.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button size="sm" onClick={handleUpdate}>
                Reload
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Later
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
}
