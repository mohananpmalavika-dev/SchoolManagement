'use client';

import React, { useState } from 'react';
import {
  AuditEntityType,
  AuditAction,
  AuditFieldDiff,
  TamperProofAuditRecord,
} from '@krypton/types';
import { complianceClient } from '@/lib/compliance-engine-client';
import { X, ShieldAlert, CheckCircle, Lock, ArrowRight } from 'lucide-react';

interface RecordOverrideModalProps {
  onClose: () => void;
  onRecordCreated: (newRecord: TamperProofAuditRecord) => void;
  isMalayalam?: boolean;
}

export function RecordOverrideModal({
  onClose,
  onRecordCreated,
  isMalayalam = false,
}: RecordOverrideModalProps) {
  const [entityType, setEntityType] = useState<AuditEntityType>('GRADE');
  const [action, setAction] = useState<AuditAction>('GRADE_OVERRIDE');
  const [entityId, setEntityId] = useState('GRD-MATH-10B-205');
  const [entityName, setEntityName] = useState('Class 10B Mathematics Exam - Diya Mary Joseph');
  const [fieldLabel, setFieldLabel] = useState('Math Term 1 Marks');
  const [oldValue, setOldValue] = useState('79.0');
  const [newValue, setNewValue] = useState('88.0');
  const [reason, setReason] = useState('');
  const [approvalRef, setApprovalRef] = useState('PR/REV/2026/102');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleEntityTypeChange = (type: AuditEntityType) => {
    setEntityType(type);
    if (type === 'GRADE') {
      setAction('GRADE_OVERRIDE');
      setEntityId('GRD-MATH-10B-205');
      setEntityName('Class 10B Mathematics Exam - Diya Mary Joseph');
      setFieldLabel('Mathematics Final Score');
      setOldValue('79.0');
      setNewValue('88.0');
    } else if (type === 'FEE_PAYMENT') {
      setAction('FEE_STATUS_MODIFIED');
      setEntityId('INV-2026-940');
      setEntityName('Tuition Fee Invoice #INV-2026-940 - Siddharth Nair');
      setFieldLabel('Payment Status');
      setOldValue('PENDING');
      setNewValue('WAIVED_PRINCIPAL_SCHOLARSHIP');
    } else if (type === 'STUDENT_RECORD') {
      setAction('DOB_ALTERED');
      setEntityId('STU-105');
      setEntityName('Student Master Record - Siddharth Nair');
      setFieldLabel('Date of Birth');
      setOldValue('2010-09-28');
      setNewValue('2010-09-30');
    } else if (type === 'CERTIFICATE') {
      setAction('CERTIFICATE_REVOKED');
      setEntityId('TC-2026-09');
      setEntityName('Transfer Certificate #TC-2026-09');
      setFieldLabel('Certificate Status');
      setOldValue('ISSUED');
      setNewValue('REVOKED');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(
        isMalayalam
          ? 'മാറ്റത്തിനുള്ള കാരണം നൽകൽ നിർബന്ധമാണ്!'
          : 'Mandatory justification / reason is required for security audit!',
      );
      return;
    }

    setSubmitting(true);
    try {
      const changes: AuditFieldDiff[] = [
        {
          field: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
          fieldLabel,
          oldValue,
          newValue,
          changeType: 'MODIFIED',
        },
      ];

      const newRecord = complianceClient.appendAuditRecord({
        entityType,
        entityId,
        entityName,
        action,
        performedBy: {
          userId: 'usr-admin-current',
          fullName: 'Dr. K. R. Nambiar (Principal)',
          role: 'PRINCIPAL_DIRECTOR',
          email: 'principal@kryptonschool.edu.in',
          ipAddress: '192.168.1.10',
          userAgent: navigator.userAgent || 'Mozilla/5.0 Krypton-Admin-Client',
        },
        reason: reason.trim(),
        approvalRef: approvalRef.trim() || undefined,
        changes,
      });

      onRecordCreated(newRecord);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to append cryptographic audit block');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-red-500/20 border border-red-400/40 rounded-xl text-red-300">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isMalayalam ? 'സുരക്ഷിത രേഖ തിരുത്തൽ ലോഗ് ചെയ്യുക' : 'Log Controlled Record Modification'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {isMalayalam
                  ? 'മാർക്ക്, ഫീസ്, സർട്ടിഫിക്കറ്റ് തുടങ്ങിയ പ്രധാന വിവരങ്ങൾ തിരുത്തുമ്പോൾ ക്രിപ്റ്റോഗ്രാഫിക് ബ്ലോക്ക് ചെയിനിൽ രേഖപ്പെടുത്തുന്നു.'
                  : 'Tamper-evident SHA-256 blockchain audit block will be cryptographically sealed.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Entity Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {isMalayalam ? 'തിരുത്തേണ്ട വിഭാഗം (Entity Type)' : 'Target Domain / Entity Type'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'GRADE', label: 'Marks / Grades', labelMl: 'മാർക്കുകൾ' },
                { type: 'FEE_PAYMENT', label: 'Fee / Payment', labelMl: 'ഫീസ് സ്റ്റാറ്റസ്' },
                { type: 'STUDENT_RECORD', label: 'Student Bio', labelMl: 'വിദ്യാർത്ഥി പ്രൊഫൈൽ' },
                { type: 'CERTIFICATE', label: 'Certificate', labelMl: 'സർട്ടിഫിക്കറ്റ്' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleEntityTypeChange(item.type as AuditEntityType)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                    entityType === item.type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isMalayalam ? item.labelMl : item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entity Name & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isMalayalam ? 'റെക്കോർഡ് വിവരണം' : 'Target Entity Description'}
              </label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isMalayalam ? 'റെക്കോർഡ് ഐഡി' : 'Target Entity ID'}
              </label>
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Field Label, Old Value, New Value */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-3">
            <div className="text-xs font-bold text-slate-700">
              {isMalayalam ? 'തിരുത്തപ്പെടുന്ന ഫീൽഡ് & മാറ്റങ്ങൾ' : 'Field Modification Values'}
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {isMalayalam ? 'ഫീൽഡ് നാമം' : 'Field Label'}
              </label>
              <input
                type="text"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-red-700 font-semibold mb-1">
                  {isMalayalam ? 'പഴയ മൂല്യം (Before)' : 'Old / Current Value'}
                </label>
                <input
                  type="text"
                  value={oldValue}
                  onChange={(e) => setOldValue(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-red-300 bg-red-50/40 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-emerald-700 font-semibold mb-1">
                  {isMalayalam ? 'പുതിയ മൂല്യം (After)' : 'New Overridden Value'}
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-emerald-300 bg-emerald-50/40 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-bold text-red-600 mb-1 flex items-center justify-between">
              <span>{isMalayalam ? 'മാറ്റത്തിനുള്ള കാരണം (നിർബന്ധം)*' : 'Mandatory Justification / Reason *'}</span>
              <span className="text-[10px] text-slate-400 font-normal">Audited by External Regulators</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder={
                isMalayalam
                  ? 'ഉദാഹരണത്തിന്: പ്രിൻസിപ്പലിന്റെ അനുമതിയോടെയുള്ള പുനർമൂല്യനിർണ്ണയം / ബാങ്ക് ചെക്ക് മടങ്ങിയതുമൂലമുള്ള ഫീസ് സ്റ്റാറ്റസ് മാറ്റം...'
                  : 'e.g. Re-evaluation approved by Academic Board Ref: PR/REV/2026/102...'
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
            />
          </div>

          {/* Approval Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isMalayalam ? 'അംഗീകാര നമ്പർ / ഓർഡർ റഫറൻസ്' : 'Official Approval Reference / Order No'}
            </label>
            <input
              type="text"
              value={approvalRef}
              onChange={(e) => setApprovalRef(e.target.value)}
              placeholder="e.g. PR/REV/2026/102"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          {/* Blockchain Seal Notice */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 text-xs text-indigo-900">
            <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              {isMalayalam
                ? 'ഈ മാറ്റം SHA-256 ക്രിപ്റ്റോഗ്രാഫിക് ഹാഷ് ഉപയോഗിച്ച് സീൽ ചെയ്യപ്പെടും. ഒരിക്കൽ ചേർത്താൽ മാറ്റാൻ കഴിയില്ല.'
                : 'This action will generate a permanent, tamper-evident cryptographic block in the immutable audit ledger.'}
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition"
            >
              {isMalayalam ? 'റദ്ദാക്കുക' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-indigo-700 text-white rounded-xl text-xs font-bold hover:brightness-110 transition shadow-md flex items-center gap-1.5"
            >
              <span>{isMalayalam ? 'സീൽ ചെയ്ത് ലോഗ് ചെയ്യുക' : 'Seal & Append to Ledger'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
