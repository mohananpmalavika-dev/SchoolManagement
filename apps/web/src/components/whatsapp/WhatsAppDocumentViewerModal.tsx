'use client';

import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, FileText, QrCode } from 'lucide-react';
import { SchoolPdfDocument } from '@/lib/whatsapp-client';

interface WhatsAppDocumentViewerModalProps {
  document: SchoolPdfDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppDocumentViewerModal({
  document,
  isOpen,
  onClose,
}: WhatsAppDocumentViewerModalProps) {
  if (!isOpen || !document) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-800/80 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-semibold text-base tracking-wide flex items-center gap-2">
                {document.title}
                <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
                  Kenya MoE & KRA Verified
                </span>
              </h3>
              <p className="text-xs text-emerald-300">{document.titleSw}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert(`Downloaded "${document.title}.pdf" (${(document.fileSizeBytes / 1024).toFixed(0)} KB)`);
              }}
              className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Paper Container */}
        <div className="p-8 max-h-[75vh] overflow-y-auto bg-slate-50">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-gray-800 max-w-2xl mx-auto font-sans relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-9xl font-bold uppercase rotate-45 text-black">
                KRYPTON
              </span>
            </div>

            {/* Kenyan School Letterhead */}
            <div className="border-b-2 border-emerald-800 pb-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-full bg-emerald-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  KAN
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                    KRYPTON ACADEMY NAIROBI
                  </h1>
                  <p className="text-xs text-gray-600 font-medium">
                    Shule ya Upili ya Krypton • Registered by Ministry of Education (MOE/NBI/2024/098)
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Argwings Kodhek Road, Kilimani, Nairobi, Kenya | P.O. Box 45020-00100 Nairobi | Tel: +254 712 000 111
              </p>
            </div>

            {/* Document Specific Body */}
            {document.type === 'REPORT_CARD' && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Official Assessment Report (CBC / KNEC)
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">
                      Term 2 Continuous Assessment Report (2024)
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Tarehe / Date</p>
                    <p className="text-xs font-semibold text-gray-800">{document.publishedDate}</p>
                  </div>
                </div>

                {/* Student Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-gray-500">Student Name:</span>{' '}
                    <strong className="text-gray-900">{document.studentName || 'Brian Kipchoge'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Admission No:</span>{' '}
                    <strong className="text-gray-900">KPS/2024/0142</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Academic Level:</span>{' '}
                    <strong className="text-gray-900">Grade 8 Junior Secondary (CBC)</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Attendance:</span>{' '}
                    <strong className="text-emerald-700">97.2% (Present)</strong>
                  </div>
                </div>

                {/* Marks Table */}
                <table className="w-full text-xs text-left border border-gray-200 mt-2">
                  <thead className="bg-emerald-900 text-white">
                    <tr>
                      <th className="py-2 px-3">Subject Learning Area</th>
                      <th className="py-2 px-3 text-center">Max Marks</th>
                      <th className="py-2 px-3 text-center">Score</th>
                      <th className="py-2 px-3 text-center">Performance Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">Mathematics</td>
                      <td className="py-2 px-3 text-center">100</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">96</td>
                      <td className="py-2 px-3 text-center font-semibold text-emerald-800">EE (Exceeding Expectations)</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">Integrated Science & Physics</td>
                      <td className="py-2 px-3 text-center">100</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">94</td>
                      <td className="py-2 px-3 text-center font-semibold text-emerald-800">EE (Exceeding Expectations)</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">Kiswahili Lugha na Fasihi</td>
                      <td className="py-2 px-3 text-center">100</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">92</td>
                      <td className="py-2 px-3 text-center font-semibold text-emerald-800">EE (Exceeding Expectations)</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">English Language & Literature</td>
                      <td className="py-2 px-3 text-center">100</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">90</td>
                      <td className="py-2 px-3 text-center font-semibold text-emerald-800">EE (Exceeding Expectations)</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">Social Studies & Life Skills</td>
                      <td className="py-2 px-3 text-center">100</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">90</td>
                      <td className="py-2 px-3 text-center font-semibold text-emerald-800">ME (Meeting Expectations)</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                    <tr>
                      <td className="py-2 px-3">Aggregate Total</td>
                      <td className="py-2 px-3 text-center">500</td>
                      <td className="py-2 px-3 text-center text-emerald-800 font-bold text-sm">
                        462 (92.4%)
                      </td>
                      <td className="py-2 px-3 text-center text-emerald-800 font-bold">
                        Daraja A (Position 3)
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Remarks & Stamp */}
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs">
                  <span className="font-semibold text-emerald-900">Maoni ya Mwalimu wa Darasa (Class Teacher Remarks):</span>
                  <p className="text-gray-700 mt-0.5">
                    &quot;Brian is an exceptionally dedicated learner with high aptitude in STEM. Very active in Junior Secondary Science Congress. Keep it up!&quot;
                  </p>
                </div>
              </div>
            )}

            {document.type === 'FEE_RECEIPT' && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Official Lipa Na M-Pesa Tax Receipt
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">
                      Receipt No: RCPT-KEN-2024-884
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs bg-[#00A859]/20 text-[#008744] px-2 py-0.5 rounded-full font-bold">
                      <CheckCircle className="w-3 h-3" /> IMELIPWA / PAID
                    </span>
                    <p className="text-[11px] text-gray-500 mt-1">{document.publishedDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-gray-500">Student:</span>{' '}
                    <strong className="text-gray-900">{document.studentName || 'Brian Kipchoge'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">M-Pesa Ref / Txn ID:</span>{' '}
                    <strong className="text-emerald-700 font-mono font-bold">QKJ8129ABC</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment Gateway:</span>{' '}
                    <strong className="text-gray-900">Safaricom Daraja Lipa Na M-Pesa</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Paybill & KRA PIN:</span>{' '}
                    <strong className="text-gray-900 font-mono">174379 • P051234567Z</strong>
                  </div>
                </div>

                {/* Kenyan Fee Items */}
                <table className="w-full text-xs text-left border border-gray-200 mt-2">
                  <thead className="bg-emerald-900 text-white">
                    <tr>
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-3 text-right">Amount (KSh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-2 px-3">Term 2 Junior Secondary Tuition & Smart Labs</td>
                      <td className="py-2 px-3 text-right font-medium">9,500.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">School GPS Bus Transport (Nairobi West Route)</td>
                      <td className="py-2 px-3 text-right font-medium">4,500.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">CBC Learning Activity Kit & Library Amenities</td>
                      <td className="py-2 px-3 text-right font-medium">850.00</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <tr>
                      <td className="py-2 px-3 text-emerald-900">Jumla Iliyolipwa / Total Paid (KES)</td>
                      <td className="py-2 px-3 text-right text-emerald-800 text-base">KSh 14,850.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {document.type === 'CIRCULAR_NOTICE' && (
              <div className="mt-6 space-y-4">
                <div className="border-b pb-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Official Ministry & School Circular
                  </span>
                  <h2 className="text-base font-bold text-gray-900 mt-1">
                    Ref: KAN/CIR/2024/048 - MoE Term 2 Half-Term Break & Annual Athletics Trials
                  </h2>
                  <p className="text-xs text-gray-500">Date: {document.publishedDate}</p>
                </div>

                <div className="text-xs text-gray-700 space-y-3 leading-relaxed">
                  <p>
                    Dear Parents & Guardians / Wapendwa Wazazi,
                  </p>
                  <p>
                    Please note that in compliance with the Ministry of Education Kenya school calendar, the school will break for half-term on <strong>Friday, 11th October 2024 at 1:00 PM</strong> and resume on <strong>Monday, 21st October 2024 at 7:30 AM</strong>.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900">
                    <strong>M-Pesa Fee Clearance:</strong> Parents are kindly requested to clear any outstanding Term 2 balances via our official Paybill <strong>174379</strong> before reporting date to ensure seamless transport and meal services.
                  </div>
                  <p>
                    Inter-house athletic trials will be held at Nyayo National Stadium on 25th October. Transport will be provided from school.
                  </p>
                </div>
              </div>
            )}

            {/* Verification Seal & Signature */}
            <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-emerald-900" />
                <div>
                  <p className="font-semibold text-gray-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> KRA TIMS & MoE Authenticated
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">ETR: KRA-ETR-NBI-2024-0988</p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block border-b border-gray-400 pb-1 mb-1 font-serif italic text-sm text-gray-800">
                  Dr. Samuel Kamau Ph.D.
                </div>
                <p className="font-semibold text-gray-800 text-[11px]">Chief Principal & Director</p>
                <p className="text-[10px] text-gray-400">Krypton Academy Nairobi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
