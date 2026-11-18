'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/AppShell';
import { AccountSecurity } from '@/components/AccountSecurity';
import { PushNotificationSettings } from '@/components/PushNotificationSettings';
import { PageHeading, Panel } from '@/components/WorkspaceUI';
import { Button, Input } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { clearSession, homeForRole, schoolRoles, teacherRoles } from '@/lib/session';
import { messageFor } from '@/lib/workspace';
import type { Portal } from '@/lib/navigation';
export default function AccountPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const portal: Portal = user?.role === 'SUPER_ADMIN' ? 'admin' : teacherRoles.includes(user?.role || '') ? 'teacher' : schoolRoles.includes(user?.role || '') ? 'school' : user?.role === 'STUDENT' ? 'student' : 'parent';
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (next !== confirm) { setError('The new passwords do not match.'); return; }
    setBusy(true);
    try { await apiClient.post('/auth/password', {currentPassword:current, newPassword:next}); clearSession(); window.location.assign('/login'); }
    catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  }
  return <AppShell portal={portal}><div className="account-layout"><PageHeading eyebrow="ACCOUNT & SECURITY" title="Your account" description="Manage your profile and keep access to your workspace secure." actions={<Link className="panel-link" href={homeForRole(user?.role || '')}><ArrowLeft size={16}/>Back to workspace</Link>}/><div className="account-columns"><div className="content-stack"><Panel title="Your profile" subtitle="Your school manages your name, email, and role"><div className="panel-body"><div className="flex items-center gap-4"><span className="avatar !w-14 !h-14 !text-lg">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><div><h2 className="text-lg">{user?.firstName} {user?.lastName}</h2><p className="muted text-xs mt-2 flex gap-2 items-center"><Mail size={13}/>{user?.email}</p></div></div><span className="pill neutral mt-5">{user?.role.replaceAll('_',' ').toLowerCase()}</span></div></Panel><PushNotificationSettings/><Panel title="Change password" subtitle="Changing your password signs out all existing sessions"><form className="panel-body space-y-5" onSubmit={submit}>{error && <div className="state-box" role="alert">{error}</div>}<Input label="Current password" type="password" autoComplete="current-password" required maxLength={128} value={current} onChange={e => setCurrent(e.target.value)}/><Input label="New password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={next} onChange={e => setNext(e.target.value)} helpText="Use at least 12 characters."/><Input label="Confirm new password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)}/><Button type="submit" isLoading={busy} leftIcon={<ShieldCheck size={16}/>}>Change password</Button></form></Panel></div><AccountSecurity/></div></div></AppShell>;
}
