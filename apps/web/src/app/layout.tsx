import type { Metadata, Viewport } from 'next';
import './globals.css';
import './design.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FeatureBoundary } from '@/components/FeatureBoundary';
export const metadata: Metadata = {
  title: { default: 'Krypton | School workspace', template: '%s | Krypton' },
  description: 'One connected workspace for school teams and families.',
  manifest: '/manifest.json', icons: { icon: '/brand.svg', apple: '/brand.svg' },
};
export const viewport: Viewport = { themeColor: '#132435', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><LanguageProvider><AuthProvider><FeatureBoundary>{children}</FeatureBoundary></AuthProvider></LanguageProvider></body></html>;
}
