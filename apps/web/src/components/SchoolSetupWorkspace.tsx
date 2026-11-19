'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { emptyPreschoolOptions, type PreschoolAction, type PreschoolOptions } from '@/lib/preschool';
import { messageFor } from '@/lib/workspace';
import { PageHeading } from './WorkspaceUI';
import { Button } from './ui';
import { PreschoolSettings } from './preschool/PreschoolSettings';

export function SchoolSetupWorkspace() {
  const [options, setOptions] = useState<PreschoolOptions>(emptyPreschoolOptions);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const working = useRef(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setOptions((await apiClient.get<PreschoolOptions>('/preschool/options')).data); }
    catch (err) { setError(messageFor(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const action: PreschoolAction = async (path, data, method = 'post') => {
    if (working.current) return false;
    working.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (method === 'delete') await apiClient.delete('/preschool' + path);
      else await apiClient[method]('/preschool' + path, data);
      setOptions((await apiClient.get<PreschoolOptions>('/preschool/options')).data);
      window.dispatchEvent(new Event('preschool-configuration-changed'));
      setNotice('Preschool setup saved.');
      return true;
    } catch (err) { setError(messageFor(err)); return false; }
    finally { working.current = false; setBusy(false); }
  };
  const hasPreschool = options.schools.some(school => school.programme !== 'STANDARD');
  return <>
    <PageHeading eyebrow="PRESCHOOL" title="Preschool setup" description="Manage class stages, teaching staff and safe pickup. The platform Super Admin manages your school type."
      actions={<><Link className="account-back-link" href="/school/academics">Academic setup</Link><Button size="sm" variant="outline" disabled={loading || busy} leftIcon={<RefreshCw size={15}/>} onClick={() => void load()}>Refresh</Button></>}/>
    {error && <div className="state-box mb-4" role="alert">{error}<button className="underline ml-3" disabled={busy || loading} onClick={() => void load()}>Try again</button></div>}
    {notice && <div className="state-box success mb-4" role="status">{notice}</div>}
    {loading ? <p role="status">Loading preschool setup…</p> : <PreschoolSettings options={options} action={action} busy={busy}/>}
    {!loading && hasPreschool && <div className="panel panel-body mt-6 flex flex-wrap items-center justify-between gap-4"><p>After assigning preschool classes and teachers, open the daily workspace.</p><Link className="account-back-link" href="/school/preschool?section=daily">Open preschool workspace</Link></div>}
  </>;
}
