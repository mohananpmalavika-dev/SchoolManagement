'use client';
import { type ReactNode } from 'react';
import Link from 'next/link';
import { FlaskConical, ArrowUpRight } from 'lucide-react';
import { PageHeading, Panel } from './WorkspaceUI';
import { usePathname } from 'next/navigation';
interface PreviewFeature { title: string; href: string; action: string }
const previews: Record<string, PreviewFeature> = {
  '/school/fees/preview': {title:'Advanced finance studio',href:'/school/fees',action:'Open invoices and payments'},
  '/school/timetable/preview': {title:'Automatic timetable studio',href:'/school/timetable',action:'Open saved timetable'},
  '/dashboard/compliance': {title:'Compliance studio',href:'/dashboard',action:'Return to workspace'},
  '/dashboard/whatsapp': {title:'WhatsApp automation',href:'/dashboard/notifications',action:'View school updates'},
};
export function FeatureBoundary({ children, inWorkspace = false }: { children: ReactNode; inWorkspace?: boolean }) {
  const pathname = usePathname();
  if (!inWorkspace && !['/parent/transport','/parent/absence','/driver','/admissions','/admissions/apply','/admissions/track'].includes(pathname) && !pathname.startsWith('/ptm/room/')) return <>{children}</>;
  const feature = previews[pathname] || (pathname.startsWith('/ptm/room/') ? previews['/ptm/room'] : undefined);
  if (!feature) return <>{children}</>;
  if (process.env.NODE_ENV === 'production') return <div className={inWorkspace ? undefined : "page-content max-w-4xl"}><PageHeading eyebrow="SCHOOL SERVICES" title={feature.title} description="This service is being prepared for your school."/><Panel title="This service is not available yet" subtitle="Contact your school office for help"><div className="panel-body space-y-5"><p className="muted text-sm">This preview does not save official school records. Use the connected workspace below for current school information.</p><Link className="overview-hero-link !mt-0 !bg-primary-600 !text-white" href={feature.href}>{feature.action}<ArrowUpRight size={16}/></Link></div></Panel></div>;
  return <><div className="preview-notice" role="note"><FlaskConical size={18}/><div><strong>Feature preview · Sample data</strong><p>Changes in this preview are stored on this device or in memory and are not official school records.</p></div></div>{children}</>;
}

