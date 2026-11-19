'use client';
import { useState, useEffect, useCallback, useMemo, useRef, useId } from 'react';
import { Search, Plus, Download, RefreshCw, Pencil, ArrowDown, ArrowUp, ArrowUpDown, X, LayoutGrid, List, ArrowUpRight } from 'lucide-react';
import { Button } from './ui';
import { PageHeading, EmptyState, StatusPill } from './WorkspaceUI';
import { RecordModal, type Field } from './RecordModal';
import { apiClient } from '@/lib/api-client';
import { getRows, messageFor, exportCsv, money, dateLabel } from '@/lib/workspace';
import { useAuth } from '@/contexts/AuthContext';
import { educationLevelLabels, preschoolStages } from '@/lib/academic-setup';
export interface Column { key: string; label: string; format?: 'money' | 'date' | 'status' }
interface Props { title: string; description: string; endpoint: string; columns: Column[]; fields?: Field[]; editable?: boolean; createAllowed?: boolean; action?: { label: string; path: string } }
const directories = new Set(['students', 'guardians', 'staff', 'schools', 'users', 'books', 'materials']);
export function ResourcePage({ title, description, endpoint, columns, fields, editable = false, createAllowed = true, action }: Props) {
  const { user } = useAuth();
  const role = user?.role || '';
  const resource = endpoint.split('/').filter(Boolean).at(-1) || '';
  const deputyRestricted = ['guardians','guardian-links','staff','books','borrowings','vehicles','routes','invoices','payments','assignments','materials'].includes(resource);
  const canWrite = !!fields && (
    resource === 'tickets' && ['ACCOUNTANT','LIBRARIAN','TRANSPORT_OFFICER','RECEPTIONIST','AUDITOR'].includes(role) ||
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
  const [view, setView] = useState<'cards' | 'table'>(directories.has(resource) ? 'cards' : 'table');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Record<string, any> | undefined>();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, any> | undefined>();
  const previewDialog = useRef<HTMLDialogElement>(null);
  const previewTitle = useId();
  useEffect(() => {
    if (!preview) { previewDialog.current?.close(); return; }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previewDialog.current?.showModal();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [preview]);
  useEffect(() => { setPreview(undefined); }, [endpoint]);
  const viewKey = 'krypton:view:' + (user?.tenantId || 'platform') + ':' + user?.id + ':' + resource;
  useEffect(() => {
    let next: 'cards' | 'table' = directories.has(resource) ? 'cards' : 'table';
    try { const saved = localStorage.getItem(viewKey); if (saved === 'cards' || saved === 'table') next = saved; } catch { /* Display preferences are optional. */ }
    setView(next);
  }, [resource, viewKey]);
  const changeView = (next: 'cards' | 'table') => {
    setView(next);
    try { localStorage.setItem(viewKey, next); } catch { /* The view still works without storage. */ }
  };
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRows(await getRows(endpoint)); } catch (err) { setError(messageFor(err)); } finally { setLoading(false); }
  }, [endpoint, setLoading, setError, setRows]);
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
  const recordLabel = resource === 'classes' ? 'class' : resource === 'streams' ? 'section' : resource === 'years' ? 'school year' : resource === 'terms' ? 'term' : title === 'People & access' ? 'user' : title === 'Students' ? 'student' : title === 'Guardians' ? 'guardian' : title === 'Staff' ? 'staff member' : 'record';
  const canAct = !!action && (role === 'SUPER_ADMIN' || ['SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN'].includes(role) || role === 'DEPUTY_PRINCIPAL' && !deputyRestricted || role === 'LIBRARIAN' && resource === 'borrowings');
  const showActions = editable && canWrite || canAct;
  const primaryName = (row: Record<string, any>) => String(row[columns[0]?.key] ?? row.name ?? row.title ?? 'Record');
  const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('');
  const edit = (row: Record<string, any>) => { setSelected(row); setModal(true); };
  function value(column: Column, row: Record<string, any>) {
    if (column.key === 'educationLevel') return educationLevelLabels[row[column.key]] || row[column.key] || '—';
    if (column.key === 'preschoolStage') return preschoolStages[row[column.key] as keyof typeof preschoolStages] || 'Stage not assigned';
    if (column.format === 'status') return <StatusPill value={String(row[column.key] ?? 'UNKNOWN')}/>;
    if (column.format === 'money') return row[column.key] == null ? '\u2014' : money(Number(row[column.key]));
    if (column.format === 'date') return dateLabel(row[column.key]);
    return String(row[column.key] ?? '\u2014');
  }
  return <div className="resource-workspace">
    <PageHeading eyebrow={directories.has(resource) ? 'Your directory' : 'School records'} title={title} description={description} actions={<><Button size="sm" variant="outline" leftIcon={<Download size={15}/>} disabled={loading || !!error || !filtered.length} onClick={() => exportCsv(title, columns, filtered)}>Export CSV</Button>{canWrite && createAllowed && <Button size="sm" leftIcon={<Plus size={16}/>} onClick={() => setModal(true)}>Add {recordLabel}</Button>}</>}/>
    {notice && <div role="status" className="state-box success flex items-center justify-between gap-4">{notice}<button className="icon-button" aria-label="Dismiss confirmation" onClick={() => setNotice('')}><X size={16}/></button></div>}
    {error && <div role="alert" className="state-box">{error} <button disabled={loading} onClick={() => void load()} className="underline ml-3">Retry</button></div>}
    <section className={'records-surface ' + (view === 'table' ? 'table-surface' : '')} aria-label={title + ' records'}>
      <div className="table-toolbar">
        <div className="resource-filters"><div className="search-field"><Search size={18}/><input type="search" placeholder={'Find in ' + title.toLowerCase()} aria-label={'Search ' + title} value={search} onChange={e => setSearch(e.target.value)}/></div>{statusKey && <select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(item => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select>}{hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters}>Clear filters</Button>}</div>
        <div className="record-display-controls"><div className="view-switch" role="group" aria-label="Record display"><button aria-label="Card view" aria-pressed={view === 'cards'} onClick={() => changeView('cards')}><LayoutGrid size={16}/><span>Cards</span></button><button aria-label="Table view" aria-pressed={view === 'table'} onClick={() => changeView('table')}><List size={17}/><span>Table</span></button></div><button className="icon-button" disabled={loading} aria-label="Refresh records" onClick={() => void load()}><RefreshCw size={17} className={loading ? 'animate-spin' : ''}/></button></div>
      </div>
      <div className="record-summary"><span><strong>{filtered.length.toLocaleString()}</strong> {hasFilters ? 'matching' : 'loaded'} records{error ? ' from the previous load' : ''}</span>{view === 'cards' && <label className="record-sort"><ArrowUpDown size={14}/><span className="sr-only">Sort records</span><select aria-label="Sort records" value={sort ? sort.key + ':' + sort.direction : ''} onChange={event => { const [key, direction] = event.target.value.split(':'); setSort(key ? { key, direction: direction as 'asc' | 'desc' } : null); }}><option value="">Default order</option>{columns.flatMap(column => ['asc','desc'].map(direction => <option key={column.key + direction} value={column.key + ':' + direction}>{column.label} {direction === 'asc' ? '(ascending)' : '(descending)'}</option>))}</select></label>}{view === 'table' && <span>{hasFilters ? 'Showing filtered results' : 'All loaded records'}{sort ? ' \u00b7 Sorted by ' + columns.find(c => c.key === sort.key)?.label.toLowerCase() : ''}</span>}</div>
      {!!statuses.length && <div className="record-status-tabs" role="group" aria-label="Record status shortcuts"><button aria-pressed={!status} onClick={() => setStatus('')}>All records<span>{rows.length}</span></button>{statuses.map(item => <button key={item} aria-pressed={status === item} onClick={() => setStatus(item)}>{item.replaceAll('_',' ').toLowerCase()}<span>{rows.filter(row => String(row[statusKey!]) === item).length}</span></button>)}</div>}
      {loading ? <div className="record-grid" aria-busy="true" aria-label="Loading records">{[1,2,3,4,5,6].map(i => <div className="skeleton h-48" key={i}/>)}</div> : error ? <EmptyState title="Records could not be refreshed" description="Try again to load current school records." retry={() => void load()}/> : !visible.length ? <EmptyState title={hasFilters ? 'No matching records' : 'No records yet'} description={hasFilters ? 'Clear the filters or try another search.' : 'Records will appear here when your school adds them.'}/> : view === 'cards' ? <div className="record-grid">{visible.map(row => <article className="record-card" key={row.id} aria-label={primaryName(row) + ' record'}><div className="record-card-top"><span className="record-avatar" aria-hidden="true">{initials(primaryName(row))}</span>{statusKey && <StatusPill value={String(row[statusKey] ?? 'UNKNOWN')}/>}</div><h2><button className="record-open" aria-label={'View ' + primaryName(row)} onClick={() => setPreview(row)}>{primaryName(row)}<ArrowUpRight size={16}/></button></h2><dl>{columns.slice(1).filter(column => column.key !== statusKey).map(column => <div key={column.key}><dt>{column.label}</dt><dd>{value(column,row)}</dd></div>)}</dl>{showActions && <div className="record-card-actions">{editable && canWrite && <button aria-label={'Edit ' + primaryName(row)} onClick={() => edit(row)}><Pencil size={14}/><span>Edit details</span><ArrowUpRight size={15}/></button>}{canAct && action && <Button size="sm" variant="outline" disabled={!!busy || row.status === 'RETURNED'} onClick={() => void run(row)}>{busy === row.id ? 'Working...' : action.label}</Button>}</div>}</article>)}</div> : <div className="table-wrap"><table><caption className="sr-only">{title} {filtered.length} matching records</caption><thead><tr>{columns.map(column => <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button className="sort-button" aria-label={'Sort by ' + column.label} onClick={() => toggleSort(column.key)}>{column.label}{sort?.key === column.key ? sort.direction === 'asc' ? <ArrowUp size={13}/> : <ArrowDown size={13}/> : <ArrowUpDown size={13}/>}</button></th>)}{showActions && <th scope="col">Actions</th>}</tr></thead><tbody>{visible.map(row => <tr key={row.id}>{columns.map((column, index) => <td key={column.key}>{index === 0 && !column.format && ['name','studentName','guardianName','teacherName'].includes(column.key) ? <span className="record-name"><span className="record-avatar" aria-hidden="true">{initials(String(row[column.key] || ''))}</span><button className="record-open" aria-label={'View ' + primaryName(row)} onClick={() => setPreview(row)}>{value(column,row)}</button></span> : value(column,row)}</td>)}{showActions && <td><div className="flex gap-2">{editable && canWrite && <button className="icon-button" aria-label={'Edit ' + primaryName(row)} onClick={() => edit(row)}><Pencil size={15}/></button>}{canAct && action && <Button size="sm" variant="outline" disabled={!!busy || row.status === 'RETURNED'} onClick={() => void run(row)}>{busy === row.id ? 'Working...' : action.label}</Button>}</div></td>}</tr>)}</tbody></table></div>}
      <div className="table-pagination"><span aria-live="polite">{filtered.length ? (safePage - 1) * pageSize + 1 : 0}{'\u2013'}{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2 flex-wrap"><label className="sr-only" htmlFor="resource-page-size">Records per page</label><select id="resource-page-size" className="page-size-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>{[10,25,50].map(size => <option key={size} value={size}>{size} / page</option>)}</select><Button variant="ghost" size="sm" disabled={safePage <= 1 || loading} onClick={() => setPage(safePage - 1)}>Previous</Button><span>{safePage} / {pages}</span><Button variant="ghost" size="sm" disabled={safePage >= pages || loading} onClick={() => setPage(safePage + 1)}>Next</Button></div></div>
    </section>
    <dialog ref={previewDialog} className="record-detail-dialog" aria-labelledby={previewTitle} onCancel={() => setPreview(undefined)} onClose={() => setPreview(undefined)} onClick={event => { if (event.target === event.currentTarget) setPreview(undefined); }}>
      {preview && <><div className="record-detail-header"><span className="eyebrow">{title} / Record overview</span><button className="icon-button" aria-label="Close record preview" onClick={() => setPreview(undefined)}><X size={19}/></button></div><div className="record-detail-identity"><span className="record-avatar">{initials(primaryName(preview))}</span><h2 id={previewTitle}>{primaryName(preview)}</h2>{statusKey && <StatusPill value={String(preview[statusKey] ?? 'UNKNOWN')}/>}</div><div className="record-detail-body"><h3>Record details</h3><dl>{columns.slice(1).filter(column => column.key !== statusKey).map(column => <div key={column.key}><dt>{column.label}</dt><dd>{value(column, preview)}</dd></div>)}{fields?.filter(field => !columns.some(column => column.key === field.key) && ['date','email','textarea'].includes(field.type || '') && preview[field.key] != null && preview[field.key] !== '').map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.type === 'date' ? dateLabel(preview[field.key]) : String(preview[field.key])}</dd></div>)}</dl></div><div className="record-detail-footer"><Button variant="outline" onClick={() => setPreview(undefined)}>Close preview</Button>{editable && canWrite && <Button leftIcon={<Pencil size={15}/>} onClick={() => { previewDialog.current?.close(); setPreview(undefined); edit(preview); }}>Edit details</Button>}</div></>}
    </dialog>
    {modal && fields && <RecordModal title={selected ? 'Edit ' + recordLabel : 'Add ' + recordLabel} endpoint={endpoint} fields={fields} initial={selected} onClose={close} onSaved={() => {close();setNotice('Record saved successfully.');void load();}}/>}
  </div>;
}
