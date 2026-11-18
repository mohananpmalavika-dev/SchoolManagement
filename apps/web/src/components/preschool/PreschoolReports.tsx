'use client';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Printer } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import {
  PRESCHOOL_DOMAIN_META,
  developmentDomains,
  summarizePreschoolDomains,
  type DevelopmentDomain,
  type PreschoolChildView,
  type PreschoolDomainObservationGroup,
} from '@/lib/preschool';
import { exportCsv, messageFor, money } from '@/lib/workspace';
import { Panel, EmptyState } from '../WorkspaceUI';
import { Button } from '../ui';
import {
  PreschoolMilestoneProgressCard,
  PreschoolTermReportPrint,
  type PreschoolTermReportData,
} from './PreschoolMilestoneReport';

interface ReportClassroom {
  id: string;
  name: string;
  preschoolStage?: string | null;
  schoolName?: string;
}

interface ReportRow {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  checkIns: number;
  checkOuts: number;
  careUpdates: number;
  outstandingBalance?: number;
  observations: PreschoolDomainObservationGroup[];
  attendance: { status: string; _count: { _all: number } }[];
}

export function PreschoolReports({
  classId,
  from,
  to,
  today,
  refresh,
}: {
  classId: string;
  from: string;
  to: string;
  today?: string;
  refresh: number;
}) {
  const [data, setData] = useState<{
    classroom?: ReportClassroom;
    students: ReportRow[];
    admissionsInRange: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [printReport, setPrintReport] = useState<PreschoolTermReportData | null>(null);
  const [printLoadingId, setPrintLoadingId] = useState('');
  const [printError, setPrintError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError('');
    setPrintError('');
    setSelectedStudentId('');
    apiClient
      .get('/preschool/reports', { params: { classId, from, to }, signal: controller.signal })
      .then(({ data }) => setData(data))
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      });
    return () => controller.abort();
  }, [classId, from, to, refresh]);

  const rows = useMemo(
    () =>
      data?.students.map((s) => {
        const milestoneSummary = summarizePreschoolDomains(s.observations);
        const perDomainCounts: Record<string, number> = {};
        for (const bucket of milestoneSummary.domains) {
          perDomainCounts['domain_' + bucket.domain] = bucket.total;
        }
        return {
          ...s,
          name: s.firstName + ' ' + s.lastName,
          milestoneSummary,
          observationCount: milestoneSummary.totalObservations,
          emergingCount: milestoneSummary.levels.EMERGING,
          developingCount: milestoneSummary.levels.DEVELOPING,
          consistentCount: milestoneSummary.levels.CONSISTENT,
          domainsObserved: milestoneSummary.domainsObserved,
          ...perDomainCounts,
          absentDays: s.attendance
            .filter((a) => a.status === 'ABSENT')
            .reduce((n, a) => n + a._count._all, 0),
          outstandingRupees:
            s.outstandingBalance == null ? '' : (s.outstandingBalance / 100).toFixed(2),
        };
      }) || [],
    [data]
  );

  const classMilestoneGroups = useMemo(
    () => rows.flatMap((row) => row.observations),
    [rows]
  );

  const childrenCountByDomain = useMemo(() => {
    const counts: Partial<Record<DevelopmentDomain, number>> = {};
    for (const domain of developmentDomains) {
      counts[domain] = rows.filter((row) =>
        row.milestoneSummary.domains.some((bucket) => bucket.domain === domain && bucket.total > 0)
      ).length;
    }
    return counts;
  }, [rows]);

  const selectedRow = rows.find((row) => row.id === selectedStudentId) || null;

  async function openTermReport(row: (typeof rows)[number]) {
    setPrintLoadingId(row.id);
    setPrintError('');
    try {
      const { data: childData } = await apiClient.get<PreschoolChildView>(
        '/preschool/students/' + row.id,
        { params: { from, to } }
      );
      setPrintReport({
        studentName: row.name,
        className: childData.student.className || data?.classroom?.name || 'Preschool class',
        preschoolStage:
          childData.student.preschoolStage || data?.classroom?.preschoolStage || null,
        schoolName: childData.student.schoolName || data?.classroom?.schoolName || '',
        dateOfBirth: childData.student.dateOfBirth || null,
        from,
        to,
        generatedOn: today || to,
        checkIns: row.checkIns,
        checkOuts: row.checkOuts,
        absentDays: row.absentDays,
        careUpdates: row.careUpdates,
        groups: row.observations,
        observations: childData.observations || [],
      });
    } catch (err) {
      // Fallback to grouped summary if detailed fetch fails (e.g., inactive student)
      setPrintReport({
        studentName: row.name,
        className: data?.classroom?.name || 'Preschool class',
        preschoolStage: data?.classroom?.preschoolStage || null,
        schoolName: data?.classroom?.schoolName || '',
        from,
        to,
        generatedOn: today || to,
        checkIns: row.checkIns,
        checkOuts: row.checkOuts,
        absentDays: row.absentDays,
        careUpdates: row.careUpdates,
        groups: row.observations,
        observations: [],
      });
      setPrintError('Opened term report with grouped counts: ' + messageFor(err));
    } finally {
      setPrintLoadingId('');
    }
  }

  return (
    <div className="content-stack">
      {error && (
        <div role="alert" className="state-box">
          {error}
        </div>
      )}
      {printError && (
        <div role="status" className="state-box">
          {printError}
        </div>
      )}
      {data && rows.length > 0 && (
        <PreschoolMilestoneProgressCard
          title={
            data.classroom?.name
              ? `Class 7-domain milestone overview · ${data.classroom.name}`
              : 'Class 7-domain milestone overview'
          }
          subtitle="Combined observations across all children in this class for the selected date range."
          groups={classMilestoneGroups}
          from={from}
          to={to}
          childrenCountByDomain={childrenCountByDomain}
          totalChildrenInClass={rows.length}
        />
      )}
      <Panel
        title="Preschool reports & term progress cards"
        subtitle="Attendance and 7-domain milestones cover the selected dates. Fee balances are current, in INR."
      >
        <div className="panel-body space-y-4">
          {data ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>
                  Admissions during this period: <strong>{data.admissionsInRange}</strong>
                </p>
                <Button
                  variant="outline"
                  disabled={!rows.length}
                  onClick={() =>
                    exportCsv(
                      'preschool-' + from + '-' + to,
                      [
                        { label: 'Child', key: 'name' },
                        { label: 'Check-ins', key: 'checkIns' },
                        { label: 'Checkouts', key: 'checkOuts' },
                        { label: 'Recorded absences', key: 'absentDays' },
                        { label: 'Shared care updates', key: 'careUpdates' },
                        { label: 'Total observations', key: 'observationCount' },
                        { label: 'Domains observed (of 7)', key: 'domainsObserved' },
                        { label: 'Consistent', key: 'consistentCount' },
                        { label: 'Developing', key: 'developingCount' },
                        { label: 'Emerging', key: 'emergingCount' },
                        ...developmentDomains.map((domain) => ({
                          label: PRESCHOOL_DOMAIN_META[domain].shortLabel,
                          key: 'domain_' + domain,
                        })),
                        ...(rows.some((s) => s.outstandingBalance != null)
                          ? [{ label: 'Current balance (INR)', key: 'outstandingRupees' }]
                          : []),
                      ],
                      rows
                    )
                  }
                >
                  Download report CSV
                </Button>
              </div>
              {rows.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Child</th>
                        <th>Check-ins / out</th>
                        <th>Recorded absences</th>
                        <th>Care updates</th>
                        <th>7-Domain milestones</th>
                        {rows.some((s) => s.outstandingBalance != null) && (
                          <th>Current fees due</th>
                        )}
                        <th>Term report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((s) => {
                        const isSelected = selectedStudentId === s.id;
                        return (
                          <tr key={s.id}>
                            <td className="font-medium">{s.name}</td>
                            <td>
                              {s.checkIns} / {s.checkOuts}
                            </td>
                            <td>{s.absentDays}</td>
                            <td>{s.careUpdates}</td>
                            <td>
                              {s.observationCount > 0 ? (
                                <div className="space-y-1 min-w-44">
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="font-semibold">
                                      {s.domainsObserved}/7 domains
                                    </span>
                                    <span className="muted">({s.observationCount})</span>
                                  </div>
                                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                                    {s.consistentCount > 0 && (
                                      <div
                                        style={{
                                          width: `${(s.consistentCount / s.observationCount) * 100}%`,
                                          backgroundColor: '#10b981',
                                        }}
                                        title={`Consistent: ${s.consistentCount}`}
                                      />
                                    )}
                                    {s.developingCount > 0 && (
                                      <div
                                        style={{
                                          width: `${(s.developingCount / s.observationCount) * 100}%`,
                                          backgroundColor: '#f59e0b',
                                        }}
                                        title={`Developing: ${s.developingCount}`}
                                      />
                                    )}
                                    {s.emergingCount > 0 && (
                                      <div
                                        style={{
                                          width: `${(s.emergingCount / s.observationCount) * 100}%`,
                                          backgroundColor: '#0ea5e9',
                                        }}
                                        title={`Emerging: ${s.emergingCount}`}
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-[11px]">
                                    <span className="text-emerald-700 font-medium">
                                      C: {s.consistentCount}
                                    </span>
                                    <span className="text-amber-700 font-medium">
                                      D: {s.developingCount}
                                    </span>
                                    <span className="text-sky-700 font-medium">
                                      E: {s.emergingCount}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs muted">No observations yet</span>
                              )}
                            </td>
                            {s.outstandingBalance != null && (
                              <td>{money(s.outstandingBalance)}</td>
                            )}
                            <td>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant={isSelected ? 'primary' : 'outline'}
                                  leftIcon={<BarChart3 size={14} />}
                                  onClick={() =>
                                    setSelectedStudentId(isSelected ? '' : s.id)
                                  }
                                >
                                  {isSelected ? 'Hide 7-domain' : '7-domain card'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<Printer size={14} />}
                                  isLoading={printLoadingId === s.id}
                                  disabled={Boolean(printLoadingId) && printLoadingId !== s.id}
                                  onClick={() => void openTermReport(s)}
                                >
                                  Term PDF
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No children in this class" />
              )}
            </>
          ) : (
            !error && <p role="status">Preparing report…</p>
          )}
        </div>
      </Panel>
      {selectedRow && (
        <PreschoolMilestoneProgressCard
          title={`7-Domain milestone card · ${selectedRow.name}`}
          subtitle={`${data?.classroom?.name || 'Preschool'} · ${selectedRow.checkIns} check-ins · ${selectedRow.absentDays} absences`}
          groups={selectedRow.observations}
          from={from}
          to={to}
          printLoading={printLoadingId === selectedRow.id}
          onOpenPrint={() => void openTermReport(selectedRow)}
        />
      )}
      {printReport && (
        <PreschoolTermReportPrint
          report={printReport}
          canEditRemarks
          close={() => setPrintReport(null)}
        />
      )}
    </div>
  );
}
