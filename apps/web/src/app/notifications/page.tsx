'use client';
import { AppShell } from '@/components/AppShell';
import { NotificationsPage } from '@/components/NotificationsPage';
import { useAuth } from '@/contexts/AuthContext';
import { schoolRoles, teacherRoles } from '@/lib/session';
import type { Portal } from '@/lib/navigation';

export default function Page() {
  const { user } = useAuth();
  const portal: Portal = user?.role === 'SUPER_ADMIN' ? 'admin' : teacherRoles.includes(user?.role || '') ? 'teacher'
    : schoolRoles.includes(user?.role || '') ? 'school' : user?.role === 'STUDENT' ? 'student' : 'parent';
  return <AppShell portal={portal}><NotificationsPage /></AppShell>;
}
