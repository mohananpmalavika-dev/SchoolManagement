'use client';

import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  CheckCircle2,
  Calendar,
  Download,
  Printer,
  Sparkles,
  TrendingDown,
  Building,
  GraduationCap,
  FileText,
  Clock,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import {
  financeClient,
} from '@/lib/finance-client';
import {
  StaffPayrollProfile,
  StaffPayslip,
  MonthlyPayrollRun,
} from '@krypton/types';
import { PayslipModal } from './PayslipModal';

export function StaffPayrollView() {
  const [profiles] = useState<StaffPayrollProfile[]>(() => financeClient.getStaffProfiles());
  const [unpaidLeaveMap, setUnpaidLeaveMap] = useState<Record<string, number>>({
    'st-02': 1,
    'st-05': 2,
  });
  const [isProcessingRun, setIsProcessingRun] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<StaffPayslip | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [runHistory, setRunHistory] = useState<MonthlyPayrollRun[]>(() => financeClient.getPayrollRuns());
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  const handleLeaveChange = (staffId: string, count: number) => {
    setUnpaidLeaveMap((prev) => ({
      ...prev,
      [staffId]: Math.max(0, count),
    }));
  };

  const handleExecute1ClickPayroll = async () => {
    setIsProcessingRun(true);
    await new Promise((r) => setTimeout(r, 1200));

    try {
      const run = financeClient.executeMonthlyPayrollRun(selectedMonth, 2026, unpaidLeaveMap);
      setRunHistory(financeClient.getPayrollRuns());
      alert(`🎉 1-Click Payroll Run for ${selectedMonth} completed successfully!\nDisbursed ₹${run.totalNetDisbursed.toLocaleString()} across ${run.totalStaffCount} staff members.`);
    } catch (err: any) {
      alert(err.message || 'Failed to process payroll');
    } finally {
      setIsProcessingRun(false);
    }
  };

  const handleOpenPayslip = (profile: StaffPayrollProfile) => {
    const unpaid = unpaidLeaveMap[profile.id] || 0;
    const slip = financeClient.calculateStaffPayslip(profile, selectedMonth, 2026, unpaid);
    setSelectedPayslip(slip);
    setIsPayslipModalOpen(true);
  };

  const currentRun = runHistory.find((r) => r.month === selectedMonth) || runHistory[0];

  // Quick aggregates
  const totalStaff = profiles.length;
  const totalMonthlyGross = profiles.reduce((acc, curr) => acc + curr.monthlyGrossSalary, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="studio-banner bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Users size={22} />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Staff HRMS & 1-Click Monthly Payroll
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Unified institutional HR compensation engine. Automatically factors teaching allowances,
              attendance registers, unpaid leave deductions (Loss of Pay), statutory PF/TDS withholdings,
              and enables 1-click batch disbursement with verified digital payslips.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs bg-white/10 text-white border border-white/20 px-3 py-2 rounded-xl focus:outline-none"
            >
              <option value="October 2026" className="text-slate-900">October 2026 (Current)</option>
              <option value="September 2026" className="text-slate-900">September 2026</option>
              <option value="August 2026" className="text-slate-900">August 2026</option>
            </select>

            <button
              onClick={handleExecute1ClickPayroll}
              disabled={isProcessingRun}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-75 cursor-pointer whitespace-nowrap"
            >
              {isProcessingRun ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Disbursing Batch...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>1-Click Run Monthly Payroll</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">ACTIVE STAFF ROSTER</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-800">{totalStaff}</span>
            <span className="text-xs text-indigo-600 font-medium">3 Faculty • 2 Ops</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">MONTHLY GROSS LIABILITY</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-800 font-mono">
              ₹{totalMonthlyGross.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">Base + Allowances</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">STATUTORY PF / TAX DEDUCTIONS</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-rose-600 font-mono">
              ₹{currentRun?.totalDeductions.toLocaleString() || '38,200'}
            </span>
            <span className="text-xs text-rose-600 font-medium">PF, TDS & Leave LOP</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">TOTAL NET DISBURSED</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-600 font-mono">
              ₹{currentRun?.totalNetDisbursed.toLocaleString() || '246,800'}
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
              SETTLED
            </span>
          </div>
        </div>
      </div>

      {/* Staff Roster Compensation & Payroll Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building size={16} className="text-indigo-600" />
              Staff Compensation Register & Leave Deductions
            </h3>
            <p className="text-xs text-slate-500">
              Modify unpaid leaves below to see automatic daily-rate pay deductions reflect in real time.
            </p>
          </div>
          <span className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg font-mono">
            Pay Period: 01 Oct 2026 - 31 Oct 2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Department & Position</th>
                <th className="py-3 px-4 text-right">Basic Pay</th>
                <th className="py-3 px-4 text-right">Gross Salary</th>
                <th className="py-3 px-4 text-center">Unpaid Leaves (LOP)</th>
                <th className="py-3 px-4 text-right">Leave Deduction</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">Official Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {profiles.map((profile) => {
                const unpaid = unpaidLeaveMap[profile.id] || 0;
                const slip = financeClient.calculateStaffPayslip(profile, selectedMonth, 2026, unpaid);

                return (
                  <tr key={profile.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 text-sm block">
                        {profile.fullName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {profile.staffNumber} • {profile.bankAccount.bankName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        {profile.isTeaching ? (
                          <GraduationCap size={14} className="text-indigo-600" />
                        ) : (
                          <Building size={14} className="text-slate-500" />
                        )}
                        <span>{profile.position}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {profile.department}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                      ₹{profile.salaryComponents.basicSalary.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{profile.monthlyGrossSalary.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center border border-slate-300 rounded bg-white overflow-hidden shadow-xs">
                        <button
                          onClick={() => handleLeaveChange(profile.id, unpaid - 1)}
                          className="px-2 py-0.5 hover:bg-slate-100 text-slate-600 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-mono font-bold text-slate-800">
                          {unpaid}
                        </span>
                        <button
                          onClick={() => handleLeaveChange(profile.id, unpaid + 1)}
                          className="px-2 py-0.5 hover:bg-slate-100 text-slate-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="block text-[10px] text-slate-400 mt-0.5">days</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-600">
                      {slip.leaveDeductionAmount > 0
                        ? `-₹${slip.leaveDeductionAmount.toLocaleString()}`
                        : '₹0'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{slip.netPayable.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenPayslip(profile)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-[11px] inline-flex items-center gap-1.5 transition"
                      >
                        <FileText size={13} />
                        <span>View Payslip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      <PayslipModal
        payslip={selectedPayslip}
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
      />
    </div>
  );
}
