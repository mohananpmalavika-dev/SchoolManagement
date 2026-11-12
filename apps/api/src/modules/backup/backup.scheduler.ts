import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { BackupService } from './backup.service';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);
  private readonly backupEnabled: boolean;
  private readonly backupSchedule: string;
  private readonly retentionDays: number;

  constructor(
    private readonly backupService: BackupService,
    private readonly configService: ConfigService,
  ) {
    this.backupEnabled = this.configService.get<string>('BACKUP_ENABLED', 'false') === 'true';
    this.backupSchedule = this.configService.get<string>('BACKUP_SCHEDULE', '0 2 * * *'); // Default: 2 AM daily
    this.retentionDays = parseInt(this.configService.get<string>('BACKUP_RETENTION_DAYS', '14'));

    if (this.backupEnabled) {
      this.logger.log(`Automated backups enabled with schedule: ${this.backupSchedule}`);
      this.logger.log(`Backup retention: ${this.retentionDays} days`);
    } else {
      this.logger.warn('Automated backups disabled. Set BACKUP_ENABLED=true to enable.');
    }
  }

  /**
   * Automated daily backup (runs at 2 AM by default)
   * Override schedule with BACKUP_SCHEDULE environment variable
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'automated-backup',
    timeZone: 'Asia/Kolkata', // India Standard Time
  })
  async handleAutomatedBackup(): Promise<void> {
    if (!this.backupEnabled) {
      return;
    }

    this.logger.log('Starting automated database backup...');

    try {
      const result = await this.backupService.createBackup();

      if (result.success) {
        this.logger.log(
          `Automated backup completed successfully: ${result.backupId} (${(result.size / 1024 / 1024).toFixed(2)} MB in ${result.duration}ms)`
        );

        // Verify backup integrity
        const isValid = await this.backupService.verifyBackup(result.backupId);
        if (isValid) {
          this.logger.log(`Backup verification passed: ${result.backupId}`);
        } else {
          this.logger.error(`Backup verification failed: ${result.backupId}`);
          // TODO: Send alert notification
        }
      } else {
        this.logger.error(`Automated backup failed: ${result.error}`);
        // TODO: Send alert notification
      }
    } catch (error: any) {
      this.logger.error(`Automated backup error: ${error.message}`, error.stack);
      // TODO: Send alert notification
    }
  }

  /**
   * Automated backup cleanup (runs weekly on Sunday at 3 AM)
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'backup-cleanup',
    timeZone: 'Asia/Kolkata',
  })
  async handleBackupCleanup(): Promise<void> {
    if (!this.backupEnabled) {
      return;
    }

    this.logger.log('Starting automated backup cleanup...');

    try {
      const deletedCount = await this.backupService.pruneOldBackups(this.retentionDays);
      this.logger.log(`Backup cleanup completed: ${deletedCount} old backups deleted`);
    } catch (error: any) {
      this.logger.error(`Backup cleanup error: ${error.message}`, error.stack);
    }
  }

  /**
   * Weekly backup verification (runs on Monday at 1 AM)
   * Verifies all backups from the last 7 days
   */
  @Cron('0 1 * * 1', {
    name: 'backup-verification',
    timeZone: 'Asia/Kolkata',
  })
  async handleWeeklyVerification(): Promise<void> {
    if (!this.backupEnabled) {
      return;
    }

    this.logger.log('Starting weekly backup verification...');

    try {
      const backups = await this.backupService.listBackups();
      const recentBackups = backups.filter((backup) => {
        const daysSinceBackup = (Date.now() - backup.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceBackup <= 7;
      });

      this.logger.log(`Verifying ${recentBackups.length} recent backups...`);

      let verifiedCount = 0;
      let failedCount = 0;

      for (const backup of recentBackups) {
        const isValid = await this.backupService.verifyBackup(backup.backupId);
        if (isValid) {
          verifiedCount++;
        } else {
          failedCount++;
          this.logger.error(`Backup verification failed: ${backup.backupId}`);
        }
      }

      this.logger.log(
        `Weekly verification completed: ${verifiedCount} verified, ${failedCount} failed`
      );

      if (failedCount > 0) {
        // TODO: Send alert notification
      }
    } catch (error: any) {
      this.logger.error(`Weekly verification error: ${error.message}`, error.stack);
    }
  }
}
