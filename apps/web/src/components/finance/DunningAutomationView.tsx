'use client';

import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Sparkles,
  HelpCircle,
  CreditCard,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  financeClient,
  DemoInvoice,
} from '@/lib/finance-client';
import {
  DunningStage,
  DunningNotice,
  PaymentPlan,
} from '@krypton/types';

interface DunningAutomationViewProps {
  invoices: DemoInvoice[];
  onOpenCheckout: (invoice: DemoInvoice) => void;
  onRefreshData: () => void;
}

export function DunningAutomationView({
  invoices,
  onOpenCheckout,
  onRefreshData,
}: DunningAutomationViewProps) {
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);
  const [dispatchLog, setDispatchLog] = useState<string[]>([]);
  const [selectedNoticeForPreview, setSelectedNoticeForPreview] = useState<DunningNotice | null>(null);
  const [activeTab, setActiveTab] = useState<'notices' | 'plans'>('notices');

  const dunningNotices = financeClient.evaluateDunningSchedule(invoices);
  const paymentPlans = financeClient.getPaymentPlans();

  // Statistics across dunning pipeline
  const softCount = dunningNotices.filter((n) => n.stage === 'UPCOMING_SOFT').length;
  const dueCount = dunningNotices.filter((n) => n.stage === 'DUE_ALERT').length;
  const lateFeeCount = dunningNotices.filter((n) => n.stage === 'OVERDUE_LATE_FEE').length;
  const planOfferCount = dunningNotices.filter((n) => n.stage === 'PAYMENT_PLAN_OFFER').length;

  const totalLateFeeAccrued = dunningNotices.reduce((acc, curr) => acc + curr.lateFeeAmount, 0);

  const filteredNotices = dunningNotices.filter((n) => {
    if (filterStage === 'ALL') return true;
    return n.stage === filterStage;
  });

  const handleRunDunningAutomation = async () => {
    setIsRunningAutomation(true);
    setDispatchLog([]);

    const logs: string[] = [];
    logs.push('Evaluating dunning schedule for all active invoices against today (11 Oct 2026)...');
    setDispatchLog([...logs]);
    await new Promise((r) => setTimeout(r, 600));

    logs.push(`Found ${softCount} students within 7-day soft reminder window.`);
    setDispatchLog([...logs]);
    await new Promise((r) => setTimeout(r, 500));

    logs.push(`Found ${dueCount} invoices due today (Due Alert dispatched via WhatsApp).`);
    setDispatchLog([...logs]);
    await new Promise((r) => setTimeout(r, 500));

    logs.push(`Calculated ₹${totalLateFeeAccrued.toLocaleString()} late fees on ${lateFeeCount} overdue accounts.`);
    setDispatchLog([...logs]);
    await new Promise((r) => setTimeout(r, 600));

    logs.push(`Generated automated 3-Month Payment Plan options for ${planOfferCount} extended delinquent accounts.`);
    logs.push('✓ Automated Dunning cycle executed successfully. Notifications delivered.');
    setDispatchLog([...logs]);

    setIsRunningAutomation(false);
  };

  const handleActivatePaymentPlan = (invoiceId: string) => {
    try {
      const plan = financeClient.createPaymentPlan(invoiceId, 3);
      alert(`Payment Plan created successfully! Total amount of ₹${plan.totalAmount.toLocaleString()} split into 3 monthly interest-free installments.`);
      onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Failed to create plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Overview Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Clock size={22} />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                Automated Dunning & Fee Escalation Engine
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Proactive multi-stage dunning automation: 7-day Soft Reminders ➔ Due Alerts ➔ Dynamic Late Fee
              Escalation ➔ Automatic 3-Month Installment Plans. Maximizes fee recovery while protecting parent trust.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRunDunningAutomation}
              disabled={isRunningAutomation}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition disabled:opacity-75 cursor-pointer"
            >
              <RefreshCw className={isRunningAutomation ? 'animate-spin' : ''} size={16} />
              <span>{isRunningAutomation ? 'Running Cycle...' : 'Run Automated Dunning Cycle'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-Stage Visual Dunning Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stage 1: Soft Reminder */}
        <div
          onClick={() => setFilterStage('UPCOMING_SOFT')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            filterStage === 'UPCOMING_SOFT'
              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              STAGE 1 • T - 7 DAYS
            </span>
            <span className="text-xl font-bold text-emerald-600">{softCount}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Soft Friendly Reminder</h4>
          <p className="text-xs text-slate-500 mt-1">
            Gentle courtesy notice with 1-click payment link sent via WhatsApp.
          </p>
        </div>

        {/* Stage 2: Due Alert */}
        <div
          onClick={() => setFilterStage('DUE_ALERT')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            filterStage === 'DUE_ALERT'
              ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
              STAGE 2 • DUE DATE (T-0)
            </span>
            <span className="text-xl font-bold text-blue-600">{dueCount}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Due Date Alert</h4>
          <p className="text-xs text-slate-500 mt-1">
            Urgent notification on the deadline to prevent lapse into penalty period.
          </p>
        </div>

        {/* Stage 3: Late Fee Accrual */}
        <div
          onClick={() => setFilterStage('OVERDUE_LATE_FEE')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            filterStage === 'OVERDUE_LATE_FEE'
              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              STAGE 3 • T + 1-14 DAYS
            </span>
            <span className="text-xl font-bold text-amber-600">{lateFeeCount}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Late Fee Escalation</h4>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic late fees added (₹{totalLateFeeAccrued.toLocaleString()} total accrued).
          </p>
        </div>

        {/* Stage 4: Payment Plan Offer */}
        <div
          onClick={() => setFilterStage('PAYMENT_PLAN_OFFER')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            filterStage === 'PAYMENT_PLAN_OFFER'
              ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
              STAGE 4 • T + 15+ DAYS
            </span>
            <span className="text-xl font-bold text-rose-600">{planOfferCount}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">Payment Plan Offer</h4>
          <p className="text-xs text-slate-500 mt-1">
            Split into 3 monthly interest-free installments to recover funds safely.
          </p>
        </div>
      </div>

      {/* Live Automation Dispatch Console (when running) */}
      {dispatchLog.length > 0 && (
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-1.5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800 pb-1.5 mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} /> Dunning Automation Execution Log
            </span>
            <span className="text-[10px] text-slate-400">Timestamp: 2026-10-11T12:20:00Z</span>
          </div>
          {dispatchLog.map((log, index) => (
            <div key={index} className="leading-relaxed">
              <span className="text-indigo-400">»</span> {log}
            </div>
          ))}
        </div>
      )}

      {/* Tabs: Dunning Notices vs Active Installment Plans */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('notices')}
            className={`text-sm font-bold pb-2 transition flex items-center gap-2 ${
              activeTab === 'notices'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock size={16} />
            <span>Active Dunning Notices ({dunningNotices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`text-sm font-bold pb-2 transition flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers size={16} />
            <span>Active Installment Payment Plans ({paymentPlans.length})</span>
          </button>
        </div>

        {activeTab === 'notices' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Stage:</span>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Stages ({dunningNotices.length})</option>
              <option value="UPCOMING_SOFT">Stage 1: Soft Reminder</option>
              <option value="DUE_ALERT">Stage 2: Due Alert</option>
              <option value="OVERDUE_LATE_FEE">Stage 3: Late Fee Overdue</option>
              <option value="PAYMENT_PLAN_OFFER">Stage 4: Payment Plan Offer</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'notices' ? (
        /* DUNNING NOTICES TABLE */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student & Guardian</th>
                  <th className="py-3 px-4">Dunning Stage</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Fee Balance</th>
                  <th className="py-3 px-4 text-right">Late Fee</th>
                  <th className="py-3 px-4 text-right">Total Payable</th>
                  <th className="py-3 px-4 text-center">Notification Preview</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredNotices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No invoices currently in this dunning stage.
                    </td>
                  </tr>
                ) : (
                  filteredNotices.map((notice) => {
                    const originalInv = invoices.find((i) => i.id === notice.invoiceId);
                    return (
                      <tr key={notice.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 text-sm block">
                            {notice.studentName}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {notice.guardianName} • {notice.guardianPhone}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {notice.stage === 'UPCOMING_SOFT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Clock size={12} /> 7-Day Soft Reminder
                            </span>
                          )}
                          {notice.stage === 'DUE_ALERT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <AlertTriangle size={12} /> Due Today Alert
                            </span>
                          )}
                          {notice.stage === 'OVERDUE_LATE_FEE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle size={12} /> {Math.abs(notice.daysRemainingOrOverdue)}d Overdue (+Late Fee)
                            </span>
                          )}
                          {notice.stage === 'PAYMENT_PLAN_OFFER' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert size={12} /> {Math.abs(notice.daysRemainingOrOverdue)}d Overdue (Payment Plan)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {notice.dueDate}
                          <span className="block text-[10px] text-slate-400">
                            {notice.daysRemainingOrOverdue >= 0
                              ? `in ${notice.daysRemainingOrOverdue} days`
                              : `${Math.abs(notice.daysRemainingOrOverdue)} days past`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                          ₹{notice.originalAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-600 font-semibold">
                          {notice.lateFeeAmount > 0 ? `+₹${notice.lateFeeAmount.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          ₹{notice.totalPayable.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedNoticeForPreview(notice)}
                            className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium underline inline-flex items-center gap-1"
                          >
                            <MessageSquare size={13} /> View Message
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {notice.paymentPlanEligible && !notice.paymentPlanOffered && (
                            <button
                              onClick={() => handleActivatePaymentPlan(notice.invoiceId)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-semibold transition"
                            >
                              Offer 3-Mo Plan
                            </button>
                          )}
                          {originalInv && (
                            <button
                              onClick={() => onOpenCheckout(originalInv)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold shadow-sm transition"
                            >
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PAYMENT PLANS OVERVIEW */
        <div className="space-y-4">
          {paymentPlans.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
              <Layers size={36} className="mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600">No active installment plans yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Installment plans can be offered automatically to students with 15+ days overdue fees.
              </p>
            </div>
          ) : (
            paymentPlans.map((plan) => (
              <div key={plan.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-base">{plan.studentName}</h4>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
                        0% Interest Relief Plan
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Total Financed: ₹{plan.totalAmount.toLocaleString()} • Split across {plan.installmentsCount} Monthly Tranches
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                    STATUS: {plan.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plan.installments.map((inst) => (
                    <div
                      key={inst.installmentNumber}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center font-bold text-slate-700">
                        <span>Tranche #{inst.installmentNumber}</span>
                        <span className="font-mono text-slate-900">₹{inst.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar size={12} /> Due: {inst.dueDate}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        PENDING
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Message Preview Modal */}
      {selectedNoticeForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <MessageSquare size={18} className="text-indigo-600" />
                <span>Automated Dunning Message Preview</span>
              </div>
              <button
                onClick={() => setSelectedNoticeForPreview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Channel: <strong>{selectedNoticeForPreview.channel}</strong></span>
                <span>To: <strong>{selectedNoticeForPreview.guardianPhone}</strong></span>
              </div>
              <p className="text-slate-800 font-sans leading-relaxed bg-white p-3 rounded border border-slate-200">
                "{selectedNoticeForPreview.messagePreview}"
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedNoticeForPreview(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
