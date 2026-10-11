import { Test, TestingModule } from '@nestjs/testing';
import { StaffService } from '../modules/staff/staff.service';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../database/tenant.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StaffStatus, StaffDepartment, EmploymentType } from '@krypton/types';

describe('StaffService Multi-Tenant Suite', () => {
  let staffService: StaffService;
  let prisma: any;
  let tenantService: any;

  const mockStaffMember = {
    id: 'staff_uuid_001',
    tenantId: 'school_alpha_123',
    staffNumber: 'EMP-001',
    firstName: 'Peter',
    lastName: 'Mwangi',
    email: 'peter.mwangi@school.com',
    phone: '+254700112233',
    department: StaffDepartment.MATHEMATICS,
    position: 'Senior Teacher',
    employmentType: EmploymentType.FULL_TIME,
    status: StaffStatus.ACTIVE,
    hireDate: new Date('2024-01-15'),
    isTeacher: true,
  };

  beforeEach(async () => {
    prisma = {
      staff: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    tenantService = {
      requireTenantContext: jest.fn().mockReturnValue('school_alpha_123'),
      getTenantId: jest.fn().mockReturnValue('school_alpha_123'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenantService },
      ],
    }).compile();

    staffService = module.get<StaffService>(StaffService);
  });

  describe('create', () => {
    it('should create staff member scoped to current tenant', async () => {
      prisma.staff.findFirst.mockResolvedValue(null);
      prisma.staff.create.mockResolvedValue(mockStaffMember);

      const result = await staffService.create({
        staffNumber: 'EMP-001',
        firstName: 'Peter',
        lastName: 'Mwangi',
        email: 'peter.mwangi@school.com',
        phone: '+254700112233',
        department: StaffDepartment.MATHEMATICS,
        position: 'Senior Teacher',
        employmentType: EmploymentType.FULL_TIME,
        hireDate: '2024-01-15',
        isTeacher: true,
      });

      expect(result).toBeDefined();
      expect(result.staffNumber).toBe('EMP-001');
      expect(prisma.staff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'school_alpha_123',
            staffNumber: 'EMP-001',
          }),
        }),
      );
    });

    it('should throw ConflictException if staffNumber already exists in tenant', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaffMember);

      await expect(
        staffService.create({
          staffNumber: 'EMP-001',
          firstName: 'Another',
          lastName: 'Person',
          email: 'another@school.com',
          phone: '+254700998877',
          hireDate: '2024-01-15',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.staff.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should query staff scoped to tenant with pagination and filters', async () => {
      prisma.staff.findMany.mockResolvedValue([mockStaffMember]);
      prisma.staff.count.mockResolvedValue(1);

      const result = await staffService.findAll({
        page: 1,
        limit: 10,
        department: StaffDepartment.MATHEMATICS,
      });

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.staff.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'school_alpha_123',
            department: StaffDepartment.MATHEMATICS,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return staff member if within tenant boundary', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaffMember);

      const result = await staffService.findOne('staff_uuid_001');

      expect(result).toBeDefined();
      expect(result.id).toBe('staff_uuid_001');
      expect(prisma.staff.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'staff_uuid_001', tenantId: 'school_alpha_123' },
        }),
      );
    });

    it('should throw NotFoundException if staff member belongs to different tenant', async () => {
      // Tenant filter returns null because School B record is not in School A
      prisma.staff.findFirst.mockResolvedValue(null);

      await expect(staffService.findOne('cross_tenant_staff_id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove (soft deactivation)', () => {
    it('should update staff status to TERMINATED/INACTIVE within tenant boundary', async () => {
      prisma.staff.findFirst.mockResolvedValue(mockStaffMember);
      prisma.staff.update.mockResolvedValue({
        ...mockStaffMember,
        status: StaffStatus.TERMINATED,
      });

      const result = await staffService.remove('staff_uuid_001');

      expect(result.status).toBe(StaffStatus.TERMINATED);
      expect(prisma.staff.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'staff_uuid_001' },
          data: expect.objectContaining({ status: StaffStatus.TERMINATED }),
        }),
      );
    });
  });
});
