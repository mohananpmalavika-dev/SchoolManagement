'use client';
import { useEffect, useRef, useState } from 'react';
import { Award, CheckCircle2, FileText, Printer, Sparkles, TrendingUp } from 'lucide-react';
import {
  friendly,
  summarizePreschoolDomains,
  type DevelopmentDomain,
  type DevelopmentLevel,
  type DomainProgressBucket,
  type PreschoolDomainObservationGroup,
  type PreschoolObservation,
} from '@/lib/preschool';
import { dateLabel } from '@/lib/workspace';
import { Button } from '../ui';
import { Panel } from '../WorkspaceUI';

const LEVEL_STYLES: Record<
  DevelopmentLevel | 'UNOBSERVED',
  { label: string; badgeClass: string; barHex: string; description: string }
> = {
  CONSISTENT: {
    label: 'Consistent',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    barHex: '#10b981',
    description: 'Demonstrating the skill independently across everyday classroom play.',
  },
  DEVELOPING: {
    label: 'Developing',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    barHex: '#f59e0b',
    description: 'Practising the skill with growing confidence and occasional prompts.',
  },
  EMERGING: {
    label: 'Emerging',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    barHex: '#0ea5e9',
    description: 'Beginning to explore the skill with guidance and modelling.',
  },
  UNOBSERVED: {
    label: 'Not yet observed',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    barHex: '#e2e8f0',
    description: 'No observations recorded in this area during the selected period.',
  },
};

function DomainStackedBar({
  emerging,
  developing,
  consistent,
  total,
}: {
  emerging: number;
  developing: number;
  consistent: number;
  total: number;
}) {
  if (total <= 0) {
    return (
      <div
        className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden"
        aria-label="No observations recorded yet"
      />
    );
  }
  const ePct = (emerging / total) * 100;
  const dPct = (developing / total) * 100;
  const cPct = (consistent / total) * 100;
  return (
    <div
      className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex"
      role="img"
      aria-label={`${consistent} consistent, ${developing} developing, ${emerging} emerging`}
    >
      {consistent > 0 && (
        <div
          style={{ width: `${cPct}%`, backgroundColor: LEVEL_STYLES.CONSISTENT.barHex }}
          className="h-full transition-all"
          title={`Consistent: ${consistent}`}
        />
      )}
      {developing > 0 && (
        <div
          style={{ width: `${dPct}%`, backgroundColor: LEVEL_STYLES.DEVELOPING.barHex }}
          className="h-full transition-all"
          title={`Developing: ${developing}`}
        />
      )}
      {emerging > 0 && (
        <div
          style={{ width: `${ePct}%`, backgroundColor: LEVEL_STYLES.EMERGING.barHex }}
          className="h-full transition-all"
          title={`Emerging: ${emerging}`}
        />
      )}
    </div>
  );
}

export function PreschoolMilestoneProgressCard({
  title,
  subtitle,
  groups,
  observations = [],
  from,
  to,
  childrenCountByDomain,
  totalChildrenInClass,
  onOpenPrint,
  printLoading = false,
}: {
  title: string;
  subtitle?: string;
  groups?: PreschoolDomainObservationGroup[];
  observations?: PreschoolObservation[];
  from?: string;
  to?: string;
  childrenCountByDomain?: Partial<Record<DevelopmentDomain, number>>;
  totalChildrenInClass?: number;
  onOpenPrint?: () => void;
  printLoading?: boolean;
}) {
  const summary = summarizePreschoolDomains(groups, observations);
  const periodLabel = from && to ? `${dateLabel(from)} – ${dateLabel(to)}` : '';

  return (
    <Panel
      title={title}
      subtitle={
        subtitle ||
        (periodLabel
          ? `7 early-years development domains · ${periodLabel}`
          : '7 early-years development domains across Emerging, Developing and Consistent levels.')
      }
    >
      <div className="panel-body space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium">
              <Sparkles size={13} />
              <strong>{summary.totalObservations}</strong>{' '}
              {summary.totalObservations === 1 ? 'observation' : 'observations'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium">
              <Award size={13} />
              <strong>{summary.domainsObserved} / 7</strong> domains observed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-1 font-medium">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: LEVEL_STYLES.CONSISTENT.barHex }}
              />
              Consistent: <strong>{summary.levels.CONSISTENT}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 px-3 py-1 font-medium">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: LEVEL_STYLES.DEVELOPING.barHex }}
              />
              Developing: <strong>{summary.levels.DEVELOPING}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 text-sky-800 px-3 py-1 font-medium">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: LEVEL_STYLES.EMERGING.barHex }}
              />
              Emerging: <strong>{summary.levels.EMERGING}</strong>
            </span>
          </div>
          {onOpenPrint && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Printer size={15} />}
              isLoading={printLoading}
              onClick={onOpenPrint}
            >
              Print / Save Term Report PDF
            </Button>
          )}
        </div>

        {summary.totalObservations > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs muted">
              <span>Overall milestone distribution</span>
              <span>
                {Math.round((summary.levels.CONSISTENT / summary.totalObservations) * 100)}%
                consistent ·{' '}
                {Math.round((summary.levels.DEVELOPING / summary.totalObservations) * 100)}%
                developing ·{' '}
                {Math.round((summary.levels.EMERGING / summary.totalObservations) * 100)}% emerging
              </span>
            </div>
            <DomainStackedBar
              consistent={summary.levels.CONSISTENT}
              developing={summary.levels.DEVELOPING}
              emerging={summary.levels.EMERGING}
              total={summary.totalObservations}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {summary.domains.map((bucket: DomainProgressBucket) => {
            const levelStyle = LEVEL_STYLES[bucket.primaryLevel];
            const observedChildren = childrenCountByDomain?.[bucket.domain];
            return (
              <div
                key={bucket.domain}
                className="rounded-xl border p-4 space-y-2.5 bg-white/80"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: bucket.meta.accentHex }}
                      />
                      {bucket.meta.label}
                    </h3>
                    <p className="text-xs muted mt-0.5">{bucket.meta.description}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full border ${levelStyle.badgeClass}`}
                  >
                    {levelStyle.label}
                  </span>
                </div>

                <DomainStackedBar
                  consistent={bucket.consistent}
                  developing={bucket.developing}
                  emerging={bucket.emerging}
                  total={bucket.total}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-emerald-700 font-medium">
                      Consistent: {bucket.consistent}
                    </span>
                    <span className="text-amber-700 font-medium">
                      Developing: {bucket.developing}
                    </span>
                    <span className="text-sky-700 font-medium">
                      Emerging: {bucket.emerging}
                    </span>
                  </div>
                  <span className="muted">
                    {observedChildren != null && totalChildrenInClass != null
                      ? `${observedChildren}/${totalChildrenInClass} children`
                      : `${bucket.total} total`}
                  </span>
                </div>

                {bucket.recentSkills.length > 0 && (
                  <div className="pt-2 border-t flex flex-wrap gap-1.5">
                    {bucket.recentSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs rounded-md bg-slate-100 text-slate-700 px-2 py-0.5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs muted">
          Early years progress tracks growth across everyday classroom play—not grades, rankings or
          diagnoses. Unobserved areas simply reflect skills not yet logged in this period.
        </p>
      </div>
    </Panel>
  );
}

export interface PreschoolTermReportData {
  studentName: string;
  className: string;
  preschoolStage?: string | null;
  schoolName?: string;
  dateOfBirth?: string | null;
  from: string;
  to: string;
  generatedOn?: string;
  checkIns: number;
  checkOuts?: number;
  absentDays: number;
  careUpdates: number;
  groups: PreschoolDomainObservationGroup[];
  observations: PreschoolObservation[];
}

export function PreschoolTermReportPrint({
  report,
  canEditRemarks = false,
  close,
}: {
  report: PreschoolTermReportData;
  canEditRemarks?: boolean;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [termTitle, setTermTitle] = useState('Early Years Term Progress Report');
  const [teacherRemarks, setTeacherRemarks] = useState('');

  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);

  const summary = summarizePreschoolDomains(report.groups, report.observations);
  const stageLabel = report.preschoolStage ? friendly(report.preschoolStage) : '';
  const maxDomainTotal = Math.max(1, ...summary.domains.map((d) => d.total));

  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-label="Printable early years term progress report"
      className="preschool-print-overlay fixed inset-0 z-50 overflow-auto bg-white p-6 w-screen h-screen max-w-none max-h-none m-0"
    >
      <div className="preschool-print-controls mx-auto max-w-4xl mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileText size={16} />
            Printable Term Report PDF Preview
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button leftIcon={<Printer size={15} />} onClick={() => window.print()}>
              Print / Save PDF
            </Button>
            <Button variant="outline" onClick={close}>
              Close report
            </Button>
          </div>
        </div>
        {canEditRemarks && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <label className="text-xs font-medium text-slate-700 block space-y-1">
              <span>Report title</span>
              <input
                type="text"
                value={termTitle}
                maxLength={120}
                onChange={(e) => setTermTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
              />
            </label>
            <label className="text-xs font-medium text-slate-700 block space-y-1">
              <span>Teacher’s term reflection (optional — printed on PDF)</span>
              <textarea
                rows={2}
                value={teacherRemarks}
                maxLength={1000}
                placeholder="Add a warm, strengths-based reflection for the family…"
                onChange={(e) => setTeacherRemarks(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
              />
            </label>
          </div>
        )}
      </div>

      <article className="preschool-print-sheet mx-auto max-w-4xl text-slate-900 bg-white">
        <header className="border-b-2 border-slate-800 pb-4 mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            {report.schoolName && (
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                {report.schoolName}
              </p>
            )}
            <h1 className="text-2xl font-bold text-slate-950 mt-0.5">
              {termTitle.trim() || 'Early Years Term Progress Report'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              7-Domain Holistic Milestone Summary · {dateLabel(report.from)} to{' '}
              {dateLabel(report.to)}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-0.5">
            <p className="font-semibold text-slate-900">
              {report.className}
              {stageLabel ? ` · ${stageLabel}` : ''}
            </p>
            {report.generatedOn && <p>Prepared: {dateLabel(report.generatedOn)}</p>}
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="rounded-lg border border-slate-300 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Child</p>
            <p className="text-base font-bold text-slate-950 mt-0.5">{report.studentName}</p>
            {report.dateOfBirth && (
              <p className="text-xs text-slate-600">DOB: {dateLabel(report.dateOfBirth)}</p>
            )}
          </div>
          <div className="rounded-lg border border-slate-300 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Attendance</p>
            <p className="text-base font-bold text-slate-950 mt-0.5">
              {report.checkIns} {report.checkIns === 1 ? 'day' : 'days'} present
            </p>
            <p className="text-xs text-slate-600">{report.absentDays} recorded absences</p>
          </div>
          <div className="rounded-lg border border-slate-300 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              Domains Covered
            </p>
            <p className="text-base font-bold text-slate-950 mt-0.5">
              {summary.domainsObserved} / 7
            </p>
            <p className="text-xs text-slate-600">
              {summary.totalObservations} logged observations
            </p>
          </div>
          <div className="rounded-lg border border-slate-300 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              Daily Care Updates
            </p>
            <p className="text-base font-bold text-slate-950 mt-0.5">{report.careUpdates}</p>
            <p className="text-xs text-slate-600">Shared with family</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-5">
          <p className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} />
            Developmental Progress Scale
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
            {(['EMERGING', 'DEVELOPING', 'CONSISTENT'] as const).map((lvl) => (
              <div key={lvl} className="flex items-start gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-sm mt-0.5 shrink-0"
                  style={{ backgroundColor: LEVEL_STYLES[lvl].barHex }}
                />
                <span>
                  <strong>{LEVEL_STYLES[lvl].label}:</strong> {LEVEL_STYLES[lvl].description}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-base font-bold text-slate-950 mb-3">
            7-Domain Visual Milestone Profile
          </h2>
          <div className="rounded-lg border border-slate-300 p-3">
            <svg
              viewBox="0 0 760 250"
              className="w-full h-auto"
              role="img"
              aria-label="7-Domain milestone distribution chart"
            >
              {summary.domains.map((bucket, idx) => {
                const y = 14 + idx * 33;
                const barX = 195;
                const barW = 430;
                const barH = 18;
                const scaleTotal = Math.max(bucket.total, 1);
                const cW = bucket.total ? (bucket.consistent / scaleTotal) * barW : 0;
                const dW = bucket.total ? (bucket.developing / scaleTotal) * barW : 0;
                const eW = bucket.total ? (bucket.emerging / scaleTotal) * barW : 0;
                const barFillRatio = bucket.total ? Math.max(0.18, bucket.total / maxDomainTotal) : 0;
                const scaledC = cW * barFillRatio;
                const scaledD = dW * barFillRatio;
                const scaledE = eW * barFillRatio;
                return (
                  <g key={bucket.domain}>
                    <circle cx={10} cy={y + 9} r={4.5} fill={bucket.meta.accentHex} />
                    <text
                      x={22}
                      y={y + 13}
                      fontSize="12"
                      fontWeight="600"
                      fill="#0f172a"
                    >
                      {bucket.meta.shortLabel}
                    </text>
                    <rect
                      x={barX}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={4}
                      fill="#f1f5f9"
                      stroke="#e2e8f0"
                    />
                    {scaledC > 0 && (
                      <rect
                        x={barX}
                        y={y}
                        width={scaledC}
                        height={barH}
                        rx={3}
                        fill={LEVEL_STYLES.CONSISTENT.barHex}
                      />
                    )}
                    {scaledD > 0 && (
                      <rect
                        x={barX + scaledC}
                        y={y}
                        width={scaledD}
                        height={barH}
                        fill={LEVEL_STYLES.DEVELOPING.barHex}
                      />
                    )}
                    {scaledE > 0 && (
                      <rect
                        x={barX + scaledC + scaledD}
                        y={y}
                        width={scaledE}
                        height={barH}
                        rx={3}
                        fill={LEVEL_STYLES.EMERGING.barHex}
                      />
                    )}
                    <text x={barX + barW + 12} y={y + 13} fontSize="11" fill="#334155">
                      {bucket.total > 0
                        ? `C:${bucket.consistent}  D:${bucket.developing}  E:${bucket.emerging}`
                        : 'Not yet observed'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-base font-bold text-slate-950 mb-3">
            Domain-by-Domain Observations & Highlights
          </h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 px-2.5 py-2 w-44">Development Domain</th>
                <th className="border border-slate-300 px-2 py-2 text-center w-20">Emerging</th>
                <th className="border border-slate-300 px-2 py-2 text-center w-20">Developing</th>
                <th className="border border-slate-300 px-2 py-2 text-center w-20">Consistent</th>
                <th className="border border-slate-300 px-2.5 py-2">Observed Skills & Notes</th>
              </tr>
            </thead>
            <tbody>
              {summary.domains.map((bucket) => (
                <tr key={bucket.domain} className="align-top break-inside-avoid">
                  <td className="border border-slate-300 px-2.5 py-2">
                    <p className="font-semibold text-slate-900">{bucket.meta.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {LEVEL_STYLES[bucket.primaryLevel].label}
                    </p>
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-medium">
                    {bucket.emerging}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-medium">
                    {bucket.developing}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center font-medium">
                    {bucket.consistent}
                  </td>
                  <td className="border border-slate-300 px-2.5 py-2">
                    {bucket.observations.length > 0 ? (
                      <ul className="space-y-1.5">
                        {bucket.observations.slice(0, 4).map((obs) => (
                          <li key={obs.id}>
                            <span className="font-semibold text-slate-900">{obs.skill}</span>{' '}
                            <span className="text-slate-500">
                              ({friendly(obs.level)} · {dateLabel(obs.observedOn)})
                            </span>
                            : <span className="text-slate-700">{obs.observation}</span>
                          </li>
                        ))}
                        {bucket.observations.length > 4 && (
                          <li className="text-slate-500 italic">
                            + {bucket.observations.length - 4} more recorded observations in this
                            domain
                          </li>
                        )}
                      </ul>
                    ) : bucket.total > 0 ? (
                      <span className="text-slate-600">
                        {bucket.total} classroom{' '}
                        {bucket.total === 1 ? 'observation' : 'observations'} recorded.
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        No observations recorded in this period.
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {teacherRemarks.trim() && (
          <section className="rounded-lg border border-slate-300 p-4 mb-6 break-inside-avoid">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              Teacher’s Term Reflection
            </h2>
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {teacherRemarks.trim()}
            </p>
          </section>
        )}

        <footer className="pt-8 mt-6 border-t border-slate-300 break-inside-avoid">
          <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-700 mb-5">
            <div>
              <div className="border-b border-slate-400 h-10 mb-1.5" />
              <p className="font-semibold">Class Teacher</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1.5" />
              <p className="font-semibold">Principal / Coordinator</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1.5" />
              <p className="font-semibold">Parent / Guardian</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Early years classroom observations document play, curiosity and personal growth. They are
            not clinical assessments, grades, or comparisons between children.
          </p>
        </footer>
      </article>
    </dialog>
  );
}
