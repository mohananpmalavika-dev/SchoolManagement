'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Clock,
  Award,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Printer,
  Sparkles,
  Layers,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  financeClient,
  DemoInvoice,
} from '@/lib/finance-client';
import { MultiGatewayCheckoutModal } from './MultiGatewayCheckoutModal';
import { DunningAutomationView } from './DunningAutomationView';
import { ConcessionMatrixView } from './ConcessionMatrixView';
import { StaffPayrollView } from './StaffPayrollView';
import { StaffPortalPayslipView } from './StaffPortalPayslipView';

type FinanceTab = 'overview' | 'dunning' | 'concessions' | 'payroll' | 'staff-portal';

export function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [invoices, setInvoices] = useState<DemoInvoice[]>(() => financeClient.getInvoices());
  const [selectedInvoiceForCheckout, setSelectedInvoiceForCheckout] = useState<DemoInvoice | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID' | 'PAYMENT_PLAN'>('ALL');

  const metrics = financeClient.getSummaryMetrics();
  const paymentRecords = financeClient.getPaymentRecords();

  const handleRefresh = () => {
    setInvoices(financeClient.getInvoices());
  };

  const handleOpenCheckout = (inv: DemoInvoice) => {
    setSelectedInvoiceForCheckout(inv);
    setIsCheckoutOpen(true);
  };

  const handlePaymentComplete = (updatedInv: DemoInvoice) => {
    setInvoices(financeClient.getInvoices());
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.guardianName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Hero */}
      <div className="studio-banner bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-3xl shadow-2xl border border-indigo-900/50 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles size={14} />
              <span>End-to-End Financial Automation ERP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Advanced Institutional Finance & Treasury Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              പൂർണ്ണ സാമ്പത്തിക നിയന്ത്രണം: Multi-Gateway Checkout (Razorpay, NPCI UPI, NetBanking, Cards, Stripe) •
              Automated Dunning & Late Fee Escalation • Scholarship & Sibling Concession Matrix • Staff HRMS & 1-Click Payroll.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const overdueInv = invoices.find((i) => i.status === 'OVERDUE' || i.status === 'PENDING') || invoices[0];
                handleOpenCheckout(overdueInv);
              }}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <CreditCard size={18} />
              <span>Launch Global Checkout</span>
            </button>
          </div>
        </div>

        {/* Executive Financial Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-indigo-900/60">
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
              TOTAL INVOICED
            </span>
            <span className="text-lg font-bold font-mono text-white mt-0.5 block">
              ₹{metrics.totalInvoiced.toLocaleString()}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              TOTAL COLLECTED
            </span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
              ₹{metrics.totalCollected.toLocaleString()}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">
              COLLECTION RATE
            </span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              {metrics.collectionRatePercent}%
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
              OUTSTANDING DUES
            </span>
            <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
              ₹{metrics.outstandingBalance.toLocaleString()}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
              CONCESSIONS GRANTED
            </span>
            <span className="text-lg font-bold font-mono text-emerald-300 mt-0.5 block">
              ₹{metrics.concessionsGrantedTotal.toLocaleString()}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
              MONTHLY PAYROLL
            </span>
            <span className="text-lg font-bold font-mono text-purple-300 mt-0.5 block">
              ₹{metrics.monthlyPayrollLiability.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard size={16} />
          <span>Multi-Gateway Checkout & Invoices</span>
        </button>

        <button
          onClick={() => setActiveTab('dunning')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap relative ${
            activeTab === 'dunning'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock size={16} />
          <span>Automated Dunning & Escalation</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2" />
        </button>

        <button
          onClick={() => setActiveTab('concessions')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'concessions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award size={16} />
          <span>Scholarship & Sibling Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users size={16} />
          <span>Staff HRMS & 1-Click Payroll</span>
        </button>

        <button
          onClick={() => setActiveTab('staff-portal')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'staff-portal'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase size={16} />
          <span>Staff Self-Service Portal</span>
        </button>
      </div>

      {/* Tab Content Rendering */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Invoices Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'PENDING', 'OVERDUE', 'PAID', 'PAYMENT_PLAN'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search student, invoice #, guardian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Invoices Master Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Active Student Invoices & Payment Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Click &apos;Pay with Gateway&apos; on any invoice to test Indian &amp; global checkout (Razorpay, NPCI UPI, NetBanking, Cards, Stripe).
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                {filteredInvoices.length} Invoices
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Student & Grade</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4 text-right">Tuition</th>
                    <th className="py-3 px-4 text-right">Concession</th>
                    <th className="py-3 px-4 text-right">Late Fee</th>
                    <th className="py-3 px-4 text-right">Total Payable</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {inv.invoiceNumber}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          Due: {inv.dueDate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm block">
                          {inv.studentName}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {inv.admissionNumber} • {inv.grade}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 block">{inv.guardianName}</span>
                        <span className="text-[11px] text-slate-500">{inv.guardianPhone}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                        ₹{inv.tuitionFee.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                        {inv.concessionApplied > 0 ? `-₹${inv.concessionApplied.toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-600">
                        {inv.lateFee > 0 ? `+₹${inv.lateFee.toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{inv.balanceAmount.toLocaleString()}
                        {inv.paidAmount > 0 && (
                          <span className="block text-[10px] text-emerald-600 font-normal">
                            Paid: ₹{inv.paidAmount.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} /> PAID
                          </span>
                        )}
                        {inv.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                            PENDING
                          </span>
                        )}
                        {inv.status === 'OVERDUE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            OVERDUE
                          </span>
                        )}
                        {inv.status === 'PAYMENT_PLAN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                            PAYMENT PLAN
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {inv.status !== 'PAID' ? (
                          <button
                            onClick={() => handleOpenCheckout(inv)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-sm transition flex items-center gap-1.5 ml-auto"
                          >
                            <CreditCard size={13} />
                            <span>Pay with Gateway</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Multi-Gateway Transaction Audit */}
          {paymentRecords.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                Live Multi-Gateway Settlement Stream (Verified Audits)
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {paymentRecords.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{pay.studentName}</span>
                      <span className="text-slate-400 font-mono ml-2">[{pay.reference}]</span>
                      <p className="text-[11px] text-slate-500">
                        Gateway: <strong>{pay.gateway}</strong> • Receipt: {pay.receiptNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-emerald-700 text-sm">
                        +₹{pay.amount.toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {new Date(pay.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dunning' && (
        <DunningAutomationView
          invoices={invoices}
          onOpenCheckout={handleOpenCheckout}
          onRefreshData={handleRefresh}
        />
      )}

      {activeTab === 'concessions' && <ConcessionMatrixView />}

      {activeTab === 'payroll' && <StaffPayrollView />}

      {activeTab === 'staff-portal' && <StaffPortalPayslipView />}

      {/* Global Multi-Gateway Modal */}
      {selectedInvoiceForCheckout && (
        <MultiGatewayCheckoutModal
          invoice={selectedInvoiceForCheckout}
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
