import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
export const metadata: Metadata = {
  title: { default: 'Krypton ? School workspace', template: '%s ? Krypton' },
  description: 'One connected workspace for school teams and families.',
  manifest: '/manifest.json', icons: { icon: '/brand.svg', apple: '/brand.svg' },
};
export const viewport: Viewport = { themeColor: '#102c36', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><LanguageProvider><AuthProvider>{children}</AuthProvider></LanguageProvider></body></html>;
}