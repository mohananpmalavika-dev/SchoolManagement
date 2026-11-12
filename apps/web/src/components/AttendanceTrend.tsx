'use client';
import { useId, useState } from 'react';
type Day = { date: string; total: number; rate: number };
export function AttendanceTrend({ days }: { days: Day[] }) {
  const gradient = useId().replaceAll(':', '');
  const [selected, setSelected] = useState(() => Math.max(0, days.findIndex(day => day.total > 0)));
  const active = days[Math.min(selected, days.length - 1)];
  const x = (index: number) => days.length <= 1 ? 500 : 20 + index * 960 / (days.length - 1);
  const y = (rate: number) => 145 - Math.min(100, Math.max(0, rate)) * 1.3;
  const runs: { x: number; y: number }[][] = [];
  days.forEach((day, index) => {
    if (!day.total) return;
    if (index === 0 || !days[index - 1].total) runs.push([]);
    runs[runs.length - 1].push({ x: x(index), y: y(day.rate) });
  });
  return <div className="attendance-trend">
    <div className="trend-readout" aria-live="polite"><div><strong>{active?.total ? active.rate + '%' : '\u2014'}</strong><span>{active ? new Date(active.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Attendance'}</span></div><small>{active?.total ? active.total.toLocaleString('en-IN') + ' students recorded' : 'No register recorded'}</small></div>
    <div className="trend-plot"><svg viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3478EF" stopOpacity=".2"/><stop offset="1" stopColor="#3478EF" stopOpacity="0"/></linearGradient></defs>
      {[20,60,100,145].map(value => <path key={value} d={'M0 ' + value + 'H1000'} stroke="#EAF0F8" strokeDasharray="4 5"/>)}
      {runs.map((run, index) => { const line = run.map((point, i) => (i ? 'L' : 'M') + point.x + ' ' + point.y).join(' '); return <g key={index}><path d={line + 'L' + run.at(-1)!.x + ' 145L' + run[0].x + ' 145Z'} fill={'url(#' + gradient + ')'}/><path d={line} stroke="#3478EF" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round"/></g>; })}
    </svg>{days.map((day, index) => <button key={day.date} className={'trend-point ' + (selected === index ? 'selected' : '')} style={{ left: x(index) / 10 + '%', top: (day.total ? y(day.rate) : 145) / 1.6 + '%' }} onClick={() => setSelected(index)} onFocus={() => setSelected(index)} aria-label={new Date(day.date).toLocaleDateString('en-IN', { weekday: 'long' }) + ': ' + (day.total ? day.rate + '%, ' + day.total + ' students recorded' : 'No register recorded')} aria-pressed={selected === index}><span/></button>)}</div>
    <div className="trend-days">{days.map(day => <span key={day.date}>{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>)}</div><div className="chart-summary"><span><span className="workspace-dot inline-block mr-2"/>Attendance rate</span><span>Saved daily registers</span></div>
  </div>;
}
