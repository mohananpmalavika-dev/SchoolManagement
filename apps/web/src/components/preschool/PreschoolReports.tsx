'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { exportCsv, messageFor, money } from '@/lib/workspace';
import { Panel, EmptyState } from '../WorkspaceUI';
import { Button } from '../ui';
interface ReportRow {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  checkIns: number;
  checkOuts: number;
  careUpdates: number;
  outstandingBalance?: number;
  observations: { _count: { _all: number } }[];
  attendance: { status: string; _count: { _all: number } }[];
}
export function PreschoolReports({
  classId,
  from,
  to,
  refresh,
}: {
  classId: string;
  from: string;
  to: string;
  refresh: number;
}) {
  const [data, setData] = useState<{ students: ReportRow[]; admissionsInRange: number } | null>(
      null
    ),
    [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError('');
    apiClient
      .get('/preschool/reports', { params: { classId, from, to }, signal: controller.signal })
      .then(({ data }) => setData(data))
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      });
    return () => controller.abort();
  }, [classId, from, to, refresh]);
  const rows =
    data?.students.map((s) => ({
      ...s,
      name: s.firstName + ' ' + s.lastName,
      observationCount: s.observations.reduce((n, o) => n + o._count._all, 0),
      absentDays: s.attendance
        .filter((a) => a.status === 'ABSENT')
        .reduce((n, a) => n + a._count._all, 0),
      outstandingRupees:
        s.outstandingBalance == null ? '' : (s.outstandingBalance / 100).toFixed(2),
    })) || [];
  return (
    <Panel
      title="Preschool reports"
      subtitle="Attendance and observations cover the selected dates. Fee balances are current, in INR."
    >
      <div className="panel-body space-y-4">
        {error && (
          <div role="alert" className="state-box">
            {error}
          </div>
        )}
        {data ? (
          <>
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
                    { label: 'Observations', key: 'observationCount' },
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
            {rows.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Child</th>
                      <th>Check-ins / out</th>
                      <th>Recorded absences</th>
                      <th>Care updates</th>
                      <th>Observations</th>
                      {rows.some((s) => s.outstandingBalance != null) && <th>Current fees due</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>
                          {s.checkIns} / {s.checkOuts}
                        </td>
                        <td>{s.absentDays}</td>
                        <td>{s.careUpdates}</td>
                        <td>{s.observationCount}</td>
                        {s.outstandingBalance != null && <td>{money(s.outstandingBalance)}</td>}
                      </tr>
                    ))}
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
  );
}
