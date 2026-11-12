'use client';

import React, { useState } from 'react';
import { complianceClient } from '@/lib/compliance-engine-client';
import { OneClickExportSection } from './OneClickExportSection';
import { TamperProofAuditTrail } from './TamperProofAuditTrail';
import {
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  Layers,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
  ExternalLink,
  Languages,
} from 'lucide-react';

export function GovtComplianceDashboard() {
  const [activeTab, setActiveTab] = useState<'EXPORTS' | 'AUDIT_TRAIL' | 'MANDATES'>('EXPORTS');
  const [isMalayalam, setIsMalayalam] = useState(true);
  const stats = complianceClient.getStats();

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {isMalayalam ? 'അക്രഡിറ്റേഷനും കംപ്ലയൻസും' : 'Accreditation & Compliance Engine'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                  CBSE • ICSE • State Board • UDISE+ • APAAR
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {isMalayalam
                  ? 'ഗവൺമെന്റ് അക്രഡിറ്റേഷനും കംപ്ലയൻസും (Govt & Board Compliance Engine)'
                  : 'Government & Educational Board Compliance Engine'}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                {isMalayalam
                  ? '1-ക്ലിക്ക് ഗവൺമെന്റ് പോർട്ടൽ ഡാറ്റാ എക്സ്പോർട്ടും തിരുത്താനാവാത്ത സെക്യൂരിറ്റി ഓഡിറ്റ് ലോഗും.'
                  : '1-Click portal exports & cryptographic tamper-proof audit trail for educational boards.'}
              </p>
            </div>

            {/* Language Toggle & Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMalayalam(!isMalayalam)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <Languages className="w-4 h-4 text-indigo-600" />
                <span>{isMalayalam ? 'English-ലേക്ക് മാറ്റുക' : 'മലയാളം (Malayalam)'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isMalayalam ? 'ഡാറ്റാ സുരക്ഷ: 100%' : 'Cryptographically Secured'}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Total Students */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">
                  {isMalayalam ? 'ആകെ വിദ്യാർത്ഥികൾ' : 'Total Enrolled'}
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalStudentsEnrolled}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isMalayalam ? 'വിദ്യാഭ്യാസ വർഷം 2026-27' : 'Academic Year 2026-27'}
              </div>
            </div>

            {/* Board Candidates */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">
                  {isMalayalam ? 'ബോർഡ് പരീക്ഷാർത്ഥികൾ' : 'Board Registered (LOC)'}
                </span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-indigo-700">{stats.boardRegisteredCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isMalayalam ? 'ക്ലാസ്സ് 10 & 12 രജിസ്റ്റർ ചെയ്തു' : 'Class 10 & 12 Candidates'}
              </div>
            </div>

            {/* Compliance Rate */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">
                  {isMalayalam ? 'കംപ്ലയൻസ് റേറ്റ്' : 'Compliance Readiness'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{stats.complianceRate}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isMalayalam ? 'സർക്കാർ മാനദണ്ഡങ്ങൾ അനുസരിച്ച്' : 'Pre-validated across boards'}
              </div>
            </div>

            {/* Audit Chain Status */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">
                  {isMalayalam ? 'ഓഡിറ്റ് ലോഗ് ബ്ലോക്കുകൾ' : 'Audit Merkle-Blocks'}
                </span>
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalAuditRecords}</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isMalayalam ? 'SHA-256 സുരക്ഷിതം' : 'SHA-256 Tamper-Proof'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-200 -mb-6">
            <button
              onClick={() => setActiveTab('EXPORTS')}
              className={`pb-4 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'EXPORTS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {isMalayalam ? '1-ക്ലിക്ക് പോർട്ടൽ എക്സ്പോർട്ട്' : '1-Click Portal Data Export'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('AUDIT_TRAIL')}
              className={`pb-4 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'AUDIT_TRAIL'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                {isMalayalam ? 'സെക്യൂരിറ്റി ഓഡിറ്റ് ലോഗ് (Tamper-Proof)' : 'Tamper-Proof Audit Trail'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('MANDATES')}
              className={`pb-4 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                activeTab === 'MANDATES'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>
                {isMalayalam ? 'അക്രഡിറ്റേഷൻ മാനദണ്ഡങ്ങൾ (Checklist)' : 'Board Compliance Checklist'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {activeTab === 'EXPORTS' && <OneClickExportSection isMalayalam={isMalayalam} />}

        {activeTab === 'AUDIT_TRAIL' && <TamperProofAuditTrail isMalayalam={isMalayalam} />}

        {activeTab === 'MANDATES' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isMalayalam
                  ? 'വിദ്യാഭ്യാസ ബോർഡ് അക്രഡിറ്റേഷൻ ചെക്ക്‌ലിസ്റ്റ്'
                  : 'Educational Board Mandatory Compliance Checklist'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isMalayalam
                  ? 'CBSE ബൈലോസ്, സംസ്ഥാന വിദ്യാഭ്യാസ ആക്റ്റ്, കേന്ദ്ര വിദ്യാഭ്യാസ മന്ത്രാലയ നിർദ്ദേശങ്ങൾ പ്രകാരമുള്ള വാർഷിക പരിശോധന.'
                  : 'Annual statutory verification requirements across CBSE, State Directorate, and Ministry.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  board: 'CBSE New Delhi',
                  rule: 'Rule 14.1 & OASIS LOC',
                  title: 'Student Registration & LOC 5-Subject Verification',
                  titleMl: 'വിദ്യാർത്ഥി രജിസ്ട്രേഷനും 5 വിഷയങ്ങളുടെ LOC പരിശോധനയും',
                  status: 'COMPLETED',
                  details: 'All Class 10 candidates assigned valid subject codes (041, 086, 085, 184, 087). Aadhaar numbers formatted.',
                },
                {
                  board: 'State Directorate of Education',
                  rule: 'Right to Education (RTE) Section 12(1)(c)',
                  title: '25% Free & Compulsory Education Admission Quota',
                  titleMl: '25% സൗജന്യ നിർബന്ധിത വിദ്യാഭ്യാസ പ്രവേശന ക്വാട്ട',
                  status: 'COMPLETED',
                  details: 'Fee concession matrix aligned with state RTE portal sync. Audit records sealed.',
                },
                {
                  board: 'UDISE+ MoE Govt of India',
                  rule: 'National Education Portal DCF',
                  title: 'SDMIS Permanent Education Number (PEN) Mapping',
                  titleMl: 'SDMIS പെർമനന്റ് എഡ്യൂക്കേഷൻ നമ്പർ (PEN) മാപ്പിംഗ്',
                  status: 'IN_PROGRESS',
                  details: '837 out of 840 students mapped with official PEN tokens. 3 pending confirmation.',
                },
                {
                  board: 'CBSE Affiliation Bye-Laws',
                  rule: 'Mandatory Public Disclosure Section B',
                  title: 'Faculty Details, Qualifications & Salary Disclosure',
                  titleMl: 'അധ്യാപക യോഗ്യതകളും ശമ്പള വിവരങ്ങളും വെബ്സൈറ്റിൽ പരസ്യപ്പെടുത്തൽ',
                  status: 'COMPLETED',
                  details: '52 teachers verified with OASIS IDs and background credentials.',
                },
                {
                  board: 'UDISE+ & APAAR (Ministry of Education, India)',
                  rule: 'National APAAR / PEN Identifier Mandate',
                  title: 'APAAR ID Mapping & Daily Attendance Sync',
                  titleMl: 'APAAR ഐഡി മാപ്പിംഗും പ്രതിദിന ഹാജർ റിപ്പോർട്ടിംഗും',
                  status: 'COMPLETED',
                  details: 'Daily sync engine active via background scheduler with 99.8% uptime.',
                },
                {
                  board: 'Examination Board Regulatory Code',
                  rule: 'Anti-Tamper Protocol Sec 4.2',
                  title: 'Grade Moderation & Cryptographic Audit Trails',
                  titleMl: 'മാർക്ക് മോഡറേഷനും ക്രിപ്റ്റോഗ്രാഫിക് ഓഡിറ്റ് ട്രയലും',
                  status: 'COMPLETED',
                  details: 'Zero manual database modifications permitted without signed cryptographic block hash.',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {item.board}
                      </span>
                      <span className="text-[11px] font-mono text-indigo-600 font-bold">{item.rule}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isMalayalam ? item.titleMl : item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
