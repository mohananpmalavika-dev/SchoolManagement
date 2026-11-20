import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
const base = process.env.UI_BASE_URL || 'http://localhost:3157',
  output = new URL('../qa/hrms-repair/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true }),
  errors = [],
  checks = [];
const id = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
async function session(role, linked = true) {
  const user = {
    id: id(role === 'TEACHER' ? 1 : role === 'SCHOOL_ADMIN' ? 3 : 2),
    tenantId: id(100),
    firstName: 'School',
    lastName: role,
    role,
  };
  const staff = {
    id: id(10),
    userId: user.id,
    employeeCode: 'ST001',
    firstName: 'School',
    lastName: role,
    employmentStatus: 'ACTIVE',
    joiningDate: '2026-01-01',
    salaryAssignments: [],
    shiftAssignments: [],
    leaveBalances: [],
    department: { name: 'Teaching' },
    designation: { title: 'Teacher' },
  };
  const setup = {
    departments: [{ id: id(20), name: 'Teaching' }],
    designations: [],
    grades: [],
    shifts: [
      {
        id: id(21),
        name: 'School day',
        startTime: '09:00',
        endTime: '17:00',
        graceMinutes: 10,
        halfDayMinutes: 240,
        isDefault: true,
      },
    ],
    leaveTypes: [{ id: id(22), name: 'Personal leave', code: 'PL', isPaid: true, daysPerYear: 5 }],
    components: [
      {
        id: id(23),
        name: 'Basic salary',
        code: 'BASIC',
        type: 'EARNING',
        calculationType: 'BASE',
        isStatutory: false,
      },
    ],
    structures: [
      {
        id: id(24),
        name: 'School salary',
        components: [
          { id: id(25), component: { code: 'BASIC', type: 'EARNING', calculationType: 'BASE' } },
        ],
      },
    ],
    accounts: [
      {
        id: id(26),
        firstName: 'New',
        lastName: 'Teacher',
        email: 'candidate@example.test',
        role: 'TEACHER',
      },
    ],
  };
  const state = {
    employees: [
      staff,
      {
        ...staff,
        id: id(11),
        userId: id(29),
        employeeCode: 'ST002',
        currentSalary: {
          id: id(51),
          structure: { name: 'Current structure' },
          baseMonthlySalary: 40000,
          effectiveFrom: '2026-10-02',
        },
        salaryAssignments: [
          {
            id: id(52),
            structure: { name: 'Future structure' },
            baseMonthlySalary: 90000,
            effectiveFrom: '2027-01-01',
            effectiveTo: null,
          },
          {
            id: id(51),
            structure: { name: 'Current structure' },
            baseMonthlySalary: 40000,
            effectiveFrom: '2026-10-02',
            effectiveTo: '2026-12-31',
          },
        ],
      },
    ],
    punches: [],
    leaves: [],
    payslips: [],
    periods: [],
    statutory: { pfApplicable: false, esiApplicable: false, uanMasked: '********5678' },
    failStatutory: false,
    offers: [],
    recruitment: {
      vacancies: [],
      candidates: [],
      interviewers: [{ id: id(26), firstName: 'Panel', lastName: 'Teacher' }],
    },
    failRecruitment: false,
    resignations: [],
    letters: [],
    failPunch: false,
    failLeave: false,
    failLoad: false,
    failJoining: false,
    failExit: false,
    writes: [],
    reads: [],
    selectedTenants: [],
  };
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
  });
  await context.addInitScript(() => localStorage.setItem('accessToken', 'hrms-ui-fixture'));
  await context.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, ''),
      method = route.request().method();
    const ok = (data) => route.fulfill({ json: { success: true, data } }),
      bad = (message) =>
        route.fulfill({ status: 409, json: { success: false, error: { message } } });
    if (path === '/auth/me') return ok(user);
    if (path === '/preschool/navigation') return ok({ programme: 'STANDARD' });
    if (path === '/admin/schools')
      return ok([
        { id: id(100), name: 'School A', status: 'ACTIVE' },
        { id: id(101), name: 'School B', status: 'ACTIVE' },
      ]);
    if (!path.startsWith('/hrms/')) return ok([]);
    const endpoint = path.replace('/hrms/', '');
    if (path.startsWith('/hrms/'))
      state.selectedTenants.push(route.request().headers()['x-tenant-id']);
    if (method === 'GET') {
      state.reads.push(endpoint);
      if (state.failLoad && endpoint === 'leaves/requests')
        return bad('Leave records temporarily unavailable');
      if (endpoint === 'employees/me') return ok(linked ? staff : null);
      if (endpoint === 'overview')
        return ok({
          stats: {
            totalEmployees: state.employees.length,
            staffCount: 1,
            pendingLeaves: state.leaves.length,
            pendingResignations: 0,
          },
        });
      if (endpoint === 'employees') return ok(state.employees);
      if (endpoint === 'setup') return ok(setup);
      if (endpoint === 'leaves/types') return ok(setup.leaveTypes);
      if (endpoint === 'leaves/balances')
        return ok([
          {
            leaveTypeId: id(22),
            leaveType: setup.leaveTypes[0],
            year: 2026,
            accruedDays: 5,
            carriedDays: 1,
            allocatedDays: 6,
            availableDays: 6,
            usedDays: 0,
            pendingDays: 0,
          },
        ]);
      if (endpoint === 'punches/today') return ok(state.punches);
      if (endpoint === 'leaves/requests') return ok(state.leaves);
      if (endpoint === 'payroll/payslips') return ok(state.payslips);
      if (endpoint === 'payroll/periods') return ok(state.periods);
      if (endpoint.endsWith('/statutory')) return ok(state.statutory);
      if (endpoint.endsWith('/download'))
        return route.fulfill({ contentType: 'text/csv', body: 'Employee,ST001\nNet,30000' });
      if (endpoint === 'onboarding/offers') return ok(state.offers);
      if (endpoint === 'recruitment') return ok(state.recruitment);
      if (endpoint === 'exit/resignations') return ok(state.resignations);
      if (endpoint === 'exit/letters') return ok(state.letters);
      return ok([]);
    }
    const data = route.request().postDataJSON();
    state.writes.push({ endpoint, method, data });
    if (endpoint.startsWith('recruitment/')) {
      if (state.failRecruitment) return bad('Candidate already applied for this vacancy');
      if (endpoint === 'recruitment/vacancies')
        state.recruitment.vacancies.push({ id: id(700), ...data });
      if (endpoint === 'recruitment/candidates')
        state.recruitment.candidates.push({
          id: id(701),
          ...data,
          status: 'APPLIED',
          vacancy: state.recruitment.vacancies.find((v) => v.id === data.vacancyId),
          interviews: [],
        });
      const candidate = state.recruitment.candidates.find((c) => c.id === endpoint.split('/')[2]);
      if (endpoint.endsWith('/stage')) {
        candidate.status = data.status;
        candidate.decisionReason = data.reason;
      }
      if (endpoint.endsWith('/interviews')) {
        candidate.status = 'INTERVIEWING';
        candidate.interviews.push({
          id: id(702),
          ...data,
          interviewerName: 'Panel Teacher',
          status: 'SCHEDULED',
        });
      }
      if (endpoint.endsWith('/review'))
        Object.assign(
          state.recruitment.candidates
            .flatMap((c) => c.interviews)
            .find((i) => i.id === endpoint.split('/')[2]),
          data
        );
    }
    if (endpoint.startsWith('salary-assignments/') && endpoint.endsWith('/withdraw'))
      state.employees.forEach((employee) => {
        employee.salaryAssignments = employee.salaryAssignments.filter(
          (a) => a.id !== endpoint.split('/')[1]
        );
      });
    if (endpoint.endsWith('/statutory')) {
      if (state.failStatutory) return bad('Review the PF account number');
      state.statutory = {
        pfApplicable: data.pfApplicable,
        esiApplicable: data.esiApplicable,
        uanMasked: data.uanNumber
          ? '********' + data.uanNumber.slice(-4)
          : state.statutory.uanMasked,
      };
    }
    if (endpoint === 'punch') {
      if (state.failPunch) return bad('Finish your break before checkout');
      state.punches.push({
        id: id(40),
        punchType: data.punchType,
        punchTime: new Date().toISOString(),
        verificationMode: 'WEB_PORTAL',
        employee: staff,
      });
    }
    if (endpoint === 'leaves/apply') {
      if (state.failLeave) return bad('Insufficient available leave balance');
      state.leaves.push({
        id: id(41 + state.leaves.length * 100),
        employeeId: staff.id,
        employee: staff,
        leaveType: setup.leaveTypes[0],
        status: 'PENDING',
        ...data,
        numberOfDays: data.isHalfDay
          ? 0.5
          : Math.floor((Date.parse(data.endDate) - Date.parse(data.startDate)) / 86400000) + 1,
        documentStatus: data.documentUrl ? 'PENDING' : 'NOT_REQUIRED',
      });
    }
    if (endpoint === `leaves/requests/${id(41)}/cancel`) state.leaves[0].status = 'CANCELLED';
    if (endpoint.startsWith('leaves/requests/') && endpoint.endsWith('/document-review')) {
      const row = state.leaves.find((l) => l.id === endpoint.split('/')[2]);
      row.documentStatus = data.status;
      row.documentRemarks = data.remarks;
    }
    if (endpoint.startsWith('leaves/requests/') && endpoint.endsWith('/document')) {
      const row = state.leaves.find((l) => l.id === endpoint.split('/')[2]);
      row.documentUrl = data.documentUrl;
      row.documentStatus = 'PENDING';
      row.documentRemarks = null;
    }
    if (endpoint.startsWith('leaves/requests/') && endpoint.endsWith('/review'))
      state.leaves.find((l) => l.id === endpoint.split('/')[2]).status = data.status;
    if (endpoint === 'masters/departments') setup.departments.push({ id: id(42), ...data.data });
    if (endpoint === 'masters/leave-types') setup.leaveTypes.push({ id: id(60), ...data.data });
    if (endpoint === 'masters/shifts') setup.shifts.push({ id: id(43), ...data.data });
    if (endpoint.startsWith('exit/resignations/') && endpoint.endsWith('/settlement')) {
      const row = state.resignations.find((r) => r.id === endpoint.split('/')[2]);
      row.settlement = {
        id: id(75),
        ...data,
        status: 'CALCULATED',
        preparedBy: user.id,
        preparedSnapshot: { preparationId: randomUUID() },
        netSettlementAmount:
          data.earnedSalary + data.leaveEncashmentAmount - data.noticePayRecovery,
      };
    }
    if (endpoint.startsWith('exit/resignations/') && endpoint.endsWith('/complete')) {
      const current = state.resignations.find((r) => r.id === endpoint.split('/')[2]);
      if (data.preparationId !== current.settlement.preparedSnapshot?.preparationId)
        return bad('Settlement changed; review the current preparation');
      if (state.failExit) return bad('Account changed while revoking access; retry completion');
      const row = state.resignations.find((r) => r.id === endpoint.split('/')[2]);
      row.status = 'COMPLETED';
      row.completedAt = new Date().toISOString();
      row.settlement.status = 'FINALIZED';
      row.settlement.finalizedBy = user.id;
      row.clearances.forEach((c) => (c.lockedAt = row.completedAt));
      const letter = {
        id: id(76),
        referenceNumber: data.referenceNumber,
        resignationId: row.id,
        settlementId: row.settlement.id,
        issueDate: row.completedAt,
        content: 'Staff is relieved following approved resignation, clearances and settlement.',
        issuedBy: 'School reviewer',
      };
      state.letters.push(letter);
      row.relievingLetter = letter;
      return ok({ resignationId: row.id, status: 'COMPLETED', letter, accountRevoked: true });
    }
    if (endpoint === 'payroll/preview')
      return ok({
        issues: [],
        slips: [
          {
            employeeId: staff.id,
            employeeCode: 'ST001',
            workedDays: 2,
            lossOfPayDays: 0,
            netSalary: 30000,
          },
        ],
        totalNet: 30000,
      });
    if (endpoint === 'payroll/generate') {
      state.periods = [
        {
          id: id(50),
          year: data.year,
          month: data.month,
          status: 'OPEN',
          runs: [{ id: id(45), status: 'DRAFT' }],
        },
      ];
      state.payslips.push({
        id: id(44),
        runId: id(45),
        year: data.year,
        month: data.month,
        workedDays: 2,
        lossOfPayDays: 0,
        grossSalary: 30000,
        totalDeductions: 0,
        netSalary: 30000,
        status: 'DRAFT',
        run: { id: id(45), status: 'DRAFT', preparedBy: user.id },
        employee: staff,
      });
    }
    if (endpoint === `payroll/runs/${id(45)}/discard`) {
      state.payslips = [];
      state.periods[0].runs = [];
    }
    if (endpoint === `payroll/runs/${id(45)}/approve`) {
      state.periods.forEach((p) => {
        p.status = 'LOCKED';
        p.runs.forEach((r) => (r.status = 'APPROVED'));
      });
      state.payslips.forEach((p) => {
        p.status = 'APPROVED';
        p.run.status = 'APPROVED';
      });
    }
    if (endpoint === 'onboarding/offers')
      state.offers.push({
        id: id(46 + state.offers.length * 2),
        ...data,
        status: 'OFFERED',
        joiningTasks: [
          { id: id(47 + state.offers.length * 2), title: 'Verify joining', isCompleted: false },
        ],
      });
    if (endpoint.startsWith('onboarding/tasks/'))
      state.offers
        .flatMap((o) => o.joiningTasks)
        .find((t) => t.id === endpoint.split('/')[2]).isCompleted = data.isCompleted;
    if (endpoint.startsWith('onboarding/offers/') && endpoint.endsWith('/convert')) {
      if (state.failJoining) return bad('Existing staff identity conflicts with this offer');
      state.offers.find((o) => o.id === endpoint.split('/')[2]).status = 'JOINED';
    }
    return ok({});
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(120000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(
    base +
      (role === 'SUPER_ADMIN'
        ? '/admin/hrms'
        : role === 'TEACHER'
          ? '/teacher/hrms'
          : '/school/hrms')
  );
  if (role === 'SUPER_ADMIN') {
    await page.getByLabel('School workspace', { exact: true }).selectOption(id(100));
  }
  await page.getByRole('heading', { name: 'HR, Attendance & Payroll', exact: true }).waitFor();
  await page
    .getByRole('status')
    .filter({ hasText: 'Loading HR records' })
    .waitFor({ state: 'hidden' });
  return { context, page, state, staff, setup };
}
async function save(p) {
  const modal = p.getByRole('dialog');
  await modal.getByRole('button', { name: /^Save / }).click();
  await modal.waitFor({ state: 'hidden' });
}
try {
  const teacher = await session('TEACHER'),
    p = teacher.page,
    modal = p.getByRole('dialog');
  assert.equal(await p.getByRole('button', { name: 'HR setup', exact: true }).count(), 0);
  assert.equal(await p.getByRole('button', { name: 'Joining & offers', exact: true }).count(), 0);
  assert(!teacher.state.reads.includes('overview'));
  assert(!teacher.state.reads.includes('employees'));
  assert(!teacher.state.reads.includes('setup'));
  checks.push(
    'Teacher loads wrapped responses without crashing and requests only personal collections'
  );
  await p.getByRole('button', { name: 'Punch attendance', exact: true }).click();
  await modal.getByLabel('Punch type').selectOption('CHECK_IN');
  await save(p);
  assert(!('employeeId' in teacher.state.writes.at(-1).data));
  await p.getByRole('button', { name: 'Attendance', exact: true }).click();
  await p.getByText('CHECK IN', { exact: false }).waitFor();
  teacher.state.failPunch = true;
  await p.getByRole('button', { name: 'Punch attendance', exact: true }).click();
  await modal.getByLabel('Punch type').selectOption('CHECK_OUT');
  await modal.getByRole('button', { name: /^Save / }).click();
  await modal.getByRole('alert').filter({ hasText: 'Finish your break before checkout' }).waitFor();
  assert.equal(await modal.getByLabel('Punch type').inputValue(), 'CHECK_OUT');
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  checks.push(
    'Personal punching saves and rejected punches show the server error while retaining the form'
  );
  await p.getByRole('button', { name: 'Leave', exact: true }).click();
  await p.getByRole('button', { name: 'Apply leave', exact: true }).click();
  await modal.getByLabel('Leave type').selectOption(id(22));
  await modal.getByLabel('Start date').fill('2026-12-01');
  await modal.getByLabel('End date').fill('2026-12-02');
  await modal.getByLabel('Reason', { exact: false }).fill('Family event');
  teacher.state.failLeave = true;
  await modal.getByRole('button', { name: /^Save / }).click();
  await modal
    .getByRole('alert')
    .filter({ hasText: 'Insufficient available leave balance' })
    .waitFor();
  teacher.state.failLeave = false;
  await save(p);
  assert(!('numberOfDays' in teacher.state.writes.at(-1).data));
  assert.equal(teacher.state.leaves[0].numberOfDays, 2);
  await p.getByText('Family event', { exact: true }).waitFor();
  teacher.state.failLoad = true;
  await p.getByRole('button', { name: 'Refresh HR' }).click();
  await p.getByRole('alert').filter({ hasText: 'Leave records temporarily unavailable' }).waitFor();
  teacher.state.failLoad = false;
  await p.getByRole('button', { name: 'Retry HR load' }).click();
  await p
    .getByRole('alert')
    .filter({ hasText: 'Leave records temporarily unavailable' })
    .waitFor({ state: 'hidden' });
  checks.push(
    'Leave form calculates days, retains failed submissions and collection retry recovers'
  );
  await p.getByRole('button', { name: 'Cancel leave ST001', exact: true }).click();
  await p.getByRole('dialog').getByLabel('Cancellation reason').fill('Plans changed after booking');
  await save(p);
  assert.equal(teacher.state.leaves[0].status, 'CANCELLED');
  checks.push('Pending personal leave cancellation sends the reviewed reason to the API');
  await p.getByText('2026 · Personal leave: 6 available', { exact: false }).waitFor();
  await p.getByRole('button', { name: 'Apply leave', exact: true }).click();
  await modal.getByLabel('Leave type').selectOption(id(22));
  await modal.getByLabel('Start date').fill('2026-12-03');
  await modal.getByLabel('End date').fill('2026-12-03');
  assert.equal(await modal.getByLabel('Half-day session').count(), 0);
  await modal.getByLabel('Half day', { exact: true }).check();
  await modal.getByLabel('Half-day session').selectOption('PM');
  await modal.getByRole('status').filter({ hasText: '0.5 chargeable days' }).waitFor();
  await modal.getByLabel('Reason', { exact: false }).fill('Afternoon appointment');
  await modal.getByLabel('Document link (HTTPS)').fill('https://example.test/proof.pdf');
  await save(p);
  assert.equal(teacher.state.writes.at(-1).data.halfDaySession, 'PM');
  await p.getByRole('button', { name: 'Replace leave document ST001', exact: true }).click();
  await modal
    .getByLabel('Supporting document link (HTTPS)')
    .fill('https://example.test/replacement.pdf');
  await save(p);
  assert.equal(teacher.state.leaves[1].documentStatus, 'PENDING');
  assert.equal(teacher.state.leaves[1].documentUrl, 'https://example.test/replacement.pdf');
  checks.push(
    'Staff see live leave balances, choose half-day sessions and replace evidence for independent review'
  );
  await teacher.context.close();
  const recruiter = await session('PRINCIPAL'),
    rp = recruiter.page,
    rd = rp.getByRole('dialog');
  await rp.getByRole('button', { name: 'Recruitment', exact: true }).click();
  await rp.getByRole('button', { name: 'New vacancy', exact: true }).click();
  await rd.getByLabel('Job title').fill('Science teacher');
  await rd.getByLabel('HR department').selectOption(id(20));
  await rd.getByLabel('Job description').fill('Teach science and conduct practical lessons.');
  await rd.getByLabel('Vacancy status').selectOption('OPEN');
  await save(rp);
  await rp.getByRole('button', { name: 'Add candidate', exact: true }).click();
  await rd.getByLabel('Vacancy').selectOption(id(700));
  await rd.getByLabel('Candidate name').fill('Recruitment Teacher');
  await rd.getByLabel('Candidate email').fill('recruitment@example.test');
  await rd.getByLabel('Candidate phone').fill('1234567890');
  recruiter.state.failRecruitment = true;
  await rd.getByRole('button', { name: /^Save / }).click();
  await rd.getByRole('alert').filter({ hasText: 'already applied' }).waitFor();
  assert.equal(await rd.getByLabel('Candidate name').inputValue(), 'Recruitment Teacher');
  recruiter.state.failRecruitment = false;
  await save(rp);
  for (const status of ['SCREENING', 'SHORTLISTED']) {
    await rp.getByRole('button', { name: 'Update stage Recruitment Teacher', exact: true }).click();
    await rd.getByLabel('Next stage').selectOption(status);
    await rd.getByLabel('Decision reason').fill('Meets role criteria');
    await save(rp);
  }
  await rp
    .getByRole('button', { name: 'Schedule interview Recruitment Teacher', exact: true })
    .click();
  await rd.getByLabel('Interview round').fill('Demo lesson');
  await rd.getByLabel('Interviewer').selectOption(id(26));
  await rd.getByLabel('Interview start').fill('2030-01-02T10:00');
  await rd.getByLabel('Interview end').fill('2030-01-02T11:00');
  await rd.getByLabel('Room or meeting link').fill('Science lab');
  await save(rp);
  assert(recruiter.state.writes.at(-1).data.startsAt.endsWith('Z'));
  await rp.getByRole('button', { name: 'Record outcome Demo lesson', exact: true }).click();
  await rd.getByLabel('Recommendation').selectOption('RECOMMENDED');
  await rd.getByLabel('Rating (1–5)').fill('4');
  await rd.getByLabel('Feedback or cancellation reason').fill('Strong science knowledge');
  await save(rp);
  await rp.getByRole('button', { name: 'Update stage Recruitment Teacher', exact: true }).click();
  await rd.getByLabel('Next stage').selectOption('SELECTED');
  await rd.getByLabel('Decision reason').fill('Panel recommended joining');
  await save(rp);
  await rp.getByRole('button', { name: 'Create offer Recruitment Teacher', exact: true }).click();
  assert.equal(await rd.getByLabel('Candidate email').inputValue(), 'recruitment@example.test');
  await rd.getByLabel('Joining date').fill('2030-02-01');
  await rd.getByLabel('Base monthly salary offered (INR)').fill('40000');
  await rd.getByLabel('Salary structure').selectOption(id(24));
  await rd.getByLabel('School department').selectOption('TEACHING');
  await rd.getByLabel('School account role').selectOption('TEACHER');
  await save(rp);
  assert.equal(recruiter.state.writes.at(-1).data.candidateId, id(701));
  await rp.getByLabel('Search candidates').fill('no such candidate');
  await rp.getByRole('heading', { name: 'No matching candidates' }).waitFor();
  await rp.getByLabel('Search candidates').fill('');
  for (const width of [1440, 390, 320]) {
    await rp.setViewportSize({ width, height: 1000 });
    assert(
      await rp.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Recruitment overflow at ' + width
    );
  }
  await rp.screenshot({
    path: fileURLToPath(new URL('hrms-recruitment-mobile.png', output)),
    fullPage: true,
  });
  await recruiter.context.close();
  checks.push(
    'Recruitment supports vacancy intake, recoverable application errors, candidate stages, timezone-safe interviews, feedback, linked offer forms, filtering and mobile layout'
  );
  const manager = await session('PRINCIPAL'),
    m = manager.page,
    dialog = m.getByRole('dialog');
  await m.getByRole('button', { name: 'HR setup', exact: true }).click();
  await m.getByRole('button', { name: 'Create school staff login', exact: true }).click();
  await dialog.getByLabel('First name').fill('New');
  await dialog.getByLabel('Last name').fill('Staff');
  await dialog.getByLabel('Account email').fill('new-staff@example.test');
  await dialog.getByLabel('Staff account role').selectOption('TEACHER');
  await dialog
    .getByLabel('Temporary password', { exact: false })
    .fill('Hr-' + randomUUID() + 'A1!');
  await save(m);
  assert.equal(manager.state.writes.at(-1).endpoint, 'accounts');
  checks.push('Managers can provision a school staff login through the HR setup form');
  await m.getByRole('button', { name: 'Add departments', exact: true }).click();
  await dialog.getByLabel('Department name').fill('Learning support');
  await save(m);
  await m.getByText('Learning support', { exact: true }).waitFor();
  await m.getByRole('button', { name: 'Add shifts', exact: true }).click();
  for (const [label, value] of [
    ['Shift name', 'Morning shift'],
    ['Start time', '08:00'],
    ['End time', '16:00'],
    ['Grace minutes', '10'],
    ['Half-day threshold minutes', '240'],
    ['Full-day net work minutes', '420'],
  ])
    await dialog.getByLabel(label).fill(value);
  await dialog.getByLabel('Default daytime shift').check();
  await save(m);
  assert.equal(manager.state.writes.at(-1).data.data.isDefault, true);
  await m.getByRole('button', { name: 'Sync school staff', exact: true }).click();
  await m.getByRole('status').filter({ hasText: 'synchronized' }).waitFor();
  checks.push(
    'HR setup creates persistent department/shift masters with boolean inputs and explicit staff sync'
  );
  await m.getByRole('button', { name: 'Add leave types', exact: true }).click();
  await dialog.getByLabel('Leave type name').fill('Monthly school leave');
  await dialog.getByLabel('Leave code').fill('ML');
  await dialog.getByLabel('Annual leave entitlement').fill('12');
  await dialog.getByLabel('Accrual method').selectOption('MONTHLY');
  await dialog.getByLabel('Chargeable day basis').selectOption('WORKING_DAYS');
  await dialog.getByLabel('Working weekdays').fill('1,2,3,4,5,6');
  await dialog.getByLabel('Excluded dates').fill('2026-12-25');
  await dialog.getByLabel('Carry-forward cap').fill('3');
  await dialog.getByLabel('Minimum notice days').fill('2');
  await dialog.getByLabel('Allow backdated applications').uncheck();
  await dialog.getByLabel('Document required', { exact: true }).check();
  await save(m);
  const savedPolicy = manager.state.writes.at(-1).data.data;
  assert.deepEqual(savedPolicy.workingWeekdays, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(savedPolicy.excludedDates, ['2026-12-25']);
  assert.equal(savedPolicy.carryForwardLimit, 3);
  assert.equal(savedPolicy.allowBackdated, false);
  manager.state.leaves.push({
    id: id(61),
    employeeId: id(11),
    employee: manager.state.employees[1],
    leaveType: { name: 'Medical leave', requiresDocument: true, documentAfterDays: 1 },
    startDate: '2026-12-08',
    endDate: '2026-12-08',
    numberOfDays: 1,
    status: 'PENDING',
    reason: 'Medical appointment',
    documentUrl: 'https://example.test/medical.pdf',
    documentStatus: 'PENDING',
  });
  await m.getByRole('button', { name: 'Refresh HR', exact: true }).click();
  await m.getByRole('button', { name: 'Leave', exact: true }).click();
  assert(await m.getByRole('button', { name: 'Approve leave ST002', exact: true }).isDisabled());
  await m.getByRole('button', { name: 'Review leave document ST002', exact: true }).click();
  await dialog.getByLabel('Document decision').selectOption('VERIFIED');
  await dialog.getByLabel('Verification findings').fill('Applicant and medical dates checked');
  await m.setViewportSize({ width: 390, height: 1000 });
  assert(
    await m.evaluate(
      () => document.querySelector('dialog').getBoundingClientRect().width <= innerWidth
    )
  );
  await m.screenshot({
    path: fileURLToPath(new URL('hrms-leave-document.png', output)),
    fullPage: true,
  });
  await save(m);
  await m.setViewportSize({ width: 1440, height: 1000 });
  await m.getByRole('button', { name: 'Approve leave ST002', exact: true }).click();
  await m.getByText('approved', { exact: true }).waitFor();
  assert.equal(manager.state.leaves[0].status, 'APPROVED');
  await m.getByRole('button', { name: 'Accrue staff leave balances', exact: true }).click();
  await dialog.getByLabel('Employee').selectOption(id(11));
  await dialog.getByLabel('Leave year').fill('2026');
  await save(m);
  assert.deepEqual(manager.state.writes.at(-1).data, { employeeId: id(11), year: 2026 });
  checks.push(
    'Managers configure accrual, carry-forward and working-day policies, verify documents before approval and record staff accrual'
  );
  await m.getByRole('button', { name: 'Staff directory', exact: true }).click();
  await m.getByText('Current salary: Current structure, base', { exact: false }).waitFor();
  await m.getByText('Salary revision history', { exact: true }).click();
  await m.getByText('Future structure: base', { exact: false }).waitFor();
  await m.getByRole('button', { name: /Withdraw salary revision ST002.*2027/ }).click();
  await dialog.getByLabel('Reason for withdrawing').fill('Replace an unused future revision');
  await save(m);
  assert.equal(manager.state.employees[1].salaryAssignments.length, 1);
  await m.getByRole('button', { name: 'Statutory profile ST002', exact: true }).click();
  await dialog.getByLabel('PF applies', { exact: true }).check();
  await dialog.getByLabel('UAN (12 digits)', { exact: true }).fill('123456789012');
  await dialog.getByLabel('I reviewed this employee', { exact: false }).check();
  await m.screenshot({
    path: fileURLToPath(new URL('hrms-statutory.png', output)),
    fullPage: true,
  });
  manager.state.failStatutory = true;
  await dialog.getByRole('button', { name: /^Save / }).click();
  await dialog.getByRole('alert').filter({ hasText: 'Review the PF account number' }).waitFor();
  assert.equal(
    await dialog.getByLabel('UAN (12 digits)', { exact: true }).inputValue(),
    '123456789012'
  );
  manager.state.failStatutory = false;
  await save(m);
  assert.equal(manager.state.writes.at(-1).data.pfApplicable, true);
  assert.equal(manager.state.writes.at(-1).data.reviewed, undefined);
  checks.push(
    'Statutory profile editing retains failed values and salary history separates current and future revisions'
  );
  await m.getByRole('button', { name: 'Assign salary ST001', exact: true }).click();
  await dialog.getByLabel('Salary structure').selectOption(id(24));
  await dialog.getByLabel('Base monthly salary').fill('30000');
  await dialog.getByLabel('Effective from').fill('2026-01-01');
  await save(m);
  assert.equal(manager.state.writes.at(-1).data.baseMonthlySalary, 30000);
  checks.push(
    'Staff directory assigns effective salary with numeric amounts through the integrated API'
  );
  await m.getByRole('button', { name: 'Payroll', exact: true }).click();
  await m.getByLabel('Payroll year').fill('2026');
  await m.getByLabel('Payroll month').selectOption('10');
  await m.getByLabel('Reviewed working dates').fill('2026-10-01\n2026-10-02');
  assert(await m.getByRole('button', { name: 'Create draft payroll', exact: true }).isDisabled());
  await m.getByRole('button', { name: 'Preview payroll', exact: true }).click();
  await m.getByText('1 eligible payslips', { exact: false }).waitFor();
  await m.getByRole('button', { name: 'Create draft payroll', exact: true }).click();
  await m.getByRole('button', { name: 'Review and approve payroll', exact: true }).waitFor();
  assert(
    await m.getByRole('button', { name: 'Review and approve payroll', exact: true }).isDisabled()
  );
  await m.getByRole('button', { name: 'Discard draft payroll', exact: true }).click();
  await dialog.getByLabel('Reason for discarding').fill('Correct reviewed attendance inputs');
  await save(m);
  assert.equal(manager.state.payslips.length, 0);
  await m.getByRole('button', { name: 'Preview payroll', exact: true }).click();
  await m.getByText('1 eligible payslips', { exact: false }).waitFor();
  await m.getByRole('button', { name: 'Create draft payroll', exact: true }).click();
  await m.getByRole('button', { name: 'Discard draft payroll', exact: true }).waitFor();
  checks.push('Draft discard requires a reason and refreshes the period before rebuilding');
  const reviewer = await session('SCHOOL_ADMIN'),
    r = reviewer.page;
  reviewer.state.payslips = structuredClone(manager.state.payslips);
  reviewer.state.periods = structuredClone(manager.state.periods);
  await r.getByRole('button', { name: 'Refresh HR', exact: true }).click();
  await r.getByRole('button', { name: 'Payroll', exact: true }).click();
  await r.getByRole('button', { name: 'Review and approve payroll', exact: true }).click();
  await r.getByRole('dialog').getByRole('checkbox').check();
  await save(r);
  assert.equal(reviewer.state.payslips[0].status, 'APPROVED');
  await r.getByText('Approved payroll is locked.', { exact: true }).waitFor();
  await r.screenshot({
    path: fileURLToPath(new URL('hrms-period-locked.png', output)),
    fullPage: true,
  });
  assert.equal(
    await r.getByRole('button', { name: 'Discard draft payroll', exact: true }).count(),
    0
  );
  const [download] = await Promise.all([
    r.waitForEvent('download'),
    r.getByRole('button', { name: 'Download payslip ST001' }).click(),
  ]);
  assert.equal(download.suggestedFilename(), 'payslip.csv');
  await reviewer.context.close();
  checks.push(
    'Payroll preview creates a draft, blocks its preparer from approval and allows a different manager to approve and download'
  );
  await m.getByRole('button', { name: 'Joining & offers', exact: true }).click();
  await m.getByRole('button', { name: 'New staff offer' }).click();
  for (const [label, value] of [
    ['Candidate name', 'New Teacher'],
    ['Candidate email', 'candidate@example.test'],
    ['Candidate phone', '9876543210'],
    ['Designation title', 'Teacher'],
    ['Joining date', '2026-11-20'],
    ['Base monthly salary offered', '32000'],
  ])
    await dialog.getByLabel(label).fill(value);
  for (const [label, value] of [
    ['HR department', id(20)],
    ['Salary structure', id(24)],
    ['School department', 'TEACHING'],
    ['School account role', 'TEACHER'],
  ])
    await dialog.getByLabel(label).selectOption(value);
  await save(m);
  assert(await m.getByRole('button', { name: 'Complete joining New Teacher' }).isDisabled());
  await m.getByLabel('Verify joining').check();
  await m.getByRole('button', { name: 'Complete joining New Teacher' }).click();
  await dialog.getByLabel('Matching school account').selectOption(id(26));
  await save(m);
  await m.getByText('joined', { exact: true }).waitFor();
  assert.deepEqual(manager.state.writes.at(-1).data, { userId: id(26) });
  checks.push('Joining requires completed checklist and selects an account matching the offer');
  await m.getByRole('button', { name: 'New staff offer' }).click();
  for (const [label, value] of [
    ['Candidate name', 'Fresh Teacher'],
    ['Candidate email', 'fresh@example.test'],
    ['Candidate phone', '9876543210'],
    ['Designation title', 'Teacher'],
    ['Joining date', '2026-11-20'],
    ['Base monthly salary offered', '32000'],
  ])
    await dialog.getByLabel(label).fill(value);
  for (const [label, value] of [
    ['HR department', id(20)],
    ['Salary structure', id(24)],
    ['School department', 'TEACHING'],
    ['School account role', 'TEACHER'],
  ])
    await dialog.getByLabel(label).selectOption(value);
  await save(m);
  await m.getByLabel('Verify joining').last().check();
  await m.getByRole('button', { name: 'Complete joining Fresh Teacher' }).click();
  assert.equal(await dialog.getByLabel('School login').inputValue(), 'CREATE');
  assert.equal(await dialog.getByLabel('Matching school account').count(), 0);
  assert.equal(await dialog.getByLabel('Joining first name').inputValue(), 'Fresh');
  assert.equal(await dialog.getByLabel('Joining last name').inputValue(), 'Teacher');
  await dialog.getByLabel('School login').selectOption('EXISTING');
  assert.equal(await dialog.getByLabel('Joining temporary password (12+ characters)').count(), 0);
  await dialog.getByLabel('School login').selectOption('CREATE');
  await dialog
    .getByLabel('Joining temporary password (12+ characters)')
    .fill('Fixture-Joining-42!');
  manager.state.failJoining = true;
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await dialog
    .getByRole('alert')
    .filter({ hasText: 'Existing staff identity conflicts' })
    .waitFor();
  assert.equal(
    await dialog.getByLabel('Joining temporary password (12+ characters)').inputValue(),
    'Fixture-Joining-42!'
  );
  await m.setViewportSize({ width: 390, height: 1000 });
  assert(
    await m.evaluate(
      () => document.querySelector('dialog').getBoundingClientRect().width <= innerWidth
    )
  );
  await m.screenshot({
    path: fileURLToPath(new URL('hrms-offer-joining.png', output)),
    fullPage: true,
  });
  manager.state.failJoining = false;
  await save(m);
  assert.deepEqual(manager.state.writes.at(-1).data, {
    newAccount: { firstName: 'Fresh', lastName: 'Teacher', password: 'Fixture-Joining-42!' },
  });
  await m
    .getByRole('button', { name: 'Complete joining Fresh Teacher' })
    .waitFor({ state: 'hidden' });
  checks.push(
    'Joining creates a login with conditional credential fields, preserves failed entries and posts only the selected account mode'
  );
  const exitDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
    new Date()
  );
  const exitCase = {
    id: id(70),
    employeeId: id(11),
    employee: manager.state.employees[1],
    status: 'APPROVED',
    reason: 'Reviewed departure',
    preferredExitDate: exitDate,
    approvedExitDate: exitDate,
    clearances: ['LIBRARY', 'ACCOUNTS', 'ASSETS_IT', 'PRINCIPAL'].map((department, i) => ({
      id: id(80 + i),
      department,
      status: 'CLEARED',
      duesAmount: 0,
    })),
    settlement: {
      id: id(75),
      status: 'FINALIZED',
      workingDaysInFinalMonth: 10,
      earnedSalary: 15000,
      leaveEncashmentAmount: 1000,
      noticePayRecovery: 0,
      netSettlementAmount: 16000,
    },
  };
  manager.state.resignations.push(exitCase);
  await m.setViewportSize({ width: 1440, height: 1000 });
  await m.getByRole('button', { name: 'Refresh HR', exact: true }).click();
  await m.getByRole('button', { name: 'Exit & clearances', exact: true }).click();
  await m.getByText('Legacy staged settlement:', { exact: false }).waitFor();
  assert.equal(
    await m.getByRole('button', { name: 'Issue relieving letter', exact: true }).count(),
    0
  );
  assert.equal(
    await m.getByRole('button', { name: 'Finalize settlement', exact: true }).count(),
    0
  );
  await m.getByRole('button', { name: 'Prepare final settlement', exact: true }).click();
  assert.equal(await dialog.getByLabel('Earned salary', { exact: false }).inputValue(), '15000');
  await save(m);
  assert.equal(exitCase.status, 'APPROVED');
  assert.equal(exitCase.settlement.status, 'CALCULATED');
  assert.equal(manager.state.letters.length, 0);
  assert(await m.getByRole('button', { name: 'Complete staff exit', exact: true }).isDisabled());
  const exitReviewer = await session('SCHOOL_ADMIN'),
    ex = exitReviewer.page,
    exDialog = ex.getByRole('dialog');
  exitReviewer.state.resignations = manager.state.resignations;
  exitReviewer.state.letters = manager.state.letters;
  await ex.getByRole('button', { name: 'Refresh HR', exact: true }).click();
  await ex.getByRole('button', { name: 'Exit & clearances', exact: true }).click();
  await ex.getByRole('button', { name: 'Complete staff exit', exact: true }).click();
  await exDialog.getByLabel('Relieving letter reference').fill('EXIT-UI-2026');
  await exDialog.getByRole('checkbox').check();
  exitReviewer.state.failExit = true;
  await exDialog.getByRole('button', { name: 'Save changes', exact: true }).click();
  await exDialog
    .getByRole('alert')
    .filter({ hasText: 'Account changed while revoking access' })
    .waitFor();
  assert.equal(
    await exDialog.getByLabel('Relieving letter reference').inputValue(),
    'EXIT-UI-2026'
  );
  assert.equal(exitCase.status, 'APPROVED');
  assert.equal(exitCase.settlement.status, 'CALCULATED');
  assert.equal(manager.state.letters.length, 0);
  await ex.setViewportSize({ width: 390, height: 1000 });
  assert(
    await ex.evaluate(
      () => document.querySelector('dialog').getBoundingClientRect().width <= innerWidth
    )
  );
  await ex.screenshot({
    path: fileURLToPath(new URL('hrms-exit-completion.png', output)),
    fullPage: true,
  });
  exitReviewer.state.failExit = false;
  await save(ex);
  assert.deepEqual(exitReviewer.state.writes.at(-1).data, {
    referenceNumber: 'EXIT-UI-2026',
    preparationId: exitCase.settlement.preparedSnapshot.preparationId,
  });
  assert(exitReviewer.state.writes.at(-1).endpoint.endsWith('/complete'));
  assert.equal(exitCase.settlement.status, 'FINALIZED');
  assert(exitCase.clearances.every((c) => c.lockedAt));
  assert.equal(manager.state.letters.length, 1);
  await ex.getByText('Exit completed on', { exact: false }).waitFor();
  assert.equal(
    await ex.getByRole('button', { name: 'Complete staff exit', exact: true }).count(),
    0
  );
  assert.equal(
    await ex.getByRole('button', { name: 'Prepare final settlement', exact: true }).count(),
    0
  );
  await exitReviewer.context.close();
  checks.push(
    'Exit re-preparation keeps legacy cases reviewable and a different manager completes settlement, letter and revocation in one save with recoverable errors'
  );
  for (const width of [1440, 768, 390, 320]) {
    await m.setViewportSize({ width, height: 1000 });
    assert(
      await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'HR page overflow at ' + width
    );
  }
  await m.screenshot({ path: fileURLToPath(new URL('hrms-mobile.png', output)), fullPage: true });
  await m.getByRole('button', { name: 'HR setup', exact: true }).click();
  await m.getByRole('button', { name: 'Add departments' }).click();
  assert(
    await m.evaluate(
      () => document.querySelector('dialog').getBoundingClientRect().width <= innerWidth
    )
  );
  await m.screenshot({
    path: fileURLToPath(new URL('hrms-form-mobile.png', output)),
    fullPage: true,
    animations: 'disabled',
  });
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  checks.push('HR workspace and accessible native-dialog forms fit desktop through 320px widths');
  await manager.context.close();
  const accountant = await session('ACCOUNTANT');
  assert.equal(
    await accountant.page.getByRole('button', { name: 'Joining & offers', exact: true }).count(),
    0
  );
  assert(!accountant.state.reads.includes('overview'));
  await accountant.context.close();
  const unlinked = await session('TEACHER', false);
  await unlinked.page
    .getByText('Your login is not linked to an HR employee.', { exact: false })
    .waitFor();
  assert(!unlinked.state.reads.includes('punches/today'));
  assert((await unlinked.page.getByRole('button', { name: 'Punch attendance' }).count()) === 0);
  await unlinked.context.close();
  checks.push(
    'Accountant and unlinked staff receive appropriate controls without unauthorized management reads'
  );
  const platform = await session('SUPER_ADMIN');
  assert(platform.state.selectedTenants.length > 0);
  assert(platform.state.selectedTenants.every((value) => value === id(100)));
  const before = platform.state.selectedTenants.length;
  await platform.page.getByLabel('School workspace', { exact: true }).selectOption(id(101));
  await platform.page
    .getByRole('status')
    .filter({ hasText: 'Loading HR records' })
    .waitFor({ state: 'hidden' });
  await platform.page.waitForFunction(() =>
    document.querySelector('#hr-school')?.value.endsWith('101')
  );
  assert(platform.state.selectedTenants.slice(before).some((value) => value === id(101)));
  await platform.context.close();
  checks.push(
    'Platform administrators explicitly select a school and switching scopes every HR API request'
  );
  assert.deepEqual(errors, []);
  await writeFile(
    new URL('ui-results.json', output),
    JSON.stringify(
      {
        checks,
        errors,
        fixture: 'Wrapped API fixtures; backend DB integration is verified separately',
      },
      null,
      2
    )
  );
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  await browser.close();
}
