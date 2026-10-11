'use client';

import React from 'react';
import { TamperProofAuditRecord } from '@krypton/types';
import { X, ShieldCheck, AlertTriangle, Clock, User, Hash, FileText } from 'lucide-react';

interface AuditDiffModalProps {
  record: TamperProofAuditRecord | null;
  onClose: () => void;
  isMalayalam?: boolean;
}

export function AuditDiffModal({ record, onClose, isMalayalam = false }: AuditDiffModalProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Block #{record.sequence}
                </span>
                <span className="text-xs text-gray-300 font-mono">{record.id}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {isMalayalam ? 'രേഖ തിരുത്തൽ ഓഡിറ്റ് വിശദാംശങ്ങൾ' : 'Audit Trail Diff & Cryptographic Proof'}
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
          {/* Target Entity Overview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {isMalayalam ? 'തിരുത്തപ്പെട്ട ഇനം (Target Entity)' : 'Target Modified Record'}
            </div>
            <div className="text-base font-bold text-slate-900">{record.entityName}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                {record.entityType}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                Action: {record.action}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono text-slate-600 bg-slate-200">
                ID: {record.entityId}
              </span>
            </div>
          </div>

          {/* Mandatory Reason Box */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-900 font-semibold mb-1">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>{isMalayalam ? 'മാറ്റത്തിനുള്ള കാരണം (Mandatory Reason):' : 'Mandatory Justification / Reason:'}</span>
            </div>
            <p className="text-amber-950 font-medium pl-6 leading-relaxed">
              &ldquo;{record.reason}&rdquo;
            </p>
            {record.approvalRef && (
              <div className="mt-2 pl-6 flex items-center gap-2 text-xs font-semibold text-amber-800">
                <span className="bg-amber-200/80 px-2 py-0.5 rounded">
                  Approval Ref: {record.approvalRef}
                </span>
              </div>
            )}
          </div>

          {/* Field Level Changes Before vs After */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>{isMalayalam ? 'മാറ്റങ്ങൾ (മുമ്പും ശേഷവും):' : 'Field Level Diff (Before vs After):'}</span>
            </h3>

            <div className="space-y-3">
              {record.changes.map((diff, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{diff.fieldLabel}</span>
                    <span className="text-xs font-mono text-slate-500">[{diff.field}]</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    {/* Before */}
                    <div className="p-4 bg-red-50/40">
                      <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        {isMalayalam ? 'മാറ്റത്തിന് മുൻപ് (Before)' : 'Previous Value (Before)'}
                      </div>
                      <div className="text-sm font-mono text-red-900 bg-white/80 p-2.5 rounded-lg border border-red-200 break-words line-through decoration-red-500">
                        {diff.oldValue !== null && diff.oldValue !== undefined ? String(diff.oldValue) : '— (None)'}
                      </div>
                    </div>

                    {/* After */}
                    <div className="p-4 bg-emerald-50/40">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {isMalayalam ? 'മാറ്റത്തിന് ശേഷം (After)' : 'New Value (After)'}
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-900 bg-white/80 p-2.5 rounded-lg border border-emerald-200 break-words">
                        {diff.newValue !== null && diff.newValue !== undefined ? String(diff.newValue) : '— (Deleted)'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User & Environment Fingerprint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {isMalayalam ? 'മാറ്റം വരുത്തിയ ആൾ (Performed By)' : 'Authorized Operator'}
              </div>
              <div className="font-bold text-slate-900">{record.performedBy.fullName}</div>
              <div className="text-xs text-indigo-700 font-semibold">{record.performedBy.role}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{record.performedBy.email}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {isMalayalam ? 'തീയതി & നെറ്റ്‌വർക്ക്' : 'Timestamp & Origin'}
              </div>
              <div className="font-medium text-slate-900">
                {new Date(record.timestamp).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })}
              </div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                IP: <span className="font-semibold">{record.performedBy.ipAddress}</span>
              </div>
              <div className="text-xs text-slate-400 truncate mt-0.5">
                UA: {record.performedBy.userAgent}
              </div>
            </div>
          </div>

          {/* Cryptographic Hash Chain Proof */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Hash className="w-4 h-4" />
                {isMalayalam ? 'ക്രിപ്റ്റോഗ്രാഫിക് ഹാഷ് ചെയിൻ പ്രൂഫ്' : 'Cryptographic Hash Chaining Proof (SHA-256)'}
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-800 text-[10px]">
                {record.signature}
              </span>
            </div>

            <div>
              <div className="text-slate-400 text-[11px] mb-0.5">Previous Block Hash (Parent):</div>
              <div className="bg-slate-950 p-2 rounded text-slate-400 break-all select-all border border-slate-800">
                {record.previousHash}
              </div>
            </div>

            <div>
              <div className="text-indigo-300 text-[11px] mb-0.5 font-semibold">Current Block Hash (Calculated):</div>
              <div className="bg-slate-950 p-2 rounded text-indigo-200 font-bold break-all select-all border border-indigo-900/60">
                {record.currentHash}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {isMalayalam
                ? 'ഈ രേഖ തിരുത്തപ്പെടാത്ത സുരക്ഷിത ചെയിനിൽ എൻക്രിപ്റ്റ് ചെയ്തിരിക്കുന്നു.'
                : 'Tamper-Proof & Non-Repudiable Audit Record.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
          >
            {isMalayalam ? 'അടയ്ക്കുക' : 'Close Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
