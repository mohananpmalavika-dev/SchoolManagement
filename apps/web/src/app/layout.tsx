import type { Metadata, Viewport } from 'next';
import './globals.css';
import './design.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FeatureBoundary } from '@/components/FeatureBoundary';
export const metadata: Metadata = {
  title: { default: 'HustlerTech | School Workspace ERP', template: '%s | HustlerTech' },
  description: 'One connected workspace for school teams and families.',
  manifest: '/manifest.json', icons: { icon: '/hustlertech-logo.png', apple: '/hustlertech-logo.png', shortcut: '/hustlertech-logo.png' },
};
export const viewport: Viewport = { themeColor: '#6952bc', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><LanguageProvider><AuthProvider><FeatureBoundary>{children}</FeatureBoundary></AuthProvider></LanguageProvider></body></html>;
}
