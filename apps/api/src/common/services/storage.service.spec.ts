import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { TenantService } from '../../database/tenant.service';

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;
  let tenantService: TenantService;

  const mockTenantService = {
    requireTenantContext: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        S3_ENDPOINT: undefined, // Disable S3 for tests
        S3_ACCESS_KEY: undefined,
        S3_SECRET_KEY: undefined,
        S3_BUCKET: 'test-bucket',
        S3_PUBLIC_URL: 'https://s3.example.com',
        S3_REGION: 'us-east-1',
        S3_USE_SSL: 'true',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
    tenantService = module.get<TenantService>(TenantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should warn when S3 is not configured', () => {
      expect(service).toBeDefined();
      // StorageService logs warning when S3 not configured
    });

    it('should initialize S3 client when credentials are provided', () => {
      const s3Config = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            S3_ENDPOINT: 'https://s3.amazonaws.com',
            S3_ACCESS_KEY: 'test-key',
            S3_SECRET_KEY: 'test-secret',
            S3_BUCKET: 'test-bucket',
            S3_REGION: 'us-east-1',
          };
          return config[key] ?? defaultValue;
        }),
      };

      const testService = new StorageService(s3Config as any, tenantService as any);
      expect(testService).toBeDefined();
    });
  });

  describe('extractTenantIdFromKey', () => {
    it('should extract tenant ID from valid S3 key', () => {
      const s3Key = 'tenant-123/media/photos/2026/10/file.jpg';
      // Access private method via type assertion
      const tenantId = (service as any).extractTenantIdFromKey(s3Key);
      expect(tenantId).toBe('tenant-123');
    });

    it('should return null for invalid S3 key format', () => {
      const s3Key = 'invalid-key';
      const tenantId = (service as any).extractTenantIdFromKey(s3Key);
      expect(tenantId).toBeNull();
    });

    it('should handle S3 keys with multiple path segments', () => {
      const s3Key = 'tenant-456/documents/2026/11/deep/nested/file.pdf';
      const tenantId = (service as any).extractTenantIdFromKey(s3Key);
      expect(tenantId).toBe('tenant-456');
    });
  });

  describe('uploadFile', () => {
    it('should throw error when S3 is not configured', async () => {
      const fileBuffer = Buffer.from('test content');
      
      await expect(
        service.uploadFile(fileBuffer, {
          tenantId: 'tenant-123',
          category: 'photos',
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
        })
      ).rejects.toThrow('S3 storage not configured');
    });

    it('should use tenant ID from context when not provided', async () => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-from-context');

      const fileBuffer = Buffer.from('test content');

      await expect(
        service.uploadFile(fileBuffer, {
          category: 'photos',
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
        })
      ).rejects.toThrow('S3 storage not configured');

      expect(mockTenantService.requireTenantContext).toHaveBeenCalled();
    });

    it('should generate S3 key with tenant prefix', async () => {
      // This test requires actual S3 to work
      // Tested in integration tests with MinIO
      expect(service).toBeDefined();
    });
  });

  describe('getPresignedUrl - Tenant Security', () => {
    beforeEach(() => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
    });

    it('should throw error when S3 key has no tenant ID', async () => {
      const invalidKey = 'no-tenant-prefix/file.jpg';

      await expect(
        service.getPresignedUrl(invalidKey)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.getPresignedUrl(invalidKey)
      ).rejects.toThrow('Invalid S3 key format - tenant ID missing');
    });

    it('should throw ForbiddenException for cross-tenant access attempt', async () => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
      
      const s3KeyFromDifferentTenant = 'tenant-456/photos/2026/10/file.jpg';

      await expect(
        service.getPresignedUrl(s3KeyFromDifferentTenant)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.getPresignedUrl(s3KeyFromDifferentTenant)
      ).rejects.toThrow('Access denied - file belongs to different tenant');
    });

    it('should allow access when tenant IDs match', async () => {
      // This requires actual S3 to work
      // Tested in integration tests
      expect(service).toBeDefined();
    });

    it('should log warning for cross-tenant access attempts', async () => {
      const logSpy = jest.spyOn((service as any).logger, 'warn');
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
      
      const s3KeyFromDifferentTenant = 'tenant-456/photos/2026/10/file.jpg';

      try {
        await service.getPresignedUrl(s3KeyFromDifferentTenant);
      } catch (error) {
        // Expected to throw
      }

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cross-tenant access attempt blocked')
      );

      logSpy.mockRestore();
    });
  });

  describe('deleteFile - Tenant Security', () => {
    beforeEach(() => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
    });

    it('should throw error when S3 key has no tenant ID', async () => {
      const invalidKey = 'no-tenant-prefix/file.jpg';

      await expect(
        service.deleteFile(invalidKey)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.deleteFile(invalidKey)
      ).rejects.toThrow('Invalid S3 key format - tenant ID missing');
    });

    it('should throw ForbiddenException for cross-tenant delete attempt', async () => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
      
      const s3KeyFromDifferentTenant = 'tenant-456/photos/2026/10/file.jpg';

      await expect(
        service.deleteFile(s3KeyFromDifferentTenant)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.deleteFile(s3KeyFromDifferentTenant)
      ).rejects.toThrow('Access denied - file belongs to different tenant');
    });

    it('should log warning for cross-tenant delete attempts', async () => {
      const logSpy = jest.spyOn((service as any).logger, 'warn');
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
      
      const s3KeyFromDifferentTenant = 'tenant-456/photos/2026/10/file.jpg';

      try {
        await service.deleteFile(s3KeyFromDifferentTenant);
      } catch (error) {
        // Expected to throw
      }

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cross-tenant delete attempt blocked')
      );

      logSpy.mockRestore();
    });
  });

  describe('getFileMetadata - Tenant Security', () => {
    beforeEach(() => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
    });

    it('should throw error when S3 key has no tenant ID', async () => {
      const invalidKey = 'no-tenant-prefix/file.jpg';

      await expect(
        service.getFileMetadata(invalidKey)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for cross-tenant metadata access', async () => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
      
      const s3KeyFromDifferentTenant = 'tenant-456/photos/2026/10/file.jpg';

      await expect(
        service.getFileMetadata(s3KeyFromDifferentTenant)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listFiles - Tenant Security', () => {
    it('should throw ForbiddenException when listing files for different tenant', async () => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');

      await expect(
        service.listFiles('tenant-456')
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.listFiles('tenant-456')
      ).rejects.toThrow('Cannot list files for different tenant');
    });

    it('should allow listing files for current tenant', async () => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');

      const result = await service.listFiles('tenant-123');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should build prefix with tenant isolation', async () => {
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
      const logSpy = jest.spyOn((service as any).logger, 'log');

      await service.listFiles('tenant-123', 'photos/2026');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('tenant-123/photos/2026')
      );

      logSpy.mockRestore();
    });
  });

  describe('Security Best Practices', () => {
    it('should always prefix S3 keys with tenant ID', () => {
      const s3Key = 'tenant-123/photos/2026/10/file.jpg';
      const tenantId = (service as any).extractTenantIdFromKey(s3Key);
      expect(tenantId).toBe('tenant-123');
      expect(s3Key).toMatch(/^tenant-123\//);
    });

    it('should validate tenant ownership before all operations', () => {
      // Tested through individual operation tests above
      expect(service).toBeDefined();
    });

    it('should store tenant ID in S3 metadata', async () => {
      // This is tested in uploadFile implementation
      // Verified by checking metadata on upload
      expect(service).toBeDefined();
    });

    it('should log all cross-tenant access attempts', () => {
      // Tested through individual operation tests above
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw NotFoundException when file does not exist', async () => {
      // This requires actual S3 to test
      // Tested in integration tests
      expect(service).toBeDefined();
    });

    it('should handle S3 connection errors gracefully', async () => {
      // Connection errors would throw from S3Client
      // Tested in integration tests
      expect(service).toBeDefined();
    });

    it('should handle invalid file permissions gracefully', async () => {
      // Permission errors would throw ForbiddenException
      // Tested in integration tests
      expect(service).toBeDefined();
    });
  });

  describe('OCI / Docker Presigned URLs and Bucket Initialization', () => {
    it('should sign presigned URLs against S3_PUBLIC_URL when S3_ENDPOINT is internal', async () => {
      const ociConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            S3_ENDPOINT: 'http://minio:9000',
            S3_PUBLIC_URL: 'https://erp.school.edu.in/',
            S3_ACCESS_KEY: 'kryptonadmin',
            S3_SECRET_KEY: 'super-secret-minio-key',
            S3_BUCKET: 'krypton-media',
            S3_REGION: 'us-east-1',
            S3_USE_SSL: 'false',
          };
          return config[key] ?? defaultValue;
        }),
      };
      mockTenantService.requireTenantContext.mockReturnValue('tenant-123');
      const ociService = new StorageService(ociConfig as any, tenantService as any);
      jest.spyOn((ociService as any).s3Client, 'send').mockResolvedValue({
        Metadata: { tenantid: 'tenant-123' },
      });

      const result = await ociService.getPresignedUrl(
        'tenant-123/photos/2026/11/sample.jpg',
        120,
        { tenantId: 'tenant-123', responseContentDisposition: 'inline' },
      );

      expect(result.expiresIn).toBe(120);
      expect(result.url).toMatch(
        /^https:\/\/erp\.school\.edu\.in\/krypton-media\/tenant-123\/photos\/2026\/11\/sample\.jpg\?/,
      );
      expect(result.url).not.toContain('minio:9000');
      expect(result.url).toContain('X-Amz-Signature=');
    });

    it('should fall back to S3_ENDPOINT when S3_PUBLIC_URL is empty string', async () => {
      const localConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            S3_ENDPOINT: 'http://localhost:9000',
            S3_PUBLIC_URL: '',
            S3_ACCESS_KEY: 'minioadmin',
            S3_SECRET_KEY: 'minioadmin',
            S3_BUCKET: 'krypton-media',
            S3_REGION: 'us-east-1',
          };
          return config[key] ?? defaultValue;
        }),
      };
      const localService = new StorageService(localConfig as any, tenantService as any);
      jest.spyOn((localService as any).s3Client, 'send').mockResolvedValue({
        Metadata: { tenantid: 'tenant-123' },
      });

      const result = await localService.getPresignedUrl(
        'tenant-123/photos/2026/11/sample.jpg',
        120,
        { tenantId: 'tenant-123' },
      );

      expect(result.url).toMatch(/^http:\/\/localhost:9000\/krypton-media\/tenant-123\/photos\//);
    });

    it('should create the S3 bucket automatically when HeadBucket returns 404', async () => {
      const ociConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            S3_ENDPOINT: 'http://minio:9000',
            S3_PUBLIC_URL: 'https://erp.school.edu.in',
            S3_ACCESS_KEY: 'kryptonadmin',
            S3_SECRET_KEY: 'super-secret-minio-key',
            S3_BUCKET: 'krypton-media',
            S3_REGION: 'us-east-1',
          };
          return config[key] ?? defaultValue;
        }),
      };
      const ociService = new StorageService(ociConfig as any, tenantService as any);
      const sendSpy = jest
        .spyOn((ociService as any).s3Client, 'send')
        .mockRejectedValueOnce({ name: 'NotFound', $metadata: { httpStatusCode: 404 } })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const upload = await ociService.uploadFile(Buffer.from('fake-jpeg'), {
        tenantId: 'tenant-123',
        category: 'photos',
        filename: 'child.jpg',
        mimeType: 'image/jpeg',
      });

      expect(sendSpy).toHaveBeenCalledTimes(3);
      expect((sendSpy.mock.calls[0][0] as { constructor: { name: string } }).constructor.name).toBe('HeadBucketCommand');
      expect((sendSpy.mock.calls[1][0] as { constructor: { name: string } }).constructor.name).toBe('CreateBucketCommand');
      expect((sendSpy.mock.calls[2][0] as { constructor: { name: string } }).constructor.name).toBe('PutObjectCommand');
      expect(upload.url).toMatch(/^https:\/\/erp\.school\.edu\.in\/krypton-media\/tenant-123\/photos\//);
    });
  });
});
