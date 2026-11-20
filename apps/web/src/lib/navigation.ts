import { BarChart3, Bell, BookOpen, Bot, Briefcase, Bus, CalendarDays, Camera, ClipboardCheck, CreditCard, FileCheck, GraduationCap, Image as ImageIcon, LayoutDashboard, Library, LifeBuoy, MessageSquare, Radar, School, ShieldCheck, Sparkles, Users, Zap, type LucideIcon } from 'lucide-react';
import { predictiveAnalyticsRoles, schoolRoles, teacherRoles } from './session';
import { preschoolManagers } from './preschool';
export type Portal = 'admin' | 'school' | 'teacher' | 'parent' | 'student';
export interface NavigationItem { href: string; label: string; icon: LucideIcon }
export interface NavigationGroup { label: string; items: NavigationItem[] }
const schoolAgeOnly = new Set(['grades', 'examinations', 'report-cards', 'timetable', 'performance', 'quizzes', 'lms', 'predictive-analytics', 'smart-attendance', 'attendance', 'learning', 'ai-studio', 'substitution']);
export function isSchoolAgePage(pathname: string): boolean {
  return schoolAgeOnly.has(pathname.split('/')[2]) || pathname === '/school/academics/promotion';
}
type Entry = [string, string, LucideIcon];
export const portalLabels: Record<Portal, string> = { admin: 'Platform administration', school: 'School management', teacher: 'Teaching workspace', parent: 'Family workspace', student: 'Student workspace' };
export const preschoolSections = [
  ['daily', 'Daily care & attendance', ClipboardCheck],
  ['learning', 'Activities & plans', Sparkles],
  ['copilot', 'INKY AI assistant', Bot],
  ['progress', 'Child development', GraduationCap],
  ['photos', 'Photos', ImageIcon],
  ['cameras', 'Classroom cameras', Camera],
  ['reports', 'Preschool reports', FileCheck],
] as const;
export type PreschoolSection = typeof preschoolSections[number][0];
export const preschoolSectionLabels = Object.fromEntries(preschoolSections.map(([section, label]) => [section, label])) as Record<PreschoolSection, string>;
export function preschoolSectionsFor(role: string): PreschoolSection[] {
  if (role === 'PARENT') return ['daily', 'learning', 'progress', 'photos', 'cameras'];
  if (preschoolManagers.includes(role)) return preschoolSections.map(([section]) => section);
  if (['TEACHER', 'CLASS_TEACHER'].includes(role)) return preschoolSections.map(([section]) => section);
  return [];
}
export function navigationMatches(href: string, pathname: string, section: string | null): boolean {
  const aliases: Record<string, string> = { '/student/academics': '/student/grades', '/student/library': '/student/materials', '/school/fees/preview': '/school/analytics', '/school/transport/driver': '/school/transport', '/dashboard/transport': '/parent/transport', '/driver': '/school/transport' };
  pathname = aliases[pathname] || pathname;
  const [path, query] = href.split('?');
  const targetSection = new URLSearchParams(query).get('section');
  return (pathname === path || path !== '/dashboard' && pathname.startsWith(path + '/')) && (!targetSection || targetSection === (section || 'daily'));
}
export function navigationFor(portal: Portal, role: string, programme: string = 'STANDARD'): NavigationGroup[] {
  const allowed = portal === 'admin' ? role === 'SUPER_ADMIN' : portal === 'school' ? schoolRoles.includes(role) : portal === 'teacher' ? teacherRoles.includes(role) : role === (portal === 'parent' ? 'PARENT' : 'STUDENT');
  if (!allowed) return [];
  const groups = baseNavigation(portal, role);
  if (portal !== 'parent') groups[0].items.push({ href: '/notifications', label: 'Notifications', icon: Bell });
  const enabled = programme === 'PRESCHOOL' || programme === 'COMBINED';
  const sections = enabled ? preschoolSectionsFor(role) : [];
  if (['school', 'teacher', 'parent'].includes(portal) && sections.length) {
    const base = portal === 'parent' ? '/dashboard' : '/' + portal;
    const items: NavigationItem[] = preschoolSections.filter(([section]) => sections.includes(section)).map(([section, label, icon]) => ({ href: base + '/preschool?section=' + section, label, icon }));
    if (portal === 'school' && preschoolManagers.includes(role)) items.push({ href: '/school/setup', label: 'Preschool setup', icon: School });
    groups.splice(1, 0, { label: 'PRESCHOOL', items });
  }
  return groups.map(group => ({ ...group, label: programme === 'PRESCHOOL' && group.label === 'ACADEMICS' ? 'SCHOOL SETUP' : group.label, items: programme === 'PRESCHOOL' ? group.items.filter(item => !isSchoolAgePage(item.href)).map(item => item.href === '/school/academics' ? { ...item, label: 'Classes & school years' } : item) : group.items })).filter(group => group.items.length);
}
function baseNavigation(portal: Portal, role: string): NavigationGroup[] {
  const base = portal === 'parent' ? '/dashboard' : '/' + portal;
  const group = (label: string, entries: Entry[]): NavigationGroup => ({ label, items: entries.map(([slug, title, icon]) => ({ href: slug.startsWith('/') ? slug : base + (slug ? '/' + slug : ''), label: title, icon })) });
  if (portal === 'admin') return [
    group('WORKSPACE', [['dashboard', 'Dashboard', LayoutDashboard], ['analytics', 'School benchmarking', BarChart3], ['copilot', 'ERP Copilot', Bot]]),
    group('PLATFORM', [['schools', 'Schools', School], ['school-setup', 'School setup', School], ['users', 'Users & access', Users], ['subscriptions', 'Subscriptions', CreditCard]]),
    group('OPERATIONS', [['reports', 'Reports', FileCheck], ['system', 'System health', ShieldCheck], ['support', 'Support center', LifeBuoy], ['hrms', 'HR & Payroll', Briefcase]]),
  ];
  if (portal === 'teacher') return [
    group('WORKSPACE', [['dashboard', 'Dashboard', LayoutDashboard], ['classes', 'My classes', Users], ['timetable', 'My schedule', CalendarDays]]),
    group('TEACHING', [['attendance', 'Attendance', ClipboardCheck], ['smart-attendance', 'Classroom check-in', ShieldCheck], ['grades', 'Gradebook', BookOpen], ['learning', 'Assignments & resources', Library], ['portfolio', 'Student portfolios', GraduationCap], ['performance', 'Learning performance', BarChart3]]),
    group('TOOLS & CONNECTIONS', [['chat', 'School chat', MessageSquare], ['quizzes', 'Class quizzes', ClipboardCheck], ['ai-studio', 'AI teaching studio', Sparkles], ['copilot', 'ERP Copilot', Bot], ['substitution', 'Substitution duties', Zap], ['ptm', 'Parent meetings', CalendarDays], ['messages', 'School messages', MessageSquare], ['hrms', 'Staff HR & Leaves', Briefcase]]),
  ];
  if (portal === 'student') return [
    group('WORKSPACE', [['dashboard', 'Dashboard', LayoutDashboard], ['timetable', 'My timetable', CalendarDays], ['profile', 'My profile', Users]]),
    group('MY LEARNING', [['assignments', 'Assignments', ClipboardCheck], ['quizzes', 'Quizzes', Zap], ['materials', 'Resources & library', Library], ['grades', 'My progress', BarChart3], ['report-cards', 'Report cards', FileCheck], ['attendance', 'My attendance', ClipboardCheck], ['check-in', 'Classroom check-in', ShieldCheck], ['portfolio', 'My portfolio', GraduationCap]]),
  ];
  if (portal === 'parent') return [
    group('FAMILY', [['', 'Dashboard', LayoutDashboard], ['/dashboard/chat', 'Teacher chat', MessageSquare], ['fees', 'Fees & payments', CreditCard], ['attendance', 'Attendance', ClipboardCheck], ['grades', 'Learning progress', BookOpen], ['notifications', 'Notifications', Bell]]),
    group('SCHOOL SERVICES', [['/parent/transport', 'Bus tracking', Bus], ['/parent/absence', 'Report an absence', ClipboardCheck], ['portfolio', 'Child portfolio', GraduationCap], ['lms', 'Homework & quizzes', Library], ['ptm', 'Parent meetings', CalendarDays], ['certificates', 'Certificates & ID cards', FileCheck], ['/admissions/apply', 'Admission application', GraduationCap], ['/admissions/track', 'Track application', FileCheck]]),
  ];
  const operations: Record<string, Entry[]> = {
    ACCOUNTANT: [['admissions', 'Admissions', GraduationCap], ['guardians', 'Guardians', Users], ['fees', 'Fees & invoices', CreditCard], ['fees/payment-settings', 'School payment accounts', CreditCard], ['hrms', 'Payroll & HR', Briefcase]],
    LIBRARIAN: [['library', 'Library', Library]],
    TRANSPORT_OFFICER: [['transport', 'Trips & bus tracking', Bus], ['transport/setup', 'Vehicles & routes', Bus], ['transport/assignments', 'Student bus assignments', Users]],
    RECEPTIONIST: [['admissions', 'Admissions', GraduationCap], ['/admissions/apply', 'Admission application', GraduationCap], ['/admissions/track', 'Track application', FileCheck], ['guardians', 'Guardians', Users]],
    AUDITOR: [['guardians', 'Guardians', Users], ['fees', 'Fees & payment records', CreditCard], ['report-cards', 'Report cards', FileCheck]],
  };
  if (operations[role]) return [
    group('WORKSPACE', [['dashboard', 'Dashboard', LayoutDashboard], ['students', 'Students', Users]]),
    group('OPERATIONS', [...operations[role], ...(role !== 'ACCOUNTANT' ? [['hrms', 'My HR & leave', Briefcase]] as Entry[] : []), ['support', 'Support', LifeBuoy]]),
  ];
  return [
    group('WORKSPACE', [['dashboard', 'Dashboard', LayoutDashboard], ...(predictiveAnalyticsRoles.includes(role) ? [['analytics', 'Advanced analytics', BarChart3], ['predictive-analytics', 'Student risk alerts', Radar], ['ai-studio', 'AI teaching studio', Sparkles]] as Entry[] : []), ['copilot', 'ERP Copilot', Bot]]),
    group('PEOPLE', [['students', 'Students', Users], ['admissions', 'Admissions', GraduationCap], ['/admissions/apply', 'Admission application', GraduationCap], ['/admissions/track', 'Track application', FileCheck], ['guardians', 'Guardians', Users], ['staff', 'Staff directory', Users], ['hrms', 'HR & Payroll', Briefcase]]),
    group('ACADEMICS', [['academics', 'Academic setup', BookOpen], ['academics/promotion', 'Year-end promotion', GraduationCap], ['attendance', 'Attendance', ClipboardCheck], ['smart-attendance', 'Classroom check-in', ShieldCheck], ['grades', 'Gradebook', BookOpen], ['examinations', 'Examinations', FileCheck], ['report-cards', 'Report cards', FileCheck], ['learning', 'Assignments & resources', Library], ['calendar', 'School calendar', CalendarDays], ['timetable', 'Timetable', CalendarDays], ['timetable/preview', 'Timetable planner', CalendarDays], ['substitution', 'Staff substitutions', Zap]]),
    group('OPERATIONS', [['chat', 'School chat', MessageSquare], ['absences','Absence requests',ClipboardCheck], ['portfolio','Student portfolios',GraduationCap], ['certificates','Certificates & ID cards',FileCheck], ['quizzes','Class quizzes',ClipboardCheck], ['fees', 'Fees & invoices', CreditCard], ['library', 'Library', Library], ['inventory', 'Inventory', Library], ['messages', 'School messages', MessageSquare], ['support', 'Support', LifeBuoy], ...(['PRINCIPAL','SCHOOL_ADMIN'].includes(role) ? [['ptm', 'Parent meetings', CalendarDays]] as Entry[] : []), ...(['SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN'].includes(role) ? [['whatsapp', 'WhatsApp messages', MessageSquare], ['fees/payment-settings', 'School payment accounts', CreditCard]] as Entry[] : [])]),
    ...(managersForCompliance(role) ? [group('REPORTING', [['compliance', 'Government reporting', FileCheck]])] : []),
    group('TRANSPORT', [['transport', 'Trips & bus tracking', Bus], ['transport/setup', 'Vehicles & routes', Bus], ['transport/assignments', 'Student bus assignments', Users]]),
  ];
}
function managersForCompliance(role: string) { return ['SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN'].includes(role); }
