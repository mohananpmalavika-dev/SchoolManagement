'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { schoolProgrammeLabels } from '@/lib/preschool';
import { messageFor } from '@/lib/workspace';
import { EmptyState, PageHeading, Panel } from './WorkspaceUI';
import { Button } from './ui';

type Programme = keyof typeof schoolProgrammeLabels;
interface SchoolOption { id: string; name: string; programme: Programme; isActive: boolean; tenant: { name: string } }

export function PlatformSchoolSetup() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [programme, setProgramme] = useState<Programme>('STANDARD');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const working = useRef(false);
  const load = useCallback(async () => {
    setLoading(true); setError(''); setSchoolId(''); setNotice('');
    try { setSchools((await apiClient.get<SchoolOption[]>('/admin/school-setup')).data); }
    catch (err) { setError(messageFor(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const school = schools.find(row => row.id === schoolId);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!school || working.current || programme === school.programme) return;
    working.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const updated = (await apiClient.patch<{ id: string; programme: Programme }>('/admin/school-setup/' + encodeURIComponent(school.id), { programme })).data;
      setSchools(rows => rows.map(row => row.id === updated.id ? { ...row, programme: updated.programme } : row));
      setNotice(school.name + ': school type saved. The school menu will reflect this type on refresh.');
    } catch (err) { setError(messageFor(err)); }
    finally { working.current = false; setBusy(false); }
  }
  return <>
    <PageHeading eyebrow="PLATFORM" title="School setup" description="Set each school’s programme. Only the platform Super Admin can change school type."
      actions={<><Link className="account-back-link" href="/admin/schools">Manage schools</Link><Button size="sm" variant="outline" disabled={loading || busy} leftIcon={<RefreshCw size={15}/>} onClick={() => void load()}>Refresh</Button></>}/>
    {error && <div className="state-box mb-4" role="alert">{error}<button className="underline ml-3" disabled={loading || busy} onClick={() => void load()}>Reload schools</button></div>}
    {notice && <div className="state-box success mb-4" role="status">{notice}</div>}
    {loading ? <p role="status">Loading schools…</p> : !schools.length ? <EmptyState title="No schools available" description="Create a school in Schools, then return here to select its type."/> : <Panel title="School type" subtitle="Choose a school, select its programme and save. Principals manage academic and daily preschool work after setup.">
      <form className="panel-body space-y-6" onSubmit={event => void save(event)}>
        <div className="form-grid">
          <div className="field"><label htmlFor="setup-school">School</label><select id="setup-school" value={schoolId} disabled={busy} required onChange={event => { const row = schools.find(item => item.id === event.target.value); setSchoolId(row?.id || ''); setProgramme(row?.programme || 'STANDARD'); setNotice(''); setError(''); }}><option value="">Choose a school</option>{schools.map(row => <option key={row.id} value={row.id}>{row.name}{row.tenant.name !== row.name ? ' — ' + row.tenant.name : ''}{!row.isActive ? ' (inactive)' : ''}</option>)}</select></div>
          <div className="field"><label htmlFor="setup-programme">School type</label><select id="setup-programme" value={programme} disabled={!school || busy} onChange={event => { setProgramme(event.target.value as Programme); setNotice(''); }}>{Object.entries(schoolProgrammeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        </div>
        {school && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold">Saved type: {schoolProgrammeLabels[school.programme]}</p><p className="muted mt-2">{programme === 'STANDARD' ? 'Academic and school operations menus are available.' : programme === 'PRESCHOOL' ? 'Preschool care, learning and development menus are available.' : 'Regular school and preschool menus are available together.'} Class and staff assignments are retained when the type changes.</p></div>}
        <Button type="submit" isLoading={busy} disabled={!school || programme === school.programme}>Save school type</Button>
      </form>
    </Panel>}
  </>;
}
