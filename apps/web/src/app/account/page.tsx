'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react';
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
  return <AppShell portal={portal}>
    <div className="account-layout">
      <PageHeading eyebrow="Workspace settings" title="Account settings" description="Manage your profile, sign-in security, and notification preferences." actions={<Link className="account-back-link" href={homeForRole(user?.role || '')}><ArrowLeft size={15}/>Back to workspace</Link>}/>
      <section className="account-profile" aria-labelledby="account-profile-name">
        <span className="account-profile-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
        <div className="account-profile-identity"><span className="account-section-label">Your profile</span><h2 id="account-profile-name">{user?.firstName} {user?.lastName}</h2><p><Mail size={14}/>{user?.email}</p></div>
        <div className="account-profile-meta"><span className="account-role">{user?.role.replaceAll('_', ' ').toLowerCase()}</span><small>Your school manages your profile details.</small></div>
      </section>
      <div className="account-settings-grid">
        <Panel title="Change password" subtitle="Keep your account protected with a strong password.">
          <form className="panel-body account-password-form" onSubmit={submit}>
            {error && <div className="state-box" role="alert">{error}</div>}
            <Input label="Current password" type="password" autoComplete="current-password" required maxLength={128} value={current} onChange={e => setCurrent(e.target.value)}/>
            <Input label="New password" type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={next} onChange={e => setNext(e.target.value)} helpText="Use at least 6 characters."/>
            <Input label="Confirm new password" type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)}/>
            <div className="account-form-footer"><p><LockKeyhole size={14}/>Changing your password signs out all existing sessions.</p><Button type="submit" isLoading={busy}>Update password</Button></div>
          </form>
        </Panel>
        <div className="account-security-stack"><AccountSecurity/><PushNotificationSettings/></div>
      </div>
    </div>
  </AppShell>;
}
