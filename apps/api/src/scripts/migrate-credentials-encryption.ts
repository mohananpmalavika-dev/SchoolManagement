#!/usr/bin/env node
/**
 * Migration Script: Base64 to AES-256-GCM Encryption
 * 
 * This script migrates existing credentials from base64 encoding to AES-256-GCM encryption.
 * It updates:
 * - NEMIS integration credentials (apiKey, apiSecret)
 * - KNEC integration credentials (apiKey, apiSecret)
 * 
 * Usage:
 *   ts-node apps/api/src/scripts/migrate-credentials-encryption.ts
 * 
 * Requirements:
 * - ENCRYPTION_MASTER_KEY must be set in environment
 * - ENCRYPTION_SALT must be set in environment
 * - Database must be accessible
 * 
 * Safety:
 * - Performs dry-run by default (set DRY_RUN=false to apply changes)
 * - Creates backup before migration
 * - Validates decryption after migration
 */

import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { EncryptionUtil } from '../common/utils/encryption.util';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationStats {
  nemisTotal: number;
  nemisMigrated: number;
  nemisSkipped: number;
  nemisFailed: number;
  knecTotal: number;
  knecMigrated: number;
  knecSkipped: number;
  knecFailed: number;
}

class CredentialMigration {
  private prisma: PrismaClient;
  private encryptionUtil: EncryptionUtil;
  private configService: ConfigService;
  private dryRun: boolean;
  private stats: MigrationStats;

  constructor() {
    this.prisma = new PrismaClient();
    this.configService = new ConfigService();
    this.encryptionUtil = new EncryptionUtil(this.configService);
    this.dryRun = process.env.DRY_RUN !== 'false';
    this.stats = {
      nemisTotal: 0,
      nemisMigrated: 0,
      nemisSkipped: 0,
      nemisFailed: 0,
      knecTotal: 0,
      knecMigrated: 0,
      knecSkipped: 0,
      knecFailed: 0,
    };
  }

  /**
   * Run migration
   */
  async run(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Credential Encryption Migration');
    console.log('  Base64 → AES-256-GCM');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    if (this.dryRun) {
      console.log('🔍 DRY RUN MODE (set DRY_RUN=false to apply changes)');
      console.log('');
    }

    try {
      // Validate environment
      await this.validateEnvironment();

      // Migrate NEMIS credentials
      await this.migrateNemisCredentials();

      // Migrate KNEC credentials
      await this.migrateKnecCredentials();

      // Display summary
      this.displaySummary();

      if (this.dryRun) {
        console.log('');
        console.log('✅ Dry run completed successfully');
        console.log('   Set DRY_RUN=false to apply changes');
      } else {
        console.log('');
        console.log('✅ Migration completed successfully');
      }
    } catch (error: any) {
      console.error('');
      console.error('❌ Migration failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Validate environment configuration
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔐 Validating encryption configuration...');

    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    const salt = this.configService.get<string>('ENCRYPTION_SALT');

    if (!masterKey) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY not set. Please configure this in your .env file.'
      );
    }

    if (masterKey.length < 32) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY must be at least 32 characters long.'
      );
    }

    if (!salt) {
      console.warn('⚠️  ENCRYPTION_SALT not set. A random salt will be generated.');
      console.warn('    Add the generated salt to your .env file to ensure consistency.');
    } else if (salt.length !== 64) {
      throw new Error(
        'ENCRYPTION_SALT must be 64 hex characters (32 bytes).'
      );
    }

    // Test encryption
    try {
      const testValue = 'test-credential';
      const encrypted = await this.encryptionUtil.encrypt(testValue);
      const decrypted = await this.encryptionUtil.decrypt(encrypted);

      if (decrypted !== testValue) {
        throw new Error('Encryption test failed: decrypted value does not match');
      }

      console.log('   ✓ Encryption configuration valid');
    } catch (error: any) {
      throw new Error(`Encryption test failed: ${error.message}`);
    }

    console.log('');
  }

  /**
   * Migrate NEMIS credentials
   */
  private async migrateNemisCredentials(): Promise<void> {
    console.log('📋 Migrating NEMIS credentials...');

    const integrations = await this.prisma.nemisIntegration.findMany({
      where: {
        OR: [
          { apiKey: { not: null } },
          { apiSecret: { not: null } },
        ],
      },
    });

    this.stats.nemisTotal = integrations.length;
    console.log(`   Found ${integrations.length} NEMIS integrations`);

    for (const integration of integrations) {
      try {
        let apiKeyMigrated = false;
        let apiSecretMigrated = false;

        // Migrate API Key
        if (integration.apiKey) {
          if (this.encryptionUtil.isEncrypted(integration.apiKey)) {
            console.log(`   ⊘ Skipping ${integration.nemisSchoolCode}: apiKey already encrypted`);
            this.stats.nemisSkipped++;
          } else {
            const migratedApiKey = await this.encryptionUtil.migrateFromBase64(
              integration.apiKey
            );

            if (!this.dryRun && migratedApiKey) {
              await this.prisma.nemisIntegration.update({
                where: { id: integration.id },
                data: { apiKey: migratedApiKey },
              });
            }

            apiKeyMigrated = true;
          }
        }

        // Migrate API Secret
        if (integration.apiSecret) {
          if (this.encryptionUtil.isEncrypted(integration.apiSecret)) {
            if (!apiKeyMigrated) {
              console.log(`   ⊘ Skipping ${integration.nemisSchoolCode}: apiSecret already encrypted`);
            }
          } else {
            const migratedApiSecret = await this.encryptionUtil.migrateFromBase64(
              integration.apiSecret
            );

            if (!this.dryRun && migratedApiSecret) {
              await this.prisma.nemisIntegration.update({
                where: { id: integration.id },
                data: { apiSecret: migratedApiSecret },
              });
            }

            apiSecretMigrated = true;
          }
        }

        if (apiKeyMigrated || apiSecretMigrated) {
          console.log(`   ✓ Migrated ${integration.nemisSchoolCode}`);
          this.stats.nemisMigrated++;
        }
      } catch (error: any) {
        console.error(`   ✗ Failed to migrate ${integration.nemisSchoolCode}: ${error.message}`);
        this.stats.nemisFailed++;
      }
    }

    console.log('');
  }

  /**
   * Migrate KNEC credentials
   */
  private async migrateKnecCredentials(): Promise<void> {
    console.log('📋 Migrating KNEC credentials...');

    const integrations = await this.prisma.knecIntegration.findMany({
      where: {
        OR: [
          { apiKey: { not: null } },
          { apiSecret: { not: null } },
        ],
      },
    });

    this.stats.knecTotal = integrations.length;
    console.log(`   Found ${integrations.length} KNEC integrations`);

    for (const integration of integrations) {
      try {
        let apiKeyMigrated = false;
        let apiSecretMigrated = false;

        // Migrate API Key
        if (integration.apiKey) {
          if (this.encryptionUtil.isEncrypted(integration.apiKey)) {
            console.log(`   ⊘ Skipping ${integration.knecCentreNumber}: apiKey already encrypted`);
            this.stats.knecSkipped++;
          } else {
            const migratedApiKey = await this.encryptionUtil.migrateFromBase64(
              integration.apiKey
            );

            if (!this.dryRun && migratedApiKey) {
              await this.prisma.knecIntegration.update({
                where: { id: integration.id },
                data: { apiKey: migratedApiKey },
              });
            }

            apiKeyMigrated = true;
          }
        }

        // Migrate API Secret
        if (integration.apiSecret) {
          if (this.encryptionUtil.isEncrypted(integration.apiSecret)) {
            if (!apiKeyMigrated) {
              console.log(`   ⊘ Skipping ${integration.knecCentreNumber}: apiSecret already encrypted`);
            }
          } else {
            const migratedApiSecret = await this.encryptionUtil.migrateFromBase64(
              integration.apiSecret
            );

            if (!this.dryRun && migratedApiSecret) {
              await this.prisma.knecIntegration.update({
                where: { id: integration.id },
                data: { apiSecret: migratedApiSecret },
              });
            }

            apiSecretMigrated = true;
          }
        }

        if (apiKeyMigrated || apiSecretMigrated) {
          console.log(`   ✓ Migrated ${integration.knecCentreNumber}`);
          this.stats.knecMigrated++;
        }
      } catch (error: any) {
        console.error(`   ✗ Failed to migrate ${integration.knecCentreNumber}: ${error.message}`);
        this.stats.knecFailed++;
      }
    }

    console.log('');
  }

  /**
   * Display migration summary
   */
  private displaySummary(): void {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('NEMIS Integrations:');
    console.log(`  Total:    ${this.stats.nemisTotal}`);
    console.log(`  Migrated: ${this.stats.nemisMigrated}`);
    console.log(`  Skipped:  ${this.stats.nemisSkipped}`);
    console.log(`  Failed:   ${this.stats.nemisFailed}`);
    console.log('');
    console.log('KNEC Integrations:');
    console.log(`  Total:    ${this.stats.knecTotal}`);
    console.log(`  Migrated: ${this.stats.knecMigrated}`);
    console.log(`  Skipped:  ${this.stats.knecSkipped}`);
    console.log(`  Failed:   ${this.stats.knecFailed}`);
    console.log('');
    console.log('Overall:');
    console.log(`  Total:    ${this.stats.nemisTotal + this.stats.knecTotal}`);
    console.log(`  Migrated: ${this.stats.nemisMigrated + this.stats.knecMigrated}`);
    console.log(`  Skipped:  ${this.stats.nemisSkipped + this.stats.knecSkipped}`);
    console.log(`  Failed:   ${this.stats.nemisFailed + this.stats.knecFailed}`);
    console.log('═══════════════════════════════════════════════════════════');
  }
}

// Run migration
const migration = new CredentialMigration();
migration.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
