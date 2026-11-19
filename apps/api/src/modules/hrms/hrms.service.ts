import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HrmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. OVERVIEW & WORKFORCE SUMMARY
  // ==========================================
  async getHrmsOverview(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      todayPunches,
      pendingLeaves,
      pendingResignations,
      departments,
      shifts,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { tenantId } }),
      this.prisma.employee.count({ where: { tenantId, employmentStatus: 'ACTIVE' } }),
      this.prisma.punchLog.count({
        where: {
          tenantId,
          punchTime: { gte: today },
        },
      }),
      this.prisma.leaveRequest.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.resignation.count({ where: { tenantId, status: 'SUBMITTED' } }),
      this.prisma.department.findMany({
        where: { tenantId },
        include: { _count: { select: { employees: true } } },
      }),
      this.prisma.shift.findMany({ where: { tenantId } }),
    ]);

    return {
      stats: {
        totalEmployees,
        activeEmployees,
        todayPunches,
        pendingLeaves,
        pendingResignations,
      },
      departments,
      shifts,
    };
  }

  // ==========================================
  // 2. EMPLOYEES & STAFF DIRECTORY
  // ==========================================
  async listEmployees(tenantId: string) {
    return this.prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: true,
        designation: true,
        bankAccount: true,
        statutoryProfile: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEmployeeById(tenantId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        designation: true,
        bankAccount: true,
        statutoryProfile: true,
        documents: true,
        shiftAssignments: { include: { shift: true } },
        leaveBalances: { include: { leaveType: true } },
        orderLetters: true,
      },
    });
    if (!employee) throw new NotFoundException('Employee record not found');
    return employee;
  }

  async getEmployeeByUserId(tenantId: string, userId: string) {
    let employee = await this.prisma.employee.findFirst({
      where: { tenantId, userId },
      include: { department: true, designation: true },
    });

    // If not found, check if there is a Staff record with this userId and auto-link/create
    if (!employee) {
      const staff = await this.prisma.staff.findFirst({
        where: { tenantId, userId },
      });
      if (staff) {
        employee = await this.prisma.employee.create({
          data: {
            tenantId,
            staffId: staff.id,
            userId: staff.userId,
            employeeCode: staff.staffNumber,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            phone: staff.phone,
            gender: staff.gender,
            joiningDate: staff.hireDate || new Date(),
            employmentStatus: 'ACTIVE',
          },
          include: { department: true, designation: true },
        });
      }
    }

    return employee;
  }

  // ==========================================
  // 3. STAFF PUNCHING & SHIFTS
  // ==========================================
  async listShifts(tenantId: string) {
    return this.prisma.shift.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createShift(tenantId: string, data: { name: string; startTime: string; endTime: string; graceMinutes?: number; isDefault?: boolean }) {
    return this.prisma.shift.create({
      data: {
        tenantId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        graceMinutes: data.graceMinutes ?? 15,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async recordPunch(
    tenantId: string,
    employeeId: string,
    payload: {
      punchType: string;
      verificationMode?: string;
      latitude?: number;
      longitude?: number;
      deviceId?: string;
    },
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create the punch log
    const log = await this.prisma.punchLog.create({
      data: {
        tenantId,
        employeeId,
        deviceId: payload.deviceId,
        punchTime: now,
        punchType: payload.punchType || 'CHECK_IN',
        verificationMode: payload.verificationMode || 'FINGERPRINT',
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
    });

    // If staff record is linked, also update or create the daily StaffAttendance
    if (employee.staffId) {
      const existingAttendance = await this.prisma.staffAttendance.findUnique({
        where: {
          tenantId_staffId_date: {
            tenantId,
            staffId: employee.staffId,
            date: today,
          },
        },
      });

      if (!existingAttendance) {
        await this.prisma.staffAttendance.create({
          data: {
            tenantId,
            staffId: employee.staffId,
            date: today,
            status: 'PRESENT',
            firstIn: now,
            lastOut: now,
            timeIn: now,
            timeOut: now,
          },
        });
      } else {
        const updateData: any = {
          lastOut: now,
          timeOut: now,
        };
        if (!existingAttendance.firstIn) {
          updateData.firstIn = now;
          updateData.timeIn = now;
        }
        await this.prisma.staffAttendance.update({
          where: { id: existingAttendance.id },
          data: updateData,
        });
      }
    }

    return { success: true, message: 'Punch recorded successfully', punch: log };
  }

  async getTodayPunchLogs(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.punchLog.findMany({
      where: {
        tenantId,
        punchTime: { gte: today },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
      },
      orderBy: { punchTime: 'desc' },
      take: 100,
    });
  }

  // ==========================================
  // 4. LEAVE MANAGEMENT
  // ==========================================
  async listLeaveTypes(tenantId: string) {
    let types = await this.prisma.leaveType.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    if (types.length === 0) {
      // Seed default school leave types if empty
      types = await Promise.all([
        this.prisma.leaveType.create({
          data: { tenantId, name: 'Casual Leave', code: 'CL', daysPerYear: 12, isPaid: true },
        }),
        this.prisma.leaveType.create({
          data: { tenantId, name: 'Medical / Sick Leave', code: 'ML', daysPerYear: 10, isPaid: true, requiresDocument: true },
        }),
        this.prisma.leaveType.create({
          data: { tenantId, name: 'Earned Leave', code: 'EL', daysPerYear: 15, isPaid: true },
        }),
        this.prisma.leaveType.create({
          data: { tenantId, name: 'Duty Leave / School Event', code: 'DL', daysPerYear: 7, isPaid: true },
        }),
      ]);
    }

    return types;
  }

  async submitLeaveRequest(
    tenantId: string,
    employeeId: string,
    data: {
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      numberOfDays: number;
      reason: string;
      isHalfDay?: boolean;
    },
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        numberOfDays: Number(data.numberOfDays),
        reason: data.reason,
        isHalfDay: data.isHalfDay ?? false,
        status: 'PENDING',
      },
      include: { leaveType: true, employee: true },
    });
  }

  async listLeaveRequests(tenantId: string, status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewLeaveRequest(
    tenantId: string,
    requestId: string,
    decision: { status: 'APPROVED' | 'REJECTED'; reviewerRemarks?: string; reviewedBy?: string },
  ) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, tenantId },
    });
    if (!request) throw new NotFoundException('Leave request not found');

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: decision.status,
        reviewerRemarks: decision.reviewerRemarks,
        reviewedBy: decision.reviewedBy,
        reviewedAt: new Date(),
      },
    });
  }

  // ==========================================
  // 5. INDIA PAYROLL & SALARY SLIPS
  // ==========================================
  async listSalaryStructures(tenantId: string) {
    return this.prisma.salaryStructure.findMany({
      where: { tenantId },
      include: {
        components: { include: { component: true } },
      },
    });
  }

  async generateMonthlyPayroll(tenantId: string, year: number, month: number) {
    // Check or create PayrollPeriod
    let period = await this.prisma.payrollPeriod.findUnique({
      where: {
        tenantId_year_month: { tenantId, year, month },
      },
    });

    if (!period) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      period = await this.prisma.payrollPeriod.create({
        data: {
          tenantId,
          year,
          month,
          startDate,
          endDate,
          totalWorkingDays: 26,
          status: 'OPEN',
        },
      });
    }

    const employees = await this.prisma.employee.findMany({
      where: { tenantId, employmentStatus: 'ACTIVE' },
      include: { salaryAssignments: { include: { structure: { include: { components: { include: { component: true } } } } } } },
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const payrollRun = await this.prisma.payrollRun.create({
      data: {
        tenantId,
        periodId: period.id,
        status: 'APPROVED',
        totalEmployees: employees.length,
      },
    });

    const payslips = [];
    for (const emp of employees) {
      const assignment = emp.salaryAssignments[0];
      const basic = assignment ? assignment.baseMonthlySalary : 25000;
      const da = Math.round(basic * 0.12);
      const hra = Math.round(basic * 0.20);
      const gross = basic + da + hra;
      const pf = Math.round(basic * 0.12);
      const pt = 200;
      const deductions = pf + pt;
      const net = gross - deductions;

      totalGross += gross;
      totalDeductions += deductions;
      totalNet += net;

      const slip = await this.prisma.payslip.create({
        data: {
          tenantId,
          runId: payrollRun.id,
          employeeId: emp.id,
          year,
          month,
          workedDays: 26,
          grossSalary: gross,
          totalDeductions: deductions,
          netSalary: net,
          breakdown: {
            basic,
            da,
            hra,
            pf,
            pt,
          },
          status: 'GENERATED',
        },
      });
      payslips.push(slip);
    }

    await this.prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: {
        totalGrossSalary: totalGross,
        totalDeductions,
        totalNetSalary: totalNet,
      },
    });

    return {
      run: payrollRun,
      count: payslips.length,
      totalNet,
      totalGross,
    };
  }

  async listPayslips(tenantId: string, year?: number, month?: number) {
    return this.prisma.payslip.findMany({
      where: {
        tenantId,
        ...(year ? { year } : {}),
        ...(month ? { month } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // 6. ONBOARDING & JOB OFFERS
  // ==========================================
  async listJobOffers(tenantId: string) {
    return this.prisma.jobOffer.findMany({
      where: { tenantId },
      include: { joiningTasks: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJobOffer(
    tenantId: string,
    data: {
      candidateName: string;
      candidateEmail: string;
      candidatePhone: string;
      designationTitle: string;
      joiningDate: string;
      offeredCtcMonthly: number;
    },
  ) {
    const offer = await this.prisma.jobOffer.create({
      data: {
        tenantId,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        candidatePhone: data.candidatePhone,
        designationTitle: data.designationTitle,
        joiningDate: new Date(data.joiningDate),
        offeredCtcMonthly: Number(data.offeredCtcMonthly),
        status: 'OFFERED',
      },
    });

    // Default checklist tasks for school teacher/staff onboarding
    await this.prisma.onboardingTask.createMany({
      data: [
        { tenantId, offerId: offer.id, title: 'Submit Degree & B.Ed / Teaching Certificates', category: 'DOCUMENT' },
        { tenantId, offerId: offer.id, title: 'Submit Aadhaar Card & PAN Card Copy', category: 'DOCUMENT' },
        { tenantId, offerId: offer.id, title: 'Sign Official Appointment & Code of Conduct Letter', category: 'HR_FORMALITY' },
        { tenantId, offerId: offer.id, title: 'Provide Bank Account & Cancelled Cheque for Salary', category: 'HR_FORMALITY' },
        { tenantId, offerId: offer.id, title: 'Create School ERP Teacher Account & Biometric Enroll', category: 'IT_SETUP' },
      ],
    });

    return offer;
  }

  async convertOfferToEmployee(tenantId: string, offerId: string) {
    const offer = await this.prisma.jobOffer.findFirst({
      where: { id: offerId, tenantId },
      include: { joiningTasks: true },
    });
    if (!offer) throw new NotFoundException('Job offer not found');

    const count = await this.prisma.employee.count({ where: { tenantId } });
    const code = `EMP${String(count + 1).padStart(4, '0')}`;
    const nameParts = offer.candidateName.trim().split(' ');
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    // Create Employee record
    const emp = await this.prisma.employee.create({
      data: {
        tenantId,
        employeeCode: code,
        firstName,
        lastName,
        email: offer.candidateEmail,
        phone: offer.candidatePhone,
        joiningDate: offer.joiningDate,
        employmentStatus: 'ACTIVE',
      },
    });

    // Create linked Staff record in school
    await this.prisma.staff.create({
      data: {
        tenantId,
        staffNumber: code,
        firstName,
        lastName,
        email: offer.candidateEmail,
        phone: offer.candidatePhone,
        gender: 'OTHER',
        department: 'ADMINISTRATION',
        position: offer.designationTitle,
        employmentType: 'PERMANENT',
        hireDate: offer.joiningDate,
        status: 'ACTIVE',
      },
    });

    await this.prisma.jobOffer.update({
      where: { id: offerId },
      data: { status: 'JOINED' },
    });

    return emp;
  }

  // ==========================================
  // 7. RESIGNATION, EXIT CLEARANCE & RELIEVING
  // ==========================================
  async submitResignation(
    tenantId: string,
    employeeId: string,
    data: { reason: string; preferredExitDate: string },
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const resignation = await this.prisma.resignation.create({
      data: {
        tenantId,
        employeeId,
        reason: data.reason,
        preferredExitDate: new Date(data.preferredExitDate),
        status: 'SUBMITTED',
      },
    });

    // Automatically generate 4 departmental clearances: Library, Accounts, IT/Assets, Principal
    await this.prisma.exitClearance.createMany({
      data: [
        { tenantId, resignationId: resignation.id, employeeId, department: 'LIBRARY', status: 'PENDING', remarks: 'Check returned library books' },
        { tenantId, resignationId: resignation.id, employeeId, department: 'ACCOUNTS', status: 'PENDING', remarks: 'Check fee advances or loans' },
        { tenantId, resignationId: resignation.id, employeeId, department: 'ASSETS_IT', status: 'PENDING', remarks: 'Check laptop, ID card, keys' },
        { tenantId, resignationId: resignation.id, employeeId, department: 'PRINCIPAL', status: 'PENDING', remarks: 'Final management clearance' },
      ],
    });

    return resignation;
  }

  async listResignations(tenantId: string) {
    return this.prisma.resignation.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
        clearances: true,
        settlement: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewClearance(
    tenantId: string,
    clearanceId: string,
    data: { status: 'CLEARED' | 'DUES_PENDING'; duesAmount?: number; remarks?: string; clearedBy: string },
  ) {
    const clearance = await this.prisma.exitClearance.findFirst({
      where: { id: clearanceId, tenantId },
    });
    if (!clearance) throw new NotFoundException('Clearance record not found');

    return this.prisma.exitClearance.update({
      where: { id: clearanceId },
      data: {
        status: data.status,
        duesAmount: data.duesAmount ?? 0,
        remarks: data.remarks,
        clearedBy: data.clearedBy,
        clearedAt: new Date(),
      },
    });
  }

  async issueRelievingLetter(
    tenantId: string,
    employeeId: string,
    data: { referenceNumber: string; content: string; issuedBy: string },
  ) {
    const emp = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    // Create Relieving Letter
    const letter = await this.prisma.employeeOrderLetter.create({
      data: {
        tenantId,
        employeeId,
        letterType: 'RELIEVING_LETTER',
        referenceNumber: data.referenceNumber,
        content: data.content,
        issuedBy: data.issuedBy,
      },
    });

    // Mark employee as RESIGNED / INACTIVE
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        employmentStatus: 'RESIGNED',
        exitDate: new Date(),
      },
    });

    if (emp.staffId) {
      await this.prisma.staff.update({
        where: { id: emp.staffId },
        data: { status: 'TERMINATED', terminationDate: new Date() },
      });
    }

    return letter;
  }
}
