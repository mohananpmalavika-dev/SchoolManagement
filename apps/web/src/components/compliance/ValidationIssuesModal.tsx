'use client';

import React from 'react';
import { BoardExportTemplate, ComplianceValidationIssue } from '@krypton/types';
import { X, AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface ValidationIssuesModalProps {
  template: BoardExportTemplate | null;
  issues: ComplianceValidationIssue[];
  onClose: () => void;
  onProceedExport: () => void;
  isMalayalam?: boolean;
}

export function ValidationIssuesModal({
  template,
  issues,
  onClose,
  onProceedExport,
  isMalayalam = false,
}: ValidationIssuesModalProps) {
  if (!template) return null;

  const errors = issues.filter((i) => i.severity === 'ERROR');
  const warnings = issues.filter((i) => i.severity === 'WARNING');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-500/20 border border-indigo-400/40 rounded-xl text-indigo-300">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                {template.portalName}
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {isMalayalam ? 'പോർട്ടൽ ഡാറ്റാ ഗുണനിലവാര പരിശോധന' : 'Pre-Export Portal Data Quality Audit'}
              </h2>
            </div>
          </div>
        </div>

        {/* Score & Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-indigo-700">{template.complianceScore}%</div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                {isMalayalam ? 'കംപ്ലയൻസ് സ്കോർ' : 'Compliance Readiness'}
              </div>
              <div className="text-[11px] text-slate-500">
                {template.recordCount} {isMalayalam ? 'വിദ്യാർത്ഥി രേഖകൾ പരിശോധിച്ചു' : 'Records Validated'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {errors.length > 0 && (
              <span className="px-2.5 py-1 rounded-md font-bold bg-red-100 text-red-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.length} {isMalayalam ? 'പിഴവുകൾ' : 'Errors'}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="px-2.5 py-1 rounded-md font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {warnings.length} {isMalayalam ? 'മുന്നറിയിപ്പുകൾ' : 'Warnings'}
              </span>
            )}
            {issues.length === 0 && (
              <span className="px-2.5 py-1 rounded-md font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isMalayalam ? '100% കൃത്യം' : '100% Verified'}
              </span>
            )}
          </div>
        </div>

        {/* Issues List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-sm">
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">
                {isMalayalam ? 'എല്ലാ ഡാറ്റയും 100% കൃത്യമാണ്!' : 'Zero Validation Errors!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isMalayalam
                  ? 'ഈ പോർട്ടലിലേക്ക് സമർപ്പിക്കേണ്ട എല്ലാ വിവരങ്ങളും സർക്കാർ മാനദണ്ഡങ്ങൾക്ക് അനുസൃതമാണ്.'
                  : 'All candidate profiles contain mandated attributes, valid identity numbers, and subject codes.'}
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3.5 rounded-xl border text-xs ${
                  issue.severity === 'ERROR'
                    ? 'bg-red-50/70 border-red-200 text-red-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    {issue.severity === 'ERROR' ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{issue.studentName}</span>
                    <span className="text-[11px] font-mono text-slate-600">({issue.studentId})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      issue.severity === 'ERROR'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-amber-200 text-amber-800'
                    }`}
                  >
                    {issue.field}
                  </span>
                </div>
                <p className="font-medium pl-5 text-slate-800">{issue.issue}</p>
                <div className="mt-2 pl-5 flex items-center gap-1.5 text-slate-600 text-[11px]">
                  <span className="font-semibold text-indigo-700">
                    {isMalayalam ? 'പരിഹാരം:' : 'Suggested Fix:'}
                  </span>
                  <span>{issue.suggestedFix}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition"
          >
            {isMalayalam ? 'ക്ലോസ് ചെയ്യുക' : 'Close Audit'}
          </button>

          <button
            onClick={() => {
              onProceedExport();
              onClose();
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md flex items-center gap-1.5"
          >
            <span>{isMalayalam ? 'ഡൗൺലോഡുമായി മുന്നോട്ട് പോകുക' : 'Proceed with 1-Click Export'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
