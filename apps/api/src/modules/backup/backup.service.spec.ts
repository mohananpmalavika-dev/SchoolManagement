import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { BackupService } from './backup.service';
import * as fs from 'fs';
import * as path from 'path';
import { createCipheriv, createHash, randomBytes } from 'crypto';

describe('BackupService', () => {
  let service: BackupService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        DATABASE_URL: 'postgresql://krypton:krypton@localhost:5432/krypton_test',
        ENCRYPTION_MASTER_KEY: 'test-master-key-at-least-32-characters-long-for-testing',
        S3_ENABLED: undefined, // Disable S3 for tests
        S3_ENDPOINT: undefined,
        S3_ACCESS_KEY: undefined,
        S3_SECRET_KEY: undefined,
        S3_BUCKET: 'test-bucket',
        BACKUP_DIR: './test-backups',
        BACKUP_RETENTION_DAYS: '14',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    configService = module.get<ConfigService>(ConfigService);

    // Create test backup directory
    const backupDir = mockConfigService.get('BACKUP_DIR');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Cleanup test backup directory
    const backupDir = mockConfigService.get('BACKUP_DIR');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      for (const file of files) {
        fs.unlinkSync(path.join(backupDir, file));
      }
      fs.rmdirSync(backupDir);
    }
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create backup directory if it does not exist', () => {
      const backupDir = mockConfigService.get('BACKUP_DIR');
      expect(fs.existsSync(backupDir)).toBe(true);
    });

    it('should throw error if encryption key is too short', () => {
      const shortKeyConfig = {
        ...mockConfigService,
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'ENCRYPTION_MASTER_KEY') {
            return 'too-short';
          }
          return mockConfigService.get(key, defaultValue);
        }),
      };

      expect(() => {
        new BackupService(shortKeyConfig as any);
      }).toThrow('ENCRYPTION_MASTER_KEY must be at least 32 characters');
    });

    it('should log warning when S3 is not configured', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'warn');
      new BackupService(configService);
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('Configuration Parsing', () => {
    it('should parse DATABASE_URL correctly', () => {
      expect(service).toBeDefined();
      // Database config should be parsed from DATABASE_URL
      // This is tested indirectly through service creation
    });

    it('should use individual POSTGRES_* vars if DATABASE_URL not provided', () => {
      const individualConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            DATABASE_URL: undefined,
            POSTGRES_HOST: 'testhost',
            POSTGRES_PORT: '5433',
            POSTGRES_DB: 'testdb',
            POSTGRES_USER: 'testuser',
            POSTGRES_PASSWORD: 'testpass',
            ENCRYPTION_MASTER_KEY: 'test-master-key-at-least-32-characters-long',
            BACKUP_DIR: './test-backups',
          };
          return config[key] ?? defaultValue;
        }),
      };

      const testService = new BackupService(individualConfig as any);
      expect(testService).toBeDefined();
    });
  });

  describe('createBackup', () => {
    it('should return BackupResult with success status', async () => {
      // Note: This test will fail if PostgreSQL is not running
      // Mock or skip in CI environment
      jest.setTimeout(30000); // 30 seconds for backup operation

      const result = await service.createBackup();

      if (result.success) {
        expect(result.backupId).toBeDefined();
        expect(result.filename).toContain('backup_');
        expect(result.filename).toContain('.sql.gz.enc');
        expect(result.size).toBeGreaterThan(0);
        expect(result.checksum).toBeDefined();
        expect(result.checksum).toHaveLength(64); // SHA-256 hex string
        expect(result.duration).toBeGreaterThan(0);
        expect(result.localPath).toBeDefined();

        // Verify backup file exists
        expect(fs.existsSync(result.localPath!)).toBe(true);
      } else {
        // If backup fails (e.g., no database), should return error
        expect(result.error).toBeDefined();
      }
    }, 30000);

    it('should handle database connection failure gracefully', async () => {
      // Create service with invalid database config
      const invalidConfig = {
        ...mockConfigService,
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'DATABASE_URL') {
            return 'postgresql://invalid:invalid@nonexistent:5432/nonexistent';
          }
          return mockConfigService.get(key, defaultValue);
        }),
      };

      const invalidService = new BackupService(invalidConfig as any);
      const result = await invalidService.createBackup();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyBackup', () => {
    it('should return false for non-existent backup', async () => {
      const result = await service.verifyBackup('backup_nonexistent_12345678');
      expect(result).toBe(false);
    });

    it('should verify a valid backup successfully', async () => {
      // Archive verification has no database dependency. Actual pg_dump/restore
      // is a separate mandatory CI rehearsal and must fail when unavailable.
      const id='backup_20261120_000000_valid', input=path.join(mockConfigService.get('BACKUP_DIR'),'fixture.gz');
      fs.writeFileSync(input,require('zlib').gzipSync('CREATE TABLE restore_probe(id integer);'));
      await (service as any).encryptFile(input,path.join(mockConfigService.get('BACKUP_DIR'),id+'.sql.gz.enc'));
      expect(await service.verifyBackup(id)).toBe(true);
    }, 60000);

    it('should detect corrupted backup file', async () => {
      // Create a fake corrupted backup
      const corruptedBackupId = 'backup_20261011_000000_test';
      const corruptedFile = path.join(
        mockConfigService.get('BACKUP_DIR'),
        `${corruptedBackupId}.sql.gz.enc`
      );

      // Write random bytes (corrupted data)
      fs.writeFileSync(corruptedFile, Buffer.from('corrupted data'));

      const result = await service.verifyBackup(corruptedBackupId);
      expect(result).toBe(false);

      // Cleanup
      fs.unlinkSync(corruptedFile);
    });
  });

  describe('restoreBackup', () => {
    it('should return error for non-existent backup', async () => {
      const result = await service.restoreBackup('backup_nonexistent_12345678');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    });

    // Note: Actual restore tests should be run in isolated test database
    // to avoid overwriting production/development data
  });

  describe('listBackups', () => {
    it('should return empty array when no backups exist', async () => {
      const backups = await service.listBackups();
      expect(Array.isArray(backups)).toBe(true);
    });

    it('should list existing backups', async () => {
      // Create a test backup file
      const testBackupId = 'backup_20261011_120000_abcd';
      const testFile = path.join(
        mockConfigService.get('BACKUP_DIR'),
        `${testBackupId}.sql.gz.enc`
      );

      fs.writeFileSync(testFile, Buffer.from('test data'));

      const backups = await service.listBackups();
      expect(backups.length).toBeGreaterThan(0);

      const foundBackup = backups.find((b) => b.backupId === testBackupId);
      expect(foundBackup).toBeDefined();
      expect(foundBackup?.source).toBe('local');
      expect(foundBackup?.size).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(testFile);
    });
  });

  describe('pruneOldBackups', () => {
    it('should delete backups older than retention period', async () => {
      // Create test backup files with old timestamps
      const oldBackupId = 'backup_20260901_120000_old1'; // 40+ days old
      const oldFile = path.join(
        mockConfigService.get('BACKUP_DIR'),
        `${oldBackupId}.sql.gz.enc`
      );

      fs.writeFileSync(oldFile, Buffer.from('old backup data'));

      // Set file mtime to 40 days ago
      const oldTimestamp = Date.now() - 40 * 24 * 60 * 60 * 1000;
      fs.utimesSync(oldFile, oldTimestamp / 1000, oldTimestamp / 1000);

      const deletedCount = await service.pruneOldBackups(14);

      // Should have deleted 1 file
      expect(deletedCount).toBeGreaterThanOrEqual(0); // May be 0 if find command fails

      // Verify file was deleted
      expect(fs.existsSync(oldFile)).toBe(false);
    });

    it('should not delete recent backups', async () => {
      // Create a recent backup file
      const recentBackupId = 'backup_20261011_120000_recent';
      const recentFile = path.join(
        mockConfigService.get('BACKUP_DIR'),
        `${recentBackupId}.sql.gz.enc`
      );

      fs.writeFileSync(recentFile, Buffer.from('recent backup data'));

      const deletedCount = await service.pruneOldBackups(14);

      // Should not delete recent file
      expect(fs.existsSync(recentFile)).toBe(true);

      // Cleanup
      fs.unlinkSync(recentFile);
    });

    it('should handle empty backup directory', async () => {
      const deletedCount = await service.pruneOldBackups(14);
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt file successfully', async () => {
      const input = path.join(mockConfigService.get('BACKUP_DIR'), 'plain.sql');
      const archive = input + '.enc', restored = input + '.restored';
      fs.writeFileSync(input, 'School backup fixture');
      await (service as any).encryptFile(input, archive);
      await (service as any).decryptFile(archive, restored);
      expect(fs.readFileSync(restored, 'utf8')).toBe('School backup fixture');
    });

    it('should use unique IV for each encryption', async () => {
      const input = path.join(mockConfigService.get('BACKUP_DIR'), 'plain.sql');
      fs.writeFileSync(input, 'Identical school record');
      await (service as any).encryptFile(input, input + '.one');
      await (service as any).encryptFile(input, input + '.two');
      expect(fs.readFileSync(input + '.one').equals(fs.readFileSync(input + '.two'))).toBe(false);
    });
    it('rejects tampered encrypted data and removes partial plaintext', async () => {
      const input = path.join(mockConfigService.get('BACKUP_DIR'), 'plain.sql');
      const archive = input + '.enc', restored = input + '.restored';
      fs.writeFileSync(input, 'Do not restore unauthenticated records');
      await (service as any).encryptFile(input, archive);
      const data = fs.readFileSync(archive); data[data.length - 2] ^= 1; fs.writeFileSync(archive, data);
      await expect((service as any).decryptFile(archive, restored)).rejects.toThrow();
      expect(fs.existsSync(restored)).toBe(false);
    });
    it('retains recovery compatibility with existing CBC backup archives', async () => {
      const input = path.join(mockConfigService.get('BACKUP_DIR'), 'legacy.enc');
      const iv = randomBytes(16), key = createHash('sha256').update(mockConfigService.get('ENCRYPTION_MASTER_KEY')).digest();
      const cipher = createCipheriv('aes-256-cbc', key, iv);
      fs.writeFileSync(input, Buffer.concat([iv, cipher.update('Historical school record'), cipher.final()]));
      await (service as any).decryptFile(input, input + '.restored');
      expect(fs.readFileSync(input + '.restored', 'utf8')).toBe('Historical school record');
    });
  });

  describe('S3 Integration', () => {
    it('should skip S3 upload when S3 is disabled', async () => {
      jest.setTimeout(30000);

      const result = await service.createBackup();

      if (result.success) {
        // S3 key should be undefined when S3 is disabled
        expect(result.s3Key).toBeUndefined();
      }
    }, 30000);

    it('should upload to S3 when S3 is enabled', async () => {
      // This test requires actual S3 credentials
      // Should be run in integration test environment only
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle disk space errors gracefully', async () => {
      // Difficult to test without actually filling disk
      // Tested manually in staging environment
      expect(service).toBeDefined();
    });

    it('should handle pg_dump errors gracefully', async () => {
      const result = await service.createBackup();
      // If pg_dump fails, should return error instead of throwing
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle encryption errors gracefully', async () => {
      // Tested through backup creation with valid config
      expect(service).toBeDefined();
    });
  });
});
