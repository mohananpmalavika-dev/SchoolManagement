import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AES-256-GCM Encryption Utility
 * 
 * Provides secure encryption/decryption for sensitive credentials such as:
 * - M-Pesa API keys and secrets
 * - NEMIS API credentials
 * - KNEC API credentials
 * - Other sensitive school configuration
 * 
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - Unique IV (initialization vector) per encryption
 * - Authentication tag for integrity verification
 * - Key derivation from master key using scrypt
 * - Base64 encoding for storage compatibility
 * 
 * Format: {iv}:{authTag}:{encryptedData} (all base64 encoded)
 */
@Injectable()
export class EncryptionUtil {
  private readonly logger = new Logger(EncryptionUtil.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // 128 bits for GCM
  private readonly authTagLength = 16; // 128 bits authentication tag
  private readonly saltLength = 32; // 256 bits salt for key derivation
  private readonly keyLength = 32; // 256 bits key
  private readonly scryptCost = 16384; // N parameter for scrypt (CPU/memory cost)
  
  private encryptionKey: Buffer | null = null;
  private salt: Buffer | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize encryption key from environment
   * Must be called before encrypt/decrypt operations
   */
  private async ensureKeyInitialized(): Promise<void> {
    if (this.encryptionKey) {
      return;
    }

    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    
    if (!masterKey) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY not configured. Please set this environment variable to a secure random string (minimum 32 characters).'
      );
    }

    if (masterKey.length < 32) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY must be at least 32 characters long for security.'
      );
    }

    // Get or generate salt
    const saltConfig = this.configService.get<string>('ENCRYPTION_SALT');
    
    if (saltConfig) {
      // Use configured salt
      this.salt = Buffer.from(saltConfig, 'hex');
      
      if (this.salt.length !== this.saltLength) {
        throw new Error(
          `ENCRYPTION_SALT must be ${this.saltLength * 2} hex characters (${this.saltLength} bytes)`
        );
      }
    } else {
      // Generate salt (should be done once and stored in config)
      this.salt = crypto.randomBytes(this.saltLength);
      this.logger.warn(
        `ENCRYPTION_SALT not configured. Generated salt: ${this.salt.toString('hex')}. ` +
        'IMPORTANT: Add this to your .env file as ENCRYPTION_SALT to ensure data can be decrypted after restart.'
      );
    }

    // Derive encryption key using scrypt
    this.encryptionKey = await new Promise((resolve, reject) => {
      crypto.scrypt(
        masterKey,
        this.salt!,  // Non-null assertion since we validated above
        this.keyLength,
        { N: this.scryptCost },
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });

    this.logger.log('Encryption key initialized successfully');
  }

  /**
   * Encrypt a string value
   * 
   * @param plaintext - The string to encrypt
   * @returns Encrypted string in format: {iv}:{authTag}:{encryptedData}
   * @throws Error if encryption fails or key not initialized
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty value');
    }

    await this.ensureKeyInitialized();

    try {
      // Generate unique IV for this encryption
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey!,
        iv,
        { authTagLength: this.authTagLength }
      );

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return as base64-encoded string: iv:authTag:encrypted
      return [
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted,
      ].join(':');
    } catch (error: any) {
      this.logger.error('Encryption failed', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt an encrypted string
   * 
   * @param encrypted - Encrypted string in format: {iv}:{authTag}:{encryptedData}
   * @returns Decrypted plaintext string
   * @throws Error if decryption fails, data is tampered, or format is invalid
   */
  async decrypt(encrypted: string): Promise<string> {
    if (!encrypted) {
      throw new Error('Cannot decrypt empty value');
    }

    await this.ensureKeyInitialized();

    try {
      // Parse encrypted format
      const parts = encrypted.split(':');
      
      if (parts.length !== 3) {
        throw new Error(
          'Invalid encrypted format. Expected format: {iv}:{authTag}:{encryptedData}'
        );
      }

      const [ivBase64, authTagBase64, encryptedData] = parts;

      // Decode components
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Validate lengths
      if (iv.length !== this.ivLength) {
        throw new Error(`Invalid IV length: expected ${this.ivLength}, got ${iv.length}`);
      }

      if (authTag.length !== this.authTagLength) {
        throw new Error(
          `Invalid auth tag length: expected ${this.authTagLength}, got ${authTag.length}`
        );
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey!,
        iv,
        { authTagLength: this.authTagLength }
      );

      // Set authentication tag
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      this.logger.error('Decryption failed', error);
      
      // More specific error for authentication failures (tampered data)
      if (error.message?.includes('Unsupported state or unable to authenticate data')) {
        throw new Error(
          'Decryption failed: Data has been tampered with or encryption key has changed'
        );
      }

      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt multiple values at once
   * Useful for batch encryption operations
   */
  async encryptMany(values: Record<string, string>): Promise<Record<string, string>> {
    const encrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        encrypted[key] = await this.encrypt(value);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt multiple values at once
   * Useful for batch decryption operations
   */
  async decryptMany(values: Record<string, string>): Promise<Record<string, string>> {
    const decrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        try {
          decrypted[key] = await this.decrypt(value);
        } catch (error: any) {
          this.logger.error(`Failed to decrypt value for key: ${key}`, error);
          // Continue with other values
          decrypted[key] = '';
        }
      }
    }

    return decrypted;
  }

  /**
   * Check if a string is encrypted (has the expected format)
   * Useful for migration from base64 to AES-256-GCM
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;

    const parts = value.split(':');
    if (parts.length !== 3) return false;

    try {
      // Check if parts are valid base64
      Buffer.from(parts[0], 'base64');
      Buffer.from(parts[1], 'base64');
      Buffer.from(parts[2], 'base64');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Migrate from base64 encoding to AES-256-GCM encryption
   * Detects if value is already encrypted or needs migration
   */
  async migrateFromBase64(value: string | null): Promise<string | null> {
    if (!value) return null;

    // If already encrypted, return as-is
    if (this.isEncrypted(value)) {
      return value;
    }

    // Otherwise, assume it's base64-encoded and migrate
    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      return await this.encrypt(decoded);
    } catch (error: any) {
      this.logger.warn(`Failed to migrate value from base64: ${error.message}`);
      // If decode fails, try encrypting the value as-is (might be plain text)
      return await this.encrypt(value);
    }
  }

  /**
   * Generate a secure random encryption master key
   * Use this to generate ENCRYPTION_MASTER_KEY for .env
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a secure random salt
   * Use this to generate ENCRYPTION_SALT for .env
   */
  static generateSalt(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
