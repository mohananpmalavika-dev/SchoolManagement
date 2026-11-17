import type { Metadata, Viewport } from 'next';
import './globals.css';
import './design.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FeatureBoundary } from '@/components/FeatureBoundary';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { UpdatePrompt } from '@/components/UpdatePrompt';

export const metadata: Metadata = {
  title: { default: 'Krypton | School Workspace ERP', template: '%s | Krypton ERP' },
  description: 'One connected workspace for school teams and families.',
  manifest: '/manifest.json',
  icons: {
    icon: '/krypton-icon.png',
    apple: '/krypton-icon.png',
    shortcut: '/krypton-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'School App',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f766e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <FeatureBoundary>
              {children}
              <PWAInstallPrompt />
              <OfflineIndicator />
              <UpdatePrompt />
            </FeatureBoundary>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
