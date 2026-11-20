'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { isIOSDevice, isPWA } from '@/lib/pwa';
import { currentPushSubscription, disableBackgroundPush, enableBackgroundPush, pushConfiguration, supportsBackgroundPush, testBackgroundPush, usesPushServerKey } from '@/lib/push-notifications';
import { messageFor } from '@/lib/workspace';
import { Panel } from './WorkspaceUI';
import { Button } from './ui';

export function PushNotificationSettings() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false), [configured, setConfigured] = useState(false);
  const [enabled, setEnabled] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [installFirst, setInstallFirst] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const loadVersion = useRef(0);
  const load = useCallback(async () => {
    if (!user) return;
    const version = ++loadVersion.current;
    setLoading(true); setError('');
    try {
      const supported = supportsBackgroundPush();
      const config = await pushConfiguration();
      const subscription = supported ? await currentPushSubscription() : null;
      let enabled = false;
      if (subscription && config.publicKey && usesPushServerKey(subscription, config.publicKey)) {
        const { data } = await apiClient.post<{ subscribed: boolean }>('/push/status', { endpoint: subscription.endpoint });
        enabled = data.subscribed;
      }
      if (version !== loadVersion.current) return;
      setSupported(supported); setConfigured(config.enabled);
      setInstallFirst(isIOSDevice() && !isPWA());
      setPermission(typeof Notification === 'undefined' ? 'denied' : Notification.permission);
      setHasSubscription(!!subscription);
      setEnabled(enabled);
    } catch (err) {
      if (version === loadVersion.current) setError(messageFor(err));
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    void load(); const changed = () => { void load(); };
    window.addEventListener('krypton-push-changed', changed);
    return () => { loadVersion.current++; window.removeEventListener('krypton-push-changed', changed); };
  }, [load]);
  async function change(kind: 'enable' | 'disable' | 'test') {
    setBusy(true); setError(''); setNotice('');
    try {
      if (kind === 'enable') { await enableBackgroundPush(); setNotice('Background notifications are enabled on this device.'); }
      if (kind === 'disable') { await disableBackgroundPush(); setNotice('Background notifications are disabled on this device.'); }
      if (kind === 'test') { const result = await testBackgroundPush(); setNotice(result.message + '. Check your device notification area.'); }
      await load();
    } catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  }
  return <Panel title="Background notifications" subtitle="Receive new school update alerts even when the app is closed.">
    <div className="panel-body space-y-4">
      {error && <div className="state-box" role="alert">{error}<button className="underline ml-3" disabled={busy || loading} onClick={() => void load()}>Retry notification settings</button></div>}{notice && <div className="state-box success" role="status">{notice}</div>}
      <p className="text-sm muted">Enable notifications separately on each device. Alerts show a general message; sign in to read the school update.</p>
      {loading ? <p role="status">Checking this device...</p> : <>
        <p className="text-sm font-semibold">{enabled ? 'Enabled on this device' : 'Disabled on this device'}</p>
        {!supported && <p className="text-sm muted">Use a browser that supports Web Push over HTTPS.</p>}
        {installFirst && <p className="text-sm muted">On iPhone or iPad, add Krypton to your Home Screen and open the installed app before enabling notifications.</p>}
        {!configured && <p className="text-sm muted">Your school has not configured background push yet. School updates are still available in your inbox.</p>}
        {permission === 'denied' && supported && <p className="text-sm muted">Notifications are blocked in browser settings. Allow notifications for this site to enable them.</p>}
        <div className="flex flex-wrap gap-3">{(enabled || hasSubscription) && <>
          <Button variant="outline" disabled={busy} onClick={() => void change('disable')} leftIcon={<BellOff size={16} />}>Disable on this device</Button>
          {enabled && <Button disabled={busy || !configured} onClick={() => void change('test')}>Send test notification</Button>}
        </>}{!enabled && <Button disabled={busy || !supported || !configured || installFirst || permission === 'denied'} isLoading={busy}
          onClick={() => void change('enable')} leftIcon={<Bell size={16} />}>Enable background notifications</Button>}</div>
      </>}
    </div>
  </Panel>;
}
