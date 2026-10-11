'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building,
  GraduationCap,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Eye,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import {
  financeClient,
} from '@/lib/finance-client';
import { StaffPayslip, StaffPayrollProfile } from '@krypton/types';
import { PayslipModal } from './PayslipModal';

export function StaffPortalPayslipView() {
  const profiles = financeClient.getStaffProfiles();
  // Simulate logged-in teacher: Mrs. Lakshmi Menon (PGT English)
  const [selectedStaffId, setSelectedStaffId] = useState<string>('st-01');
  const [activePayslip, setActivePayslip] = useState<StaffPayslip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentProfile = profiles.find((p) => p.id === selectedStaffId) || profiles[0];

  // Generate 3 recent months of payslips for this staff member
  const months = ['October 2026', 'September 2026', 'August 2026'];
  const historySlips: StaffPayslip[] = months.map((m) =>
    financeClient.calculateStaffPayslip(currentProfile, m, 2026, m === 'September 2026' ? 1 : 0)
  );

  const handleViewPayslip = (slip: StaffPayslip) => {
    setActivePayslip(slip);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Staff Self-Service Header */}
      <div className="studio-banner bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Briefcase size={22} />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Teacher & Staff Self-Service Payroll Portal
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Secure employee portal. Teachers and administrative staff can view transparent breakdown of
              remuneration, statutory deductions, PF accruals, and download official verified monthly Payslip PDFs.
            </p>
          </div>

          {/* Staff Switcher for Demo Simulation */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
            <span className="text-[10px] text-indigo-200 block font-medium mb-1 px-1">
              SIMULATE LOGGED-IN EMPLOYEE:
            </span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.position})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Profile Card & Current Salary Package */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">
              {currentProfile.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{currentProfile.fullName}</h3>
              <p className="text-xs text-indigo-600 font-medium">{currentProfile.position}</p>
              <p className="text-[11px] text-slate-400 font-mono">Employee ID: {currentProfile.staffNumber}</p>
            </div>
          </div>

          <div className="text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span>Department:</span>
              <span className="font-semibold text-slate-800">{currentProfile.department}</span>
            </div>
            <div className="flex justify-between">
              <span>Salary Account:</span>
              <span className="font-mono text-slate-800">{currentProfile.bankAccount.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Bank & Branch:</span>
              <span className="text-slate-800">{currentProfile.bankAccount.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span>IFSC / Routing Code:</span>
              <span className="font-mono text-slate-800">{currentProfile.bankAccount.routingOrIfsc}</span>
            </div>
          </div>
        </div>

        {/* Current Compensation Structure */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Monthly Compensation Structure</h4>
              <p className="text-xs text-slate-500">Gross Monthly Entitlement: ₹{currentProfile.monthlyGrossSalary.toLocaleString()}</p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full font-mono">
              PERMANENT FACULTY
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold">BASIC SALARY</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                ₹{currentProfile.salaryComponents.basicSalary.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold">HRA ALLOWANCE</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                ₹{currentProfile.salaryComponents.hra.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold">TRAVEL / CONVEYANCE</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                ₹{currentProfile.salaryComponents.travelAllowance.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold">SPECIAL ALLOWANCE</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                ₹{currentProfile.salaryComponents.specialAllowance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>PF Deduction: <strong>12% of Basic</strong></span>
            <span>•</span>
            <span>Tax Withholding: <strong>{currentProfile.salaryComponents.tdsRate}% TDS</strong></span>
            <span>•</span>
            <span>Professional Tax: <strong>₹200/mo</strong></span>
          </div>
        </div>
      </div>

      {/* Payslip History List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-indigo-600" />
            Monthly Payslip History & PDF Downloads
          </h3>
          <span className="text-xs text-slate-500">Academic Year 2026-2027</span>
        </div>

        <div className="divide-y divide-slate-200 text-xs">
          {historySlips.map((slip) => (
            <div
              key={slip.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center border border-indigo-100">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{slip.month}</h4>
                  <p className="text-[11px] text-slate-500">
                    Pay Period: {slip.payPeriod} • Disbursed: {slip.paymentDate}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">Ref: {slip.paymentReference}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">NET DISBURSED</span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    ₹{slip.netPayable.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewPayslip(slip)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Download size={14} /> Download Payslip PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payslip Modal */}
      <PayslipModal
        payslip={activePayslip}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
