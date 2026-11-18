'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { messageFor, dateLabel } from '@/lib/workspace';
import { PageHeading, Panel, EmptyState, StatusPill } from './WorkspaceUI';
import { ProtectedRoute } from './ProtectedRoute';
import { Button } from './ui';
import { ManualBoardRecords } from './compliance/ManualBoardRecords';
import { ReportFigures } from './compliance/ReportFigures';

const managers = ['SCHOOL_OWNER', 'PRINCIPAL', 'SCHOOL_ADMIN'];
const root = '/government/compliance';
const label = (value: string) => value.replaceAll('_', ' ').toLowerCase();
const isoToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
type Row = {
  id: string;
  reportType: string;
  reportPeriod: string;
  reportYear: number;
  status: string;
  createdAt: string;
  reportData: any;
  metadata: any;
  approvedAt?: string;
  exports?: any[];
  history?: any[];
};
function Field({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{title}</label>
      {children}
    </div>
  );
}
export function ComplianceWorkspace() {
  return (
    <ProtectedRoute allowedRoles={managers}>
      <Workspace />
    </ProtectedRoute>
  );
}
function Workspace() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Reports'),
    [rows, setRows] = useState<Row[]>([]),
    [options, setOptions] = useState<any>(null),
    [stats, setStats] = useState<any>(null);
  const [detail, setDetail] = useState<Row | null>(null),
    [checklists, setChecklists] = useState<any[]>([]),
    [alerts, setAlerts] = useState<any[]>([]),
    [audits, setAudits] = useState<any[]>([]),
    [ledger, setLedger] = useState<any[]>([]);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const today = isoToday();
  const [type, setType] = useState('ENROLLMENT_STATISTICS'),
    [period, setPeriod] = useState(''),
    [year, setYear] = useState(today.slice(0, 4)),
    [start, setStart] = useState(today.slice(0, 4) + '-01-01'),
    [end, setEnd] = useState(today),
    [academicYear, setAcademicYear] = useState(''),
    [term, setTerm] = useState(''),
    [dueDate, setDueDate] = useState(''),
    [replaces, setReplaces] = useState('');
  const [filter, setFilter] = useState(''),
    [template, setTemplate] = useState('SCHOOL_REPORT'),
    [validation, setValidation] = useState<any>(null),
    [notes, setNotes] = useState('');
  const [exportId, setExportId] = useState(''),
    [portal, setPortal] = useState(''),
    [receipt, setReceipt] = useState(''),
    [submitted, setSubmitted] = useState(''),
    [evidence, setEvidence] = useState(''),
    [confirmed, setConfirmed] = useState(false),
    [outcome, setOutcome] = useState('ACKNOWLEDGED');
  const [checkTitle, setCheckTitle] = useState(''),
    [authority, setAuthority] = useState(''),
    [checkDue, setCheckDue] = useState(''),
    [checkArea, setCheckArea] = useState('UDISE_REPORTING'),
    [frequency, setFrequency] = useState('ANNUAL');
  const [auditType, setAuditType] = useState('FULL_AUDIT'),
    [verification, setVerification] = useState<any>(null);
  const [correctionType, setCorrectionType] = useState('STUDENT_RECORD'),
    [entityId, setEntityId] = useState(''),
    [field, setField] = useState('penNumber'),
    [oldValue, setOldValue] = useState(''),
    [newValue, setNewValue] = useState(''),
    [reason, setReason] = useState('');
  const refresh = useCallback(async (id?: string) => {
    const paths = [
      'options',
      'reports',
      'dashboard',
      'checklists',
      'alerts',
      'audits',
      'audit-trail',
    ];
    const results = await Promise.all(paths.map((path) => apiClient.get(root + '/' + path)));
    setOptions(results[0].data);
    setRows(results[1].data);
    setStats(results[2].data);
    setChecklists(results[3].data);
    setAlerts(results[4].data);
    setAudits(results[5].data);
    setLedger(results[6].data);
    if (id) setDetail((await apiClient.get(root + '/reports/' + encodeURIComponent(id))).data);
  }, []);
  useEffect(() => {
    let active = true;
    void refresh()
      .catch((err) => {
        if (active) setError(messageFor(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  async function run(work: () => Promise<unknown>, message: string, id = detail?.id) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
      await refresh(id);
      setNotice(message);
    } catch (err: any) {
      setError(messageFor(err));
      if (err.response?.data?.validation) setValidation(err.response.data.validation);
    } finally {
      setBusy(false);
    }
  }
  async function select(row: Row) {
    setError('');
    setValidation(null);
    setTemplate('SCHOOL_REPORT');
    setNotes('');
    setExportId('');
    setConfirmed(false);
    setReceipt('');
    setPortal('');
    setEvidence('');
    setSubmitted('');
    try {
      setDetail((await apiClient.get(root + '/reports/' + row.id)).data);
    } catch (err) {
      setError(messageFor(err));
    }
  }
  async function download(id: string, filename: string) {
    const response = await apiClient.get(root + '/downloads/' + encodeURIComponent(id), {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data),
      link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function generate(event: FormEvent) {
    event.preventDefault();
    if (start > end) {
      setError('First day must be on or before the last day.');
      return;
    }
    void run(
      async () => {
        const response = await apiClient.post(root + '/reports/generate', {
          reportType: type,
          reportPeriod: period.trim(),
          reportYear: Number(year),
          startDate: start,
          endDate: end,
          ...(academicYear && type === 'ENROLLMENT_STATISTICS'
            ? { academicYearId: academicYear }
            : {}),
          ...(type === 'EXAMINATION_ANALYSIS' ? { termId: term } : {}),
          ...(dueDate ? { dueDate } : {}),
          ...(replaces ? { replacesReportId: replaces } : {}),
        });
        setReplaces('');
        await select(response.data);
      },
      'Report saved. Review its figures and request approval.',
      ''
    );
  }
  function reportAction(action: string) {
    if (!detail) return;
    void run(
      () => apiClient.post(root + '/reports/action', { reportId: detail.id, action, notes }),
      'Report updated.'
    );
  }
  function exportReport(format: string) {
    if (!detail) return;
    void run(async () => {
      const { data } = await apiClient.post(root + '/portal-export', {
        reportId: detail.id,
        templateId: template,
        format,
      });
      setValidation(data.validation);
      setExportId(data.id);
      await download(data.id, data.filename);
    }, 'Export saved and downloaded. Review the portal format before uploading.');
  }
  const visible = rows.filter((row) => !filter || row.status === filter);
  const eligibleExports = (detail?.exports || []).filter(
    (file) => detail?.approvedAt && file.createdAt >= detail.approvedAt
  );
  if (loading)
    return (
      <div className="state-box" role="status">
        Loading compliance workspace…
      </div>
    );
  return (
    <>
      <PageHeading
        eyebrow="SCHOOL REPORTING"
        title="Government reporting"
        description="Prepare, review and export saved school records. Upload files through the official portal, then record the receipt and outcome."
      />
      <div className="panel p-4 text-sm">
        Manual portal workflow · Direct government submission is unavailable.{' '}
        {options?.formatNotice}
      </div>
      {error && (
        <div className="state-box" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="state-box success" role="status">
          {notice}
        </div>
      )}
      <div className="flex flex-wrap gap-2 my-5" aria-label="Reporting sections">
        {['Reports', 'Board records', 'Checklists', 'Audits', 'Alerts', 'Evidence'].map((name) => (
          <Button
            key={name}
            variant={tab === name ? 'primary' : 'outline'}
            onClick={() => setTab(name)}
          >
            {name}
            {name === 'Alerts' && stats?.alerts?.ACTIVE ? ` (${stats.alerts.ACTIVE})` : ''}
          </Button>
        ))}
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void run(() => refresh(detail?.id), 'Workspace refreshed.')}
        >
          Refresh
        </Button>
      </div>
      {tab === 'Reports' && (
        <div className="content-stack">
          <Panel
            title="Generate a school report"
            subtitle="Snapshots preserve the records used for review. Correct source records and generate a replacement when figures change."
          >
            <form className="panel-body space-y-4" onSubmit={generate}>
              <div className="form-grid">
                <Field id="compliance-type" title="Report type">
                  <select
                    id="compliance-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {(options?.reportTypes || []).map((t: string) => (
                      <option key={t} value={t}>
                        {label(t)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="compliance-period" title="Reporting period">
                  <input
                    id="compliance-period"
                    required
                    maxLength={100}
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  />
                </Field>
                <Field id="compliance-year" title="Reporting year">
                  <input
                    id="compliance-year"
                    required
                    type="number"
                    min={2020}
                    max={2100}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </Field>
                <Field id="compliance-start" title="First day">
                  <input
                    id="compliance-start"
                    required
                    type="date"
                    value={start}
                    onChange={(e) => {
                      setStart(e.target.value);
                      setYear(e.target.value.slice(0, 4));
                    }}
                  />
                </Field>
                <Field id="compliance-end" title="Last day">
                  <input
                    id="compliance-end"
                    required
                    type="date"
                    min={start}
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </Field>
                <Field id="compliance-due" title="Submission deadline (optional)">
                  <input
                    id="compliance-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Field>
                {type === 'ENROLLMENT_STATISTICS' && (
                  <Field id="compliance-academic-year" title="Academic enrollment year">
                    <select
                      id="compliance-academic-year"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                    >
                      <option value="">All saved years overlapping this period</option>
                      {options?.years?.map((y: any) => (
                        <option key={y.id} value={y.id}>
                          {y.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {type === 'EXAMINATION_ANALYSIS' && (
                  <Field id="compliance-term" title="Examination term">
                    <select
                      id="compliance-term"
                      required
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                    >
                      <option value="">Choose a term</option>
                      {options?.terms?.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
              {replaces && (
                <div className="state-box">
                  Generating a replacement for rejected report {replaces}. Previous evidence remains
                  saved.
                  <Button variant="outline" size="sm" onClick={() => setReplaces('')}>
                    Cancel replacement
                  </Button>
                </div>
              )}
              <Button type="submit" isLoading={busy}>
                Generate saved report
              </Button>
            </form>
          </Panel>
          <Panel title="Saved school reports">
            <div className="panel-body space-y-4">
              <Field id="compliance-filter" title="Filter by status">
                <select
                  id="compliance-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {[
                    'DRAFT',
                    'PENDING_APPROVAL',
                    'APPROVED',
                    'SUBMITTED',
                    'ACKNOWLEDGED',
                    'REJECTED',
                  ].map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </Field>
              {visible.length ? (
                visible.map((row) => (
                  <article key={row.id} className="panel p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <strong>{label(row.reportType)}</strong>
                      <StatusPill value={row.status} />
                    </div>
                    <p className="muted text-sm my-2">
                      {row.reportPeriod} · {dateLabel(row.createdAt)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void select(row)}
                    >
                      Review {row.reportPeriod}
                    </Button>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No saved reports"
                  description="Generate a report or change the status filter."
                />
              )}
            </div>
          </Panel>
          {detail && (
            <Panel title={`Review: ${detail.reportPeriod}`} subtitle={`Reference ${detail.id}`}>
              <div className="panel-body space-y-5">
                <StatusPill value={detail.status} />
                <details>
                  <summary>Review report figures</summary>
                  <ReportFigures data={detail.reportData} />
                </details>
                <Field id="review-notes" title="Review or portal response notes">
                  <textarea
                    id="review-notes"
                    maxLength={2000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  {detail.status === 'DRAFT' && (
                    <Button disabled={busy} onClick={() => reportAction('REQUEST_REVIEW')}>
                      Request review
                    </Button>
                  )}
                  {detail.status === 'PENDING_APPROVAL' && (
                    <>
                      <Button
                        disabled={busy || detail.metadata?.reviewRequestedBy === user?.id}
                        onClick={() => reportAction('APPROVE')}
                      >
                        Approve report
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy || !notes.trim()}
                        onClick={() => reportAction('REJECT')}
                      >
                        Reject report
                      </Button>
                      <p className="muted text-sm">
                        A different school manager must approve the report.
                      </p>
                    </>
                  )}
                  {detail.status === 'REJECTED' && (
                    <>
                      <Button
                        disabled={busy}
                        onClick={() => {
                          const request = detail.metadata?.request || {};
                          setType(detail.reportType);
                          setPeriod(detail.reportPeriod + ' corrected');
                          setYear(String(detail.reportYear));
                          setStart(request.startDate || start);
                          setEnd(request.endDate || end);
                          setTerm(request.termId || '');
                          setAcademicYear(request.academicYearId || '');
                          setReplaces(detail.id);
                          setNotice(
                            'Correct the source records, then generate the replacement above.'
                          );
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Prepare corrected replacement
                      </Button>
                      {!detail.metadata?.manualSubmission && (
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => reportAction('REOPEN')}
                        >
                          Reopen draft
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <div className="border-t pt-4 space-y-3">
                  <h3>Validate and export</h3>
                  <Field id="export-template" title="Preparation template">
                    <select
                      id="export-template"
                      value={template}
                      onChange={(e) => {
                        setTemplate(e.target.value);
                        setValidation(null);
                      }}
                    >
                      {(options?.templates || ['SCHOOL_REPORT']).map((t: string) => (
                        <option key={t} value={t}>
                          {label(t)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          async () =>
                            setValidation(
                              (
                                await apiClient.get(root + `/reports/${detail.id}/validation`, {
                                  params: { templateId: template },
                                })
                              ).data
                            ),
                          'Validation completed.'
                        )
                      }
                    >
                      Validate records
                    </Button>
                    {['csv', 'xlsx', 'json'].map((format) => (
                      <Button key={format} disabled={busy} onClick={() => exportReport(format)}>
                        Export {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                  {validation && (
                    <div className={validation.errors ? 'state-box' : 'panel p-4 text-sm'}>
                      <strong>
                        {validation.errors} errors · {validation.warnings} warnings ·{' '}
                        {validation.recordCount} records
                      </strong>
                      <p>{validation.notice}</p>
                      {validation.issues.map((issue: any, i: number) => (
                        <p key={i}>
                          {issue.severity}: {issue.message}{' '}
                          {issue.entityId && `(${issue.entityId})`}
                        </p>
                      ))}
                      {validation.errors > 0 && (
                        <Link className="panel-link" href="/school/students">
                          Correct school source records
                        </Link>
                      )}
                    </div>
                  )}
                  {(detail.exports || []).map((file) => (
                    <div key={file.id} className="flex flex-wrap gap-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => download(file.id, file.filename),
                            'Saved export downloaded.'
                          )
                        }
                      >
                        Download {file.format.toUpperCase()}
                      </Button>
                      <span className="text-xs break-all">
                        {file.templateId} · SHA-256 {file.contentHash}
                      </span>
                    </div>
                  ))}
                </div>
                {detail.status === 'APPROVED' && (
                  <form
                    className="border-t pt-4 space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void run(
                        () =>
                          apiClient.post(root + '/reports/manual-submission', {
                            reportId: detail.id,
                            exportId,
                            portal,
                            receiptReference: receipt,
                            submittedAt: new Date(submitted).toISOString(),
                            portalFormatReviewed: confirmed,
                            ...(evidence ? { evidenceUrl: evidence } : {}),
                            notes,
                          }),
                        'Manual portal receipt recorded.'
                      );
                    }}
                  >
                    <h3>Record a manual portal submission</h3>
                    <p className="muted text-sm">
                      Export after approval, review the official format and upload it yourself. Save
                      the returned receipt here.
                    </p>
                    <div className="form-grid">
                      <Field id="submission-export" title="Approved export uploaded">
                        <select
                          id="submission-export"
                          required
                          value={exportId}
                          onChange={(e) => setExportId(e.target.value)}
                        >
                          <option value="">Choose a saved export</option>
                          {eligibleExports.map((file) => (
                            <option key={file.id} value={file.id}>
                              {file.templateId} · {file.format} · {dateLabel(file.createdAt)}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field id="submission-portal" title="Government portal">
                        <input
                          id="submission-portal"
                          required
                          maxLength={150}
                          value={portal}
                          onChange={(e) => setPortal(e.target.value)}
                        />
                      </Field>
                      <Field id="submission-receipt" title="Portal receipt reference">
                        <input
                          id="submission-receipt"
                          required
                          maxLength={200}
                          value={receipt}
                          onChange={(e) => setReceipt(e.target.value)}
                        />
                      </Field>
                      <Field id="submission-time" title="Submission time">
                        <input
                          id="submission-time"
                          required
                          type="datetime-local"
                          value={submitted}
                          onChange={(e) => setSubmitted(e.target.value)}
                        />
                      </Field>
                      <Field
                        id="submission-evidence"
                        title="Evidence document HTTPS link (optional)"
                      >
                        <input
                          id="submission-evidence"
                          type="url"
                          pattern="https://.*"
                          value={evidence}
                          onChange={(e) => setEvidence(e.target.value)}
                        />
                      </Field>
                    </div>
                    <label className="flex gap-2 items-start">
                      <input
                        type="checkbox"
                        required
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      <span>
                        I reviewed the current official portal format and uploaded this approved
                        export.
                      </span>
                    </label>
                    <Button type="submit" disabled={busy || !confirmed || !eligibleExports.length}>
                      Record portal receipt
                    </Button>
                  </form>
                )}
                {detail.metadata?.manualSubmission && (
                  <div className="panel p-4 text-sm">
                    Submitted to {detail.metadata.manualSubmission.portal} · Receipt{' '}
                    {detail.metadata.manualSubmission.receiptReference}
                    <p className="text-xs break-all">
                      File SHA-256: {detail.metadata.manualSubmission.contentHash}
                    </p>
                  </div>
                )}
                {detail.status === 'SUBMITTED' && (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(
                        () =>
                          apiClient.post(root + '/reports/outcome', {
                            reportId: detail.id,
                            status: outcome,
                            notes,
                            ...(evidence ? { evidenceUrl: evidence } : {}),
                          }),
                        'Portal outcome recorded.'
                      );
                    }}
                  >
                    <Field id="portal-outcome" title="Portal outcome">
                      <select
                        id="portal-outcome"
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                      >
                        <option value="ACKNOWLEDGED">Accepted / acknowledged</option>
                        <option value="REJECTED">Rejected / needs correction</option>
                      </select>
                    </Field>
                    <Button type="submit" disabled={busy || !notes.trim()}>
                      Record portal outcome
                    </Button>
                  </form>
                )}
                <details>
                  <summary>Report history</summary>
                  {detail.history?.map((event) => (
                    <div key={event.id} className="border-t py-3">
                      <strong>{label(event.action)}</strong> · {dateLabel(event.createdAt)}
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                </details>
              </div>
            </Panel>
          )}
        </div>
      )}
      {tab === 'Board records' && (
        <ManualBoardRecords
          students={options?.students || []}
          onSaved={() => refresh(detail?.id)}
        />
      )}
      {tab === 'Checklists' && (
        <div className="content-stack">
          <Panel title="Create a compliance checklist item">
            <form
              className="panel-body space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await apiClient.post(root + '/checklists', {
                    title: checkTitle,
                    requiredBy: authority,
                    complianceArea: checkArea,
                    frequency,
                    ...(checkDue ? { dueDate: checkDue } : {}),
                  });
                  setCheckTitle('');
                }, 'Checklist item saved.');
              }}
            >
              <div className="form-grid">
                <Field id="check-title" title="Checklist title">
                  <input
                    id="check-title"
                    required
                    value={checkTitle}
                    onChange={(e) => setCheckTitle(e.target.value)}
                  />
                </Field>
                <Field id="check-authority" title="Required by">
                  <input
                    id="check-authority"
                    required
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                  />
                </Field>
                <Field id="check-area" title="Compliance area">
                  <select
                    id="check-area"
                    value={checkArea}
                    onChange={(e) => setCheckArea(e.target.value)}
                  >
                    {[
                      'UDISE_REPORTING',
                      'BOARD_COMPLIANCE',
                      'RTE_COMPLIANCE',
                      'FINANCIAL_REPORTING',
                      'SAFETY_STANDARDS',
                      'DATA_PROTECTION',
                    ].map((a) => (
                      <option key={a} value={a}>
                        {label(a)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="check-frequency" title="Frequency">
                  <select
                    id="check-frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    {['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'TERMLY', 'ANNUAL'].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field id="check-due" title="Due date">
                  <input
                    id="check-due"
                    type="date"
                    value={checkDue}
                    onChange={(e) => setCheckDue(e.target.value)}
                  />
                </Field>
              </div>
              <Button type="submit" disabled={busy}>
                Save checklist item
              </Button>
            </form>
          </Panel>
          <Panel title="School checklist">
            <div className="panel-body space-y-4">
              {checklists.length ? (
                checklists.map((item) => (
                  <article key={item.id} className="panel p-4">
                    <strong>{item.title}</strong> <StatusPill value={item.status} />
                    <p>
                      {item.requiredBy} · {item.dueDate ? dateLabel(item.dueDate) : 'No deadline'}
                    </p>
                    <p>{item.notes}</p>
                    {item.status !== 'COMPLETED' && (
                      <form
                        className="mt-3 space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = new FormData(e.currentTarget);
                          void run(
                            () =>
                              apiClient.post(root + '/checklists/complete', {
                                checklistId: item.id,
                                notes: String(form.get('notes') || ''),
                                evidence: { reference: String(form.get('reference') || '') },
                              }),
                            'Checklist item completed.'
                          );
                        }}
                      >
                        <Field id={'check-note-' + item.id} title="Completion notes">
                          <input id={'check-note-' + item.id} name="notes" required />
                        </Field>
                        <Field id={'check-evidence-' + item.id} title="Evidence reference">
                          <input id={'check-evidence-' + item.id} name="reference" required />
                        </Field>
                        <Button type="submit" size="sm" disabled={busy}>
                          Complete checklist item
                        </Button>
                      </form>
                    )}
                  </article>
                ))
              ) : (
                <EmptyState title="No checklist items" />
              )}
            </div>
          </Panel>
        </div>
      )}
      {tab === 'Audits' && (
        <Panel
          title="Data quality audits"
          subtitle="Correct issues in the school records, then rerun the audit. Scores measure the checks performed; they do not certify government compliance."
        >
          <div className="panel-body space-y-4">
            <Field id="audit-type" title="Audit scope">
              <select
                id="audit-type"
                value={auditType}
                onChange={(e) => setAuditType(e.target.value)}
              >
                {[
                  'FULL_AUDIT',
                  'STUDENT_DATA',
                  'STAFF_DATA',
                  'SCHOOL_PROFILE',
                  'ATTENDANCE_DATA',
                  'EXAMINATION_DATA',
                ].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Button
              disabled={busy}
              onClick={() =>
                void run(() => apiClient.post(root + '/audits/run', { auditType }), 'Audit saved.')
              }
            >
              Run data audit
            </Button>
            {audits.map((audit) => (
              <article key={audit.id} className="panel p-4 space-y-3">
                <strong>
                  {label(audit.auditType)} · {audit.overallScore}%
                </strong>{' '}
                <StatusPill value={audit.status} />
                <p>
                  {dateLabel(audit.createdAt)} · {audit.issuesFound} issues
                </p>
                <details>
                  <summary>Inspect audit findings</summary>
                  <p>{audit.issues?.method}</p>
                  {(audit.issues?.issues || []).map((i: any, index: number) => (
                    <p key={index} className="text-sm break-words">
                      {i.message} · {i.entityId}
                    </p>
                  ))}
                  <Link className="panel-link" href="/school/students">
                    Open school records
                  </Link>
                </details>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () => apiClient.post(root + '/audits/' + audit.id + '/recheck'),
                      'Audit rerun against current source records.'
                    )
                  }
                >
                  Recheck corrected records
                </Button>
              </article>
            ))}
            {!audits.length && <EmptyState title="No saved audits" />}
          </div>
        </Panel>
      )}
      {tab === 'Alerts' && (
        <Panel title="Compliance alerts">
          <div className="panel-body space-y-4">
            <Button
              disabled={busy}
              onClick={() =>
                void run(() => apiClient.post(root + '/deadlines/check'), 'Deadlines checked.')
              }
            >
              Check deadlines now
            </Button>
            {alerts.map((alert) => (
              <article key={alert.id} className="panel p-4 space-y-3">
                <strong>{alert.title}</strong> <StatusPill value={alert.status} />
                <p>{alert.message}</p>
                {alert.resolutionNotes && <p>{alert.resolutionNotes}</p>}
                {alert.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => apiClient.post(root + '/alerts/acknowledge', { alertId: alert.id }),
                        'Alert acknowledged.'
                      )
                    }
                  >
                    Acknowledge alert
                  </Button>
                )}
                {alert.status !== 'RESOLVED' && (
                  <form
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const text = String(new FormData(e.currentTarget).get('resolution'));
                      void run(
                        () =>
                          apiClient.post(root + '/alerts/resolve', {
                            alertId: alert.id,
                            resolutionNotes: text,
                          }),
                        'Alert resolved.'
                      );
                    }}
                  >
                    <Field id={'resolution-' + alert.id} title="Resolution notes">
                      <input id={'resolution-' + alert.id} name="resolution" required />
                    </Field>
                    <Button type="submit" size="sm" disabled={busy}>
                      Resolve alert
                    </Button>
                  </form>
                )}
              </article>
            ))}
            {!alerts.length && <EmptyState title="No compliance alerts" />}
          </div>
        </Panel>
      )}
      {tab === 'Evidence' && (
        <div className="content-stack">
          <Panel title="Saved evidence and integrity">
            <div className="panel-body space-y-4">
              <Button
                disabled={busy}
                onClick={() =>
                  void run(
                    async () =>
                      setVerification((await apiClient.post(root + '/audit-trail/verify')).data),
                    'Integrity check completed.'
                  )
                }
              >
                Verify saved evidence
              </Button>
              {verification && (
                <div
                  className={verification.isValid ? 'state-box success' : 'state-box'}
                  role="status"
                >
                  {verification.isValid ? 'Evidence chain verified' : 'Integrity check failed'} ·{' '}
                  {verification.totalBlocksVerified} records<p>{verification.scope}</p>
                </div>
              )}
              {ledger.map((event) => (
                <details key={event.id} className="border-t py-3">
                  <summary>
                    #{event.sequence} · {label(event.action)} · {event.entityType} ·{' '}
                    {dateLabel(event.createdAt)}
                  </summary>
                  <p className="text-xs break-all">{event.currentHash}</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </details>
              ))}
            </div>
          </Panel>
          <Panel
            title="Correct a saved source record"
            subtitle="Corrections require the existing value and a reason. Published grades and financial amounts must use their dedicated review workflows."
          >
            <form
              className="panel-body space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void run(
                  () =>
                    apiClient.post(root + '/audit-trail/override', {
                      entityType: correctionType,
                      entityId,
                      entityName: entityId,
                      action: 'CORRECTED',
                      reason,
                      changes: [
                        {
                          field,
                          oldValue: field === 'score' ? Number(oldValue) : oldValue || null,
                          newValue: field === 'score' ? Number(newValue) : newValue || null,
                        },
                      ],
                    }),
                  'Correction saved with evidence. Generate a new report to use it.'
                );
              }}
            >
              <div className="form-grid">
                <Field id="correction-type" title="Record type">
                  <select
                    id="correction-type"
                    value={correctionType}
                    onChange={(e) => {
                      setCorrectionType(e.target.value);
                      setField(
                        e.target.value === 'GRADE'
                          ? 'score'
                          : e.target.value === 'FEE_PAYMENT'
                            ? 'notes'
                            : e.target.value === 'STAFF_RECORD'
                              ? 'teacherCode'
                              : 'penNumber'
                      );
                    }}
                  >
                    <option value="STUDENT_RECORD">Student profile</option>
                    <option value="STAFF_RECORD">Teacher code mapping</option>
                    <option value="GRADE">Unpublished grade</option>
                    <option value="FEE_PAYMENT">Payment note</option>
                  </select>
                </Field>
                <Field id="correction-id" title="Source record ID">
                  <input
                    id="correction-id"
                    required
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                  />
                </Field>
                <Field id="correction-field" title="Field to correct">
                  <select
                    id="correction-field"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                  >
                    {(correctionType === 'STUDENT_RECORD'
                      ? [
                          'penNumber',
                          'apaarId',
                          'aadhaarLast4',
                          'birthCertNumber',
                          'firstName',
                          'lastName',
                          'dateOfBirth',
                        ]
                      : correctionType === 'GRADE'
                        ? ['score']
                        : correctionType === 'STAFF_RECORD'
                          ? ['teacherCode']
                          : ['notes']
                    ).map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field id="correction-old" title="Existing value (blank for none)">
                  <input
                    id="correction-old"
                    value={oldValue}
                    onChange={(e) => setOldValue(e.target.value)}
                  />
                </Field>
                <Field id="correction-new" title="Corrected value">
                  <input
                    id="correction-new"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                  />
                </Field>
                <Field id="correction-reason" title="Reason for correction">
                  <input
                    id="correction-reason"
                    required
                    maxLength={2000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Field>
              </div>
              <Button type="submit" disabled={busy}>
                Save justified correction
              </Button>
            </form>
          </Panel>
        </div>
      )}
    </>
  );
}
