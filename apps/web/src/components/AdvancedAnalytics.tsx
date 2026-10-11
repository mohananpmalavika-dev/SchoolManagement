'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BarChart3, ClipboardCheck, CreditCard, Download, GraduationCap, Printer, RefreshCw, Save, TrendingUp, Users } from 'lucide-react';
import type { AdvancedAnalyticsOptions, AnalyticsTrend, ExecutiveAnalyticsReport, SchoolBenchmarkReport } from '@krypton/types';
import { apiClient } from '@/lib/api-client';
import { exportCsv, messageFor } from '@/lib/workspace';
import { predictiveAnalyticsRoles } from '@/lib/session';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { EmptyState, PageHeading, Panel, StatCard } from './WorkspaceUI';
import { Button } from './ui';

type Filters = { from: string; to: string; classId: string; subjectId: string };
type Dataset = 'classes' | 'subjects' | 'trend' | 'summary';
type Cell = string | number | null;
type Row = Record<string, Cell>;
type Column = { key: string; label: string; format?: 'percent' | 'money' };
type SavedReport = { id: string; name: string; filters: Filters; dataset: Dataset; columns: string[] };
const today = () => new Date().toISOString().slice(0, 10);
const percent = (value: number | null) => value === null ? 'No records' : `${value}%`;
const money = (value: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value / 100);
const scoreColumn: Column = { key: 'averageScore', label: 'Mean score', format: 'percent' };
const attendanceColumn: Column = { key: 'attendanceRate', label: 'Attendance', format: 'percent' };
const receiptColumn: Column = { key: 'receipts', label: 'Receipts', format: 'money' };
const metricColumns: Column[] = [{ key: 'students', label: 'Active students' }, { key: 'assessedStudents', label: 'Students assessed' }, { key: 'assessmentCount', label: 'Assessment results' }, scoreColumn,
  { key: 'passRate', label: 'Assessment pass rate', format: 'percent' }, attendanceColumn, { key: 'attendanceDays', label: 'Recorded student-days' }, { key: 'attendanceStudents', label: 'Students with attendance' },
  { key: 'billed', label: 'Period billed', format: 'money' }, receiptColumn, { key: 'invoiceSettlementRate', label: 'Invoice settlement now', format: 'percent' },
  { key: 'outstanding', label: 'Outstanding now', format: 'money' }, { key: 'overdue', label: 'Overdue now', format: 'money' }];
const columnSets: Record<Dataset, Column[]> = {
  classes: [{ key: 'name', label: 'Class' }, ...metricColumns],
  subjects: [{ key: 'name', label: 'Subject' }, ...metricColumns.filter(c => ['assessedStudents', 'assessmentCount', 'averageScore', 'passRate'].includes(c.key))],
  trend: [{ key: 'date', label: 'Date (UTC)' }, scoreColumn, { key: 'assessmentCount', label: 'Assessment results' }, attendanceColumn, { key: 'attendanceDays', label: 'Recorded student-days' }, receiptColumn],
  summary: [{ key: 'name', label: 'Period' }, ...metricColumns],
};
const initialColumns: Record<Dataset, string[]> = { classes: ['name', 'students', 'averageScore', 'attendanceRate', 'receipts'], subjects: ['name', 'assessedStudents', 'assessmentCount', 'averageScore', 'passRate'], trend: ['date', 'averageScore', 'attendanceRate', 'receipts'], summary: ['name', 'students', 'averageScore', 'attendanceRate', 'receipts'] };
function formatCell(value: Cell | undefined, column: Column, currency: string) {
  if (value === null || value === undefined) return 'No records';
  return column.format === 'percent' ? `${value}%` : column.format === 'money' ? money(Number(value), currency) : String(value);
}
function delta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return 'Previous period: no comparable records';
  const change = Math.round((current - previous) * 10) / 10;
  return `${change > 0 ? '+' : ''}${change} percentage points vs previous period`;
}
function Table({ rows, columns, currency }: { rows: Row[]; columns: Column[]; currency: string }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map(c => <th key={c.key}>{c.label}{c.format === 'money' ? ` (${currency})` : ''}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={String(row.id ?? row.date ?? i)}>{columns.map(c => <td key={c.key}>{formatCell(row[c.key], c, currency)}</td>)}</tr>)}</tbody></table></div>;
}
function validSaved(value: unknown): value is SavedReport {
  if (!value || typeof value !== 'object') return false;
  const v = value as SavedReport;
  return typeof v.id === 'string' && typeof v.name === 'string' && v.name.length <= 80 && !!v.filters &&
    ['from', 'to', 'classId', 'subjectId'].every(key => typeof v.filters[key as keyof Filters] === 'string') &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.filters.from) && /^\d{4}-\d{2}-\d{2}$/.test(v.filters.to) && Object.hasOwn(columnSets, v.dataset) &&
    Array.isArray(v.columns) && v.columns.length > 0 && v.columns.every(key => columnSets[v.dataset].some(c => c.key === key));
}
function TrendChart({ rows, currency }: { rows: AnalyticsTrend[]; currency: string }) {
  const [metric, setMetric] = useState<'attendanceRate' | 'averageScore' | 'receipts'>('attendanceRate');
  const [selected, setSelected] = useState<number | null>(null);
  const size = Math.max(1, Math.ceil(rows.length / 12));
  const bins = Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => {
    const days = rows.slice(i * size, (i + 1) * size), sampleCount = days.reduce((n, d) => n + (metric === 'averageScore' ? d.assessmentCount : d.attendanceDays), 0);
    const value = metric === 'receipts' ? days.reduce((n, d) => n + d.receipts, 0) : sampleCount ? Math.round(days.reduce((n, d) => n + (d[metric] ?? 0) * (metric === 'averageScore' ? d.assessmentCount : d.attendanceDays), 0) / sampleCount * 10) / 10 : null;
    return { from: days[0].date, to: days[days.length - 1].date, value, sampleCount };
  });
  const max = metric === 'receipts' ? Math.max(1, ...bins.map(b => b.value ?? 0)) : 100;
  const label = metric === 'averageScore' ? 'Mean score' : metric === 'attendanceRate' ? 'Attendance' : 'Receipts';
  const active = selected === null ? null : bins[selected];
  return <Panel title="Performance over time" subtitle="Select a bar to inspect its dates and recorded evidence."><div className="panel-body">
    <label className="adv-inline-field">Chart metric<select aria-label="Chart metric" value={metric} onChange={e => { setMetric(e.target.value as typeof metric); setSelected(null); }}><option value="attendanceRate">Attendance</option><option value="averageScore">Mean score</option><option value="receipts">Fee receipts</option></select></label>
    <div className="adv-chart" aria-label={`${label} by date range`}>{bins.map((b, i) => <button key={b.from} type="button" className={`adv-chart-column ${selected === i ? 'selected' : ''}`} aria-pressed={selected === i} aria-label={`${label}, ${b.from} to ${b.to}: ${b.value === null ? 'No records' : metric === 'receipts' ? money(b.value, currency) : `${b.value}%`}`} onClick={() => setSelected(i)}>
      <span>{b.value === null ? '—' : metric === 'receipts' ? money(b.value, currency) : `${b.value}%`}</span><div className={b.value === null ? 'adv-chart-missing' : 'adv-chart-bar'} style={{ height: `${b.value === null ? 2 : Math.max(2, b.value / max * 100)}%` }} /><small>{b.from.slice(5)}</small></button>)}</div>
    <p className="muted adv-chart-note" role="status">{active ? `${active.from} – ${active.to} · ${label}: ${active.value === null ? 'No records' : metric === 'receipts' ? money(active.value, currency) : `${active.value}%`}${metric === 'receipts' ? '' : ` · ${active.sampleCount} ${metric === 'averageScore' ? 'assessment results' : 'recorded student-days'}`}` : 'Rates are weighted by recorded evidence in each date range. A dash means no usable records.'}</p>
  </div></Panel>;
}

export function AdvancedAnalytics({ platform = false }: { platform?: boolean }) {
  return <ProtectedRoute allowedRoles={platform ? ['SUPER_ADMIN'] : predictiveAnalyticsRoles}>{platform ? <PlatformBenchmarks /> : <SchoolAnalytics />}</ProtectedRoute>;
}
function SchoolAnalytics() {
  const { user } = useAuth();
  const [options, setOptions] = useState<AdvancedAnalyticsOptions | null>(null), [report, setReport] = useState<ExecutiveAnalyticsReport | null>(null);
  const [filters, setFilters] = useState<Filters>({ from: '', to: '', classId: '', subjectId: '' });
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [tab, setTab] = useState('executive'), [dataset, setDataset] = useState<Dataset>('classes');
  const [columns, setColumns] = useState<string[]>(initialColumns.classes), [search, setSearch] = useState(''), [sortKey, setSortKey] = useState('name'), [descending, setDescending] = useState(false), [page, setPage] = useState(1);
  const [saved, setSaved] = useState<SavedReport[]>([]), [reportName, setReportName] = useState('');
  const active = useRef<AbortController | null>(null);
  const storageKey = `advanced-reports:${user?.tenantId}:${user?.id}`;
  useEffect(() => { try { const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]'); setSaved(Array.isArray(stored) ? stored.filter(validSaved).slice(0, 10) : []); } catch { setSaved([]); } }, [storageKey]);
  const load = useCallback(async (next: Filters) => {
    active.current?.abort(); const controller = new AbortController(); active.current = controller; setLoading(true); setError(''); setReport(null);
    try { const { data } = await apiClient.get<ExecutiveAnalyticsReport>('/advanced-analytics/report', { params: { from: next.from || undefined, to: next.to || undefined, classId: next.classId || undefined, subjectId: next.subjectId || undefined }, signal: controller.signal, timeout: 60000 }); if (!controller.signal.aborted) { setReport(data); setPage(1); } }
    catch (err) { if (!controller.signal.aborted) setError(messageFor(err)); } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  const initialize = useCallback(async (signal: AbortSignal) => {
    setLoading(true); setError('');
    try { const { data } = await apiClient.get<AdvancedAnalyticsOptions>('/advanced-analytics/options', { signal }); if (!signal.aborted) { setOptions(data); const next = { ...data.defaults, classId: '', subjectId: '' }; setFilters(next); void load(next); } }
    catch (err) { if (!signal.aborted) { setError(messageFor(err)); setLoading(false); } }
  }, [load]);
  useEffect(() => { const controller = new AbortController(); void initialize(controller.signal); return () => { controller.abort(); active.current?.abort(); }; }, [initialize]);
  useEffect(() => { setPage(1); }, [search, sortKey, descending, dataset]);
  const allColumns = columnSets[dataset], chosenColumns = allColumns.filter(c => columns.includes(c.key));
  const rows: Row[] = (() => {
    if (!report) return [];
    const data: Row[] = dataset === 'classes' ? report.classes.map(r => ({ ...r })) : dataset === 'subjects' ? report.subjects.map(r => ({ ...r })) : dataset === 'trend' ? report.trend.map(r => ({ ...r })) : [{ name: 'Selected period', ...report.current }, { name: 'Previous period', ...report.previous }];
    return data.filter(row => String(row.name ?? row.date ?? '').toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => {
      const x = a[sortKey], y = b[sortKey]; if (x === null || x === undefined) return y === null || y === undefined ? 0 : 1; if (y === null || y === undefined) return -1;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * (descending ? -1 : 1);
    });
  })();
  const pages = Math.max(1, Math.ceil(rows.length / 10)), currentPage = Math.min(page, pages);
  const persist = (next: SavedReport[]) => { try { localStorage.setItem(storageKey, JSON.stringify(next)); setSaved(next); return true; } catch { setNotice(''); setError('This browser could not save the report configuration. Free some storage and try again.'); return false; } };
  const saveView = () => {
    if (!report || reportName.trim().length < 2) return;
    const next: SavedReport = { id: crypto.randomUUID(), name: reportName.trim(), filters: { from: report.period.from, to: report.period.to, classId: report.filters.classId ?? '', subjectId: report.filters.subjectId ?? '' }, dataset, columns };
    if (persist([next, ...saved.filter(s => s.name !== next.name)].slice(0, 10))) { setNotice('Report configuration saved in this browser. It will reload fresh school data when opened.'); setReportName(''); }
  };
  const openSaved = (view: SavedReport) => { setFilters(view.filters); setDataset(view.dataset); setColumns(view.columns); setSortKey(columnSets[view.dataset][0].key); setSearch(''); setTab('reports'); setNotice(''); void load(view.filters); };
  const exportView = () => {
    if (!report) return;
    const metadata: Column[] = [{ key: 'from', label: 'Period start' }, { key: 'to', label: 'Period end' }, { key: 'classFilter', label: 'Class filter' }, { key: 'subjectFilter', label: 'Subject filter' }, { key: 'generatedAt', label: 'Generated at (UTC)' }];
    const exported = rows.map(row => Object.fromEntries([...metadata, ...chosenColumns].map(c => {
      const value = c.key === 'from' ? report.period.from : c.key === 'to' ? report.period.to : c.key === 'generatedAt' ? report.generatedAt : c.key === 'classFilter' ? options?.classes.find(s => s.id === report.filters.classId)?.name ?? 'All classes' : c.key === 'subjectFilter' ? options?.subjects.find(s => s.id === report.filters.subjectId)?.name ?? 'All subjects' : c.format === 'money' && typeof row[c.key] === 'number' ? Number(row[c.key]) / 100 : row[c.key] ?? 'No records';
      return [c.key, typeof value === 'string' && /^[\s]*[=+@-]/.test(value) ? "'" + value : value];
    })));
    exportCsv(`school-${dataset}-${report.period.from}-${report.period.to}`, [...metadata, ...chosenColumns].map(c => ({ key: c.key, label: c.label + (c.format === 'money' ? ` (${report.currency}, major units)` : '') })), exported);
  };
  return <div className="advanced-analytics"><div className="adv-screen content-stack">
    <PageHeading eyebrow="EVIDENCE FOR EVERY DECISION" title="Advanced Analytics" description="Learning, attendance and finance in one executive view." actions={<Button variant="outline" size="sm" isLoading={loading} leftIcon={<RefreshCw size={15} />} onClick={() => options ? void load(filters) : void initialize(new AbortController().signal)}>Refresh</Button>} />
    {error && <div className="state-box" role="alert">{error}<Button variant="outline" size="sm" onClick={() => options ? void load(filters) : void initialize(new AbortController().signal)}>Try again</Button></div>}
    {notice && <div className="state-box success" role="status">{notice}</div>}
    {options && <form className="panel panel-body adv-filters" onSubmit={e => { e.preventDefault(); setNotice(''); void load(filters); }}>
      <label className="adv-field">From<input aria-label="From date" type="date" required value={filters.from} max={today()} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} /></label>
      <label className="adv-field">To<input aria-label="To date" type="date" required value={filters.to} min={filters.from} max={today()} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} /></label>
      <label className="adv-field">Class<select aria-label="Analytics class" value={filters.classId} onChange={e => setFilters(f => ({ ...f, classId: e.target.value }))}><option value="">All classes</option>{options.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="adv-field">Subject<select aria-label="Analytics subject" value={filters.subjectId} onChange={e => setFilters(f => ({ ...f, subjectId: e.target.value }))}><option value="">All subjects</option>{options.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="adv-field">Term dates<select aria-label="Use term dates" defaultValue="" onChange={e => { const t = options.terms.find(t => t.id === e.target.value); if (t) setFilters(f => ({ ...f, from: t.startDate, to: t.endDate > today() ? today() : t.endDate })); }}><option value="">Custom dates</option>{options.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <Button type="submit" size="sm" disabled={loading}>Apply filters</Button><p className="adv-filter-note muted">Up to 366 days. Subject selection affects learning metrics. Balance figures are current snapshots.</p>
    </form>}
    {loading && <div className="panel panel-body" role="status">Building your analytics view…</div>}
    {report && <>
      <div className="adv-period"><strong>{report.schoolName} · {report.period.from} – {report.period.to}</strong><span>Compare: {report.period.previousFrom} – {report.period.previousTo} · Updated {new Date(report.generatedAt).toLocaleString()}</span></div>
      <div className="section-tabs" role="group" aria-label="Analytics sections">{[['executive', 'Executive dashboard'], ['reports', 'Custom reports'], ['benchmark', 'Class benchmarking'], ['insights', 'Performance insights']].map(([id, label]) => <button key={id} aria-pressed={tab === id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>
      {!report.current.students && <EmptyState title="No active students in this view" description="Add students or change the class filter. Missing data will stay unscored." />}
      {tab === 'executive' && <>
        <div className="metric-grid"><StatCard label="Active students" value={report.current.students} note={`${report.current.assessedStudents} assessed · ${report.current.attendanceStudents} with attendance`} icon={Users} />
          <StatCard label="Mean assessment score" value={percent(report.current.averageScore)} note={delta(report.current.averageScore, report.previous.averageScore)} icon={GraduationCap} />
          <StatCard label="Recorded attendance" value={percent(report.current.attendanceRate)} note={delta(report.current.attendanceRate, report.previous.attendanceRate)} icon={ClipboardCheck} />
          <StatCard label="Period receipts" value={money(report.current.receipts, report.currency)} note={`Previous period: ${money(report.previous.receipts, report.currency)}`} icon={CreditCard} />
          <StatCard label="Assessment pass rate" value={percent(report.current.passRate)} note={`${report.current.assessmentCount} subject assessment results`} icon={TrendingUp} />
          <StatCard label="Period billed" value={money(report.current.billed, report.currency)} note={`Invoice settlement now: ${percent(report.current.invoiceSettlementRate)}`} icon={CreditCard} />
          <StatCard label="Outstanding now" value={money(report.current.outstanding, report.currency)} note="Current balances across cohort invoices" icon={CreditCard} />
          <StatCard label="Overdue now" value={money(report.current.overdue, report.currency)} note="Current balances past their due date" icon={CreditCard} /></div>
        <TrendChart key={`${report.generatedAt}-${report.filters.classId}-${report.filters.subjectId}`} rows={report.trend} currency={report.currency} />
        <Panel title="Evidence coverage" subtitle="Read the sample size alongside every metric."><div className="panel-body adv-coverage"><div><strong>{report.current.assessedStudents} / {report.current.students}</strong><p>Students with assessment results</p></div><div><strong>{report.current.attendanceStudents} / {report.current.students}</strong><p>Students with usable attendance</p></div><div><strong>{report.current.attendanceDays}</strong><p>Recorded student-days</p></div></div></Panel>
      </>}
      {tab === 'reports' && <Panel title="Custom report builder" subtitle="Choose a dataset and columns. Exports include the full filtered report, across all pages."><div className="panel-body content-stack">
        <div className="adv-report-controls"><label className="adv-field">Dataset<select aria-label="Report dataset" value={dataset} onChange={e => { const next = e.target.value as Dataset; setDataset(next); setColumns(initialColumns[next]); setSortKey(columnSets[next][0].key); }}><option value="classes">Class performance</option><option value="subjects">Subject performance</option><option value="trend">Daily trend</option><option value="summary">Period comparison</option></select></label>
          <label className="adv-field">Search<input aria-label="Search report rows" value={search} placeholder="Class, subject or date" onChange={e => setSearch(e.target.value)} /></label><label className="adv-field">Sort by<select aria-label="Report sort field" value={sortKey} onChange={e => setSortKey(e.target.value)}>{allColumns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label><label className="adv-field">Order<select aria-label="Report sort order" value={descending ? 'desc' : 'asc'} onChange={e => setDescending(e.target.value === 'desc')}><option value="asc">Ascending</option><option value="desc">Descending</option></select></label></div>
        <fieldset className="adv-columns"><legend>Columns to include</legend>{allColumns.map(c => <label key={c.key}><input type="checkbox" aria-label={`Include ${c.label}`} checked={columns.includes(c.key)} disabled={columns.length === 1 && columns.includes(c.key)} onChange={e => setColumns(keys => e.target.checked ? [...keys, c.key] : keys.filter(k => k !== c.key))} />{c.label}</label>)}</fieldset>
        <div className="ai-action-row"><Button size="sm" disabled={!rows.length} leftIcon={<Download size={15} />} onClick={exportView}>Export report CSV</Button><Button variant="outline" size="sm" disabled={!rows.length} leftIcon={<Printer size={15} />} onClick={() => window.print()}>Print report</Button><span className="muted">{rows.length} rows · {chosenColumns.length} columns</span></div>
        <div className="adv-save-view"><label className="adv-field">Report name<input aria-label="Report name" maxLength={80} value={reportName} onChange={e => setReportName(e.target.value)} placeholder="For example: Monthly learning review" /></label><Button size="sm" variant="outline" disabled={reportName.trim().length < 2} leftIcon={<Save size={15} />} onClick={saveView}>Save report view</Button></div>
        <p className="muted adv-filter-note">Saved views keep filters and column choices in this browser, scoped to your school and account. Opening a view loads fresh data.</p>
        {!!saved.length && <div className="adv-saved">{saved.map(s => <div key={s.id}><button className="panel-link" onClick={() => openSaved(s)}>{s.name}</button><button aria-label={`Delete saved report ${s.name}`} onClick={() => persist(saved.filter(v => v.id !== s.id))}>Remove</button></div>)}</div>}
      </div>{rows.length ? <><Table rows={rows.slice((currentPage - 1) * 10, currentPage * 10)} columns={chosenColumns} currency={report.currency} /><div className="table-pagination"><span>{(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, rows.length)} of {rows.length} rows</span><div className="ai-action-row"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div></> : <EmptyState title="No report rows match" description="Change the dataset or search to see other records." />}</Panel>}
      {tab === 'benchmark' && <Panel title="Class benchmarking" subtitle="Compare each class with the selected cohort. Class levels and assessment difficulty may differ."><div className="panel-body adv-benchmark-baseline"><BarChart3 size={22} /><p>Selected cohort mean: <strong>{percent(report.current.averageScore)}</strong> · Attendance: <strong>{percent(report.current.attendanceRate)}</strong>. Low-sample comparisons are labelled.</p></div><div className="table-wrap"><table><thead><tr><th>Class</th><th>Students</th><th>Learning score</th><th>Gap to cohort</th><th>Attendance</th><th>Coverage</th></tr></thead><tbody>{report.classes.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.students}</td><td>{percent(c.averageScore)}<small className="analytics-student-meta">{c.assessmentCount} assessment results</small></td><td>{c.assessmentCount < 5 || c.averageScore === null || report.current.averageScore === null ? <span className="pill neutral">Limited evidence</span> : `${Math.round((c.averageScore - report.current.averageScore) * 10) / 10} pp`}</td><td>{percent(c.attendanceRate)}{c.attendanceDays < 10 && <small className="analytics-student-meta">Limited evidence</small>}</td><td>{c.assessedStudents} assessed · {c.attendanceStudents} registered</td></tr>)}</tbody></table></div></Panel>}
      {tab === 'insights' && <div className="adv-insights">{report.insights.map((i, n) => <article className={`panel panel-body adv-insight ${i.kind}`} key={n}><span className={`pill ${i.kind === 'attention' ? 'warning' : i.kind === 'information' ? 'neutral' : ''}`}>{i.kind === 'attention' ? 'Review recommended' : i.kind === 'positive' ? 'Positive signal' : 'Evidence note'}</span><h2>{i.title}</h2><p>{i.detail}</p><Link href={i.href} className="panel-link">Open source records →</Link></article>)}</div>}
      <details className="panel analytics-methodology"><summary>Metric definitions & comparison limits</summary>{report.methodology.map((text, i) => <p key={i}>{text}</p>)}</details>
    </>}
  </div>{report && <section className="adv-print"><h1>{report.schoolName} · {dataset} report</h1><p>{report.period.from} – {report.period.to} · Class: {options?.classes.find(c => c.id === report.filters.classId)?.name ?? 'All'} · Subject: {options?.subjects.find(s => s.id === report.filters.subjectId)?.name ?? 'All'} · Generated {report.generatedAt}</p><Table rows={rows} columns={chosenColumns} currency={report.currency} /><p>Balances and invoice settlement are current snapshots. Missing records are unscored.</p></section>}</div>;
}

function PlatformBenchmarks() {
  const [report, setReport] = useState<SchoolBenchmarkReport | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [from, setFrom] = useState(() => new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10)), [to, setTo] = useState(today), [search, setSearch] = useState(''), [currency, setCurrency] = useState('');
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async (start: string, end: string, page: number) => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller; setLoading(true); setError(''); setReport(null);
    try { const { data } = await apiClient.get<SchoolBenchmarkReport>('/advanced-analytics/schools', { params: { from: start, to: end, page }, signal: controller.signal, timeout: 120000 }); if (!controller.signal.aborted) setReport(data); }
    catch (err) { if (!controller.signal.aborted) setError(messageFor(err)); } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void load(new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10), today(), 1); return () => request.current?.abort(); }, [load]);
  const rows = (report?.schools ?? []).filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && (!currency || s.currency === currency));
  const exportPage = () => {
    if (!report) return;
    exportCsv('school-benchmarks-current-page', [{ key: 'name', label: 'School community' }, { key: 'currency', label: 'Currency' }, ...metricColumns.filter(c => ['students', 'assessmentCount', 'averageScore', 'passRate', 'attendanceRate', 'attendanceDays', 'receipts', 'outstanding'].includes(c.key)), { key: 'from', label: 'Period start' }, { key: 'to', label: 'Period end' }], rows.map(s => ({ ...s, name: /^[\s]*[=+@-]/.test(s.name) ? "'" + s.name : s.name, receipts: s.receipts / 100, outstanding: s.outstanding / 100, from: report.period.from, to: report.period.to })));
  };
  return <div className="content-stack advanced-analytics"><PageHeading eyebrow="PLATFORM EVIDENCE" title="School benchmarking" description="Compare aggregate school communities with visible sample sizes and currency context." />
    <form className="panel panel-body adv-filters" onSubmit={e => { e.preventDefault(); void load(from, to, 1); }}><label className="adv-field">From<input aria-label="From date" type="date" required value={from} max={today()} onChange={e => setFrom(e.target.value)} /></label><label className="adv-field">To<input aria-label="To date" type="date" required value={to} min={from} max={today()} onChange={e => setTo(e.target.value)} /></label><Button type="submit" size="sm" disabled={loading}>Apply dates</Button><p className="adv-filter-note muted">School scores describe assessments and record coverage. They do not establish a school-quality ranking.</p></form>
    {error && <div className="state-box" role="alert">{error}<Button size="sm" variant="outline" onClick={() => void load(from, to, 1)}>Try again</Button></div>}{loading && <div role="status" className="panel panel-body">Preparing school comparisons…</div>}
    {report && <><div className="metric-grid"><StatCard label="School communities" value={report.total} note="Across the platform" icon={Users} /><StatCard label="Current page" value={report.schools.length} note={`${report.period.from} – ${report.period.to}`} icon={BarChart3} /><StatCard label="Students on this page" value={report.schools.reduce((n, s) => n + s.students, 0)} note="Current active cohorts" icon={GraduationCap} /><StatCard label="Evidence-ready schools" value={report.schools.filter(s => s.assessmentCount >= 5).length} note="At least five assessment results on this page" icon={ClipboardCheck} /></div>
      <Panel title="School comparison" subtitle="Filters and export apply to the current page. Money values retain each school's currency."><div className="table-toolbar adv-report-controls"><label className="adv-field">Search current page<input aria-label="Search schools on this page" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="adv-field">Currency<select aria-label="Benchmark currency" value={currency} onChange={e => setCurrency(e.target.value)}><option value="">All currencies</option>{Array.from(new Set(report.schools.map(s => s.currency))).map(c => <option key={c}>{c}</option>)}</select></label><Button size="sm" disabled={!rows.length} leftIcon={<Download size={15} />} onClick={exportPage}>Export current page</Button></div>
        {!rows.length ? <EmptyState title="No schools match this page" description="Change the filters or move to another page." /> : <div className="table-wrap"><table><thead><tr><th>School community</th><th>Students</th><th>Mean score</th><th>Pass rate</th><th>Attendance</th><th>Period receipts</th><th>Outstanding now</th></tr></thead><tbody>{rows.map(s => <tr key={s.id}><td>{s.name}<small className="analytics-student-meta">{s.status.toLowerCase()} · {s.currency}</small></td><td>{s.students}</td><td>{percent(s.averageScore)}<small className="analytics-student-meta">{s.assessmentCount} results{s.assessmentCount < 5 ? ' · limited evidence' : ''}</small></td><td>{percent(s.passRate)}</td><td>{percent(s.attendanceRate)}<small className="analytics-student-meta">{s.attendanceDays} student-days</small></td><td>{money(s.receipts, s.currency)}</td><td>{money(s.outstanding, s.currency)}</td></tr>)}</tbody></table></div>}
        <div className="table-pagination"><span>Page {report.page} of {Math.max(1, Math.ceil(report.total / report.pageSize))} · {report.total} school communities</span><div className="ai-action-row"><Button variant="outline" size="sm" disabled={report.page <= 1} onClick={() => void load(report.period.from, report.period.to, report.page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={report.page * report.pageSize >= report.total} onClick={() => void load(report.period.from, report.period.to, report.page + 1)}>Next</Button></div></div>
      </Panel><details className="panel analytics-methodology"><summary>Benchmark definitions & limits</summary>{report.methodology.map((m, i) => <p key={i}>{m}</p>)}</details></>}
  </div>;
}
