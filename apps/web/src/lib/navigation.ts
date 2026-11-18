import { BarChart3, BookOpen, Bot, Bus, CalendarDays, Camera, ClipboardCheck, CreditCard, FileCheck, GraduationCap, Image as ImageIcon, LayoutDashboard, Library, LifeBuoy, MessageSquare, Radar, School, ShieldCheck, Sparkles, Users, Zap, type LucideIcon } from 'lucide-react';
import { predictiveAnalyticsRoles, schoolRoles, teacherRoles } from './session';
import { preschoolManagers } from './preschool';
export type Portal = 'admin' | 'school' | 'teacher' | 'parent' | 'student';
export interface NavigationItem { href: string; label: string; icon: LucideIcon }
export interface NavigationGroup { label: string; items: NavigationItem[] }
type Entry = [string, string, LucideIcon];
export const portalLabels: Record<Portal, string> = { admin: 'Platform administration', school: 'School management', teacher: 'Teaching workspace', parent: 'Family workspace', student: 'Student workspace' };
export const preschoolSections = [
  ['daily', 'Daily care & check-in', ClipboardCheck],
  ['learning', 'Activities & plans', Sparkles],
  ['copilot', 'INKY assistant', Bot],
  ['progress', 'Child development', GraduationCap],
  ['photos', 'Photos', ImageIcon],
  ['cameras', 'Classroom cameras', Camera],
  ['reports', 'Preschool reports', FileCheck],
  ['settings', 'Preschool setup', School],
] as const;
export type PreschoolSection = typeof preschoolSections[number][0];
export function preschoolSectionsFor(role: string): PreschoolSection[] {
  if (role === 'PARENT') return ['daily', 'learning', 'progress', 'photos', 'cameras'];
  if (preschoolManagers.includes(role)) return preschoolSections.map(([section]) => section);
  if (['TEACHER', 'CLASS_TEACHER'].includes(role)) return preschoolSections.filter(([section]) => section !== 'settings').map(([section]) => section);
  return [];
}
export function navigationMatches(href: string, pathname: string, section: string | null): boolean {
  const [path, query] = href.split('?');
  const targetSection = new URLSearchParams(query).get('section');
  return (pathname === path || path !== '/dashboard' && pathname.startsWith(path + '/')) && (!targetSection || targetSection === (section || 'daily'));
}
export function navigationFor(portal: Portal, role: string, programme: string = 'STANDARD'): NavigationGroup[] {
  const allowed = portal === 'admin' ? role === 'SUPER_ADMIN' : portal === 'school' ? schoolRoles.includes(role) : portal === 'teacher' ? teacherRoles.includes(role) : role === (portal === 'parent' ? 'PARENT' : 'STUDENT');
  if (!allowed) return [];
  const groups = baseNavigation(portal, role);
  const enabled = programme === 'PRESCHOOL' || programme === 'COMBINED';
  const sections = preschoolSectionsFor(role).filter(section => enabled || section === 'settings');
  if (['school', 'teacher', 'parent'].includes(portal) && sections.length) {
    const base = portal === 'parent' ? '/dashboard' : '/' + portal;
    groups.splice(1, 0, { label: 'EARLY YEARS', items: preschoolSections.filter(([section]) => sections.includes(section)).map(([section, label, icon]) => ({ href: base + '/preschool?section=' + section, label, icon })) });
  }
  const schoolAgeOnly = new Set(['grades', 'examinations', 'report-cards', 'timetable', 'performance', 'quizzes', 'lms', 'predictive-analytics']);
  return groups.map(group => ({ ...group, items: programme === 'PRESCHOOL' ? group.items.filter(item => !schoolAgeOnly.has(item.href.split('/')[2])) : group.items })).filter(group => group.items.length);
}
function baseNavigation(portal: Portal, role: string): NavigationGroup[] {
  const base = portal === 'parent' ? '/dashboard' : '/' + portal;
  const group = (label: string, entries: Entry[]): NavigationGroup => ({ label, items: entries.map(([slug, title, icon]) => ({ href: slug.startsWith('/') ? slug : base + (slug ? '/' + slug : ''), label: title, icon })) });
  if (portal === 'admin') return [
    group('WORKSPACE', [['dashboard', 'Overview', LayoutDashboard], ['analytics', 'School benchmarking', BarChart3], ['copilot', 'ERP Copilot', Bot]]),
    group('PLATFORM', [['schools', 'Schools', School], ['users', 'People & access', Users], ['subscriptions', 'Subscriptions', CreditCard], ['admissions', 'Admissions', GraduationCap]]),
    group('OPERATIONS', [['reports', 'Reports', FileCheck], ['system', 'System health', ShieldCheck], ['support', 'Support center', LifeBuoy]]),
  ];
  if (portal === 'teacher') return [
    group('WORKSPACE', [['dashboard', 'Overview', LayoutDashboard], ['classes', 'My classes', Users], ['timetable', 'My schedule', CalendarDays]]),
    group('TEACHING', [['attendance', 'Attendance', ClipboardCheck], ['smart-attendance', 'Smart attendance', ShieldCheck], ['grades', 'Gradebook', BookOpen], ['learning', 'Learning management', Library], ['portfolio', 'Student portfolios', GraduationCap], ['performance', 'Performance', BarChart3]]),
    group('TOOLS & CONNECTIONS', [['chat', 'Live chat', MessageSquare], ['quizzes', 'Class quizzes', ClipboardCheck], ['ai-studio', 'AI teaching studio', Sparkles], ['copilot', 'ERP Copilot', Bot], ['substitution', 'Substitution duties', Zap], ['ptm', 'Parent meetings', CalendarDays], ['messages', 'Broadcasts', MessageSquare]]),
  ];
  if (portal === 'student') return [
    group('WORKSPACE', [['dashboard', 'Overview', LayoutDashboard], ['timetable', 'My schedule', CalendarDays], ['profile', 'My profile', Users]]),
    group('MY LEARNING', [['academics', 'Academic results', BookOpen], ['assignments', 'Assignments', ClipboardCheck], ['quizzes', 'Quizzes', Zap], ['materials', 'Learning materials', Library], ['grades', 'My grades', BarChart3], ['report-cards', 'Report cards', FileCheck], ['attendance', 'My attendance', ClipboardCheck], ['check-in', 'Classroom check-in', ShieldCheck], ['portfolio', 'My portfolio', GraduationCap], ['library', 'Library', Library]]),
  ];
  if (portal === 'parent') return [
    group('FAMILY', [['', 'Overview', LayoutDashboard], ['/dashboard/chat', 'Teacher chat', MessageSquare], ['fees', 'Fees & payments', CreditCard], ['attendance', 'Attendance', ClipboardCheck], ['grades', 'Learning progress', BookOpen], ['notifications', 'School updates', MessageSquare]]),
    group('SCHOOL SERVICES', [['/parent/transport', 'Bus tracking', Bus], ['/parent/absence', 'Report an absence', ClipboardCheck], ['portfolio', 'Child portfolio', GraduationCap], ['lms', 'Homework & quizzes', Library], ['ptm', 'Parent meetings', CalendarDays], ['certificates', 'Certificates & ID cards', FileCheck]]),
  ];
  const operations: Record<string, Entry[]> = {
    ACCOUNTANT: [['guardians', 'Guardians', Users], ['fees', 'Fees & invoices', CreditCard]],
    LIBRARIAN: [['library', 'Library', Library]],
    TRANSPORT_OFFICER: [['transport', 'Trips & live GPS', Bus], ['transport/setup', 'Vehicles & routes', Bus], ['transport/assignments', 'Student transport assignments', Users]],
    RECEPTIONIST: [['admissions', 'Admissions', GraduationCap], ['guardians', 'Guardians', Users]],
    AUDITOR: [['guardians', 'Guardians', Users], ['fees', 'Fees & payment records', CreditCard], ['report-cards', 'Report cards', FileCheck]],
  };
  if (operations[role]) return [
    group('WORKSPACE', [['dashboard', 'Overview', LayoutDashboard], ['students', 'Students', Users]]),
    group('OPERATIONS', [...operations[role], ['support', 'Support', LifeBuoy]]),
  ];
  return [
    group('WORKSPACE', [['dashboard', 'Overview', LayoutDashboard], ...(predictiveAnalyticsRoles.includes(role) ? [['analytics', 'Advanced analytics', BarChart3], ['predictive-analytics', 'At-Risk & Early Warning Radar', Radar], ['ai-studio', 'AI teaching studio', Sparkles]] as Entry[] : []), ['copilot', 'ERP Copilot', Bot]]),
    group('PEOPLE', [['students', 'Students', Users], ['admissions', 'Admissions', GraduationCap], ['guardians', 'Guardians', Users], ['staff', 'Staff directory', Users]]),
    group('ACADEMICS', [['academics', 'Academic setup', BookOpen], ['academics/promotion', 'Year-end promotion', GraduationCap], ['attendance', 'Attendance', ClipboardCheck], ['grades', 'Gradebook', BookOpen], ['examinations', 'Examinations', FileCheck], ['report-cards', 'Report cards', FileCheck], ['learning', 'Learning management', Library], ['calendar', 'School calendar', CalendarDays], ['timetable', 'Timetable', CalendarDays], ['timetable/preview', 'Timetable planner', CalendarDays], ['substitution', 'Staff substitutions', Zap]]),
    group('OPERATIONS', [['chat', 'Live campus chat', MessageSquare], ['absences','Absence requests',ClipboardCheck], ['portfolio','Student portfolios',GraduationCap], ['certificates','Certificates',FileCheck], ['quizzes','Class quizzes',ClipboardCheck], ['fees', 'Fees & invoices', CreditCard], ['library', 'Library', Library], ['inventory', 'Inventory', Library], ['messages', 'Communications', MessageSquare], ['support', 'Support', LifeBuoy]]),
    ...(managersForCompliance(role) ? [group('REPORTING', [['compliance', 'Government reporting', FileCheck]])] : []),
    group('TRANSPORT', [['transport', 'Trips & live GPS', Bus], ['transport/setup', 'Vehicles & routes', Bus], ['transport/assignments', 'Student transport assignments', Users]]),
  ];
}
function managersForCompliance(role: string) { return ['SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN'].includes(role); }
