'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CreditCard,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  UserPlus,
  LogOut,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Check,
  AlertCircle,
  Building,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { PageHeading, Panel, StatCard, StatusPill } from '@/components/WorkspaceUI';
import { Button } from '@/components/ui';

type Tab = 'overview' | 'punching' | 'leaves' | 'payroll' | 'joining' | 'exit';

export function HRMSWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [punches, setPunches] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [resignations, setResignations] = useState<any[]>([]);

  // Modals
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  // Forms
  const [punchType, setPunchType] = useState('CHECK_IN');
  const [leaveForm, setLeaveForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', numberOfDays: 1, reason: '' });
  const [offerForm, setOfferForm] = useState({ candidateName: '', candidateEmail: '', candidatePhone: '', designationTitle: '', joiningDate: '', offeredCtcMonthly: 35000 });
  const [resignForm, setResignForm] = useState({ reason: '', preferredExitDate: '' });
  const [payrollForm, setPayrollForm] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || localStorage.getItem('adminToken') : null;

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/v1/hrms/overview', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch {
      // fallback handled gracefully
    }
  };

  const fetchPunches = async () => {
    try {
      const res = await fetch('/api/v1/hrms/punches/today', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPunches(data);
      }
    } catch {}
  };

  const fetchLeaves = async () => {
    try {
      const [reqRes, typeRes] = await Promise.all([
        fetch('/api/v1/hrms/leaves/requests', { headers: authHeaders }),
        fetch('/api/v1/hrms/leaves/types', { headers: authHeaders }),
      ]);
      if (reqRes.ok) setLeaves(await reqRes.json());
      if (typeRes.ok) setLeaveTypes(await typeRes.json());
    } catch {}
  };

  const fetchPayroll = async () => {
    try {
      const res = await fetch(`/api/v1/hrms/payroll/payslips?year=${payrollForm.year}&month=${payrollForm.month}`, { headers: authHeaders });
      if (res.ok) setPayslips(await res.json());
    } catch {}
  };

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/v1/hrms/onboarding/offers', { headers: authHeaders });
      if (res.ok) setOffers(await res.json());
    } catch {}
  };

  const fetchResignations = async () => {
    try {
      const res = await fetch('/api/v1/hrms/exit/resignations', { headers: authHeaders });
      if (res.ok) setResignations(await res.json());
    } catch {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/v1/hrms/employees', { headers: authHeaders });
      if (res.ok) setEmployees(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchOverview();
    fetchEmployees();
    fetchPunches();
    fetchLeaves();
    fetchPayroll();
    fetchOffers();
    fetchResignations();
  }, []);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // 1. Submit Punch
  const handlePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hrms/punch', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          punchType,
          verificationMode: 'WEB_PORTAL',
        }),
      });
      if (res.ok) {
        showNotification(`Punch (${punchType}) recorded successfully!`);
        setShowPunchModal(false);
        fetchPunches();
        fetchOverview();
      }
    } catch (err) {
      showNotification('Failed to record punch');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Leave
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hrms/leaves/apply', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(leaveForm),
      });
      if (res.ok) {
        showNotification('Leave application submitted for approval!');
        setShowLeaveModal(false);
        fetchLeaves();
        fetchOverview();
      }
    } catch {
      showNotification('Failed to submit leave');
    } finally {
      setLoading(false);
    }
  };

  // 3. Review Leave
  const handleReviewLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/v1/hrms/leaves/requests/${id}/review`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status, reviewerRemarks: `${status} by School Management` }),
      });
      if (res.ok) {
        showNotification(`Leave request ${status.toLowerCase()} successfully!`);
        fetchLeaves();
        fetchOverview();
      }
    } catch {}
  };

  // 4. Run Monthly Payroll
  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hrms/payroll/generate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payrollForm),
      });
      if (res.ok) {
        const result = await res.json();
        showNotification(`Payroll processed! Generated ${result.count} payslips (Total Net: ₹${result.totalNet.toLocaleString()})`);
        setShowPayrollModal(false);
        fetchPayroll();
      }
    } catch {
      showNotification('Payroll generation failed');
    } finally {
      setLoading(false);
    }
  };

  // 5. Create Job Offer
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hrms/onboarding/offers', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(offerForm),
      });
      if (res.ok) {
        showNotification('Job offer created with 5-step onboarding checklist!');
        setShowOfferModal(false);
        fetchOffers();
      }
    } catch {
      showNotification('Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  // 6. Convert Offer to Active Employee & Staff
  const handleConvertOffer = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/hrms/onboarding/offers/${id}/convert`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (res.ok) {
        showNotification('Candidate converted to Active Staff & Employee!');
        fetchOffers();
        fetchEmployees();
        fetchOverview();
      }
    } catch {}
  };

  // 7. Submit Resignation
  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hrms/exit/resignations', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(resignForm),
      });
      if (res.ok) {
        showNotification('Resignation submitted! 4 departmental clearance items created.');
        setShowResignModal(false);
        fetchResignations();
        fetchOverview();
      }
    } catch {
      showNotification('Failed to submit resignation');
    } finally {
      setLoading(false);
    }
  };

  // 8. Clearance update
  const handleClearance = async (clearanceId: string, status: 'CLEARED' | 'DUES_PENDING') => {
    try {
      const res = await fetch(`/api/v1/hrms/exit/clearance/${clearanceId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status, remarks: `Status updated to ${status}` }),
      });
      if (res.ok) {
        showNotification(`Clearance marked as ${status}`);
        fetchResignations();
      }
    } catch {}
  };

  // 9. Issue Relieving Order
  const handleIssueRelieving = async (employeeId: string, name: string) => {
    try {
      const res = await fetch('/api/v1/hrms/exit/relieving-letter', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId,
          content: `This is to certify that ${name} has been relieved from their duties with all dues cleared.`,
        }),
      });
      if (res.ok) {
        showNotification('Official Relieving Order issued and employee status set to RESIGNED!');
        fetchResignations();
        fetchEmployees();
        fetchOverview();
      }
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeading
        eyebrow="UNIFIED SCHOOL WORKFORCE"
        title="HR, Attendance & Payroll Suite"
        description="Unified management for staff punching, biometric records, leaves, monthly payroll, new joining offers, and resignation exit clearances."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Clock size={15} />}
              onClick={() => setShowPunchModal(true)}
            >
              Punch Attendance
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<CalendarDays size={15} />}
              onClick={() => setShowLeaveModal(true)}
            >
              Apply Leave
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<UserPlus size={15} />}
              onClick={() => setShowOfferModal(true)}
            >
              New Staff Offer
            </Button>
          </div>
        }
      />

      {actionMessage && (
        <div role="status" className="state-box success flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Staff"
          value={overview?.stats?.totalEmployees ?? employees.length ?? 0}
          note="Enrolled workforce"
          icon={Users}
        />
        <StatCard
          label="Punches Today"
          value={overview?.stats?.todayPunches ?? punches.length ?? 0}
          note="Biometric & Mobile"
          icon={Clock}
        />
        <StatCard
          label="Pending Leaves"
          value={overview?.stats?.pendingLeaves ?? leaves.filter(l => l.status === 'PENDING').length ?? 0}
          note="Awaiting review"
          icon={CalendarDays}
        />
        <StatCard
          label="Pending Resignations"
          value={overview?.stats?.pendingResignations ?? resignations.filter(r => r.status === 'SUBMITTED').length ?? 0}
          note="Exit clearances"
          icon={LogOut}
        />
        <StatCard
          label="Payroll Status"
          value={payslips.length > 0 ? 'Processed' : 'Open'}
          note={`${payslips.length} slips generated`}
          icon={CreditCard}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Workforce Overview
        </button>
        <button
          onClick={() => setActiveTab('punching')}
          className={`py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'punching'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Staff Punching & Biometrics ({punches.length})
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'leaves'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Leave Management ({leaves.length})
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Monthly Payroll & Salary ({payslips.length})
        </button>
        <button
          onClick={() => setActiveTab('joining')}
          className={`py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'joining'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Staff Joining & Onboarding ({offers.length})
        </button>
        <button
          onClick={() => setActiveTab('exit')}
          className={`py-2.5 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'exit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Resignations & Clearances ({resignations.length})
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Quick Punch & Attendance Actions">
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Teachers and staff members can punch in or out directly from the web portal, mobile app, or connected biometric devices.
                </p>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setPunchType('CHECK_IN');
                      setShowPunchModal(true);
                    }}
                  >
                    Quick Check-In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPunchType('CHECK_OUT');
                      setShowPunchModal(true);
                    }}
                  >
                    Quick Check-Out
                  </Button>
                </div>
              </div>
            </Panel>

            <Panel title="Monthly Payroll & Processing">
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Process monthly salaries, PF, statutory contributions, and downloadable payslips for all active school staff.
                </p>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<CreditCard size={15} />}
                    onClick={() => setShowPayrollModal(true)}
                  >
                    Run Monthly Payroll
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('payroll')}
                  >
                    View Payslips
                  </Button>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="Active Staff Directory">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="py-2.5 px-4">Staff Code</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Role / Designation</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Email & Phone</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No employees registered yet.
                      </td>
                    </tr>
                  ) : (
                    employees.slice(0, 8).map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-mono font-medium">{emp.employeeCode}</td>
                        <td className="py-2.5 px-4 font-semibold text-gray-900">{emp.firstName} {emp.lastName}</td>
                        <td className="py-2.5 px-4 text-gray-600">{emp.designation?.title || 'Staff Member'}</td>
                        <td className="py-2.5 px-4 text-gray-600">{emp.department?.name || 'Academics'}</td>
                        <td className="py-2.5 px-4 text-gray-500">
                          <div>{emp.email}</div>
                          <div className="text-xs">{emp.phone}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusPill value={emp.employmentStatus} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 2. PUNCHING */}
      {activeTab === 'punching' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Today's Staff Punching Logs</h2>
              <p className="text-sm text-gray-500">Live attendance logs synced from Web, Mobile, and Hardware Biometric devices.</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Clock size={15} />}
              onClick={() => setShowPunchModal(true)}
            >
              Manual / Device Punch
            </Button>
          </div>

          <Panel title="Recent Punches Today">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Staff Name</th>
                    <th className="py-2.5 px-4">Punch Type</th>
                    <th className="py-2.5 px-4">Mode</th>
                    <th className="py-2.5 px-4">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {punches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No punch logs recorded today yet.
                      </td>
                    </tr>
                  ) : (
                    punches.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-mono font-medium text-gray-800">
                          {new Date(p.punchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-gray-900">
                          {p.employee?.firstName} {p.employee?.lastName} ({p.employee?.employeeCode})
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            p.punchType === 'CHECK_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.punchType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-600">{p.verificationMode}</td>
                        <td className="py-2.5 px-4 text-gray-500">{p.employee?.department?.name || 'General'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 3. LEAVES */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Staff Leave Applications</h2>
              <p className="text-sm text-gray-500">Review teacher leave applications, quotas, and approvals.</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={15} />}
              onClick={() => setShowLeaveModal(true)}
            >
              Apply Leave
            </Button>
          </div>

          <Panel title="Leave Requests">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="py-2.5 px-4">Staff</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Dates</th>
                    <th className="py-2.5 px-4">Days</th>
                    <th className="py-2.5 px-4">Reason</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        No leave requests submitted.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-medium text-gray-900">
                          {l.employee?.firstName} {l.employee?.lastName}
                        </td>
                        <td className="py-2.5 px-4 text-gray-700">{l.leaveType?.name} ({l.leaveType?.code})</td>
                        <td className="py-2.5 px-4 text-gray-600">
                          {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-4 font-mono">{l.numberOfDays}</td>
                        <td className="py-2.5 px-4 text-gray-600 max-w-xs truncate">{l.reason}</td>
                        <td className="py-2.5 px-4">
                          <StatusPill value={l.status} />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {l.status === 'PENDING' ? (
                            <div className="flex gap-1.5 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-700 hover:bg-red-50"
                                onClick={() => handleReviewLeave(l.id, 'REJECTED')}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 4. PAYROLL */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monthly Payroll & Salary Slips</h2>
              <p className="text-sm text-gray-500">Calculate net pay, PF/PT deductions, and generate downloadable payslips.</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<CreditCard size={15} />}
              onClick={() => setShowPayrollModal(true)}
            >
              Run Payroll
            </Button>
          </div>

          <Panel title="Issued Payslips">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="py-2.5 px-4">Month/Year</th>
                    <th className="py-2.5 px-4">Staff Name</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Gross Salary</th>
                    <th className="py-2.5 px-4">Deductions (PF/PT)</th>
                    <th className="py-2.5 px-4">Net Salary</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payslips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        No payslips generated for this period. Click "Run Payroll" to generate.
                      </td>
                    </tr>
                  ) : (
                    payslips.map((ps) => (
                      <tr key={ps.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-mono font-medium">{ps.month}/{ps.year}</td>
                        <td className="py-2.5 px-4 font-medium text-gray-900">{ps.employee?.firstName} {ps.employee?.lastName}</td>
                        <td className="py-2.5 px-4 text-gray-600">{ps.employee?.department?.name || 'General'}</td>
                        <td className="py-2.5 px-4 font-mono text-gray-700">₹{ps.grossSalary.toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-mono text-red-600">₹{ps.totalDeductions.toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">₹{ps.netSalary.toLocaleString()}</td>
                        <td className="py-2.5 px-4">
                          <StatusPill value={ps.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 5. JOINING & ONBOARDING */}
      {activeTab === 'joining' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Staff Joining & Onboarding</h2>
              <p className="text-sm text-gray-500">Send job offers, track document verification, and onboard new teachers into the school ERP.</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={15} />}
              onClick={() => setShowOfferModal(true)}
            >
              New Candidate Offer
            </Button>
          </div>

          <Panel title="Candidate Offers & Onboarding Checklist">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="py-2.5 px-4">Candidate</th>
                    <th className="py-2.5 px-4">Designation</th>
                    <th className="py-2.5 px-4">Joining Date</th>
                    <th className="py-2.5 px-4">Offered Monthly</th>
                    <th className="py-2.5 px-4">Onboarding Tasks</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {offers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        No active job offers or onboarding candidates.
                      </td>
                    </tr>
                  ) : (
                    offers.map((off) => (
                      <tr key={off.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-gray-900">{off.candidateName}</div>
                          <div className="text-xs text-gray-500">{off.candidateEmail}</div>
                        </td>
                        <td className="py-2.5 px-4 text-gray-700">{off.designationTitle}</td>
                        <td className="py-2.5 px-4 text-gray-600">{new Date(off.joiningDate).toLocaleDateString()}</td>
                        <td className="py-2.5 px-4 font-mono font-medium text-gray-800">₹{off.offeredCtcMonthly.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-gray-600">
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                            {off.joiningTasks?.length || 5} Formalities
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusPill value={off.status} />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {off.status !== 'JOINED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertOffer(off.id)}
                            >
                              Enroll as Active Staff
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* 6. RESIGNATION & EXIT */}
      {activeTab === 'exit' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Resignation & No-Dues Clearances</h2>
              <p className="text-sm text-gray-500">Manage resignation submissions, 4-stage departmental clearances (Library, Accounts, IT, Principal), and issue relieving certificates.</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<LogOut size={15} />}
              onClick={() => setShowResignModal(true)}
            >
              Submit Resignation
            </Button>
          </div>

          <Panel title="Resignation Cases">
            <div className="space-y-4 p-4">
              {resignations.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  No active resignation cases.
                </div>
              ) : (
                resignations.map((r) => (
                  <div key={r.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{r.employee?.firstName} {r.employee?.lastName} ({r.employee?.employeeCode})</h3>
                        <p className="text-xs text-gray-500">{r.employee?.designation?.title} • {r.employee?.department?.name}</p>
                        <p className="text-sm text-gray-700 mt-1">Reason: <span className="italic">{r.reason}</span></p>
                      </div>
                      <StatusPill value={r.status} />
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">4-Stage Departmental Clearances (No-Dues):</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {r.clearances?.map((cl: any) => (
                          <div key={cl.id} className="p-2.5 rounded border border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                              <div className="text-xs font-bold text-gray-800">{cl.department}</div>
                              <div className="text-[11px] text-gray-500">{cl.status}</div>
                            </div>
                            {cl.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 px-2"
                                onClick={() => handleClearance(cl.id, 'CLEARED')}
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-3">
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<FileText size={14} />}
                        onClick={() => handleIssueRelieving(r.employeeId, `${r.employee?.firstName} ${r.employee?.lastName}`)}
                      >
                        Issue Relieving Certificate & Deactivate
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* MODALS */}

      {/* 1. Punch Modal */}
      {showPunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Record Staff Attendance Punch</h3>
            <form onSubmit={handlePunch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Punch Type</label>
                <select
                  value={punchType}
                  onChange={(e) => setPunchType(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  <option value="CHECK_IN">Check-In (Morning / Duty Start)</option>
                  <option value="CHECK_OUT">Check-Out (Evening / Duty End)</option>
                  <option value="BREAK_OUT">Break-Out</option>
                  <option value="BREAK_IN">Break-In</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Punches are recorded with verified timestamp and linked directly to the staff daily attendance sheet.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowPunchModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Recording...' : 'Confirm Punch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Apply for Staff Leave</h3>
            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  required
                  value={leaveForm.leaveTypeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={leaveForm.numberOfDays}
                  onChange={(e) => setLeaveForm({ ...leaveForm, numberOfDays: parseFloat(e.target.value) })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Medical reason, personal function, school duty, etc."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowLeaveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Leave'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Generate Monthly Payroll Run</h3>
            <form onSubmit={handleGeneratePayroll} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={payrollForm.year}
                    onChange={(e) => setPayrollForm({ ...payrollForm, year: parseInt(e.target.value) })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={payrollForm.month}
                    onChange={(e) => setPayrollForm({ ...payrollForm, month: parseInt(e.target.value) })}
                    className="w-full border rounded-lg p-2 text-sm"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                      <option key={m} value={m}>
                        Month {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                This will automatically compute gross remuneration, statutory deductions (PF/PT), and generate downloadable payslips for all active staff.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowPayrollModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Run & Issue Payslips'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Create Staff Job Offer & Onboarding</h3>
            <form onSubmit={handleCreateOffer} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  value={offerForm.candidateName}
                  onChange={(e) => setOfferForm({ ...offerForm, candidateName: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="e.g. Anjali Nair"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={offerForm.candidateEmail}
                    onChange={(e) => setOfferForm({ ...offerForm, candidateEmail: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={offerForm.candidatePhone}
                    onChange={(e) => setOfferForm({ ...offerForm, candidatePhone: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation / Role</label>
                <input
                  type="text"
                  required
                  value={offerForm.designationTitle}
                  onChange={(e) => setOfferForm({ ...offerForm, designationTitle: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="e.g. TGT Mathematics Teacher"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={offerForm.joiningDate}
                    onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={offerForm.offeredCtcMonthly}
                    onChange={(e) => setOfferForm({ ...offerForm, offeredCtcMonthly: parseInt(e.target.value) })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowOfferModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Issue Offer & Checklist'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Resign Modal */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Submit Resignation</h3>
            <form onSubmit={handleSubmitResignation} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Exit Date</label>
                <input
                  type="date"
                  required
                  value={resignForm.preferredExitDate}
                  onChange={(e) => setResignForm({ ...resignForm, preferredExitDate: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Resignation</label>
                <textarea
                  required
                  rows={3}
                  value={resignForm.reason}
                  onChange={(e) => setResignForm({ ...resignForm, reason: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Relocation, higher studies, personal reasons..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowResignModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
