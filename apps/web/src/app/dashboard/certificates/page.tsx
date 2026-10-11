'use client';

import React, { useState } from 'react';
import {
  FileText,
  Award,
  CreditCard,
  Printer,
  Search,
  CheckCircle2,
  ShieldCheck,
  Settings,
  Sparkles,
  User,
  Users,
  Download,
  Eye,
  RefreshCw,
  QrCode,
  Share2,
  Sliders,
  History,
} from 'lucide-react';
import {
  CertificateType,
  StudentCertificateProfile,
  SchoolCertificateSettings,
  BonafidePurpose,
} from '@krypton/types';
import { certificateApi } from '@/lib/certificate-client';
import { TransferCertificateView } from '@/components/certificates/TransferCertificateView';
import { BonafideCertificateView } from '@/components/certificates/BonafideCertificateView';
import { CharacterCertificateView } from '@/components/certificates/CharacterCertificateView';
import { DigitalIDCardView } from '@/components/certificates/DigitalIDCardView';
import { BatchIDCardsSheet } from '@/components/certificates/BatchIDCardsSheet';
import { CertificateVerificationModal } from '@/components/certificates/CertificateVerificationModal';
import { CertificateSettingsModal } from '@/components/certificates/CertificateSettingsModal';

export default function CertificateGeneratorPage() {
  const [activeTab, setActiveTab] = useState<CertificateType | 'HISTORY'>('TRANSFER_CERTIFICATE');
  const [students, setStudents] = useState<StudentCertificateProfile[]>(() => certificateApi.getStudents());
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'stu-001');
  const [schoolSettings, setSchoolSettings] = useState<SchoolCertificateSettings>(() => certificateApi.getSchoolSettings());

  // Bonafide certificate options
  const [bonafidePurpose, setBonafidePurpose] = useState<BonafidePurpose>('PASSPORT_VISA');

  // Character certificate options
  const [conductLevel, setConductLevel] = useState<'Exemplary' | 'Outstanding' | 'Very Good'>('Exemplary');

  // TC options
  const [tcReason, setTcReason] = useState<string>('Course Completed / Higher Secondary Admission');

  // ID card batch options
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchSide, setBatchSide] = useState<'FRONT' | 'BACK' | 'BOTH'>('FRONT');

  // Bilingual subtitles toggle
  const [showMalayalam, setShowMalayalam] = useState<boolean>(true);

  // Modals
  const [isVerifierOpen, setIsVerifierOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Filtered student list
  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.currentClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger 1-Click Print & PDF Generation
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Generate real certificate representations
  const tcData = certificateApi.generateTransferCertificate(selectedStudentId, {
    reasonForLeaving: tcReason,
  });

  const bonafideData = certificateApi.generateBonafideCertificate(selectedStudentId, {
    purpose: bonafidePurpose,
  });

  const characterData = certificateApi.generateCharacterCertificate(selectedStudentId, {
    conductLevel,
  });

  const idCardData = certificateApi.generateIDCard(selectedStudentId, 'PORTRAIT');

  const issuedRecords = certificateApi.getIssuedRecords();

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      {/* Print-Specific Styles to guarantee perfect A4 Certificate & ID Card Output */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav,
          header,
          .print\\:hidden,
          button {
            display: none !important;
          }
          .printable-document-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white border-b border-indigo-800/50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-xs font-semibold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Digital Certificate & ID Card Generator</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Digital Certificates & Student ID Studio
              </h1>
              <p className="text-sm text-indigo-200 max-w-2xl font-sans">
                ട്രാൻസ്ഫർ സർട്ടിഫിക്കറ്റ് (TC), ബോണഫൈഡ്, ക്യാരക്ടർ സർട്ടിഫിക്കറ്റുകളും QR കോഡുള്ള ഡിജിറ്റൽ സ്റ്റുഡന്റ് ID കാർഡുകളും സ്കൂൾ ലോഗോയും പ്രിൻസിപ്പലിന്റെ ഡിജിറ്റൽ ഒപ്പും സഹിതം ഒറ്റ ക്ലിക്കിൽ പ്രിന്റ് ചെയ്യുക.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsVerifierOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-800/80 hover:bg-indigo-700 border border-indigo-600 rounded-xl text-xs font-semibold text-white shadow-sm transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verify Document</span>
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-800/80 hover:bg-indigo-700 border border-indigo-600 rounded-xl text-xs font-semibold text-white shadow-sm transition-all"
              >
                <Settings className="w-4 h-4 text-indigo-300" />
                <span>School Branding & Sign</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>1-Click Print / PDF</span>
              </button>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-8 pt-4 border-t border-indigo-800/60">
            <button
              onClick={() => {
                setActiveTab('TRANSFER_CERTIFICATE');
                setIsBatchMode(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'TRANSFER_CERTIFICATE'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Transfer Certificate (TC / ട്രാൻസ്ഫർ)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('BONAFIDE_CERTIFICATE');
                setIsBatchMode(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'BONAFIDE_CERTIFICATE'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Bonafide Certificate (ബോണഫൈഡ്)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('CHARACTER_CERTIFICATE');
                setIsBatchMode(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'CHARACTER_CERTIFICATE'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Character Certificate (ക്യാരക്ടർ)</span>
            </button>

            <button
              onClick={() => setActiveTab('ID_CARD')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ID_CARD'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Digital Student ID Card (QR കോഡ്)</span>
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Issued Registry ({issuedRecords.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab !== 'HISTORY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar: Student Selection & Certificate Customization */}
            <div className="lg:col-span-4 space-y-6 print:hidden">
              {/* Student Picker Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Select Student (വിദ്യാർത്ഥി)</span>
                  </h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                    {students.length} Registered
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, roll, or adm no..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Students List Scrollable */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {filteredStudents.map((stu) => {
                    const isSelected = stu.id === selectedStudentId;
                    return (
                      <button
                        key={stu.id}
                        onClick={() => setSelectedStudentId(stu.id)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-indigo-50 border-2 border-indigo-600 shadow-sm'
                            : 'bg-gray-50/70 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={stu.photoUrl}
                          alt={stu.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-300 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {stu.fullName}
                          </p>
                          <p className="text-[11px] text-gray-500 font-sans truncate">
                            {stu.fullNameMl}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                            <span>{stu.admissionNumber}</span>
                            <span>•</span>
                            <span>{stu.currentClass}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Student Snapshot */}
                {selectedStudent && (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 text-xs space-y-1">
                    <div className="font-bold text-indigo-950 flex justify-between">
                      <span>{selectedStudent.fullName}</span>
                      <span className="font-mono text-indigo-700">{selectedStudent.bloodGroup}</span>
                    </div>
                    <div className="text-gray-600">
                      Parents: {selectedStudent.fatherName} & {selectedStudent.motherName}
                    </div>
                    <div className="text-gray-500 text-[11px]">
                      DOB: {selectedStudent.dateOfBirth} ({selectedStudent.dateOfBirthWords})
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Context Controls Based on Active Tab */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Document Options</span>
                </h3>

                {/* TC Controls */}
                {activeTab === 'TRANSFER_CERTIFICATE' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Reason for Leaving (പഠനം നിർത്താനുള്ള കാരണം):
                      </label>
                      <select
                        value={tcReason}
                        onChange={(e) => setTcReason(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Course Completed / Higher Secondary Admission">
                          Course Completed / Higher Secondary Admission
                        </option>
                        <option value="Parent Relocation / Transferred to Another City">
                          Parent Relocation / Transferred to Another City
                        </option>
                        <option value="Personal Reasons on Parent Request">
                          Personal Reasons on Parent Request
                        </option>
                        <option value="Higher Studies Abroad">
                          Higher Studies Abroad
                        </option>
                      </select>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <span className="font-bold block">CBSE & Kerala Board Standard</span>
                      Transfer Certificate includes Board Exam Result, Attendance, Conduct, and Official School Stamp.
                    </div>
                  </div>
                )}

                {/* Bonafide Controls */}
                {activeTab === 'BONAFIDE_CERTIFICATE' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Certificate Purpose (ഉദ്ദേശ്യം):
                      </label>
                      <select
                        value={bonafidePurpose}
                        onChange={(e) => setBonafidePurpose(e.target.value as BonafidePurpose)}
                        className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="PASSPORT_VISA">Passport & Visa Application</option>
                        <option value="SCHOLARSHIP">State / National Scholarship</option>
                        <option value="BUS_CONCESSION">KSRTC / Transport Bus Concession</option>
                        <option value="BANK_ACCOUNT">Student Savings Bank Account</option>
                        <option value="COMPETITION_OLYMPIAD">Olympiad & Sports Tournament</option>
                        <option value="HIGHER_EDUCATION">Entrance & Higher Studies</option>
                        <option value="GENERAL">General Identification Record</option>
                      </select>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                      <span className="font-bold block">Instant Issuance</span>
                      Pre-formatted official certificate with Principal&apos;s digital signature and verify link.
                    </div>
                  </div>
                )}

                {/* Character Controls */}
                {activeTab === 'CHARACTER_CERTIFICATE' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Conduct Evaluation Grade:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Exemplary', 'Outstanding', 'Very Good'] as const).map((grade) => (
                          <button
                            key={grade}
                            type="button"
                            onClick={() => setConductLevel(grade)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                              conductLevel === grade
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ID Card Batch Mode Controls */}
                {activeTab === 'ID_CARD' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Generation Mode:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setIsBatchMode(false)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                            !isBatchMode
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Single Student Card
                        </button>
                        <button
                          onClick={() => setIsBatchMode(true)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isBatchMode
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Batch Class Sheet</span>
                        </button>
                      </div>
                    </div>

                    {isBatchMode && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Batch Print Side:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['FRONT', 'BACK', 'BOTH'] as const).map((side) => (
                            <button
                              key={side}
                              onClick={() => setBatchSide(side)}
                              className={`py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                                batchSide === side
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {side === 'FRONT' ? 'Front Side' : side === 'BACK' ? 'Back Side' : 'Dual Side'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtitles Toggle */}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-medium">
                    Malayalam Subtitles (മലയാളം വരികൾ):
                  </span>
                  <button
                    onClick={() => setShowMalayalam(!showMalayalam)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      showMalayalam
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {showMalayalam ? 'ON (ഓൺ)' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Main Document Preview & Print Stage */}
            <div className="lg:col-span-8 space-y-4">
              {/* Document Actions Bar on top of Preview */}
              <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm print:hidden">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Live Printable PDF Preview
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Save as PDF</span>
                  </button>
                </div>
              </div>

              {/* The Printable Document Container */}
              <div className="printable-document-container">
                {activeTab === 'TRANSFER_CERTIFICATE' && (
                  <TransferCertificateView
                    data={tcData}
                    settings={schoolSettings}
                    isMalayalamSubtitles={showMalayalam}
                  />
                )}

                {activeTab === 'BONAFIDE_CERTIFICATE' && (
                  <BonafideCertificateView
                    data={bonafideData}
                    settings={schoolSettings}
                    isMalayalamSubtitles={showMalayalam}
                  />
                )}

                {activeTab === 'CHARACTER_CERTIFICATE' && (
                  <CharacterCertificateView
                    data={characterData}
                    settings={schoolSettings}
                    isMalayalamSubtitles={showMalayalam}
                  />
                )}

                {activeTab === 'ID_CARD' && !isBatchMode && (
                  <DigitalIDCardView
                    data={idCardData}
                    settings={schoolSettings}
                    isMalayalamSubtitles={showMalayalam}
                  />
                )}

                {activeTab === 'ID_CARD' && isBatchMode && (
                  <BatchIDCardsSheet
                    students={students}
                    settings={schoolSettings}
                    side={batchSide}
                    isMalayalamSubtitles={showMalayalam}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* History / Issued Registry Tab */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Issued Certificates Registry (നൽകിയ സർട്ടിഫിക്കറ്റുകളുടെ പട്ടിക)
                </h3>
                <p className="text-xs text-gray-500">
                  All documents stamped with cryptographic verification hash and Principal digital seal.
                </p>
              </div>

              <button
                onClick={() => setIsVerifierOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Verify Token</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Cryptographic Hash</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {issuedRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                        {rec.referenceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {rec.certificateType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-950">
                        {rec.studentName}
                      </td>
                      <td className="py-3 px-4 font-mono">{rec.admissionNumber}</td>
                      <td className="py-3 px-4">{rec.className}</td>
                      <td className="py-3 px-4 font-mono">{rec.issueDate}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-gray-500">
                        {rec.verificationHash}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudentId(rec.studentId);
                            setActiveTab(rec.certificateType);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          View & Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      <CertificateVerificationModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
      />

      {/* Settings Modal */}
      <CertificateSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={schoolSettings}
        onSave={(updated) => setSchoolSettings(certificateApi.updateSchoolSettings(updated))}
      />
    </div>
  );
}
