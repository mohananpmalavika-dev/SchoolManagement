'use client';
import { useState } from 'react';
import { Button } from '../ui';
const title = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .toLowerCase();
const monetary = (key: string) => /amount|revenue|outstanding|collected/i.test(key);
function value(raw: unknown, key: string, money: boolean): string {
  if (raw === null || raw === undefined || raw === '') return '—';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  if (typeof raw === 'number')
    return money && monetary(key)
      ? '₹ ' +
          (raw / 100).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
      : raw.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return String(raw);
}
function Records({ rows, money, title: heading }: { rows: any[]; money: boolean; title: string }) {
  const [page, setPage] = useState(0),
    perPage = 25;
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter(
    (key) => !['id', 'studentId', 'academicYearId'].includes(key)
  );
  if (!rows.length)
    return <p className="muted text-sm">No {heading.toLowerCase()} in this snapshot.</p>;
  return (
    <div className="space-y-3">
      <h3>{heading}</h3>
      <div className="overflow-auto max-h-96">
        <table className="w-full text-xs text-left">
          <thead>
            <tr>
              {columns.map((key) => (
                <th key={key} className="p-3 border-b whitespace-nowrap">
                  {title(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(page * perPage, (page + 1) * perPage).map((row, index) => (
              <tr key={row.id || index}>
                {columns.map((key) => (
                  <td key={key} className="p-3 border-b whitespace-nowrap">
                    {value(row[key], key, money)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 items-center text-sm">
        <span>
          {page * perPage + 1}–{Math.min((page + 1) * perPage, rows.length)} of {rows.length}{' '}
          records
        </span>
        <Button variant="outline" size="sm" disabled={!page} onClick={() => setPage(page - 1)}>
          Previous records
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={(page + 1) * perPage >= rows.length}
          onClick={() => setPage(page + 1)}
        >
          Next records
        </Button>
      </div>
    </div>
  );
}
export function ReportFigures({ data }: { data: any }) {
  const money = !!data.currencyUnit;
  return (
    <div className="space-y-4 mt-4">
      {data.period && (
        <p className="text-sm">
          {data.period.startDate} – {data.period.endDate}
          {data.period.totalDays !== undefined ? ` · ${data.period.totalDays} school days` : ''}
        </p>
      )}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(data.summary || {}).map(([key, raw]) => (
          <div className="panel p-3" key={key}>
            <dt className="muted text-xs">{title(key)}</dt>
            <dd className="font-semibold mt-1">{value(raw, key, money)}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm muted">{data.basis || data.source || data.period?.calendarBasis}</p>
      {money && (
        <p className="text-sm muted">
          Money is displayed in rupees here. Exported numeric amounts use paise.
        </p>
      )}
      <Records
        key={'rows-' + data.generatedAt}
        rows={data.rows || []}
        money={money}
        title="Source records"
      />
      {data.payments && (
        <Records
          key={'payments-' + data.generatedAt}
          rows={data.payments}
          money={money}
          title="Completed receipts"
        />
      )}
    </div>
  );
}
