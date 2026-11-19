'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { messageFor } from '@/lib/workspace';
import { Button, Input } from './ui';

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const initialized = useRef(false);
  useEffect(() => {
    if (reset && !initialized.current) {
      initialized.current = true;
      const value = new URLSearchParams(window.location.search).get('token') || '';
      setToken(value);
      // Remove the reset secret from the address bar after reading it.
      window.history.replaceState(window.history.state, '', window.location.pathname);
      if (!value) setError('This reset link is missing its token. Request a new link.');
    }
  }, [reset]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (reset && password !== confirm) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      await apiClient.post(reset ? '/auth/password-reset/reset' : '/auth/password-reset/request', reset ? { token, newPassword: password } : { email: email.trim() });
      setNotice(reset ? 'Your password has been reset. You can now sign in.' : 'If an account exists with that email, a reset link has been sent. Check your inbox and spam folder.');
      setPassword(''); setConfirm('');
    } catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  }
  return <main className="recovery-page"><Link className="recovery-brand" href="/login"><img src="/krypton-icon.png" alt="Krypton" className="brand-logo-img" />Krypton</Link><section className="recovery-card"><span className="recovery-icon"><ShieldCheck size={28}/></span><span className="eyebrow">ACCOUNT SECURITY</span><h1>{reset ? 'Set a new password' : 'Let’s get you back in'}</h1><p className="muted">{reset ? 'Choose a secure password for your school workspace.' : 'Enter your account email and we’ll send a password reset link.'}</p>{notice ? <div role="status" className="state-box success">{notice}</div> : <form onSubmit={submit} className="space-y-5">{error && <div role="alert" className="state-box">{error}{reset && !token && <Link className="forgot-link" href="/forgot-password">Request a reset link</Link>}</div>}{reset ? <><Input label="New password" type="password" autoComplete="new-password" required minLength={6} maxLength={128} helpText="At least 6 characters, with uppercase and lowercase letters, a number, and a special character." value={password} onChange={e => setPassword(e.target.value)}/><Input label="Confirm new password" type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)}/></> : <Input label="Email address" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/>}<Button type="submit" fullWidth isLoading={busy} disabled={reset && !token}>{reset ? 'Reset password' : 'Send reset link'}</Button></form>}<Link className="recovery-back" href="/login"><ArrowLeft size={16}/>Back to sign in</Link></section><p className="recovery-footer">Krypton School ERP · One connected school community</p></main>;
}
