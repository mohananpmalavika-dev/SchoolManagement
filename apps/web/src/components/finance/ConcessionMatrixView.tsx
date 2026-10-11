'use client';

import React, { useState } from 'react';
import {
  Award,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Sliders,
  Percent,
  Search,
  ArrowRight,
  Info,
  Building,
  HeartHandshake,
} from 'lucide-react';
import {
  financeClient,
} from '@/lib/finance-client';
import {
  ConcessionRule,
  StudentConcessionMatch,
} from '@krypton/types';

export function ConcessionMatrixView() {
  const [rules, setRules] = useState<ConcessionRule[]>(() => financeClient.getConcessionRules());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'SIBLING' | 'STAFF' | 'MERIT'>('ALL');

  const matches: StudentConcessionMatch[] = financeClient.evaluateConcessionsMatrix();

  const handleToggleRule = (ruleId: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
    setRules(updated);
    financeClient.saveConcessionRules(updated);
  };

  const handlePercentageChange = (ruleId: string, newPercent: number) => {
    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, discountPercentage: Math.max(1, Math.min(100, newPercent)) } : r
    );
    setRules(updated);
    financeClient.saveConcessionRules(updated);
  };

  const filteredMatches = matches.filter((m) => {
    const matchSearch =
      m.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.grade.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (activeCategory === 'SIBLING') return (m.siblingCount || 0) > 1;
    if (activeCategory === 'STAFF') return m.isStaffChild;
    if (activeCategory === 'MERIT') return (m.academicGpaPercent || 0) >= 90;

    return true;
  });

  const totalConcessionsGranted = matches.reduce((acc, curr) => acc + curr.totalConcessionAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Award size={22} />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Scholarship & Sibling Concession Matrix
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Automated institutional discount matrix engine. Intelligently cross-references sibling
              guardianship, staff biological dependents, and board examination merit scores to
              auto-apply fee concessions without manual paperwork.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/15 text-right">
            <span className="text-xs text-indigo-200 block uppercase font-medium">Total Concessions Granted</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ₹{totalConcessionsGranted.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-300 block">Applied across student invoices</span>
          </div>
        </div>
      </div>

      {/* Dynamic Rule Matrix Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-indigo-600" />
            Configured Concession Rules & Percentage Matrix
          </h3>
          <span className="text-xs text-slate-500">Live Auto-Evaluation Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition ${
                rule.isActive
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    rule.type === 'SIBLING'
                      ? 'bg-blue-100 text-blue-800'
                      : rule.type === 'STAFF_CHILD'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {rule.type.replace('_', ' ')}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={() => handleToggleRule(rule.id)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <h4 className="font-bold text-slate-800 text-sm mb-1">{rule.name}</h4>
              {rule.nameMl && (
                <p className="text-xs text-indigo-700 font-medium mb-2">{rule.nameMl}</p>
              )}
              <p className="text-xs text-slate-500 mb-3">{rule.criteriaDescription}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Waiver %</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={rule.discountPercentage}
                    onChange={(e) => handlePercentageChange(rule.id, parseInt(e.target.value) || 0)}
                    className="w-14 text-xs font-bold text-center px-1.5 py-1 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar for Students */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Students ({matches.length})
          </button>
          <button
            onClick={() => setActiveCategory('SIBLING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeCategory === 'SIBLING'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users size={13} /> Sibling Groups
          </button>
          <button
            onClick={() => setActiveCategory('STAFF')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeCategory === 'STAFF'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building size={13} /> Staff Children
          </button>
          <button
            onClick={() => setActiveCategory('MERIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              activeCategory === 'MERIT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <GraduationCap size={13} /> Merit Scholars (90%+)
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search student or grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* Live Concession Matches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student & Grade</th>
                <th className="py-3 px-4">Detected Criteria</th>
                <th className="py-3 px-4">Applied Concession</th>
                <th className="py-3 px-4 text-right">Standard Tuition</th>
                <th className="py-3 px-4 text-right">Waiver Deducted</th>
                <th className="py-3 px-4 text-right">Net Tuition Due</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No students match the selected category.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => {
                  const hasConcession = m.appliedConcessions.length > 0;
                  return (
                    <tr key={m.studentId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 text-sm block">
                          {m.studentName}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {m.admissionNumber} • {m.grade}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        {m.siblingCount && m.siblingCount > 1 ? (
                          <div className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                            <Users size={12} />
                            <span>
                              Family Sibling #{m.siblingCount} ({m.siblingNames?.join(', ')})
                            </span>
                          </div>
                        ) : null}

                        {m.isStaffChild && (
                          <div className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium">
                            <Building size={12} />
                            <span>Parent: {m.staffParentName}</span>
                          </div>
                        )}

                        {m.academicGpaPercent && m.academicGpaPercent >= 90 ? (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                            <GraduationCap size={12} />
                            <span>GPA {m.academicGpaPercent}% Academic Top-Tier</span>
                          </div>
                        ) : null}

                        {!m.isStaffChild && (!m.siblingCount || m.siblingCount <= 1) && (!m.academicGpaPercent || m.academicGpaPercent < 90) && (
                          <span className="text-slate-400 text-[11px]">Standard Non-Concession Enrollment</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {hasConcession ? (
                          <div className="space-y-1">
                            {m.appliedConcessions.map((c, i) => (
                              <div key={i} className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                                <Sparkles size={12} className="text-amber-500 shrink-0" />
                                <span>{c.description}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No concessions active</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 font-semibold">
                        ₹{m.originalTuition.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        {m.totalConcessionAmount > 0
                          ? `-₹${m.totalConcessionAmount.toLocaleString()}`
                          : '₹0'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{m.netTuitionPayable.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {hasConcession ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                            <CheckCircle2 size={11} /> AUTO-APPLIED
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            STANDARD
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
