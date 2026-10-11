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
  '/school/admissions': {title:'Admissions pipeline',href:'/school/students',action:'Open student directory'},
  '/admin/admissions': {title:'Admissions pipeline',href:'/admin/schools',action:'Manage schools'},
  '/teacher/ptm': {title:'Virtual parent meetings',href:'/teacher/messages',action:'Contact families'},
  '/dashboard/ptm': {title:'Virtual parent meetings',href:'/dashboard/notifications',action:'View school updates'},
  '/dashboard/lms': {title:'Homework and quiz studio',href:'/dashboard/grades',action:'View learning progress'},
  '/dashboard/certificates': {title:'Certificate studio',href:'/dashboard',action:'Return to family overview'},
  '/dashboard/compliance': {title:'Compliance studio',href:'/dashboard',action:'Return to workspace'},
  '/dashboard/whatsapp': {title:'WhatsApp automation',href:'/dashboard/notifications',action:'View school updates'},
  '/dashboard/smart-attendance': {title:'Smart attendance',href:'/dashboard/attendance',action:'View attendance'},
  '/dashboard/substitution': {title:'Staff substitutions',href:'/dashboard',action:'Return to workspace'},
  '/dashboard/portfolio': {title:'Digital portfolios',href:'/dashboard/grades',action:'View learning progress'},
  '/dashboard/admissions': {title:'Admissions pipeline',href:'/dashboard',action:'Return to workspace'},
  '/dashboard/transport': {title:'Live bus tracking',href:'/dashboard',action:'Return to workspace'},
  '/school/transport': {title:'Live bus tracking',href:'/school/transport/setup',action:'Manage vehicles and routes'},
  '/school/transport/driver': {title:'Driver tracking',href:'/school/transport/setup',action:'Manage vehicles and routes'},
  '/parent/transport': {title:'Live bus tracking',href:'/dashboard',action:'Return to family overview'},
  '/parent/absence': {title:'Absence requests',href:'/dashboard/attendance',action:'View saved attendance'},
  '/teacher/smart-attendance': {title:'Smart attendance',href:'/teacher/attendance',action:'Open daily register'},
  '/school/substitution': {title:'Staff substitutions',href:'/school/timetable',action:'View saved timetable'},
  '/teacher/substitution': {title:'Staff substitutions',href:'/teacher/timetable',action:'View saved schedule'},
  '/teacher/portfolio': {title:'Digital portfolios',href:'/teacher/performance',action:'View student performance'},
  '/student/portfolio': {title:'Digital portfolios',href:'/student/grades',action:'View your grades'},
  '/student/quizzes': {title:'Interactive quizzes',href:'/student/assignments',action:'Open assignments'},
  '/driver': {title:'Driver tracking',href:'/login',action:'Return to sign in'},
  '/admissions/apply': {title:'Online admission applications',href:'/login',action:'Contact your school to apply'},
  '/admissions/track': {title:'Admission tracking',href:'/login',action:'Return to sign in'},
};
export function FeatureBoundary({ children, inWorkspace = false }: { children: ReactNode; inWorkspace?: boolean }) {
  const pathname = usePathname();
  if (!inWorkspace && !['/parent/transport','/parent/absence','/driver','/admissions/apply','/admissions/track'].includes(pathname)) return <>{children}</>;
  const feature = previews[pathname];
  if (!feature) return <>{children}</>;
  if (process.env.NODE_ENV === 'production') return <div className={inWorkspace ? undefined : "page-content max-w-4xl"}><PageHeading eyebrow="SCHOOL SERVICES" title={feature.title} description="This service is being prepared for your school."/><Panel title="This service is not available yet" subtitle="Contact your school office for help"><div className="panel-body space-y-5"><p className="muted text-sm">This preview does not save official school records. Use the connected workspace below for current school information.</p><Link className="overview-hero-link !mt-0 !bg-primary-600 !text-white" href={feature.href}>{feature.action}<ArrowUpRight size={16}/></Link></div></Panel></div>;
  return <><div className="preview-notice" role="note"><FlaskConical size={18}/><div><strong>Feature preview · Sample data</strong><p>Changes in this preview are stored on this device or in memory and are not official school records.</p></div></div>{children}</>;
}

