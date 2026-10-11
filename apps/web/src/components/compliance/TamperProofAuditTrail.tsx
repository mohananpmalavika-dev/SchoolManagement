'use client';

import React, { useState } from 'react';
import {
  TamperProofAuditRecord,
  AuditEntityType,
  AuditChainVerificationResult,
} from '@krypton/types';
import { complianceClient } from '@/lib/compliance-engine-client';
import { AuditDiffModal } from './AuditDiffModal';
import { RecordOverrideModal } from './RecordOverrideModal';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Hash,
  Clock,
  User,
  ArrowRight,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  AlertOctagon,
} from 'lucide-react';

interface TamperProofAuditTrailProps {
  isMalayalam?: boolean;
}

export function TamperProofAuditTrail({ isMalayalam = false }: TamperProofAuditTrailProps) {
  const [records, setRecords] = useState<TamperProofAuditRecord[]>(() =>
    complianceClient.getAuditRecords(),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('ALL');
  const [selectedRecordForDiff, setSelectedRecordForDiff] = useState<TamperProofAuditRecord | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AuditChainVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperingSimulated, setTamperingSimulated] = useState(false);

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchesFilter =
      selectedEntityFilter === 'ALL' || rec.entityType === selectedEntityFilter;
    const matchesSearch =
      rec.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.performedBy.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Verify chain integrity
  const handleVerifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = complianceClient.verifyChainIntegrity();
      setVerificationResult(result);
      setIsVerifying(false);
    }, 600);
  };

  // Simulate unauthorized tampering
  const handleSimulateTamper = () => {
    try {
      complianceClient.simulateTampering(1);
      setTamperingSimulated(true);
      setRecords(complianceClient.getAuditRecords());
      // Re-verify immediately to demonstrate detection
      const result = complianceClient.verifyChainIntegrity();
      setVerificationResult(result);
    } catch (err: any) {
      alert(`Tamper simulation error: ${err?.message}`);
    }
  };

  // Restore chain
  const handleRestoreChain = () => {
    complianceClient.restoreChain();
    setTamperingSimulated(false);
    setRecords(complianceClient.getAuditRecords());
    setVerificationResult(complianceClient.verifyChainIntegrity());
  };

  // When a new record is created
  const handleRecordCreated = (newRecord: TamperProofAuditRecord) => {
    setRecords(complianceClient.getAuditRecords());
    setVerificationResult(complianceClient.verifyChainIntegrity());
  };

  return (
    <div className="space-y-6">
      {/* Verification & Integrity Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border transition-all ${
          verificationResult?.isValid === false
            ? 'bg-red-950 text-white border-red-800 shadow-xl'
            : 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-700 shadow-xl'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`p-3.5 rounded-2xl border ${
                verificationResult?.isValid === false
                  ? 'bg-red-900/60 border-red-500 text-red-200 animate-pulse'
                  : 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300'
              }`}
            >
              {verificationResult?.isValid === false ? (
                <AlertOctagon className="w-8 h-8 text-red-400" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-white/10 text-white">
                  SHA-256 Merkle-Chain
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {records.length} Blocks Minted
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {verificationResult?.isValid === false
                  ? isMalayalam
                    ? '⚠️ മുന്നറിയിപ്പ്: ഡാറ്റാ തിരുത്തൽ / കൃത്രിമം കണ്ടെത്തി!'
                    : 'CRITICAL ALERT: Unauthorized Data Tampering Detected!'
                  : isMalayalam
                  ? 'തിരുത്താനാവാത്ത സെക്യൂരിറ്റി ഓഡിറ്റ് ലോഗ് (Tamper-Proof Audit Trail)'
                  : 'Tamper-Proof Security Audit Trail & Ledger'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {verificationResult?.isValid === false
                  ? verificationResult.tamperDetails
                  : isMalayalam
                  ? 'മാർക്കുകളോ, ഫീ പേയ്മെന്റുകളോ, സ്കൂൾ രേഖകളോ തിരുത്തപ്പെട്ടാൽ ആര്, എപ്പോൾ, എന്തുകൊണ്ട് മാറ്റി എന്ന് SHA-256 ക്രിപ്റ്റോഗ്രാഫിക് ഹാഷ് ചെയിൻ വഴി ശാശ്വതമായി സൂക്ഷിക്കുന്നു.'
                  : 'Any modifications to marks, fee statuses, or certificates are cryptographically hash-chained with mandatory justification and IP origin.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md ${
                isVerifying
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>
                {isVerifying
                  ? isMalayalam
                    ? 'പരിശോധിക്കുന്നു...'
                    : 'Verifying Blocks...'
                  : isMalayalam
                  ? 'ചെയിൻ പരിശോധിക്കുക (Verify Integrity)'
                  : 'Verify Chain Integrity'}
              </span>
            </button>

            {!tamperingSimulated ? (
              <button
                onClick={handleSimulateTamper}
                title="Test how the cryptographic engine catches direct database manipulation"
                className="px-4 py-2.5 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5 text-red-400" />
                <span>{isMalayalam ? 'കൃത്രിമം സിമുലേറ്റ് ചെയ്യുക (Test)' : 'Simulate DB Tampering'}</span>
              </button>
            ) : (
              <button
                onClick={handleRestoreChain}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isMalayalam ? 'ലോഗ് പുനഃസ്ഥാപിക്കുക' : 'Restore Clean Ledger'}</span>
              </button>
            )}

            <button
              onClick={() => setIsOverrideModalOpen(true)}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isMalayalam ? 'പുതിയ മാറ്റം ലോഗ് ചെയ്യുക' : 'Log Record Override'}</span>
            </button>
          </div>
        </div>

        {/* Verification Success Box */}
        {verificationResult && verificationResult.isValid && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>
                {isMalayalam
                  ? `ക്രിപ്റ്റോഗ്രാഫിക് പരിശോധന പൂർത്തിയായി: എല്ലാ ${verificationResult.totalBlocksVerified} ബ്ലോക്കുകളും സുരക്ഷിതമാണ്. ഒരു തിരുത്തലും കണ്ടെത്താനായില്ല.`
                  : `Cryptographic Audit Validated: All ${verificationResult.totalBlocksVerified} blocks intact. Zero tampering detected across entire ledger.`}
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">
              Verified: {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Toolbar: Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Entity Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Records', labelMl: 'എല്ലാം' },
            { id: 'GRADE', label: 'Marks & Grades', labelMl: 'മാർക്കുകൾ' },
            { id: 'FEE_PAYMENT', label: 'Fees & Invoices', labelMl: 'ഫീസ്' },
            { id: 'STUDENT_RECORD', label: 'Student Bio', labelMl: 'വിദ്യാർത്ഥി പ്രൊഫൈൽ' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedEntityFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedEntityFilter === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isMalayalam ? item.labelMl : item.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isMalayalam
                ? 'പേര്, ഐഡി, കാരണം തിരയുക...'
                : 'Search audit records, users, reasons...'
            }
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Blocks Feed */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">
              {isMalayalam ? 'ഓഡിറ്റ് രേഖകൾ ലഭ്യമല്ല' : 'No Audit Records Match Query'}
            </h3>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isCorrupted = record.isTampered;

            return (
              <div
                key={record.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isCorrupted
                    ? 'border-red-500 shadow-md ring-2 ring-red-400'
                    : 'border-slate-200/90 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Block Header Strip */}
                <div
                  className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
                    isCorrupted
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white text-[11px]">
                      Block #{record.sequence}
                    </span>
                    <span className="font-mono text-slate-500 font-semibold">{record.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        record.entityType === 'GRADE'
                          ? 'bg-blue-100 text-blue-800'
                          : record.entityType === 'FEE_PAYMENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : record.entityType === 'STUDENT_RECORD'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {record.action.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(record.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span className="font-mono bg-slate-200/70 px-2 py-0.5 rounded text-slate-600">
                      IP: {record.performedBy.ipAddress}
                    </span>
                  </div>
                </div>

                {/* Block Content */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Target and Mandatory Reason */}
                    <div className="max-w-2xl space-y-2">
                      <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <span>{record.entityName}</span>
                        {isCorrupted && (
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
                            TAMPERED
                          </span>
                        )}
                      </div>

                      {/* Mandatory Reason (Highlighted) */}
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 font-medium">
                        <span className="font-bold text-amber-900">
                          {isMalayalam ? 'മാറ്റത്തിനുള്ള കാരണം:' : 'Mandatory Reason:'}{' '}
                        </span>
                        &ldquo;{record.reason}&rdquo;
                        {record.approvalRef && (
                          <span className="ml-2 px-1.5 py-0.5 bg-amber-200 text-amber-900 font-bold rounded text-[10px]">
                            Ref: {record.approvalRef}
                          </span>
                        )}
                      </div>

                      {/* Operator Info */}
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold text-slate-800">{record.performedBy.fullName}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-indigo-700 font-semibold">{record.performedBy.role}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-mono text-[11px]">{record.performedBy.email}</span>
                      </div>
                    </div>

                    {/* Right: Quick Diff Preview & Inspect Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {record.changes.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs min-w-[220px]">
                          <div className="text-[11px] font-bold text-slate-500 mb-1">
                            {record.changes[0].fieldLabel}
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-red-700 line-through truncate max-w-[80px]">
                              {String(record.changes[0].oldValue || '')}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-emerald-700 font-bold truncate max-w-[100px]">
                              {String(record.changes[0].newValue || '')}
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedRecordForDiff(record)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <span>{isMalayalam ? 'പൂർണ്ണ മാറ്റം കാണുക' : 'Inspect Full Diff'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cryptographic Hash Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-2 truncate max-w-md">
                      <Hash className="w-3 h-3 text-indigo-500" />
                      <span className="text-slate-500">Hash:</span>
                      <span className="text-slate-700 font-bold truncate select-all">
                        {record.currentHash}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Prev Hash:</span>
                      <span className="text-slate-400 truncate max-w-[120px] select-all">
                        {record.previousHash.substring(0, 16)}...
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 text-[10px] font-bold">
                        {record.signature}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Diff Modal */}
      {selectedRecordForDiff && (
        <AuditDiffModal
          record={selectedRecordForDiff}
          onClose={() => setSelectedRecordForDiff(null)}
          isMalayalam={isMalayalam}
        />
      )}

      {/* Record Controlled Modification Modal */}
      {isOverrideModalOpen && (
        <RecordOverrideModal
          onClose={() => setIsOverrideModalOpen(false)}
          onRecordCreated={handleRecordCreated}
          isMalayalam={isMalayalam}
        />
      )}
    </div>
  );
}
