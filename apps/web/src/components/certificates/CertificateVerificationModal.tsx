'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  X,
  QrCode,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { certificateApi } from '@/lib/certificate-client';
import { GeneratedCertificateRecord, StudentCertificateProfile } from '@krypton/types';

interface CertificateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export function CertificateVerificationModal({
  isOpen,
  onClose,
  initialCode = '',
}: CertificateVerificationModalProps) {
  const [query, setQuery] = useState(initialCode);
  const [verifiedState, setVerifiedState] = useState<{
    tested: boolean;
    valid: boolean;
    record?: GeneratedCertificateRecord;
    student?: StudentCertificateProfile;
  } | null>(initialCode ? () => certificateApi.verifyCertificate(initialCode) && { tested: true, ...certificateApi.verifyCertificate(initialCode) } : null);

  if (!isOpen) return null;

  const handleVerify = (codeToTest?: string) => {
    const target = (codeToTest !== undefined ? codeToTest : query).trim();
    if (!target) return;
    const res = certificateApi.verifyCertificate(target);
    setVerifiedState({
      tested: true,
      valid: res.valid,
      record: res.record,
      student: res.student,
    });
  };

  const sampleCodes = [
    { label: 'Sample TC Hash', code: 'TC-KPS-2024-103-8F3D1A' },
    { label: 'Sample Bonafide Ref', code: 'BON/2026/112' },
    { label: 'Aarav Patel (Adm No)', code: 'KPS-2024-101' },
    { label: 'Malavika Nair (Adm No)', code: 'KPS-2024-103' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-800/80 border border-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Public Certificate & ID Verifier</h3>
              <p className="text-xs text-indigo-200">
                ക്രിപ്റ്റോഗ്രാഫിക് ഡിജിറ്റൽ സർട്ടിഫിക്കറ്റ് പരിശോധന
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Enter Verification Hash, Ref No, or Admission No:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="e.g., TC-KPS-2024-103-8F3D1A or KPS-2024-101"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
              <button
                onClick={() => handleVerify()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>Verify</span>
              </button>
            </div>
          </div>

          {/* Quick Click Samples */}
          <div>
            <span className="text-[11px] text-gray-500 block mb-1.5 font-medium">
              Quick test with issued sample records:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleCodes.map((s) => (
                <button
                  key={s.code}
                  onClick={() => {
                    setQuery(s.code);
                    handleVerify(s.code);
                  }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 rounded-lg text-xs font-mono transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Results */}
          {verifiedState?.tested && (
            <div className="pt-2 animate-fadeIn">
              {verifiedState.valid ? (
                <div className="bg-emerald-50 border-2 border-emerald-400/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950">
                        100% Authenticated & Digitally Verified
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Official document issued by institution authority.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-xl p-3 border border-emerald-200 text-xs space-y-1.5 font-sans">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Document Type:</span>
                      <span className="font-bold text-gray-900">
                        {verifiedState.record?.certificateType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Student Name:</span>
                      <span className="font-bold text-indigo-950">
                        {verifiedState.student?.fullName || verifiedState.record?.studentName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Admission No:</span>
                      <span className="font-mono font-bold text-gray-800">
                        {verifiedState.student?.admissionNumber || verifiedState.record?.admissionNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Class:</span>
                      <span className="font-medium text-gray-800">
                        {verifiedState.student?.currentClass || verifiedState.record?.className}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Authorized Signatory:</span>
                      <span className="font-semibold text-emerald-800">
                        {verifiedState.record?.issuedBy}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cryptographic Seal:</span>
                      <span className="font-mono text-[10px] text-gray-600">
                        SHA-256 Validated
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-900">
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-950">
                      Certificate Not Found or Invalid
                    </h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      The entered code or token does not match any official certificate record in the school ledger. Please check the spelling or scan the original QR code.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
