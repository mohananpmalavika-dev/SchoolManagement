'use client';

import React from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Building,
  Calendar,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { StaffPayslip } from '@krypton/types';
import { SchoolCrestLogo } from '@/components/certificates/SchoolCrestLogo';
import { QRCodeSVG } from '@/components/attendance/QRCodeSVG';

interface PayslipModalProps {
  payslip: StaffPayslip | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PayslipModal({ payslip, isOpen, onClose }: PayslipModalProps) {
  if (!isOpen || !payslip) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modal Action Header */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileText className="text-indigo-400" size={18} />
            <span className="font-bold text-sm tracking-tight">Official Salary Payslip • {payslip.month}</span>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
              VERIFIED
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white" id="official-payslip-print">
          <div className="border-2 border-slate-300 rounded-xl p-6 relative bg-white shadow-sm">
            {/* Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <SchoolCrestLogo size={340} />
            </div>

            {/* School Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-5">
              <div className="flex items-center gap-4">
                <SchoolCrestLogo size={58} />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    KRYPTON INTERNATIONAL ACADEMY
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Department of Human Resources & Institutional Payroll
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Main Campus, Education City • Affiliated to CBSE/State Board (Reg: KRY-4801)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-900 text-white text-xs font-bold font-mono rounded">
                  SALARY PAYSLIP
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1.5">{payslip.month}</p>
                <p className="text-[10px] text-slate-500 font-mono">Ref: {payslip.paymentReference}</p>
              </div>
            </div>

            {/* Staff Credentials Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">EMPLOYEE NAME</span>
                <span className="font-bold text-slate-900 text-sm">{payslip.staffName}</span>
                <span className="text-[11px] text-indigo-700 block font-medium">{payslip.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">DESIGNATION</span>
                <span className="font-semibold text-slate-800">{payslip.position}</span>
                <span className="text-[11px] text-slate-500 block font-mono">ID: {payslip.staffNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">BANK DETAILS</span>
                <span className="font-semibold text-slate-800">{payslip.bankDetails.bankName}</span>
                <span className="text-[11px] text-slate-500 block font-mono">
                  A/C: {payslip.bankDetails.accountNumberMasked}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">PAY PERIOD</span>
                <span className="font-semibold text-slate-800">{payslip.payPeriod}</span>
                <span className="text-[11px] text-slate-500 block">Date: {payslip.paymentDate}</span>
              </div>
            </div>

            {/* Attendance & Leave Metrics */}
            <div className="grid grid-cols-4 gap-3 text-center bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-xs mb-6">
              <div>
                <span className="text-slate-500 block text-[10px]">Total Working Days</span>
                <span className="font-bold text-slate-800 font-mono">{payslip.totalWorkingDays}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Days Present</span>
                <span className="font-bold text-slate-800 font-mono">{payslip.daysPresent}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Paid Casual Leaves</span>
                <span className="font-bold text-emerald-700 font-mono">{payslip.approvedPaidLeaves}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Unpaid Leaves (LOP)</span>
                <span className="font-bold text-amber-700 font-mono">{payslip.unpaidLeaves}</span>
              </div>
            </div>

            {/* Earnings & Deductions Two-Column Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6">
              {/* Earnings Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                  <span>EARNINGS HEAD</span>
                  <span>AMOUNT (INR)</span>
                </div>
                <div className="divide-y divide-slate-100 p-1">
                  <div className="flex justify-between py-1.5 px-2.5 text-slate-700">
                    <span>Basic Salary</span>
                    <span className="font-mono font-medium">₹{payslip.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5 text-slate-700">
                    <span>House Rent Allowance (HRA)</span>
                    <span className="font-mono font-medium">₹{payslip.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5 text-slate-700">
                    <span>Conveyance / Travel Allowance</span>
                    <span className="font-mono font-medium">₹{payslip.travelAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5 text-slate-700">
                    <span>Special Academic Allowance</span>
                    <span className="font-mono font-medium">₹{payslip.specialAllowance.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-slate-50 px-3.5 py-2 font-bold text-slate-900 border-t border-slate-200 flex justify-between">
                  <span>GROSS EARNINGS</span>
                  <span className="font-mono text-indigo-700">₹{payslip.totalEarnings.toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                  <span>DEDUCTIONS HEAD</span>
                  <span>AMOUNT (INR)</span>
                </div>
                <div className="divide-y divide-slate-100 p-1">
                  <div className="flex justify-between py-1.5 px-2.5 text-slate-700">
                    <span>Provident Fund (PF - 12%)</span>
                    <span className="font-mono font-medium">₹{payslip.pfDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5 text-slate-700">
                    <span>Tax Deducted at Source (TDS)</span>
                    <span className="font-mono font-medium">₹{payslip.tdsDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5 text-slate-700">
                    <span>Professional Tax</span>
                    <span className="font-mono font-medium">₹{payslip.professionalTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-2.5 text-amber-700 font-medium">
                    <span>Unpaid Leave (LOP) Deduction</span>
                    <span className="font-mono">
                      {payslip.leaveDeductionAmount > 0
                        ? `₹${payslip.leaveDeductionAmount.toLocaleString()}`
                        : '₹0'}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 px-3.5 py-2 font-bold text-slate-900 border-t border-slate-200 flex justify-between">
                  <span>TOTAL DEDUCTIONS</span>
                  <span className="font-mono text-rose-600">₹{payslip.totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Pay Callout Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-900 block">
                  NET DISBURSED PAYABLE AMOUNT
                </span>
                <span className="text-[11px] text-emerald-700">
                  Transferred via NEFT/Direct Bank Settlement
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold font-mono text-emerald-800">
                  ₹{payslip.netPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Verification Footer & Authorized Signatures */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <QRCodeSVG
                  value={`KRYPTON:PAYSLIP:${payslip.id}:${payslip.staffNumber}:${payslip.netPayable}:${payslip.verificationHash}`}
                  size={56}
                  className="p-1 border border-slate-300 rounded bg-white"
                />
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-semibold text-slate-700">Cryptographic Seal</p>
                  <p className="font-mono text-slate-400">{payslip.verificationHash}</p>
                  <p className="text-emerald-700 flex items-center gap-1 font-medium">
                    <ShieldCheck size={12} /> Digitally Signed by Krypton HRMS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 text-right">
                <div>
                  <div className="w-24 border-b border-slate-400 mb-1 inline-block"></div>
                  <p className="text-[11px] font-semibold text-slate-700">Chief Accountant</p>
                  <p className="text-[9px] text-slate-400">Finance Division</p>
                </div>
                <div>
                  <div className="w-24 border-b border-slate-400 mb-1 inline-block"></div>
                  <p className="text-[11px] font-semibold text-slate-700">Principal</p>
                  <p className="text-[9px] text-slate-400">Executive Head</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
