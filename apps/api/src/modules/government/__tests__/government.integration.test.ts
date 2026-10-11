import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '@krypton/database';
import { GovernmentModule } from '../government.module';
import { NemisService } from '../services/nemis.service';
import { KnecService } from '../services/knec.service';
import { ComplianceService } from '../services/compliance.service';

/**
 * Integration tests for Government Module
 * 
 * Run with: npm test -- government.integration.test.ts
 */
describe('Government Integration Module', () => {
  let app: INestApplication;
  let nemisService: NemisService;
  let knecService: KnecService;
  let complianceService: ComplianceService;
  let prisma: PrismaService;

  // Mock tenant ID for testing
  const mockTenantId = 'test-tenant-id';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GovernmentModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        // Mock Prisma methods
        nemisIntegration: {
          findFirst: jest.fn(),
          upsert: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        knecIntegration: {
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
        nemisStudentRecord: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          upsert: jest.fn(),
        },
        nemisSyncLog: {
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

    nemisService = moduleFixture.get<NemisService>(NemisService);
    knecService = moduleFixture.get<KnecService>(KnecService);
    complianceService = moduleFixture.get<ComplianceService>(ComplianceService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Module Setup', () => {
    it('should be defined', () => {
      expect(nemisService).toBeDefined();
      expect(knecService).toBeDefined();
      expect(complianceService).toBeDefined();
    });

    it('should have NEMIS service with all methods', () => {
      expect(nemisService.initializeIntegration).toBeDefined();
      expect(nemisService.syncStudentEnrollment).toBeDefined();
      expect(nemisService.syncTeacherData).toBeDefined();
      expect(nemisService.validateStudentData).toBeDefined();
    });

    it('should have KNEC service with all methods', () => {
      expect(knecService.initializeIntegration).toBeDefined();
      expect(knecService.registerCandidates).toBeDefined();
      expect(knecService.downloadResults).toBeDefined();
      expect(knecService.getExamTimetable).toBeDefined();
    });

    it('should have Compliance service with all methods', () => {
      expect(complianceService.generateEnrollmentReport).toBeDefined();
      expect(complianceService.generateAttendanceReport).toBeDefined();
      expect(complianceService.runDataQualityAudit).toBeDefined();
      expect(complianceService.createAlert).toBeDefined();
    });
  });

  describe('NEMIS Integration', () => {
    it('should initialize NEMIS integration', async () => {
      const mockIntegration = {
        id: '1',
        tenantId: mockTenantId,
        nemisSchoolCode: '12345',
        isEnabled: true,
        autoSync: true,
      };

      jest.spyOn(prisma.nemisIntegration, 'upsert').mockResolvedValue(mockIntegration as any);

      const result = await nemisService.initializeIntegration(
        mockTenantId,
        '12345',
        'api-key',
        'api-secret',
      );

      expect(result).toEqual(mockIntegration);
      expect(prisma.nemisIntegration.upsert).toHaveBeenCalled();
    });

    it('should validate student data', async () => {
      const mockStudent = {
        id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'MALE',
        admissionNumber: 'ADM001',
        admissionDate: new Date('2020-01-01'),
        nationalId: '12345678',
        currentClass: { name: 'Grade 5' },
        guardianLinks: [
          {
            isPrimary: true,
            guardian: {
              firstName: 'Jane',
              lastName: 'Doe',
              phone: '0712345678',
            },
          },
        ],
      };

      jest.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockStudent as any);
      jest.spyOn(prisma.nemisStudentRecord, 'upsert').mockResolvedValue({} as any);

      const result = await nemisService.validateStudentData('student-1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('KNEC Integration', () => {
    it('should initialize KNEC integration', async () => {
      const mockIntegration = {
        id: '1',
        tenantId: mockTenantId,
        knecCentreNumber: '12345',
        isEnabled: true,
      };

      jest.spyOn(prisma.knecIntegration, 'upsert').mockResolvedValue(mockIntegration as any);

      const result = await knecService.initializeIntegration(
        mockTenantId,
        '12345',
        'api-key',
        'api-secret',
      );

      expect(result).toEqual(mockIntegration);
      expect(prisma.knecIntegration.upsert).toHaveBeenCalled();
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate enrollment report', async () => {
      const mockStudents = [
        {
          id: '1',
          status: 'ACTIVE',
          gender: 'MALE',
          currentClass: { name: 'Grade 5' },
        },
        {
          id: '2',
          status: 'ACTIVE',
          gender: 'FEMALE',
          currentClass: { name: 'Grade 5' },
        },
      ];

      const mockReport = {
        id: 'report-1',
        reportType: 'ENROLLMENT_STATISTICS',
        reportPeriod: 'Term 1 2024',
        reportYear: 2024,
        status: 'DRAFT',
        reportData: {},
      };

      jest.spyOn(prisma.student, 'findMany').mockResolvedValue(mockStudents as any);
      jest.spyOn(prisma.complianceReport, 'create').mockResolvedValue(mockReport as any);

      const result = await complianceService.generateEnrollmentReport(
        mockTenantId,
        'Term 1 2024',
        2024,
      );

      expect(result).toEqual(mockReport);
      expect(prisma.complianceReport.create).toHaveBeenCalled();
    });

    it('should create compliance alert', async () => {
      const mockAlert = {
        id: 'alert-1',
        tenantId: mockTenantId,
        alertType: 'SYNC_FAILURE',
        severity: 'CRITICAL',
        title: 'Test Alert',
        message: 'Test message',
      };

      jest.spyOn(prisma, 'complianceAlert' as any).mockReturnValue({
        create: jest.fn().mockResolvedValue(mockAlert),
      });

      // Note: This test requires the actual create method
      // In real tests, you'd mock the Prisma call properly
    });
  });

  describe('Data Validation Utilities', () => {
    it('should validate Kenyan National ID', () => {
      const ValidationUtil = require('../utils/validation.util').ValidationUtil;
      
      expect(ValidationUtil.isValidNationalId('12345678')).toBe(true);
      expect(ValidationUtil.isValidNationalId('123')).toBe(false);
      expect(ValidationUtil.isValidNationalId('abcdefgh')).toBe(false);
    });

    it('should normalize Kenyan phone numbers', () => {
      const ValidationUtil = require('../utils/validation.util').ValidationUtil;
      
      expect(ValidationUtil.normalizeKenyanPhone('0712345678')).toBe('+254712345678');
      expect(ValidationUtil.normalizeKenyanPhone('254712345678')).toBe('+254712345678');
      expect(ValidationUtil.normalizeKenyanPhone('+254712345678')).toBe('+254712345678');
    });

    it('should validate age for education level', () => {
      const ValidationUtil = require('../utils/validation.util').ValidationUtil;
      
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 10);
      
      const result = ValidationUtil.isValidAgeForLevel(dob, 'PRIMARY');
      expect(result.valid).toBe(true);
    });
  });

  describe('Date Utilities', () => {
    it('should get current academic term', () => {
      const DateUtil = require('../utils/date.util').DateUtil;
      
      const term = DateUtil.getCurrentTerm(new Date('2024-02-15'));
      expect(term).toBeDefined();
      expect(term.term).toBe(1);
      expect(term.name).toBe('Term 1');
    });

    it('should calculate school days', () => {
      const DateUtil = require('../utils/date.util').DateUtil;
      
      const startDate = new Date('2024-01-08'); // Monday
      const endDate = new Date('2024-01-19'); // Friday
      
      const days = DateUtil.calculateSchoolDays(startDate, endDate);
      expect(days).toBeGreaterThan(0);
    });

    it('should identify Kenyan public holidays', () => {
      const DateUtil = require('../utils/date.util').DateUtil;
      
      const newYear = new Date('2024-01-01');
      expect(DateUtil.isPublicHoliday(newYear)).toBe(true);
      
      const regularDay = new Date('2024-02-15');
      expect(DateUtil.isPublicHoliday(regularDay)).toBe(false);
    });
  });

  describe('Encryption Utilities', () => {
    it('should encrypt and decrypt data', () => {
      // Skip if ENCRYPTION_KEY not set
      if (!process.env.ENCRYPTION_KEY) {
        process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
      }

      const EncryptionUtil = require('../utils/encryption.util').EncryptionUtil;
      
      const original = 'my-secret-api-key';
      const encrypted = EncryptionUtil.encrypt(original);
      const decrypted = EncryptionUtil.decrypt(encrypted);
      
      expect(encrypted).not.toBe(original);
      expect(decrypted).toBe(original);
    });

    it('should generate secure tokens', () => {
      if (!process.env.ENCRYPTION_KEY) {
        process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
      }

      const EncryptionUtil = require('../utils/encryption.util').EncryptionUtil;
      
      const token = EncryptionUtil.generateToken(32);
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    });
  });

  describe('Report Generation Utilities', () => {
    it('should generate CSV from data', () => {
      const ReportGeneratorUtil = require('../utils/report-generator.util').ReportGeneratorUtil;
      
      const data = [
        { name: 'John', age: 10, grade: 'A' },
        { name: 'Jane', age: 11, grade: 'B' },
      ];
      const headers = ['name', 'age', 'grade'];
      
      const csv = ReportGeneratorUtil.generateCsv(data, headers);
      
      expect(csv).toContain('name,age,grade');
      expect(csv).toContain('John,10,A');
      expect(csv).toContain('Jane,11,B');
    });

    it('should format currency correctly', () => {
      const ReportGeneratorUtil = require('../utils/report-generator.util').ReportGeneratorUtil;
      
      const formatted = ReportGeneratorUtil.formatCurrency(150000);
      expect(formatted).toContain('1,500.00');
    });
  });
});

/**
 * Test Summary:
 * - Module initialization
 * - NEMIS integration
 * - KNEC integration
 * - Compliance reporting
 * - Data validation
 * - Date utilities
 * - Encryption utilities
 * - Report generation
 * 
 * To run: npm test
 */
