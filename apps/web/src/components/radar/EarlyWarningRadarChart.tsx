'use client';

import React from 'react';
import type { RadarMetrics } from '@krypton/types';

interface EarlyWarningRadarChartProps {
  metrics: RadarMetrics;
  classAverage?: RadarMetrics;
  size?: number;
  showLabels?: boolean;
  className?: string;
}

export function EarlyWarningRadarChart({
  metrics,
  classAverage = {
    academicScore: 68,
    attendanceScore: 82,
    homeworkScore: 78,
    financialScore: 85,
    compositeRiskScore: 30,
  },
  size = 280,
  showLabels = true,
  className = '',
}: EarlyWarningRadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.72;

  // 5 Radar Dimensions
  const axes = [
    { key: 'academicScore', label: 'Exams (പരീക്ഷ)', sub: 'Marks & Trend', value: metrics.academicScore, avg: classAverage.academicScore },
    { key: 'attendanceScore', label: 'Attendance (ഹാജർ)', sub: 'Punctuality', value: metrics.attendanceScore, avg: classAverage.attendanceScore },
    { key: 'homeworkScore', label: 'Homework (ഹോംവർക്ക്)', sub: 'Submissions', value: metrics.homeworkScore, avg: classAverage.homeworkScore },
    { key: 'financialScore', label: 'Fee Health (ഫീസ്)', sub: 'Settlement', value: metrics.financialScore, avg: classAverage.financialScore },
    { key: 'retentionScore', label: 'Retention (സ്ഥിരത)', sub: 'Engagement', value: Math.max(0, 100 - metrics.compositeRiskScore), avg: 100 - classAverage.compositeRiskScore },
  ];

  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;
  // Start from top (-PI/2)
  const startAngle = -Math.PI / 2;

  const getCoordinates = (index: number, val: number, maxVal = 100) => {
    const angle = startAngle + index * angleStep;
    const r = (Math.max(0, Math.min(100, val)) / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon points for student
  const studentPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.value);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Polygon points for class average
  const avgPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.avg);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Concentric polygon grid levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Dynamic color depending on risk
  const isHighRisk = metrics.compositeRiskScore >= 65;
  const isModerateRisk = metrics.compositeRiskScore >= 35 && metrics.compositeRiskScore < 65;

  const fillColor = isHighRisk
    ? 'rgba(239, 68, 68, 0.35)'
    : isModerateRisk
    ? 'rgba(245, 158, 11, 0.32)'
    : 'rgba(16, 185, 129, 0.28)';

  const strokeColor = isHighRisk ? '#ef4444' : isModerateRisk ? '#f59e0b' : '#10b981';

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible drop-shadow-sm"
      >
        <defs>
          <linearGradient id={`radarGradient-${metrics.compositeRiskScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center Glow */}
        <circle cx={center} cy={center} r={radius} fill="url(#radarCenterGlow)" />

        {/* Concentric grid rings */}
        {levels.map((level, lvlIdx) => {
          const ringPoints = axes
            .map((_, i) => {
              const { x, y } = getCoordinates(i, level * 100);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvlIdx}
              points={ringPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={lvlIdx === levels.length - 1 ? '1.5' : '1'}
              strokeDasharray={lvlIdx === levels.length - 1 ? 'none' : '2,2'}
              className="dark:stroke-slate-700 transition-all duration-300"
            />
          );
        })}

        {/* Axis rays from center */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
              className="dark:stroke-slate-700"
            />
          );
        })}

        {/* Benchmark / Class Average Polygon */}
        <polygon
          points={avgPoints}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4,3"
          opacity="0.8"
        />

        {/* Student Value Polygon */}
        <polygon
          points={studentPoints}
          fill={`url(#radarGradient-${metrics.compositeRiskScore})`}
          stroke={strokeColor}
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

        {/* Student Data Vertex Points */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, axis.value);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth="2.5"
                className="transition-all duration-300 hover:r-6 cursor-pointer"
              />
              <title>{`${axis.label}: ${axis.value}% (Class Avg: ${axis.avg}%)`}</title>
            </g>
          );
        })}

        {/* Axis Labels */}
        {showLabels &&
          axes.map((axis, i) => {
            const angle = startAngle + i * angleStep;
            const labelR = radius + 24;
            const lx = center + labelR * Math.cos(angle);
            const ly = center + labelR * Math.sin(angle);

            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (Math.cos(angle) > 0.3) textAnchor = 'start';
            else if (Math.cos(angle) < -0.3) textAnchor = 'end';

            return (
              <g key={i} className="text-[10px] font-medium">
                <text
                  x={lx}
                  y={ly - 2}
                  textAnchor={textAnchor}
                  fill="#1e293b"
                  className="dark:fill-slate-200 font-semibold"
                >
                  {axis.label}
                </text>
                <text
                  x={lx}
                  y={ly + 10}
                  textAnchor={textAnchor}
                  fill="#64748b"
                  className="dark:fill-slate-400 text-[9px]"
                >
                  {axis.value}%
                </text>
              </g>
            );
          })}
      </svg>

      {/* Legend below chart */}
      <div className="flex items-center gap-4 text-xs mt-2 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: strokeColor }}
          />
          <span className="font-medium text-slate-700 dark:text-slate-300">Student Profile</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
          <span>Class Benchmark</span>
        </div>
      </div>
    </div>
  );
}
