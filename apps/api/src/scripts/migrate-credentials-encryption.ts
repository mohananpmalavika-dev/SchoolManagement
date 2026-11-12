#!/usr/bin/env node
/**
 * Migration Script: Base64 to AES-256-GCM Encryption
 *
 * Updates stored credentials for:
 * - UDISE+ integration credentials (apiKey, apiSecret)
 * - Board Exam integration credentials (apiKey, apiSecret)
 */

import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { EncryptionUtil } from '../common/utils/encryption.util';
import * as dotenv from 'dotenv';

dotenv.config();

interface MigrationStats {
  udiseTotal: number;
  udiseMigrated: number;
  udiseSkipped: number;
  udiseFailed: number;
  boardTotal: number;
  boardMigrated: number;
  boardSkipped: number;
  boardFailed: number;
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
      udiseTotal: 0,
      udiseMigrated: 0,
      udiseSkipped: 0,
      udiseFailed: 0,
      boardTotal: 0,
      boardMigrated: 0,
      boardSkipped: 0,
      boardFailed: 0,
    };
  }

  async run(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Indian Govt Portal Credential Encryption Migration');
    console.log('  Base64 -> AES-256-GCM');
    console.log('═══════════════════════════════════════════════════════════');

    try {
      await this.validateEnvironment();
      await this.migrateUdiseCredentials();
      await this.migrateBoardCredentials();
      this.displaySummary();
    } catch (error: any) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async validateEnvironment(): Promise<void> {
    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    if (!masterKey || masterKey.length < 32) {
      throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters long.');
    }
    const encrypted = await this.encryptionUtil.encrypt('test-credential');
    const decrypted = await this.encryptionUtil.decrypt(encrypted);
    if (decrypted !== 'test-credential') {
      throw new Error('Encryption test failed');
    }
  }

  private async migrateUdiseCredentials(): Promise<void> {
    const integrations = await this.prisma.udiseIntegration.findMany({
      where: { OR: [{ apiKey: { not: null } }, { apiSecret: { not: null } }] },
    });
    this.stats.udiseTotal = integrations.length;

    for (const integration of integrations) {
      try {
        let migrated = false;
        if (integration.apiKey && !this.encryptionUtil.isEncrypted(integration.apiKey)) {
          const val = await this.encryptionUtil.migrateFromBase64(integration.apiKey);
          if (!this.dryRun && val) {
            await this.prisma.udiseIntegration.update({ where: { id: integration.id }, data: { apiKey: val } });
          }
          migrated = true;
        }
        if (integration.apiSecret && !this.encryptionUtil.isEncrypted(integration.apiSecret)) {
          const val = await this.encryptionUtil.migrateFromBase64(integration.apiSecret);
          if (!this.dryRun && val) {
            await this.prisma.udiseIntegration.update({ where: { id: integration.id }, data: { apiSecret: val } });
          }
          migrated = true;
        }
        if (migrated) this.stats.udiseMigrated++;
        else this.stats.udiseSkipped++;
      } catch {
        this.stats.udiseFailed++;
      }
    }
  }

  private async migrateBoardCredentials(): Promise<void> {
    const integrations = await this.prisma.boardIntegration.findMany({
      where: { OR: [{ apiKey: { not: null } }, { apiSecret: { not: null } }] },
    });
    this.stats.boardTotal = integrations.length;

    for (const integration of integrations) {
      try {
        let migrated = false;
        if (integration.apiKey && !this.encryptionUtil.isEncrypted(integration.apiKey)) {
          const val = await this.encryptionUtil.migrateFromBase64(integration.apiKey);
          if (!this.dryRun && val) {
            await this.prisma.boardIntegration.update({ where: { id: integration.id }, data: { apiKey: val } });
          }
          migrated = true;
        }
        if (integration.apiSecret && !this.encryptionUtil.isEncrypted(integration.apiSecret)) {
          const val = await this.encryptionUtil.migrateFromBase64(integration.apiSecret);
          if (!this.dryRun && val) {
            await this.prisma.boardIntegration.update({ where: { id: integration.id }, data: { apiSecret: val } });
          }
          migrated = true;
        }
        if (migrated) this.stats.boardMigrated++;
        else this.stats.boardSkipped++;
      } catch {
        this.stats.boardFailed++;
      }
    }
  }

  private displaySummary(): void {
    console.log('UDISE+ Integrations:', this.stats.udiseTotal, 'Migrated:', this.stats.udiseMigrated);
    console.log('Board Integrations:', this.stats.boardTotal, 'Migrated:', this.stats.boardMigrated);
  }
}

const migration = new CredentialMigration();
migration.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
