import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GovernmentModule } from '../government.module';
import { UdiseService } from '../services/udise.service';
import { BoardExamService } from '../services/board-exam.service';
import { ComplianceService } from '../services/compliance.service';

describe('Indian Government Integration Module (UDISE+, APAAR, CBSE/ICSE/State Board)', () => {
  let app: INestApplication;
  let udiseService: UdiseService;
  let boardExamService: BoardExamService;
  let complianceService: ComplianceService;
  let prisma: PrismaService;

  const mockTenantId = 'test-tenant-id';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GovernmentModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        udiseIntegration: {
          findFirst: jest.fn(),
          upsert: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        boardIntegration: {
          findFirst: jest.fn(),
          upsert: jest.fn(),
        },
        student: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
        },
        staff: {
          findMany: jest.fn(),
        },
        complianceReport: {
          create: jest.fn(),
          findMany: jest.fn(),
        },
        udiseStudentRecord: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        udiseSyncLog: {
          create: jest.fn(),
          update: jest.fn(),
          findMany: jest.fn(),
        },
        governmentApiLog: {
          create: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    udiseService = moduleFixture.get<UdiseService>(UdiseService);
    boardExamService = moduleFixture.get<BoardExamService>(BoardExamService);
    complianceService = moduleFixture.get<ComplianceService>(ComplianceService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Module Setup', () => {
    it('should be defined with Indian compliance services', () => {
      expect(udiseService).toBeDefined();
      expect(boardExamService).toBeDefined();
      expect(complianceService).toBeDefined();
    });
  });

  describe('UDISE+ & APAAR Integration', () => {
    it('should initialize UDISE+ integration with 11-digit school code', async () => {
      const mockIntegration = {
        id: '1',
        tenantId: mockTenantId,
        udiseSchoolCode: '32080501204',
        isEnabled: true,
        autoSync: true,
      };

      jest.spyOn(prisma.udiseIntegration, 'upsert').mockResolvedValue(mockIntegration as any);

      const result = await udiseService.initializeIntegration(
        mockTenantId,
        '32080501204',
        'api-key',
        'api-secret',
      );

      expect(result).toEqual(mockIntegration);
      expect(prisma.udiseIntegration.upsert).toHaveBeenCalled();
    });

    it('should validate Indian student data (Aadhaar/APAAR + guardian phone)', async () => {
      const mockStudent = {
        id: 'student-1',
        tenantId: mockTenantId,
        firstName: 'Ananya',
        lastName: 'Nair',
        dateOfBirth: new Date('2012-05-14'),
        gender: 'FEMALE',
        admissionNumber: 'KPS2026001',
        admissionDate: new Date('2020-06-01'),
        aadhaarLast4: '4512',
        apaarId: '910012345678',
        currentClass: { name: 'Class 8' },
        guardianLinks: [
          {
            isPrimary: true,
            guardian: {
              firstName: 'Rajesh',
              lastName: 'Nair',
              phone: '+919847122334',
            },
          },
        ],
      };

      jest.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockStudent as any);
      jest.spyOn(prisma.udiseStudentRecord, 'upsert').mockResolvedValue({} as any);

      const validation = await udiseService.validateStudentData('student-1');

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
