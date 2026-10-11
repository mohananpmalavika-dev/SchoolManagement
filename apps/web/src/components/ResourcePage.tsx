'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Download, RefreshCw, Pencil, ArrowDown, ArrowUp, ArrowUpDown, X } from 'lucide-react';
import { Button } from './ui';
import { PageHeading, EmptyState, StatusPill } from './WorkspaceUI';
import { RecordModal, type Field } from './RecordModal';
import { apiClient } from '@/lib/api-client';
import { getRows, messageFor, exportCsv, money, dateLabel } from '@/lib/workspace';
import { useAuth } from '@/contexts/AuthContext';
export interface Column { key: string; label: string; format?: 'money' | 'date' | 'status' }
interface Props { title: string; description: string; endpoint: string; columns: Column[]; fields?: Field[]; editable?: boolean; createAllowed?: boolean; action?: { label: string; path: string } }
export function ResourcePage({ title, description, endpoint, columns, fields, editable = false, createAllowed = true, action }: Props) {
  const { user } = useAuth();
  const role = user?.role || '';
  const resource = endpoint.split('/').filter(Boolean).at(-1) || '';
  const deputyRestricted = ['guardians','guardian-links','staff','books','borrowings','vehicles','routes','invoices','payments','assignments','materials'].includes(resource);
  const canWrite = !!fields && (
    ['TEACHER', 'CLASS_TEACHER', 'EXAM_OFFICER'].includes(role) && /assignments|materials|submissions/.test(endpoint) ||
    ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'SCHOOL_ADMIN'].includes(role) || role === 'DEPUTY_PRINCIPAL' && !deputyRestricted ||
    role === 'ACCOUNTANT' && /invoices|payments/.test(endpoint) ||
    role === 'LIBRARIAN' && /books|borrowings/.test(endpoint) ||
    role === 'TRANSPORT_OFFICER' && /vehicles|routes/.test(endpoint) ||
    role === 'RECEPTIONIST' && /students|guardians|guardian-links/.test(endpoint));
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Record<string, any> | undefined>();
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRows(await getRows(endpoint)); } catch (err) { setError(messageFor(err)); } finally { setLoading(false); }
  }, [endpoint]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, sort, pageSize, endpoint]);
  const statusKey = columns.find(column => column.format === 'status')?.key;
  const statuses = useMemo(() => statusKey ? Array.from(new Set(rows.map(row => String(row[statusKey] || '')).filter(Boolean))).sort() : [], [rows, statusKey]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = rows.filter(row => (!status || !statusKey || String(row[statusKey]) === status) && columns.some(column => String(row[column.key] ?? '').toLowerCase().includes(query)));
    if (sort) {
      const column = columns.find(column => column.key === sort.key);
      result.sort((a, b) => {
        const left = a[sort.key], right = b[sort.key];
        if (left == null) return right == null ? 0 : 1;
        if (right == null) return -1;
        let order: number;
        if (column?.format === 'money' || typeof left === 'number' && typeof right === 'number') order = Number(left) - Number(right);
        else if (column?.format === 'date') order = new Date(left).getTime() - new Date(right).getTime();
        else order = String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
        return sort.direction === 'asc' ? order : -order;
      });
    }
    return result;
  }, [rows, columns, search, status, statusKey, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const close = useCallback(() => { setModal(false); setSelected(undefined); }, []);
  const hasFilters = !!search || !!status;
  const clearFilters = () => { setSearch(''); setStatus(''); };
  function toggleSort(key: string) { setSort(current => current?.key === key && current.direction === 'desc' ? null : { key, direction: current?.key === key ? 'desc' : 'asc' }); }
  async function run(row: Record<string, any>) {
    if (busy || !action) return;
    setBusy(row.id); setError('');
    try { await apiClient.post(endpoint + '/' + row.id + '/' + action.path); setNotice(action.label + ' completed.'); await load(); }
    catch (err) { setError(messageFor(err)); } finally { setBusy(null); }
  }
  const recordLabel = title === 'People & access' ? 'user' : title === 'Students' ? 'student' : title === 'Guardians' ? 'guardian' : title === 'Staff' ? 'staff member' : 'record';
  const canAct = !!action && (role === 'SUPER_ADMIN' || ['SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN'].includes(role) || role === 'DEPUTY_PRINCIPAL' && !deputyRestricted || role === 'LIBRARIAN' && resource === 'borrowings');
  const showActions = editable && canWrite || canAct;
  return <><PageHeading eyebrow="SCHOOL RECORDS" title={title} description={description} actions={<><Button size="sm" variant="outline" leftIcon={<Download size={15}/>} disabled={loading || !!error || !filtered.length} onClick={() => exportCsv(title, columns, filtered)}>Export CSV</Button>{canWrite && createAllowed && <Button size="sm" leftIcon={<Plus size={16}/>} onClick={() => setModal(true)}>Add {recordLabel}</Button>}</>}/>
    {notice && <div role="status" className="state-box success flex items-center justify-between gap-4">{notice}<button className="icon-button" aria-label="Dismiss confirmation" onClick={() => setNotice('')}><X size={16}/></button></div>}
    {error && <div role="alert" className="state-box">{error} <button disabled={loading} onClick={() => void load()} className="underline ml-3">Retry</button></div>}
    <section className="panel" aria-label={title + ' records'}>
      <div className="table-toolbar"><div className="resource-filters"><div className="search-field"><Search size={16}/><input type="search" placeholder={'Search ' + title.toLowerCase() + '…'} aria-label={'Search ' + title} value={search} onChange={e => setSearch(e.target.value)}/></div>{statusKey && <select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>}{hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters}>Clear filters</Button>}</div><div className="flex items-center gap-3"><span className="pill neutral">{filtered.length} records</span><button className="icon-button" disabled={loading} aria-label="Refresh records" onClick={() => void load()}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button></div></div>
      <div className="record-summary"><span><strong>{rows.length.toLocaleString()}</strong> loaded records</span><span>{hasFilters ? 'Showing filtered results' : 'All loaded records'}{sort ? ' · Sorted by ' + columns.find(c => c.key === sort.key)?.label.toLowerCase() : ''}</span></div>
      {loading ? <div className="panel-body space-y-4" aria-busy="true" aria-label="Loading records">{[1,2,3,4,5].map(i => <div className="skeleton h-10" key={i}/>)}</div> : error ? <EmptyState title="Records could not be refreshed" description="Try again to load current school records." retry={() => void load()}/> : !visible.length ? <EmptyState title={hasFilters ? 'No matching records' : 'No records yet'} description={hasFilters ? 'Clear the filters or try another search.' : 'Records will appear here when your school adds them.'}/> : <div className="table-wrap"><table><caption className="sr-only">{title} · {filtered.length} matching records</caption><thead><tr>{columns.map(column => <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button className="sort-button" aria-label={'Sort by ' + column.label} onClick={() => toggleSort(column.key)}>{column.label}{sort?.key === column.key ? sort.direction === 'asc' ? <ArrowUp size={13}/> : <ArrowDown size={13}/> : <ArrowUpDown size={13}/>}</button></th>)}{showActions && <th scope="col">Actions</th>}</tr></thead><tbody>{visible.map(row => <tr key={row.id}>{columns.map((column, index) => <td key={column.key}>{column.format === 'status' ? <StatusPill value={String(row[column.key] ?? 'UNKNOWN')}/> : column.format === 'money' ? row[column.key] == null ? '—' : money(Number(row[column.key])) : column.format === 'date' ? dateLabel(row[column.key]) : index === 0 && ['name','studentName','guardianName','teacherName'].includes(column.key) ? <span className="record-name"><span className="record-avatar" aria-hidden="true">{String(row[column.key] || '').split(' ').filter(Boolean).slice(0,2).map(word => word[0]).join('')}</span>{String(row[column.key] ?? '—')}</span> : String(row[column.key] ?? '—')}</td>)}{showActions && <td><div className="flex gap-2">{editable && canWrite && <button className="icon-button" aria-label={'Edit ' + String(row.name || row.title || 'record')} onClick={() => {setSelected(row);setModal(true);}}><Pencil size={15}/></button>}{canAct && action && <Button size="sm" variant="outline" disabled={!!busy || row.status === 'RETURNED'} onClick={() => void run(row)}>{busy === row.id ? 'Working…' : action.label}</Button>}</div></td>}</tr>)}</tbody></table></div>}
      <div className="table-pagination"><span aria-live="polite">{filtered.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2 flex-wrap"><label className="sr-only" htmlFor="resource-page-size">Records per page</label><select id="resource-page-size" className="page-size-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>{[10,25,50].map(size => <option key={size} value={size}>{size} / page</option>)}</select><Button variant="ghost" size="sm" disabled={safePage <= 1 || loading} onClick={() => setPage(safePage - 1)}>Previous</Button><span>{safePage} / {pages}</span><Button variant="ghost" size="sm" disabled={safePage >= pages || loading} onClick={() => setPage(safePage + 1)}>Next</Button></div></div>
    </section>{modal && fields && <RecordModal title={selected ? 'Edit ' + recordLabel : 'Add ' + recordLabel} endpoint={endpoint} fields={fields} initial={selected} onClose={close} onSaved={() => {close();setNotice('Record saved successfully.');void load();}}/>}</>;
}
