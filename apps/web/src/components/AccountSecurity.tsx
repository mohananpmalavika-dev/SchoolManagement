'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ShieldCheck, Download, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { messageFor } from '@/lib/workspace';
import { Panel } from './WorkspaceUI';
import { Button, Input } from './ui';
interface MfaStatus { enabled: boolean; required: boolean; backupCodesRemaining: number }
interface Setup { secret: string; qrCodeDataUrl: string; backupCodes: string[] }
export function AccountSecurity() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'idle' | 'disable' | 'regenerate'>('idle');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const load = useCallback(async () => {
    try { setStatus((await apiClient.get<MfaStatus>('/auth/mfa/status')).data); }
    catch (err) { setError(messageFor(err)); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function generate() {
    setBusy(true); setError(''); setNotice('');
    try { const { data } = await apiClient.post<Setup>('/auth/mfa/setup'); setSetup(data); setCodes(data.backupCodes); setSaved(false); }
    catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (setup) {
        await apiClient.post('/auth/mfa/verify-enable', { token: token.trim() });
        setSetup(null); setNotice('Two-step verification is enabled. Keep your recovery codes in a safe place.');
      } else if (mode === 'disable') {
        await apiClient.delete('/auth/mfa', { data: { password } });
        setCodes([]); setNotice('Two-step verification has been disabled.');
      } else if (mode === 'regenerate') {
        const { data } = await apiClient.post<{backupCodes: string[]}>('/auth/mfa/backup-codes/regenerate', { mfaToken: token.trim() });
        setCodes(data.backupCodes); setSaved(false); setNotice('New recovery codes are ready. Previous codes no longer work.');
      }
      setMode('idle'); setToken(''); setPassword(''); await load();
    } catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  }
  function downloadCodes() {
    const url = URL.createObjectURL(new Blob(['Krypton School ERP recovery codes\nStore privately. Each code can be used once.\n\n' + codes.join('\n')], {type:'text/plain'}));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'krypton-recovery-codes.txt'; anchor.click(); URL.revokeObjectURL(url);
  }
  return <Panel title="Two-step verification" subtitle="Add an authenticator code to your sign-in"><div className="panel-body space-y-5">
    {error && <div role="alert" className="state-box">{error}<Button variant="ghost" size="sm" onClick={() => {setError('');void load();}}>Retry</Button></div>}
    {notice && <div role="status" className="state-box success">{notice}</div>}
    {!status ? <p className="muted text-sm">Loading account security…</p> : <><div className="security-note"><ShieldCheck size={23}/><div><strong>{status.enabled ? 'Your account has two-step verification' : 'Protect your school account'}</strong><p className="mt-1">{status.enabled ? status.backupCodesRemaining + ' recovery codes remaining.' : 'Use an authenticator app to add a second verification step.'}</p></div></div>
    {!setup && mode === 'idle' && <div className="flex gap-3 flex-wrap">{status.enabled ? <><Button variant="outline" size="sm" leftIcon={<RefreshCw size={15}/>} onClick={() => {setMode('regenerate');setToken('');}}>Replace recovery codes</Button><Button variant="ghost" size="sm" onClick={() => setMode('disable')}>Disable verification</Button></> : <Button onClick={() => void generate()} isLoading={busy} leftIcon={<ShieldCheck size={16}/>}>Set up verification</Button>}</div>}
    {setup && <><div className="security-grid"><img src={setup.qrCodeDataUrl} className="security-qr" alt="Scan this QR code with your authenticator app"/><div><h3 className="text-base mb-2">Connect your authenticator</h3><p className="muted text-xs mb-4">Scan the code in Google Authenticator, Microsoft Authenticator, or another compatible app.</p><details><summary className="text-xs cursor-pointer">Enter a setup key instead</summary><code className="block break-all mt-3 text-xs">{setup.secret}</code></details></div></div></>}
    {codes.length > 0 && <div className="space-y-3"><h3 className="text-sm">Recovery codes</h3><p className="muted text-xs">Store these privately. Each code works once if you lose access to your authenticator.</p><div className="backup-codes">{codes.map(code => <code key={code}>{code}</code>)}</div><Button size="sm" variant="outline" leftIcon={<Download size={15}/>} onClick={downloadCodes}>Download recovery codes</Button>{setup ? <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={saved} onChange={event => setSaved(event.target.checked)}/>I have saved my recovery codes</label> : <Button variant="ghost" size="sm" onClick={() => setCodes([])}>Hide recovery codes</Button>}</div>}
    {(setup || mode !== 'idle') && <form onSubmit={submit} className="space-y-4">{mode === 'disable' ? <Input label="Confirm your password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/> : <Input label={setup ? 'Authenticator code' : 'Verification code'} autoComplete="one-time-code" required minLength={6} maxLength={16} value={token} onChange={event => setToken(event.target.value)}/>}<div className="flex gap-3 flex-wrap"><Button type="submit" isLoading={busy} disabled={!!setup && !saved}>{setup ? 'Enable verification' : mode === 'disable' ? 'Confirm disable' : 'Replace codes'}</Button><Button disabled={busy} variant="ghost" onClick={() => {setSetup(null);setMode('idle');setCodes([]);setToken('');setPassword('');setError('');}}>Cancel</Button></div></form>}</>}
  </div></Panel>;
}
