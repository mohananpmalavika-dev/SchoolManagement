'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, Download, RefreshCw, Users } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { messageFor, dateLabel } from '@/lib/workspace';
import { PageHeading, Panel, StatCard, StatusPill, EmptyState } from '@/components/WorkspaceUI';
import { Button } from '@/components/ui';
import { HRMSForm, type HrField, type HrForm } from './HRMSForm';
import { RecruitmentWorkspace } from './RecruitmentWorkspace';

const managers = ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'SCHOOL_ADMIN'];
const rupees = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
const name = (v: any) => [v?.firstName, v?.lastName].filter(Boolean).join(' ');
const opts = (values: string[]) =>
  values.map((value) => ({ value, label: value.replaceAll('_', ' ') }));
const choices = (rows: any[] = [], key = 'name') =>
  rows.map((row) => ({ value: row.id, label: row[key] || name(row) || row.id }));
const text = (key: string, label: string, type = 'text', required = true): HrField => ({
  key,
  label,
  type,
  required,
});
const select = (
  key: string,
  label: string,
  options: { value: string; label: string }[],
  required = true
): HrField => ({ key, label, options, required });
const amount = (key: string, label: string, min = 0): HrField => ({
  key,
  label,
  type: 'number',
  required: true,
  min,
  max: 10000000,
  step: 0.01,
});
const existingOfferForm = (s: any, offer: any): HrForm => ({
  title: 'Configure staff offer',
  path: `onboarding/offers/${offer.id}`,
  method: 'patch',
  initial: { ...offer, joiningDate: offer.joiningDate.slice(0, 10) },
  prepare: (values) => ({
    ...values,
    ...(offer.candidateId ? { candidateId: offer.candidateId } : {}),
  }),
  fields: [
    text('candidateName', 'Candidate name'),
    text('candidateEmail', 'Candidate email', 'email'),
    text('candidatePhone', 'Candidate phone'),
    text('designationTitle', 'Designation title'),
    text('joiningDate', 'Joining date', 'date'),
    amount('offeredCtcMonthly', 'Base monthly salary offered (INR)', 0.01),
    select('departmentId', 'HR department', choices(s.departments)),
    select('structureId', 'Salary structure', choices(s.structures)),
    select(
      'schoolDepartment',
      'School department',
      opts([
        'TEACHING',
        'ADMINISTRATION',
        'FINANCE',
        'LIBRARY',
        'TRANSPORT',
        'MAINTENANCE',
        'SECURITY',
        'IT',
        'OTHER',
      ])
    ),
    select(
      'accountRole',
      'School account role',
      opts([
        'TEACHER',
        'CLASS_TEACHER',
        'ACCOUNTANT',
        'LIBRARIAN',
        'TRANSPORT_OFFICER',
        'RECEPTIONIST',
        'SCHOOL_ADMIN',
      ])
    ),
  ],
});
type Tab =
  | 'overview'
  | 'employees'
  | 'punching'
  | 'leaves'
  | 'payroll'
  | 'recruitment'
  | 'joining'
  | 'exit'
  | 'setup';
const joiningForm = (offer: any, accounts: any[]): HrForm => {
  const matching = accounts.filter(
    (a) =>
      a.email.toLowerCase() === offer.candidateEmail.toLowerCase() && a.role === offer.accountRole
  );
  const parts = offer.candidateName.trim().split(/\s+/);
  const existing = { field: 'accountMode', equals: 'EXISTING' },
    create = { field: 'accountMode', equals: 'CREATE' };
  return {
    title: 'Complete staff joining',
    path: `onboarding/offers/${offer.id}/convert`,
    initial: {
      accountMode: matching.length ? 'EXISTING' : 'CREATE',
      userId: matching.length === 1 ? matching[0].id : '',
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    },
    description: `Complete the school login, staff, HR employee and effective salary together. Login email: ${offer.candidateEmail}; role: ${offer.accountRole.replaceAll('_', ' ')}. New logins require a password change. Compatible partial records are linked; conflicts stop joining.`,
    fields: [
      select('accountMode', 'School login', [
        { value: 'CREATE', label: 'Create login during joining' },
        { value: 'EXISTING', label: 'Use existing school login' },
      ]),
      {
        ...select(
          'userId',
          'Matching school account',
          matching.map((a) => ({ value: a.id, label: `${name(a)} · ${a.email} · ${a.role}` }))
        ),
        when: existing,
      },
      { ...text('firstName', 'Joining first name'), maxLength: 100, when: create },
      { ...text('lastName', 'Joining last name'), maxLength: 100, when: create },
      {
        ...text('password', 'Joining temporary password (12+ characters)', 'password'),
        maxLength: 128,
        when: create,
      },
    ],
    prepare: (v) =>
      v.accountMode === 'EXISTING'
        ? { userId: v.userId }
        : { newAccount: { firstName: v.firstName, lastName: v.lastName, password: v.password } },
  };
};
const initialData = {
  profile: null as any,
  overview: null as any,
  employees: [] as any[],
  punches: [] as any[],
  leaves: [] as any[],
  leaveTypes: [] as any[],
  leaveBalances: [] as any[],
  payslips: [] as any[],
  periods: [] as any[],
  offers: [] as any[],
  recruitment: { vacancies: [] as any[], candidates: [] as any[], interviewers: [] as any[] },
  resignations: [] as any[],
  letters: [] as any[],
  setup: {
    departments: [],
    designations: [],
    grades: [],
    shifts: [],
    leaveTypes: [],
    components: [],
    structures: [],
    accounts: [],
  } as any,
};
export function HRMSWorkspace() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return;
    let active = true;
    setError('');
    apiClient
      .get('/admin/schools')
      .then(({ data }) => {
        if (active) setSchools(data);
      })
      .catch((err) => {
        if (active) setError(messageFor(err));
      });
    return () => {
      active = false;
    };
  }, [user?.role, retry]);
  if (user?.role !== 'SUPER_ADMIN') return <SchoolHRMSWorkspace />;
  return (
    <>
      <Panel title="Select a school for staff HR">
        <div className="panel-body field">
          {error && (
            <div role="alert" className="state-box">
              {error}
              <button className="underline ml-3" onClick={() => setRetry((n) => n + 1)}>
                Retry
              </button>
            </div>
          )}
          <label htmlFor="hr-school">School workspace</label>
          <select
            id="hr-school"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
          >
            <option value="">Choose an active school</option>
            {schools
              .filter(
                (school: any) => !school.status || ['ACTIVE', 'TRIAL'].includes(school.status)
              )
              .map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
          </select>
        </div>
      </Panel>
      {tenantId && <SchoolHRMSWorkspace key={tenantId} tenantId={tenantId} />}
    </>
  );
}
function SchoolHRMSWorkspace({ tenantId }: { tenantId?: string }) {
  const { user } = useAuth(),
    role = user?.role || '',
    manager = managers.includes(role),
    payroll = manager || role === 'ACCOUNTANT';
  const [tab, setTab] = useState<Tab>('overview'),
    [data, setData] = useState(initialData),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [form, setForm] = useState<HrForm | null>(null);
  const [preview, setPreview] = useState<any>(null),
    [workingDates, setWorkingDates] = useState('');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [attendanceDate, setAttendanceDate] = useState(() =>
      new Date().toLocaleDateString('en-CA')
    ),
    [attendance, setAttendance] = useState<any[]>([]);
  const working = useRef(false),
    generation = useRef(0),
    attendanceGeneration = useRef(0);
  const periodYear = period.year,
    periodMonth = period.month;
  const load = useCallback(async () => {
    if (!user) return;
    const requestId = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const get = async (path: string) =>
        (
          await apiClient.get('/hrms/' + path, {
            headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
          })
        ).data;
      const profile = await get('employees/me');
      const result = { ...initialData, profile };
      const tasks: [keyof typeof initialData, string][] = [['leaveTypes', 'leaves/types']];
      if (profile) tasks.push(['leaveBalances', 'leaves/balances']);
      if (profile || manager)
        tasks.push(
          ['punches', 'punches/today'],
          ['leaves', 'leaves/requests'],
          ['letters', 'exit/letters']
        );
      if (profile || payroll)
        tasks.push(['payslips', `payroll/payslips?year=${periodYear}&month=${periodMonth}`]);
      if (profile || manager || ['ACCOUNTANT', 'LIBRARIAN'].includes(role))
        tasks.push(['resignations', 'exit/resignations']);
      if (manager)
        tasks.push(
          ['overview', 'overview'],
          ['offers', 'onboarding/offers'],
          ['recruitment', 'recruitment']
        );
      if (payroll)
        tasks.push(
          ['employees', 'employees'],
          ['setup', 'setup'],
          ['periods', `payroll/periods?year=${periodYear}&month=${periodMonth}`]
        );
      const results = await Promise.allSettled(
        tasks.map(async ([key, path]) => [key, await get(path)] as const)
      );
      const failures: string[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') (result as any)[r.value[0]] = r.value[1];
        else failures.push(tasks[i][1] + ': ' + messageFor(r.reason));
      });
      if (requestId === generation.current) {
        setData(result);
        if (failures.length) setError(failures.join('; '));
      }
    } catch (err) {
      if (requestId === generation.current) setError(messageFor(err));
    } finally {
      if (requestId === generation.current) setLoading(false);
    }
  }, [user, manager, payroll, role, periodYear, periodMonth, tenantId]);
  useEffect(() => {
    const cancel = () => {
      generation.current++;
    };
    void load();
    return cancel;
  }, [load]);
  useEffect(() => {
    setPreview(null);
    setWorkingDates('');
  }, [periodYear, periodMonth]);
  const loadAttendance = useCallback(async () => {
    const id = ++attendanceGeneration.current;
    try {
      const rows = (
        await apiClient.get('/hrms/attendance', {
          params: { date: attendanceDate },
          headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
        })
      ).data;
      if (id === attendanceGeneration.current) setAttendance(rows);
    } catch (err) {
      if (id === attendanceGeneration.current) {
        setAttendance([]);
        setError(messageFor(err));
      }
    }
  }, [attendanceDate, tenantId]);
  useEffect(() => {
    const cancel = () => {
      attendanceGeneration.current++;
    };
    if (manager && tab === 'punching') void loadAttendance();
    return cancel;
  }, [loadAttendance, manager, tab]);
  const action = async (
    path: string,
    payload?: any,
    method: 'post' | 'patch' = 'post',
    message = 'HR changes saved.'
  ) => {
    if (working.current) return false;
    working.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiClient[method]('/hrms/' + path, payload, {
        headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
      });
      setNotice(message);
      setPreview(null);
      await load();
      if (manager && tab === 'punching') await loadAttendance();
      return true;
    } catch (err) {
      setError(messageFor(err));
      return false;
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const open = (config: HrForm) => {
    setError('');
    setNotice('');
    setForm(config);
  };
  const editStatutory = async (employee: any) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      const { data: profile } = await apiClient.get(`/hrms/employees/${employee.id}/statutory`, {
        headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
      });
      open({
        title: 'Statutory profile ' + employee.employeeCode,
        path: `employees/${employee.id}/statutory`,
        method: 'patch',
        initial: profile || { pfApplicable: false, esiApplicable: false },
        description: `Review applicability and identifiers. Blank identifiers retain existing values. ${
          profile
            ? ['panMasked', 'uanMasked', 'pfMasked', 'esiMasked']
                .map((key) => profile[key])
                .filter(Boolean)
                .join(' · ')
            : 'No reviewed profile yet.'
        } Rates come from configured salary components.`,
        fields: [
          { key: 'pfApplicable', label: 'PF applies', type: 'checkbox' },
          { key: 'esiApplicable', label: 'ESI applies', type: 'checkbox' },
          text('panNumber', 'PAN', 'text', false),
          text('uanNumber', 'UAN (12 digits)', 'text', false),
          text('pfNumber', 'PF account number', 'text', false),
          text('esiNumber', 'ESI number', 'text', false),
          {
            key: 'clearIdentifiers',
            label: 'Clear existing identifiers before applying new values',
            type: 'checkbox',
          },
          {
            key: 'reviewed',
            label: 'I reviewed this employee’s statutory applicability',
            type: 'checkbox',
            required: true,
          },
        ],
        prepare: ({ reviewed, clearIdentifiers, ...values }) => ({
          ...(clearIdentifiers
            ? { panNumber: null, uanNumber: null, pfNumber: null, esiNumber: null }
            : {}),
          ...values,
        }),
      });
    } catch (err) {
      setError(messageFor(err));
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const close = () => {
    if (!busy) setForm(null);
  };
  const save = async (values: Record<string, any>) => {
    if (!form) return false;
    const clean = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
    return action(form.path, form.prepare ? form.prepare(clean) : clean, form.method);
  };
  const tabs: [Tab, string][] = [
    ['overview', 'My HR'],
    ...(payroll ? ([['employees', 'Staff directory']] as [Tab, string][]) : []),
    ['punching', 'Attendance'],
    ['leaves', 'Leave'],
    ['payroll', payroll ? 'Payroll' : 'My payslips'],
    ...(manager ? ([['recruitment', 'Recruitment']] as [Tab, string][]) : []),
    ...(manager ? ([['joining', 'Joining & offers']] as [Tab, string][]) : []),
    ['exit', 'Exit & clearances'],
    ...(payroll ? ([['setup', 'HR setup']] as [Tab, string][]) : []),
  ];
  const s = data.setup,
    own = data.profile,
    active = own?.employmentStatus === 'ACTIVE';
  const employeeOptions = data.employees.map((e) => ({
    value: e.id,
    label: `${e.employeeCode} · ${name(e)}`,
  }));
  const createLeave = () =>
    open({
      title: 'Leave application',
      path: 'leaves/apply',
      description:
        'Your selected school policy controls chargeable dates, eligibility and accrual. Half days need one date and an AM or PM session. Required evidence must be verified before approval. Split requests at calendar-year boundaries.',
      preview: (v) => {
        const policy = data.leaveTypes.find((t) => t.id === v.leaveTypeId);
        if (!policy) return 'Choose a leave policy to review its rules.';
        const start = Date.parse(v.startDate),
          end = Date.parse(v.endDate);
        let count = 0;
        if (
          Number.isFinite(start) &&
          Number.isFinite(end) &&
          end >= start &&
          end - start <= 365 * 86400000
        ) {
          for (let t = start; t <= end; t += 86400000) {
            const date = new Date(t);
            if (policy.excludedDates?.includes(date.toISOString().slice(0, 10))) continue;
            if (
              policy.dayBasis === 'WORKING_DAYS' &&
              !(policy.workingWeekdays || [1, 2, 3, 4, 5]).includes(date.getUTCDay() || 7)
            )
              continue;
            count++;
          }
          if (v.isHalfDay) count = count && start === end ? 0.5 : 0;
        }
        return `${policy.name}: ${count} chargeable days. ${policy.accrualMethod === 'MONTHLY' ? 'Accrues after completed months' : 'Annual upfront grant'}; ${policy.daysPerYear} days/year. ${policy.requiresDocument ? `Evidence required from ${policy.documentAfterDays ?? 0.5} days.` : ''} The server validates the final charge and available balance.`;
      },
      fields: [
        select('leaveTypeId', 'Leave type', choices(data.leaveTypes)),
        text('startDate', 'Start date', 'date'),
        text('endDate', 'End date', 'date'),
        { key: 'isHalfDay', label: 'Half day', type: 'checkbox' },
        {
          ...select('halfDaySession', 'Half-day session', opts(['AM', 'PM'])),
          when: { field: 'isHalfDay', equals: true },
        },
        text('reason', 'Reason', 'textarea'),
        text('documentUrl', 'Document link (HTTPS)', 'url', false),
      ],
      prepare: (v) => {
        const { halfDaySession, documentUrl, ...rest } = v;
        return {
          ...rest,
          ...(v.isHalfDay ? { halfDaySession } : {}),
          ...(documentUrl ? { documentUrl } : {}),
        };
      },
    });
  const correction = () =>
    open({
      title: 'Attendance correction',
      path: 'attendance/corrections',
      description:
        'A manager records a reviewed correction with a reason. Processed payroll dates are locked.',
      initial: { date: attendanceDate },
      fields: [
        select(
          'employeeId',
          'Employee',
          employeeOptions.filter((o) => o.value !== own?.id)
        ),
        text('date', 'Attendance date', 'date'),
        select('status', 'Attendance status', opts(['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT'])),
        text('timeIn', 'Check-in time', 'time', false),
        text('timeOut', 'Checkout time', 'time', false),
        { ...amount('breakMinutes', 'Unpaid break minutes'), required: false, max: 720, step: 1 },
        text('reason', 'Correction reason', 'textarea'),
      ],
    });
  const previewPayload = () => ({
    ...period,
    workingDates: workingDates.split(/[\s,]+/).filter(Boolean),
  });
  async function payrollPreview() {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    setPreview(null);
    try {
      setPreview((await apiClient.post('/hrms/payroll/preview', previewPayload())).data);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  async function download(id: string) {
    try {
      const response = await apiClient.get('/hrms/payroll/payslips/' + id + '/download', {
        headers: tenantId ? { 'x-tenant-id': tenantId } : undefined,
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data),
        a = document.createElement('a');
      a.href = url;
      a.download = 'payslip.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(messageFor(err));
    }
  }
  function setWeekdays() {
    const dates: string[] = [];
    for (let day = 1; day <= new Date(period.year, period.month, 0).getDate(); day++) {
      const date = new Date(Date.UTC(period.year, period.month - 1, day));
      if (![0, 6].includes(date.getUTCDay())) dates.push(date.toISOString().slice(0, 10));
    }
    setWorkingDates(dates.join('\n'));
    setPreview(null);
  }
  const empty = (rows: any[], label: string) => !rows.length && <EmptyState title={label} />;
  async function toggleTask(id: string, checked: boolean) {
    if (working.current) return;
    const previous = data.offers;
    setData((current) => ({
      ...current,
      offers: current.offers.map((offer) => ({
        ...offer,
        joiningTasks: offer.joiningTasks.map((task: any) =>
          task.id === id ? { ...task, isCompleted: checked } : task
        ),
      })),
    }));
    if (!(await action(`onboarding/tasks/${id}`, { isCompleted: checked }, 'patch')))
      setData((current) => ({ ...current, offers: previous }));
  }
  return (
    <div className="content-stack">
      <PageHeading
        eyebrow="SCHOOL WORKFORCE"
        title="HR, Attendance & Payroll"
        description="School staff, personal attendance, leave, reviewed payroll and joining/exit records."
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={loading || busy}
            leftIcon={<RefreshCw size={15} />}
            onClick={() => void load()}
          >
            Refresh HR
          </Button>
        }
      />
      {error && !form && (
        <div className="state-box" role="alert">
          {error}
          <Button
            size="sm"
            variant="outline"
            disabled={busy || loading}
            onClick={() => void load()}
          >
            Retry HR load
          </Button>
        </div>
      )}
      {notice && (
        <div className="state-box success" role="status">
          {notice}
        </div>
      )}
      <nav className="section-tabs" aria-label="HR sections">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            className={tab === key ? 'selected' : ''}
            disabled={busy}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {loading ? (
        <p role="status">Loading HR records…</p>
      ) : (
        <>
          {!own && (
            <div className="state-box">
              <p>
                Your login is not linked to an HR employee. Management can link your account in the
                school staff directory, then sync staff in HR setup.
              </p>
              {manager && (
                <Button size="sm" onClick={() => setTab('setup')}>
                  Open HR setup
                </Button>
              )}
            </div>
          )}
          {tab === 'overview' && (
            <>
              {manager && data.overview && (
                <div className="stats-grid">
                  <StatCard
                    label="HR employees"
                    value={data.overview.stats.totalEmployees}
                    note={`${data.overview.stats.staffCount} active school staff`}
                    icon={Users}
                  />
                  <StatCard
                    label="Pending leave"
                    value={data.overview.stats.pendingLeaves}
                    note="Awaiting a manager decision"
                    icon={CalendarDays}
                  />
                  <StatCard
                    label="Pending exits"
                    value={data.overview.stats.pendingResignations}
                    note="Resignation reviews"
                    icon={Clock}
                  />
                </div>
              )}
              <Panel title="My employment">
                <div className="panel-body space-y-3">
                  {own ? (
                    <>
                      <p className="font-semibold">
                        {own.employeeCode} · {name(own)}
                      </p>
                      <p>
                        {own.department?.name || 'Department pending'} ·{' '}
                        {own.designation?.title || 'Designation pending'}
                      </p>
                      <StatusPill value={own.employmentStatus} />
                      <p>Joined {dateLabel(own.joiningDate)}</p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={!active || busy}
                          onClick={() =>
                            open({
                              title: 'Attendance punch',
                              path: 'punch',
                              fields: [
                                select(
                                  'punchType',
                                  'Punch type',
                                  opts(['CHECK_IN', 'BREAK_OUT', 'BREAK_IN', 'CHECK_OUT'])
                                ),
                              ],
                            })
                          }
                        >
                          Punch attendance
                        </Button>
                        <Button
                          disabled={!active || busy || !data.leaveTypes.length}
                          variant="outline"
                          onClick={createLeave}
                        >
                          Apply leave
                        </Button>
                      </div>
                      <p className="muted">
                        Live accrual includes pending reservations and capped carry-forward.
                        Applying leave records the current entitlement.
                      </p>
                      {data.leaveBalances.map((b: any) => (
                        <p key={b.leaveTypeId}>
                          {b.year} · {b.leaveType.name}:{' '}
                          {b.allocatedDays - b.usedDays - b.pendingDays} available, {b.usedDays}{' '}
                          used, {b.pendingDays} pending
                        </p>
                      ))}
                    </>
                  ) : (
                    <p>No linked employee record.</p>
                  )}
                </div>
              </Panel>
            </>
          )}
          {tab === 'employees' && (
            <Panel
              title="School staff and HR links"
              subtitle="Sync after changing school staff or linked login accounts."
            >
              <div className="panel-body">
                <div className="flex gap-3 mb-4 flex-wrap">
                  <Link className="panel-link" href="/school/staff">
                    Manage school staff & accounts
                  </Link>
                  {manager && (
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void action(
                          'employees/sync',
                          {},
                          'post',
                          'School staff synchronized with HR.'
                        )
                      }
                    >
                      Sync school staff
                    </Button>
                  )}
                </div>
                {empty(data.employees, 'No HR employees yet')}
                {data.employees.map((e) => (
                  <div key={e.id} className="border rounded-xl p-4 mb-3 space-y-3">
                    <p className="font-semibold">
                      {e.employeeCode} · {name(e)} <StatusPill value={e.employmentStatus} />
                    </p>
                    <p>
                      {e.department?.name || 'Department pending'} ·{' '}
                      {e.designation?.title || 'Designation pending'} ·{' '}
                      {e.userId
                        ? 'School account linked'
                        : 'Link a login in the school staff directory'}
                    </p>
                    <p>
                      {e.currentSalary
                        ? `Current salary: ${e.currentSalary.structure.name}, base ${rupees(e.currentSalary.baseMonthlySalary)}, effective ${dateLabel(e.currentSalary.effectiveFrom)}`
                        : 'Salary assignment missing'}
                    </p>
                    {!!e.salaryAssignments.length && (
                      <details>
                        <summary>Salary revision history</summary>
                        {e.salaryAssignments.map((a: any) => (
                          <div key={a.id}>
                            <p>
                              {a.structure.name}: base {rupees(a.baseMonthlySalary)},{' '}
                              {dateLabel(a.effectiveFrom)} –{' '}
                              {a.effectiveTo ? dateLabel(a.effectiveTo) : 'ongoing'}
                              {a.id === e.currentSalary?.id ? ' · current' : ''}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy || e.userId === user?.id}
                              onClick={() =>
                                open({
                                  title: 'Withdraw unused salary revision',
                                  path: `salary-assignments/${a.id}/withdraw`,
                                  description:
                                    'Only revisions outside prepared or approved payroll can be withdrawn. The reason and original terms remain in the audit trail. You can then assign corrected terms.',
                                  fields: [text('reason', 'Reason for withdrawing', 'textarea')],
                                })
                              }
                            >
                              Withdraw salary revision {e.employeeCode} {dateLabel(a.effectiveFrom)}
                            </Button>
                          </div>
                        ))}
                      </details>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || e.userId === user?.id}
                        onClick={() => void editStatutory(e)}
                      >
                        Statutory profile {e.employeeCode}
                      </Button>
                      {manager && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            open({
                              title: 'Employee configuration',
                              path: `employees/${e.id}`,
                              method: 'patch',
                              initial: e,
                              fields: [
                                select(
                                  'departmentId',
                                  'HR department',
                                  choices(s.departments),
                                  false
                                ),
                                select(
                                  'designationId',
                                  'Designation',
                                  choices(s.designations, 'title'),
                                  false
                                ),
                                select('gradeId', 'Grade', choices(s.grades), false),
                              ],
                            })
                          }
                        >
                          Configure {e.employeeCode}
                        </Button>
                      )}
                      {manager && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || !s.shifts.length}
                          onClick={() =>
                            open({
                              title: 'Shift assignment',
                              path: `employees/${e.id}/shifts`,
                              fields: [
                                select('shiftId', 'Shift', choices(s.shifts)),
                                text('effectiveFrom', 'Effective from', 'date'),
                                text('effectiveTo', 'Effective to', 'date', false),
                              ],
                            })
                          }
                        >
                          Assign shift {e.employeeCode}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || !s.structures.length}
                        onClick={() =>
                          open({
                            title: 'Salary assignment',
                            path: `employees/${e.id}/salary`,
                            fields: [
                              select('structureId', 'Salary structure', choices(s.structures)),
                              amount('baseMonthlySalary', 'Base monthly salary (INR)', 0.01),
                              text('effectiveFrom', 'Effective from', 'date'),
                            ],
                          })
                        }
                      >
                        Assign salary {e.employeeCode}
                      </Button>
                    </div>
                    {e.shiftAssignments.map((a: any) => (
                      <div key={a.id} className="flex gap-3 flex-wrap items-center">
                        <p>
                          {a.shift.name}: {dateLabel(a.effectiveFrom)} –{' '}
                          {a.effectiveTo ? dateLabel(a.effectiveTo) : 'ongoing'}
                        </p>
                        {manager && !a.effectiveTo && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              open({
                                title: 'End shift assignment',
                                path: `shift-assignments/${a.id}/end`,
                                method: 'patch',
                                fields: [text('effectiveTo', 'Last shift date', 'date')],
                              })
                            }
                          >
                            End assignment
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Panel>
          )}
          {tab === 'punching' && (
            <>
              <Panel title={manager ? 'Today’s staff punches' : 'My punches today'}>
                <div className="panel-body">
                  <Button
                    disabled={!active || busy}
                    onClick={() =>
                      open({
                        title: 'Attendance punch',
                        path: 'punch',
                        fields: [
                          select(
                            'punchType',
                            'Punch type',
                            opts(['CHECK_IN', 'BREAK_OUT', 'BREAK_IN', 'CHECK_OUT'])
                          ),
                        ],
                      })
                    }
                  >
                    Punch attendance
                  </Button>
                  {empty(data.punches, 'No punches today')}
                  {data.punches.map((p) => (
                    <div className="border-b py-3" key={p.id}>
                      {name(p.employee)} · {p.punchType.replaceAll('_', ' ')} ·{' '}
                      {new Date(p.punchTime).toLocaleTimeString('en-IN')} · {p.verificationMode}
                    </div>
                  ))}
                  <p className="muted mt-4">
                    Web punches use server time and your school’s timezone. A daytime shift is
                    required. Biometric hardware ingestion is not connected.
                  </p>
                </div>
              </Panel>
              {manager && (
                <Panel title="Reviewed daily attendance">
                  <div className="panel-body space-y-3">
                    <label className="field">
                      Attendance date
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => {
                          setAttendanceDate(e.target.value);
                        }}
                      />
                    </label>
                    <Button disabled={busy || !data.employees.length} onClick={correction}>
                      Correct attendance
                    </Button>
                    {empty(attendance, 'No attendance recorded for this date')}
                    {attendance.map((a) => (
                      <p key={a.id}>
                        {a.staff.staffNumber} · {name(a.staff)} · {a.status} · {a.totalWorkMinutes}{' '}
                        minutes{a.isRegularized ? ' · reviewed correction' : ''}
                      </p>
                    ))}
                  </div>
                </Panel>
              )}
            </>
          )}
          {tab === 'leaves' && (
            <Panel title={manager ? 'Staff leave requests' : 'My leave requests'}>
              <div className="panel-body">
                <Button disabled={!active || busy || !data.leaveTypes.length} onClick={createLeave}>
                  Apply leave
                </Button>
                {manager && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      open({
                        title: 'Accrue staff leave balances',
                        path: 'leaves/balances/accrue',
                        description:
                          'Records earned entitlement through today in the school timezone. Repeating accrual does not grant additional days. Prior-year pending leave must be resolved before carry-forward.',
                        initial: { year: periodYear },
                        fields: [
                          select('employeeId', 'Employee', employeeOptions),
                          { ...amount('year', 'Leave year'), min: 2000, max: 2200, step: 1 },
                        ],
                      })
                    }
                  >
                    Accrue staff leave balances
                  </Button>
                )}
                {own && (
                  <div className="state-box mt-3 space-y-2">
                    {data.leaveBalances.map((b: any) => (
                      <p key={b.leaveTypeId}>
                        {b.year} · {b.leaveType.name}: {b.availableDays} available, {b.accruedDays}{' '}
                        accrued, {b.carriedDays} carried, {b.usedDays} used, {b.pendingDays} pending
                      </p>
                    ))}
                  </div>
                )}
                {!data.leaveTypes.length && (
                  <p className="muted mt-3">
                    Management must create leave types in HR setup before applications can be
                    submitted.
                  </p>
                )}
                {empty(data.leaves, 'No leave requests')}
                {data.leaves.map((l) => (
                  <div className="border rounded-xl p-4 mt-3 space-y-2" key={l.id}>
                    <p className="font-semibold">
                      {name(l.employee)} · {l.leaveType.name} · {l.numberOfDays} days{' '}
                      <StatusPill value={l.status} />
                    </p>
                    <p>
                      {dateLabel(l.startDate)} – {dateLabel(l.endDate)}
                      {l.isHalfDay
                        ? ` · Half day ${l.halfDaySession || '(legacy session unrecorded)'}`
                        : ''}
                    </p>
                    <p>{l.reason}</p>
                    {l.documentUrl && (
                      <a
                        className="panel-link"
                        href={l.documentUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Review document
                      </a>
                    )}
                    {(l.documentUrl || l.leaveType.requiresDocument) && (
                      <p>
                        Document: {l.documentStatus || 'PENDING'}
                        {l.documentRemarks ? ` · ${l.documentRemarks}` : ''}
                      </p>
                    )}
                    {l.status === 'PENDING' && l.employeeId === own?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          open({
                            title: 'Replace leave document',
                            path: `leaves/requests/${l.id}/document`,
                            method: 'patch',
                            description:
                              'Replacing evidence resets verification. A manager must inspect and verify the new document.',
                            fields: [
                              text('documentUrl', 'Supporting document link (HTTPS)', 'url'),
                            ],
                            initial: { documentUrl: l.documentUrl || '' },
                          })
                        }
                      >
                        Replace leave document {l.employee.employeeCode}
                      </Button>
                    )}
                    {manager &&
                      l.status === 'PENDING' &&
                      l.employeeId !== own?.id &&
                      l.documentUrl &&
                      l.documentStatus === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            open({
                              title: 'Review leave document',
                              path: `leaves/requests/${l.id}/document-review`,
                              method: 'patch',
                              description:
                                'Open the supporting document and inspect it before recording your decision. Verification is a manual school review.',
                              fields: [
                                select(
                                  'status',
                                  'Document decision',
                                  opts(['VERIFIED', 'REJECTED'])
                                ),
                                text('remarks', 'Verification findings', 'textarea'),
                              ],
                            })
                          }
                        >
                          Review leave document {l.employee.employeeCode}
                        </Button>
                      )}
                    {manager && l.status === 'PENDING' && l.employeeId !== own?.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={
                            busy ||
                            ((!!l.documentUrl ||
                              (l.leaveType.requiresDocument &&
                                l.numberOfDays >= (l.leaveType.documentAfterDays ?? 0.5))) &&
                              l.documentStatus !== 'VERIFIED')
                          }
                          onClick={() =>
                            void action(
                              `leaves/requests/${l.id}/review`,
                              { status: 'APPROVED' },
                              'patch'
                            )
                          }
                        >
                          Approve leave {l.employee.employeeCode}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void action(
                              `leaves/requests/${l.id}/review`,
                              { status: 'REJECTED' },
                              'patch'
                            )
                          }
                        >
                          Reject leave {l.employee.employeeCode}
                        </Button>
                      </div>
                    )}
                    {((l.status === 'PENDING' && (manager || l.employeeId === own?.id)) ||
                      (manager && l.status === 'APPROVED' && l.employeeId !== own?.id)) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          open({
                            title: 'Cancel leave',
                            path: `leaves/requests/${l.id}/cancel`,
                            description:
                              'Cancellation releases the reserved or used balance. Processed payroll periods remain locked.',
                            fields: [text('reason', 'Cancellation reason', 'textarea')],
                          })
                        }
                      >
                        Cancel leave {l.employee.employeeCode}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}
          {tab === 'payroll' && (
            <>
              <Panel title={payroll ? 'Reviewed monthly payroll' : 'My approved payslips'}>
                <div className="panel-body space-y-4">
                  <div className="form-grid">
                    <label className="field">
                      Payroll year
                      <input
                        type="number"
                        min={2000}
                        max={2200}
                        value={period.year}
                        onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
                      />
                    </label>
                    <label className="field">
                      Payroll month
                      <select
                        value={period.month}
                        onChange={(e) =>
                          setPeriod((p) => ({ ...p, month: Number(e.target.value) }))
                        }
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2026, i, 1).toLocaleString('en-IN', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {payroll && (
                    <>
                      <p className="muted">
                        After the month ends, review school working dates, salary structures and
                        attendance. Missing assignments, unresolved leave and incomplete attendance
                        block the draft. Configured components determine deductions; rates are not
                        supplied automatically.
                      </p>
                      <Button variant="outline" size="sm" onClick={setWeekdays}>
                        Fill Monday–Friday dates
                      </Button>
                      <label className="field">
                        Reviewed working dates (YYYY-MM-DD, one per line)
                        <textarea
                          rows={5}
                          value={workingDates}
                          onChange={(e) => {
                            setWorkingDates(e.target.value);
                            setPreview(null);
                          }}
                        />
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          disabled={
                            busy ||
                            !workingDates.trim() ||
                            data.periods.some((p) => p.status === 'LOCKED' || p.runs.length > 0)
                          }
                          onClick={() => void payrollPreview()}
                        >
                          Preview payroll
                        </Button>
                        <Button
                          disabled={
                            busy ||
                            !preview ||
                            preview.issues.length > 0 ||
                            data.periods.some((p) => p.status === 'LOCKED' || p.runs.length > 0)
                          }
                          onClick={() =>
                            void action(
                              'payroll/generate',
                              previewPayload(),
                              'post',
                              'Draft payroll created. A manager can review and approve it.'
                            )
                          }
                        >
                          Create draft payroll
                        </Button>
                      </div>
                      {preview && (
                        <div role="status" className="state-box">
                          <p>
                            {preview.slips.length} eligible payslips · Net{' '}
                            {rupees(preview.totalNet)}
                          </p>
                          {preview.issues.map((issue: string) => (
                            <p key={issue}>{issue}</p>
                          ))}
                          {preview.settledEmployees?.map((employee: any) => (
                            <p key={employee.employeeId}>
                              {employee.employeeCode}: excluded because finalized settlement already
                              includes final-month salary.
                            </p>
                          ))}
                          {preview.slips.map((p: any) => (
                            <p key={p.employeeId}>
                              {p.employeeCode}: {p.workedDays} paid days, {p.lossOfPayDays} unpaid
                              days, net {rupees(p.netSalary)}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Panel>
              <Panel title="Payslips">
                <div className="panel-body">
                  {payroll &&
                    data.periods.map((p) => (
                      <div key={p.id} className="border rounded-xl p-3 mb-3">
                        <p>
                          Payroll period {p.month}/{p.year}: <StatusPill value={p.status} />
                        </p>
                        <p className="muted">
                          {p.status === 'LOCKED'
                            ? 'Approved payroll is locked.'
                            : p.runs.length
                              ? 'Draft payroll freezes period inputs. Discard the draft to correct and rebuild.'
                              : 'Open for payroll preparation.'}
                        </p>
                        {p.runs
                          .filter((r: any) => r.status === 'DRAFT')
                          .map((r: any) => (
                            <Button
                              key={r.id}
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                open({
                                  title: 'Discard payroll draft',
                                  path: `payroll/runs/${r.id}/discard`,
                                  description:
                                    'Removes this draft and its draft payslips, retains the audit trail, and allows corrections before regeneration. Approved payroll cannot be discarded.',
                                  fields: [text('reason', 'Reason for discarding', 'textarea')],
                                })
                              }
                            >
                              Discard draft payroll
                            </Button>
                          ))}
                      </div>
                    ))}
                  {empty(data.payslips, 'No payslips for this period')}
                  {manager &&
                    Array.from(
                      new Set(
                        data.payslips.filter((p) => p.run?.status === 'DRAFT').map((p) => p.runId)
                      )
                    ).map((id) => (
                      <Button
                        key={id}
                        disabled={
                          busy ||
                          data.payslips.some(
                            (p) => p.runId === id && p.run?.preparedBy === user?.id
                          )
                        }
                        onClick={() =>
                          open({
                            title: 'Payroll approval',
                            path: `payroll/runs/${id}/approve`,
                            description:
                              'A manager other than the preparer must review the amounts. Approval releases payslips and locks the period.',
                            fields: [
                              {
                                key: 'reviewed',
                                label:
                                  'I have reviewed the payroll amounts and configured deductions',
                                type: 'checkbox',
                                required: true,
                              },
                            ],
                            prepare: () => ({}),
                          })
                        }
                      >
                        Review and approve payroll
                      </Button>
                    ))}
                  {data.payslips.map((p) => (
                    <div className="border rounded-xl p-4 mt-3 space-y-2" key={p.id}>
                      <p className="font-semibold">
                        {name(p.employee)} · {p.month}/{p.year} <StatusPill value={p.status} />
                      </p>
                      <p>
                        Paid days {p.workedDays} · Unpaid {p.lossOfPayDays} · Gross{' '}
                        {rupees(p.grossSalary)} · Deductions {rupees(p.totalDeductions)} · Net{' '}
                        {rupees(p.netSalary)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Download size={15} />}
                        onClick={() => void download(p.id)}
                      >
                        Download payslip {p.employee.employeeCode}
                      </Button>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
          {tab === 'recruitment' && manager && (
            <RecruitmentWorkspace
              data={data.recruitment}
              departments={s.departments}
              busy={busy}
              open={open}
              joining={() => setTab('joining')}
              offer={(candidate) => {
                const config = existingOfferForm(s, {
                  id: '',
                  candidateId: candidate.id,
                  candidateName: candidate.name,
                  candidateEmail: candidate.email,
                  candidatePhone: candidate.phone,
                  designationTitle: candidate.vacancy.title,
                  departmentId: candidate.vacancy.departmentId,
                  joiningDate: '',
                });
                open({
                  ...config,
                  title: 'Offer selected candidate',
                  path: 'onboarding/offers',
                  method: 'post',
                  description:
                    'Candidate identity and department must match this application. The offer reserves one vacancy position. Complete the checklist in Joining & offers to hire.',
                });
              }}
            />
          )}
          {tab === 'joining' && (
            <Panel title="Offers and joining checklist">
              <div className="panel-body">
                <p className="muted mb-3">
                  Complete the checklist, then create a school login during joining or select a
                  matching active login. Use Recruitment to track vacancy applications, interviews
                  and selection before making an offer.
                </p>
                <Button
                  disabled={busy || !s.departments.length || !s.structures.length}
                  onClick={() =>
                    open({
                      title: 'Staff offer',
                      path: 'onboarding/offers',
                      fields: [
                        text('candidateName', 'Candidate name'),
                        text('candidateEmail', 'Candidate email', 'email'),
                        text('candidatePhone', 'Candidate phone'),
                        text('designationTitle', 'Designation title'),
                        text('joiningDate', 'Joining date', 'date'),
                        amount('offeredCtcMonthly', 'Base monthly salary offered (INR)', 0.01),
                        select('departmentId', 'HR department', choices(s.departments)),
                        select('structureId', 'Salary structure', choices(s.structures)),
                        select(
                          'schoolDepartment',
                          'School department',
                          opts([
                            'TEACHING',
                            'ADMINISTRATION',
                            'FINANCE',
                            'LIBRARY',
                            'TRANSPORT',
                            'MAINTENANCE',
                            'SECURITY',
                            'IT',
                            'OTHER',
                          ])
                        ),
                        select(
                          'accountRole',
                          'School account role',
                          opts([
                            'TEACHER',
                            'CLASS_TEACHER',
                            'ACCOUNTANT',
                            'LIBRARIAN',
                            'TRANSPORT_OFFICER',
                            'RECEPTIONIST',
                            'SCHOOL_ADMIN',
                          ])
                        ),
                      ],
                    })
                  }
                >
                  New staff offer
                </Button>
                {(!s.departments.length || !s.structures.length) && (
                  <p className="muted">
                    Configure departments, salary components and structures in HR setup first.
                  </p>
                )}
                {empty(data.offers, 'No staff offers')}
                {data.offers.map((o) => (
                  <div key={o.id} className="border rounded-xl p-4 mt-3 space-y-3">
                    <p className="font-semibold">
                      {o.candidateName} · {o.designationTitle} <StatusPill value={o.status} />
                    </p>
                    <p>
                      {o.candidateEmail} · {dateLabel(o.joiningDate)} · Base{' '}
                      {rupees(o.offeredCtcMonthly)}
                    </p>
                    {o.status === 'OFFERED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          open({
                            title: 'Close staff offer',
                            path: `onboarding/offers/${o.id}/decision`,
                            method: 'patch',
                            fields: [
                              select('status', 'Offer decision', opts(['DECLINED', 'WITHDRAWN'])),
                              text('reason', 'Offer decision reason', 'textarea'),
                            ],
                          })
                        }
                      >
                        Close offer {o.candidateName}
                      </Button>
                    )}
                    {o.decisionReason && <p>Decision: {o.decisionReason}</p>}
                    {o.status === 'OFFERED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => open(existingOfferForm(s, o))}
                      >
                        Configure offer {o.candidateName}
                      </Button>
                    )}
                    {o.joiningTasks.map((t: any) => (
                      <label className="flex gap-3" key={t.id}>
                        <input
                          type="checkbox"
                          disabled={busy || o.status !== 'OFFERED'}
                          checked={t.isCompleted}
                          onChange={(e) => void toggleTask(t.id, e.target.checked)}
                        />
                        {t.title}
                      </label>
                    ))}
                    {o.status === 'OFFERED' && (
                      <Button
                        size="sm"
                        disabled={
                          busy ||
                          !o.joiningTasks.length ||
                          o.joiningTasks.some((t: any) => !t.isCompleted)
                        }
                        onClick={() => open(joiningForm(o, s.accounts))}
                      >
                        Complete joining {o.candidateName}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}
          {tab === 'exit' && (
            <Panel title="Resignation and exit clearance">
              <div className="panel-body space-y-4">
                <Button
                  disabled={!active || busy}
                  variant="outline"
                  onClick={() =>
                    open({
                      title: 'My resignation',
                      path: 'exit/resignations',
                      fields: [
                        text('preferredExitDate', 'Preferred exit date', 'date'),
                        text('reason', 'Resignation reason', 'textarea'),
                      ],
                    })
                  }
                >
                  Submit my resignation
                </Button>
                {empty(data.resignations, 'No resignation cases')}
                {data.resignations.map((r) => (
                  <div key={r.id} className="border rounded-xl p-4 space-y-3">
                    <p className="font-semibold">
                      {name(r.employee)} <StatusPill value={r.status} />
                    </p>
                    <p>
                      {r.reason} · Requested exit {dateLabel(r.preferredExitDate)}
                      {r.approvedExitDate ? ` · Approved ${dateLabel(r.approvedExitDate)}` : ''}
                    </p>
                    {manager && r.status === 'SUBMITTED' && r.employeeId !== own?.id && (
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            open({
                              title: 'Resignation review',
                              path: `exit/resignations/${r.id}/review`,
                              method: 'patch',
                              initial: { approvedExitDate: r.preferredExitDate.slice(0, 10) },
                              fields: [
                                select('status', 'Decision', opts(['APPROVED', 'REJECTED'])),
                                text('approvedExitDate', 'Approved exit date', 'date', false),
                                text('reviewerRemarks', 'Review remarks', 'textarea', false),
                              ],
                            })
                          }
                        >
                          Review resignation
                        </Button>
                      </div>
                    )}
                    {r.clearances.map((c: any) => (
                      <div key={c.id} className="flex gap-3 items-center flex-wrap">
                        <p>
                          {c.department} · {c.status} · Dues {rupees(c.duesAmount)}
                        </p>
                        {r.status === 'APPROVED' &&
                          r.employeeId !== own?.id &&
                          (manager ||
                            (role === 'ACCOUNTANT' && c.department === 'ACCOUNTS') ||
                            (role === 'LIBRARIAN' && c.department === 'LIBRARY')) &&
                          !r.settlement?.finalizedBy &&
                          !r.completedAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                open({
                                  title: 'Department clearance',
                                  path: `exit/clearance/${c.id}`,
                                  method: 'patch',
                                  initial: { duesAmount: c.duesAmount },
                                  fields: [
                                    select(
                                      'status',
                                      'Clearance decision',
                                      opts(['CLEARED', 'DUES_PENDING'])
                                    ),
                                    amount('duesAmount', 'Outstanding dues (INR)'),
                                    text('remarks', 'Clearance remarks', 'textarea', false),
                                  ],
                                })
                              }
                            >
                              Review {c.department}
                            </Button>
                          )}
                      </div>
                    ))}
                    {payroll && r.status === 'APPROVED' && (
                      <>
                        <p>
                          Settlement:{' '}
                          {r.settlement
                            ? `${r.settlement.status}, net ${rupees(r.settlement.netSettlementAmount)}`
                            : 'Not prepared'}
                        </p>
                        {!r.settlement?.finalizedBy && !r.completedAt && (
                          <Button
                            size="sm"
                            disabled={
                              busy ||
                              r.clearances.length !== 4 ||
                              r.clearances.some(
                                (c: any) => c.status !== 'CLEARED' || c.duesAmount !== 0
                              )
                            }
                            onClick={() =>
                              open({
                                title: 'Final settlement',
                                path: `exit/resignations/${r.id}/settlement`,
                                description:
                                  'Record reviewed inputs in INR. Set earned salary to zero if approved final-month payroll includes it. A different manager completes the exit, letter and access revocation together. Preparing a staged legacy settlement returns it to review.',
                                initial: r.settlement
                                  ? {
                                      workingDaysInFinalMonth: r.settlement.workingDaysInFinalMonth,
                                      earnedSalary: r.settlement.earnedSalary,
                                      leaveEncashmentAmount: r.settlement.leaveEncashmentAmount,
                                      noticePayRecovery: r.settlement.noticePayRecovery,
                                    }
                                  : undefined,
                                fields: [
                                  amount('workingDaysInFinalMonth', 'Working days in final month'),
                                  amount('earnedSalary', 'Earned salary'),
                                  amount('leaveEncashmentAmount', 'Leave encashment'),
                                  amount('noticePayRecovery', 'Notice recovery'),
                                ],
                              })
                            }
                          >
                            Prepare final settlement
                          </Button>
                        )}
                        {manager &&
                          r.settlement?.status === 'CALCULATED' &&
                          r.settlement.preparedSnapshot?.preparationId && (
                            <Button
                              size="sm"
                              disabled={
                                busy ||
                                r.employeeId === own?.id ||
                                r.settlement.preparedBy === user?.id
                              }
                              onClick={() =>
                                open({
                                  title: 'Complete staff exit',
                                  path: `exit/resignations/${r.id}/complete`,
                                  description: `${name(r.employee)} · Approved exit ${dateLabel(r.approvedExitDate)}. Settlement net ${rupees(r.settlement.netSettlementAmount)}: earned salary ${rupees(r.settlement.earnedSalary)}, leave encashment ${rupees(r.settlement.leaveEncashmentAmount)}, notice recovery ${rupees(r.settlement.noticePayRecovery)}. One save locks the four reviewed clearances, finalizes these amounts, issues the letter, terminates employment and revokes access. Changed preparation requires a fresh review; failures roll back together.`,
                                  fields: [
                                    {
                                      ...text('referenceNumber', 'Relieving letter reference'),
                                      maxLength: 80,
                                    },
                                    {
                                      key: 'reviewed',
                                      label:
                                        'I reviewed settlement and clearances and approve account revocation',
                                      type: 'checkbox',
                                      required: true,
                                    },
                                  ],
                                  prepare: (v) => ({
                                    referenceNumber: v.referenceNumber,
                                    preparationId: r.settlement.preparedSnapshot?.preparationId,
                                  }),
                                })
                              }
                            >
                              Complete staff exit
                            </Button>
                          )}
                        {r.settlement &&
                          (r.settlement.status === 'FINALIZED' ||
                            !r.settlement.preparedSnapshot?.preparationId) &&
                          !r.completedAt && (
                            <p role="status">
                              Legacy staged settlement: prepare the reviewed amounts again before
                              atomic exit completion.
                            </p>
                          )}
                      </>
                    )}
                    {r.status === 'COMPLETED' && (
                      <p className="state-box">
                        Exit completed{r.completedAt ? ` on ${dateLabel(r.completedAt)}` : ''}.
                        Settlement and clearances are locked, the relieving letter is issued, and
                        account access is revoked.
                        {r.relievingLetter
                          ? ` Reference ${r.relievingLetter.referenceNumber}.`
                          : ''}
                      </p>
                    )}
                  </div>
                ))}
                {data.letters.map((l) => (
                  <div className="state-box" key={l.id}>
                    <p className="font-semibold">
                      {l.referenceNumber} · {dateLabel(l.issueDate)}
                    </p>
                    <p>{l.content}</p>
                    <p>Issued by {l.issuedBy}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          {tab === 'setup' && (
            <HRSetup
              setup={s}
              manager={manager}
              busy={busy}
              open={open}
              sync={() =>
                void action('employees/sync', {}, 'post', 'School staff synchronized with HR.')
              }
            />
          )}
        </>
      )}
      {form && <HRMSForm config={form} busy={busy} error={error} onSave={save} onClose={close} />}
    </div>
  );
}

function HRSetup({
  setup: s,
  manager,
  busy,
  open,
  sync,
}: {
  setup: any;
  manager: boolean;
  busy: boolean;
  open: (form: HrForm) => void;
  sync: () => void;
}) {
  const masters: { key: string; source: string; label: string; fields: HrField[] }[] = [
    {
      key: 'departments',
      source: 'departments',
      label: 'Departments',
      fields: [text('name', 'Department name'), text('code', 'Code', 'text', false)],
    },
    {
      key: 'designations',
      source: 'designations',
      label: 'Designations',
      fields: [text('title', 'Designation title'), text('code', 'Code', 'text', false)],
    },
    {
      key: 'grades',
      source: 'grades',
      label: 'Grades',
      fields: [text('name', 'Grade name'), text('code', 'Code', 'text', false)],
    },
    {
      key: 'shifts',
      source: 'shifts',
      label: 'Shifts',
      fields: [
        text('name', 'Shift name'),
        text('startTime', 'Start time', 'time'),
        text('endTime', 'End time', 'time'),
        { ...amount('graceMinutes', 'Grace minutes'), max: 120, step: 1 },
        { ...amount('halfDayMinutes', 'Half-day threshold minutes', 1), max: 720, step: 1 },
        {
          ...amount('fullDayMinutes', 'Full-day net work minutes', 1),
          max: 1440,
          step: 1,
          required: false,
        },
        { key: 'isDefault', label: 'Default daytime shift', type: 'checkbox' },
      ],
    },
    {
      key: 'leave-types',
      source: 'leaveTypes',
      label: 'Leave types',
      fields: [
        text('name', 'Leave type name'),
        text('code', 'Leave code'),
        { ...amount('daysPerYear', 'Annual leave entitlement'), max: 366, step: 0.5 },
        select('accrualMethod', 'Accrual method', opts(['ANNUAL_UPFRONT', 'MONTHLY'])),
        text('effectiveFrom', 'Policy effective from', 'date'),
        text('effectiveTo', 'Policy effective until (optional)', 'date', false),
        select('dayBasis', 'Chargeable day basis', opts(['CALENDAR', 'WORKING_DAYS'])),
        text('workingWeekdays', 'Working weekdays (1=Mon to 7=Sun, comma separated)'),
        text('excludedDates', 'Excluded dates (YYYY-MM-DD, comma separated)', 'textarea', false),
        { ...amount('carryForwardLimit', 'Carry-forward cap'), max: 366, step: 0.5 },
        { ...amount('waitingDays', 'Eligibility waiting days'), max: 366, step: 1 },
        { ...amount('minNoticeDays', 'Minimum notice days'), max: 366, step: 1 },
        {
          ...amount('maxDaysPerRequest', 'Maximum days per request'),
          min: 0.5,
          max: 366,
          step: 0.5,
        },
        {
          ...amount('documentAfterDays', 'Evidence required from days'),
          min: 0.5,
          max: 366,
          step: 0.5,
        },
        { key: 'prorateJoiningYear', label: 'Prorate joining-year entitlement', type: 'checkbox' },
        { key: 'allowBackdated', label: 'Allow backdated applications', type: 'checkbox' },
        { key: 'allowHalfDay', label: 'Allow AM/PM half days', type: 'checkbox' },
        { key: 'isPaid', label: 'Paid leave', type: 'checkbox' },
        { key: 'requiresDocument', label: 'Document required', type: 'checkbox' },
      ],
    },
    {
      key: 'salary-components',
      source: 'components',
      label: 'Salary components',
      fields: [
        text('name', 'Component name'),
        text('code', 'Component code'),
        select('type', 'Component type', opts(['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'])),
        select('calculationType', 'Calculation', opts(['BASE', 'FIXED', 'PERCENT_OF_BASIC'])),
        {
          key: 'percentage',
          label: 'Percentage (for percent of basic)',
          type: 'number',
          min: 0,
          max: 100,
          step: 0.0001,
        },
        { key: 'isStatutory', label: 'Reviewed statutory component', type: 'checkbox' },
        select('statutoryType', 'Statutory scheme', opts(['NONE', 'PF', 'ESI', 'OTHER']), false),
      ],
    },
  ];
  return (
    <div className="content-stack">
      <Panel title="HR setup order">
        <div className="panel-body space-y-3">
          <p>
            Link school staff to login accounts, sync the directory, configure shifts and leave
            types, then create salary components and structures. Assign an effective salary to each
            employee in Staff directory.
          </p>
          <p>
            Use BASIC / EARNING / BASE for the base salary component. Additional components use a
            fixed amount or percentage of basic. Statutory rates must be configured and reviewed by
            your payroll officer.
          </p>
          <div className="flex gap-3 flex-wrap">
            {manager && (
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  open({
                    title: 'School staff account',
                    path: 'accounts',
                    description:
                      'Create a school login with at least 12 characters, uppercase, lowercase, a number and a symbol. Share the temporary password securely; it must be changed at first sign-in.',
                    fields: [
                      text('firstName', 'First name'),
                      text('lastName', 'Last name'),
                      text('email', 'Account email', 'email'),
                      select(
                        'role',
                        'Staff account role',
                        opts([
                          'TEACHER',
                          'CLASS_TEACHER',
                          'ACCOUNTANT',
                          'LIBRARIAN',
                          'TRANSPORT_OFFICER',
                          'RECEPTIONIST',
                          'SCHOOL_ADMIN',
                        ])
                      ),
                      text('password', 'Temporary password (at least 12 characters)', 'password'),
                    ],
                  })
                }
              >
                Create school staff login
              </Button>
            )}
            <Link className="panel-link" href="/school/staff">
              School staff & linked accounts
            </Link>
            {manager && (
              <Button disabled={busy} onClick={sync}>
                Sync school staff
              </Button>
            )}
          </div>
        </div>
      </Panel>
      {masters
        .filter((m) => manager || m.key === 'salary-components')
        .map((m) => (
          <Panel key={m.key} title={m.label}>
            <div className="panel-body space-y-3">
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  open({
                    title: 'Add ' + m.label.toLowerCase(),
                    path: `masters/${m.key}`,
                    fields: m.fields,
                    initial:
                      m.key === 'leave-types'
                        ? {
                            accrualMethod: 'ANNUAL_UPFRONT',
                            effectiveFrom: `${new Date().getFullYear()}-01-01`,
                            dayBasis: 'CALENDAR',
                            workingWeekdays: '1,2,3,4,5',
                            excludedDates: '',
                            carryForwardLimit: 0,
                            waitingDays: 0,
                            minNoticeDays: 0,
                            maxDaysPerRequest: 366,
                            documentAfterDays: 0.5,
                            allowBackdated: true,
                            allowHalfDay: true,
                            isPaid: true,
                          }
                        : undefined,
                    description:
                      m.key === 'leave-types'
                        ? 'Monthly accrual credits completed calendar months and rounds down cumulatively to half days. Used policies are immutable; create a new policy for changes. Excluded dates apply to both calendar and working-day policies.'
                        : undefined,
                    prepare: (v) => ({
                      data:
                        m.key === 'leave-types'
                          ? {
                              ...v,
                              workingWeekdays: String(v.workingWeekdays)
                                .split(',')
                                .map((s) => Number(s.trim())),
                              excludedDates: String(v.excludedDates)
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            }
                          : v,
                    }),
                  })
                }
              >
                Add {m.label.toLowerCase()}
              </Button>
              {!s[m.source].length && (
                <p className="muted">No {m.label.toLowerCase()} configured.</p>
              )}
              {s[m.source].map((r: any) => (
                <div key={r.id} className="flex justify-between items-center gap-3 border-b py-3">
                  <p>
                    {r.name || r.title}
                    {r.code ? ` (${r.code})` : ''}
                    {r.startTime
                      ? ` · ${r.startTime}–${r.endTime}${r.isDefault ? ' · default' : ''}`
                      : ''}
                    {r.calculationType ? ` · ${r.type} · ${r.calculationType}` : ''}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      open({
                        title: 'Edit ' + (r.name || r.title),
                        path: `masters/${m.key}/${r.id}`,
                        method: 'patch',
                        fields: m.fields,
                        initial:
                          m.key === 'leave-types'
                            ? {
                                ...r,
                                effectiveFrom: r.effectiveFrom?.slice(0, 10) || '2000-01-01',
                                effectiveTo: r.effectiveTo?.slice(0, 10) || '',
                                workingWeekdays: r.workingWeekdays?.join(',') || '1,2,3,4,5',
                                excludedDates: r.excludedDates?.join(',') || '',
                              }
                            : r,
                        prepare: (v) => ({
                          data:
                            m.key === 'leave-types'
                              ? {
                                  ...v,
                                  workingWeekdays: String(v.workingWeekdays)
                                    .split(',')
                                    .map((s) => Number(s.trim())),
                                  excludedDates: String(v.excludedDates)
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                }
                              : v,
                        }),
                      })
                    }
                  >
                    Edit {r.name || r.title}
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      <Panel title="Salary structures">
        <div className="panel-body space-y-3">
          <Button
            size="sm"
            disabled={busy || !s.components.length}
            onClick={() =>
              open({
                title: 'Salary structure',
                path: 'payroll/structures',
                description:
                  'Select the components and enter monthly fixed amounts. BASE uses the employee’s base salary; percentage values come from the component master. Include BASIC.',
                fields: [
                  text('name', 'Structure name'),
                  ...s.components.flatMap((c: any) => [
                    {
                      key: 'include:' + c.id,
                      label: `Include ${c.name} (${c.code})`,
                      type: 'checkbox',
                    },
                    {
                      key: 'amount:' + c.id,
                      label: `Fixed amount for ${c.code} (INR)`,
                      type: 'number',
                      min: 0,
                      max: 10000000,
                      step: 0.01,
                    },
                  ]),
                ],
                prepare: (v) => ({
                  name: v.name,
                  components: s.components
                    .filter((c: any) => v['include:' + c.id])
                    .map((c: any) => ({
                      componentId: c.id,
                      amount: c.calculationType === 'FIXED' ? Number(v['amount:' + c.id] || 0) : 0,
                    })),
                }),
              })
            }
          >
            Add salary structure
          </Button>
          {s.structures.map((r: any) => (
            <div key={r.id} className="border rounded-xl p-4">
              <p className="font-semibold">{r.name}</p>
              {r.components.map((l: any) => (
                <p key={l.id}>
                  {l.component.code} · {l.component.type} · {l.component.calculationType}
                  {l.component.calculationType === 'FIXED'
                    ? ` · ${rupees(l.amount)}`
                    : l.component.calculationType === 'PERCENT_OF_BASIC'
                      ? ` · ${l.component.percentage}%`
                      : ''}
                </p>
              ))}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
