import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionUtil } from './encryption.util';

describe('EncryptionUtil', () => {
  let encryptionUtil: EncryptionUtil;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionUtil,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_MASTER_KEY') {
                return 'test-master-key-that-is-at-least-32-characters-long-for-security';
              }
              if (key === 'ENCRYPTION_SALT') {
                return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    encryptionUtil = module.get<EncryptionUtil>(EncryptionUtil);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryptionUtil.encrypt(plaintext);
      const decrypted = await encryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt sensitive credentials', async () => {
      const credentials = {
        apiKey: 'sk_test_1234567890abcdef',
        apiSecret: 'very-secret-passphrase-12345',
        passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      };

      for (const [key, value] of Object.entries(credentials)) {
        const encrypted = await encryptionUtil.encrypt(value);
        const decrypted = await encryptionUtil.decrypt(encrypted);
        expect(decrypted).toBe(value);
      }
    });

    it('should produce different ciphertext for same plaintext (unique IV)', async () => {
      const plaintext = 'same plaintext';
      const encrypted1 = await encryptionUtil.encrypt(plaintext);
      const encrypted2 = await encryptionUtil.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      const decrypted1 = await encryptionUtil.decrypt(encrypted1);
      const decrypted2 = await encryptionUtil.decrypt(encrypted2);

      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('should handle special characters and unicode', async () => {
      const plaintext = '🔐 Special: !@#$%^&*()_+-=[]{}|;:",.<>?/~` Unicode: 你好世界';
      const encrypted = await encryptionUtil.encrypt(plaintext);
      const decrypted = await encryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', async () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = await encryptionUtil.encrypt(plaintext);
      const decrypted = await encryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for empty plaintext', async () => {
      await expect(encryptionUtil.encrypt('')).rejects.toThrow(
        'Cannot encrypt empty value'
      );
    });

    it('should throw error for empty ciphertext', async () => {
      await expect(encryptionUtil.decrypt('')).rejects.toThrow(
        'Cannot decrypt empty value'
      );
    });

    it('should throw error for invalid encrypted format', async () => {
      await expect(encryptionUtil.decrypt('invalid-format')).rejects.toThrow(
        'Invalid encrypted format'
      );
    });

    it('should throw error for tampered data', async () => {
      const plaintext = 'original text';
      const encrypted = await encryptionUtil.encrypt(plaintext);

      // Tamper with the encrypted data
      const [iv, authTag, data] = encrypted.split(':');
      const tamperedData = data.slice(0, -4) + 'XXXX';
      const tampered = `${iv}:${authTag}:${tamperedData}`;

      await expect(encryptionUtil.decrypt(tampered)).rejects.toThrow();
    });

    it('should throw error for tampered auth tag', async () => {
      const plaintext = 'original text';
      const encrypted = await encryptionUtil.encrypt(plaintext);

      // Tamper with the auth tag
      const [iv, authTag, data] = encrypted.split(':');
      const tamperedAuthTag = authTag.slice(0, -4) + 'XXXX';
      const tampered = `${iv}:${tamperedAuthTag}:${data}`;

      await expect(encryptionUtil.decrypt(tampered)).rejects.toThrow();
    });
  });

  describe('encryptMany and decryptMany', () => {
    it('should encrypt multiple values', async () => {
      const values = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };

      const encrypted = await encryptionUtil.encryptMany(values);

      expect(Object.keys(encrypted)).toEqual(['key1', 'key2', 'key3']);
      expect(encrypted.key1).not.toBe(values.key1);
      expect(encrypted.key2).not.toBe(values.key2);
      expect(encrypted.key3).not.toBe(values.key3);

      const decrypted = await encryptionUtil.decryptMany(encrypted);

      expect(decrypted).toEqual(values);
    });

    it('should handle empty values in batch encryption', async () => {
      const values = {
        key1: 'value1',
        key2: '',
        key3: 'value3',
      };

      const encrypted = await encryptionUtil.encryptMany(values);

      expect(encrypted.key1).toBeTruthy();
      expect(encrypted.key2).toBeFalsy();
      expect(encrypted.key3).toBeTruthy();
    });
  });

  describe('isEncrypted', () => {
    it('should detect encrypted values', async () => {
      const plaintext = 'test value';
      const encrypted = await encryptionUtil.encrypt(plaintext);

      expect(encryptionUtil.isEncrypted(encrypted)).toBe(true);
    });

    it('should detect non-encrypted values', () => {
      expect(encryptionUtil.isEncrypted('plain text')).toBe(false);
      expect(encryptionUtil.isEncrypted('base64string==')).toBe(false);
      expect(encryptionUtil.isEncrypted('')).toBe(false);
    });
  });

  describe('migrateFromBase64', () => {
    it('should migrate base64-encoded value to encrypted', async () => {
      const originalValue = 'secret-api-key';
      const base64Value = Buffer.from(originalValue).toString('base64');

      const migrated = await encryptionUtil.migrateFromBase64(base64Value);

      expect(migrated).not.toBe(base64Value);
      expect(encryptionUtil.isEncrypted(migrated!)).toBe(true);

      const decrypted = await encryptionUtil.decrypt(migrated!);
      expect(decrypted).toBe(originalValue);
    });

    it('should not re-encrypt already encrypted values', async () => {
      const plaintext = 'already encrypted value';
      const encrypted = await encryptionUtil.encrypt(plaintext);

      const migrated = await encryptionUtil.migrateFromBase64(encrypted);

      expect(migrated).toBe(encrypted);
    });

    it('should handle null values', async () => {
      const migrated = await encryptionUtil.migrateFromBase64(null);
      expect(migrated).toBeNull();
    });
  });

  describe('key initialization', () => {
    it('should throw error if ENCRYPTION_MASTER_KEY not set', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionUtil,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => null),
            },
          },
        ],
      }).compile();

      const util = module.get<EncryptionUtil>(EncryptionUtil);

      await expect(util.encrypt('test')).rejects.toThrow(
        'ENCRYPTION_MASTER_KEY not configured'
      );
    });

    it('should throw error if ENCRYPTION_MASTER_KEY too short', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionUtil,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'ENCRYPTION_MASTER_KEY') return 'short';
                return null;
              }),
            },
          },
        ],
      }).compile();

      const util = module.get<EncryptionUtil>(EncryptionUtil);

      await expect(util.encrypt('test')).rejects.toThrow(
        'ENCRYPTION_MASTER_KEY must be at least 32 characters'
      );
    });
  });

  describe('static utility methods', () => {
    it('should generate valid master key', () => {
      const masterKey = EncryptionUtil.generateMasterKey();

      expect(masterKey).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]{64}$/.test(masterKey)).toBe(true);
    });

    it('should generate valid salt', () => {
      const salt = EncryptionUtil.generateSalt();

      expect(salt).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]{64}$/.test(salt)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = EncryptionUtil.generateMasterKey();
      const key2 = EncryptionUtil.generateMasterKey();

      expect(key1).not.toBe(key2);
    });
  });
});
