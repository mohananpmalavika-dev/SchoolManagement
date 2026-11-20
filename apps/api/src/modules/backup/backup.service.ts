import { open } from 'fs/promises';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync, readdirSync, unlinkSync, readFileSync, writeFileSync, renameSync, accessSync, constants } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';
import * as path from 'path';

const execFileAsync = promisify(execFile);
const BACKUP_MAGIC = Buffer.from('KRYPTON-BACKUP-GCM2\n');

export interface BackupResult {
  success: boolean;
  backupId: string;
  filename: string;
  size: number;
  checksum: string;
  s3Key?: string;
  localPath?: string;
  duration: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  backupId: string;
  duration: number;
  recordsRestored?: number;
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly s3Client: S3Client;
  private readonly s3Bucket: string;
  private readonly s3Enabled: boolean;
  private readonly localBackupDir: string;
  private readonly encryptionKey: Buffer;
  private readonly dbConfig: {
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
    sslmode: string;
  };

  constructor(private readonly configService: ConfigService) {
    // S3 Configuration
    const dedicated = ['ENDPOINT','ACCESS_KEY','SECRET_KEY','BUCKET'].some(key => this.configService.get('BACKUP_S3_' + key));
    const prefix = dedicated ? 'BACKUP_S3_' : 'S3_';
    const s3Endpoint = this.configService.get<string>(prefix + 'ENDPOINT');
    const s3AccessKey = this.configService.get<string>(prefix + 'ACCESS_KEY');
    const s3SecretKey = this.configService.get<string>(prefix + 'SECRET_KEY');
    const s3Region = this.configService.get<string>(prefix + 'REGION', 'us-east-1');
    
    this.s3Bucket = this.configService.get<string>(prefix + 'BUCKET', 'krypton-backups');
    this.s3Enabled = !!s3Endpoint && !!s3AccessKey && !!s3SecretKey;

    if (this.s3Enabled) {
      this.s3Client = new S3Client({
        endpoint: s3Endpoint,
        region: s3Region,
        credentials: {
          accessKeyId: s3AccessKey!,
          secretAccessKey: s3SecretKey!,
        },
        forcePathStyle: true, // Required for MinIO
      });
      this.logger.log('S3 backup storage configured');
    } else {
      this.logger.warn('S3 backup storage not configured - backups will be local only');
    }

    // Local backup directory
    this.localBackupDir = this.configService.get<string>('BACKUP_DIR', './backups');
    if (!existsSync(this.localBackupDir)) {
      mkdirSync(this.localBackupDir, { recursive: true, mode: 0o700 });
    }

    // Encryption key for backup encryption
    const keyFile = this.configService.get<string>('BACKUP_ENCRYPTION_KEY_FILE');
    const encryptionMasterKey = keyFile ? readFileSync(keyFile, 'utf8').trim() : this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    if (!encryptionMasterKey || encryptionMasterKey.length < 32) {
      throw new Error('ENCRYPTION_MASTER_KEY must be at least 32 characters for backup encryption');
    }
    // Derive a 32-byte key from master key for AES-256
    this.encryptionKey = createHash('sha256').update(encryptionMasterKey).digest();

    // Database configuration from DATABASE_URL or individual env vars
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (databaseUrl) {
      const url = new URL(databaseUrl);
      this.dbConfig = {
        host: url.hostname,
        port: url.port || '5432',
        database: decodeURIComponent(url.pathname.slice(1)),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        sslmode: url.searchParams.get('sslmode') || process.env.PGSSLMODE || 'prefer',
      };
    } else {
      this.dbConfig = {
        host: this.configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: this.configService.get<string>('POSTGRES_PORT', '5432'),
        database: this.configService.get<string>('POSTGRES_DB', 'krypton'),
        user: this.configService.get<string>('POSTGRES_USER', 'krypton'),
        password: this.configService.get<string>('POSTGRES_PASSWORD', ''),
        sslmode: process.env.PGSSLMODE || 'prefer',
      };
    }
  }

  /**
   * Create a full database backup
   * Process: pg_dump -> gzip -> encrypt -> upload to S3
   */
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = `backup_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const filename = `${backupId}.sql.gz.enc`;
    const localPath = path.join(this.localBackupDir, filename);
    const pgDumpFile = path.join(this.localBackupDir, `${backupId}.sql`);
    const gzipFile = `${pgDumpFile}.gz`;

    this.logger.log(`Starting database backup: ${backupId}`);

    try {
      // Step 1: Execute pg_dump with gzip compression
      if (this.configService.get('BACKUP_REQUIRE_OFFSITE') === 'true' && !this.s3Enabled)
        throw new Error('Off-site backup storage is required');
      
      this.logger.log('Executing pg_dump...');
      const dumpHandle = await open(pgDumpFile, 'wx', 0o600); await dumpHandle.close();
      await execFileAsync('pg_dump', ['-h', this.dbConfig.host, '-p', this.dbConfig.port, '-U', this.dbConfig.user, '-d', this.dbConfig.database, '--no-owner', '--no-privileges', '--clean', '--if-exists', '-f', pgDumpFile], {
        timeout: Number(this.configService.get('BACKUP_TIMEOUT_MS', 1800000)),
        env: {
          ...process.env,
          PGPASSWORD: this.dbConfig.password,
          PGSSLMODE: this.dbConfig.sslmode,
          PGCONNECT_TIMEOUT: '10',
        },
      });

      // Step 2: Compress with gzip
      const readStream = createReadStream(pgDumpFile);
      const writeStream = createWriteStream(gzipFile, {mode:0o600});
      const gzip = createGzip({ level: 9 });
      await pipeline(readStream, gzip, writeStream);

      // Step 3: Encrypt with authenticated AES-256-GCM
      const encryptedFile = `${gzipFile}.enc`;
      await this.encryptFile(gzipFile, encryptedFile);

      // Step 4: Calculate checksum of encrypted file
      const checksum = await this.calculateChecksum(encryptedFile);

      // Step 5: Get file size (cross-platform)
      const stats = statSync(encryptedFile);
      const size = stats.size;
      if (!await this.verifyBackup(backupId)) throw new Error('Archive verification failed');

      // Step 6: Upload to S3 if enabled
      let s3Key: string | undefined;
      if (this.s3Enabled) {
        s3Key = `backups/${filename}`;
        await this.uploadToS3(encryptedFile, s3Key, checksum);
        const uploaded = await this.s3Client.send(new HeadObjectCommand({ Bucket: this.s3Bucket, Key: s3Key }));
        if (uploaded.ContentLength !== size || uploaded.Metadata?.checksum !== checksum)
          throw new Error('Off-site object verification failed');
        this.logger.log(`Backup uploaded to S3: ${s3Key}`);
      }

      // Step 7: Clean up intermediate files
      try {
        if (existsSync(pgDumpFile)) unlinkSync(pgDumpFile);
        if (existsSync(gzipFile)) unlinkSync(gzipFile);
      } catch (cleanupErr: any) {
        this.logger.warn(`Failed to clean up intermediate backup files: ${cleanupErr.message}`);
      }

      const duration = Date.now() - startTime;
      this.writeStatus('last-success.json', { backupId, completedAt: new Date().toISOString(),
        size, checksum, offsite: !!s3Key, verified: true,
        keyId: createHash('sha256').update(this.encryptionKey).digest('hex').slice(0, 12) });
      this.writeStatus('last-attempt.json', { at: new Date().toISOString(), success: true });
      this.logger.log(`Backup completed successfully in ${duration}ms: ${backupId}`);

      return {
        success: true,
        backupId,
        filename,
        size,
        checksum,
        s3Key,
        localPath: encryptedFile,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.writeStatus('last-attempt.json', { at: new Date().toISOString(), success: false });
      this.logger.error(`Backup failed after ${duration}ms: ${error.message}`, error.stack);
      
      return {
        success: false,
        backupId,
        filename,
        size: 0,
        checksum: '',
        duration,
        error: error.message,
      };
    } finally {
      // pg_dump/compression/upload failures must not retain plaintext school data.
      for (const file of [pgDumpFile, gzipFile]) if (existsSync(file)) unlinkSync(file);
    }
  }

  private writeStatus(name: string, value: unknown) {
    const target = path.join(this.localBackupDir, name), temporary = target + '.' + randomBytes(6).toString('hex');
    try { writeFileSync(temporary, JSON.stringify(value), { mode: 0o600 }); renameSync(temporary, target); }
    finally { if (existsSync(temporary)) unlinkSync(temporary); }
  }

  async operationalStatus() {
    accessSync(this.localBackupDir, constants.R_OK | constants.W_OK);
    const read = (name: string) => {
      try { return JSON.parse(readFileSync(path.join(this.localBackupDir, name), 'utf8')); } catch { return null; }
    };
    const success = read('last-success.json'), attempt = read('last-attempt.json'), rehearsal = read('last-rehearsal.json');
    const fresh = (value: unknown, hours: number) => typeof value === 'string' &&
      Number.isFinite(Date.parse(value)) && Date.now() >= Date.parse(value) && Date.now() - Date.parse(value) <= hours * 3600000;
    let offsite = 'unconfigured';
    if (this.s3Enabled) {
      try {
        if (!success?.offsite || !success.backupId) throw new Error();
        const object = await this.s3Client.send(new HeadObjectCommand({Bucket:this.s3Bucket,Key:'backups/'+this.backupFilename(success.backupId)}), {abortSignal:AbortSignal.timeout(2500)});
        offsite = object.ContentLength === success.size && object.Metadata?.checksum === success.checksum ? 'healthy' : 'unhealthy';
      } catch { offsite = 'unhealthy'; }
    }
    return {
      localStorage: 'healthy', offsite,
      backup: success?.verified && fresh(success.completedAt, Number(this.configService.get('BACKUP_MAX_AGE_HOURS', 30))) && attempt?.success !== false ? 'healthy' : 'unhealthy',
      lastSuccessAt: success?.completedAt || null,
      rehearsal: rehearsal?.success && rehearsal?.source === 'offsite' && rehearsal?.validation === 'expected-counts' &&
        fresh(rehearsal.completedAt, Number(this.configService.get('RESTORE_MAX_AGE_HOURS', 24 * 35))) ? 'healthy' : 'unverified',
      lastRehearsalAt: rehearsal?.completedAt || null,
    };
  }

  async fetchOffsite(backupId: string) {
    if (!this.s3Enabled) throw new Error('Off-site backup storage is required');
    const filename = this.backupFilename(backupId), target = path.join(this.localBackupDir, filename);
    const temporary = target + '.' + randomBytes(8).toString('hex') + '.download';
    try {
      const object = await this.s3Client.send(new HeadObjectCommand({Bucket:this.s3Bucket,Key:'backups/'+filename}));
      await this.downloadFromS3('backups/' + filename, temporary);
      if (!object.Metadata?.checksum || await this.calculateChecksum(temporary) !== object.Metadata.checksum)
        throw new Error('Off-site checksum mismatch');
      renameSync(temporary, target);
      if (!await this.verifyBackup(backupId)) throw new Error('Off-site archive authentication failed');
    } finally { if (existsSync(temporary)) unlinkSync(temporary); }
  }

  /**
   * Verify a backup by downloading from S3 (if needed) and checking integrity
   */
  async verifyBackup(backupId: string): Promise<boolean> {
    this.logger.log(`Verifying backup: ${backupId}`);

    const temporaryFiles: string[] = [];
    try {
      const filename = this.backupFilename(backupId);
      const localPath = path.join(this.localBackupDir, filename);

      // Download from S3 if not local
      if (!existsSync(localPath) && this.s3Enabled) {
        const s3Key = `backups/${filename}`;
        await this.downloadFromS3(s3Key, localPath);
      }

      if (!existsSync(localPath)) {
        this.logger.error(`Backup file not found: ${localPath}`);
        return false;
      }

      // Verify file is readable and encrypted
      const checksum = await this.calculateChecksum(localPath);
      this.logger.log(`Backup checksum: ${checksum}`);

      // Try to decrypt and decompress first few bytes to verify integrity
      const decryptedFile = `${localPath}.${randomBytes(8).toString('hex')}.dec`;
      temporaryFiles.push(decryptedFile);
      const decompressedFile = `${decryptedFile}.sql`;
      temporaryFiles.push(decompressedFile);

      await this.decryptFile(localPath, decryptedFile);
      
      // Verify it's valid gzip by decompressing
      const readStream = createReadStream(decryptedFile);
      const writeStream = createWriteStream(decompressedFile, { mode: 0o600 });
      const gunzip = createGunzip();
      await pipeline(readStream, gunzip, writeStream);

      // Clean up verification files
      for (const file of [decryptedFile, decompressedFile]) if (existsSync(file)) unlinkSync(file);

      this.logger.log(`Backup verification successful: ${backupId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Backup verification failed: ${error.message}`, error.stack);
      return false;
    } finally {
      for (const file of temporaryFiles) if (existsSync(file)) unlinkSync(file);
    }
  }

  /**
   * Restore database from backup
   * WARNING: This will drop existing data if --clean flag was used in pg_dump
   */
  async restoreBackup(backupId: string, targetDatabase?: string): Promise<RestoreResult> {
    const startTime = Date.now();
    this.logger.warn(`Starting database restore from backup: ${backupId}`);

    const temporaryFiles: string[] = [];
    try {
      const filename = this.backupFilename(backupId);
      const localPath = path.join(this.localBackupDir, filename);

      // Download from S3 if not local
      if (!existsSync(localPath) && this.s3Enabled) {
        const s3Key = `backups/${filename}`;
        this.logger.log(`Downloading backup from S3: ${s3Key}`);
        await this.downloadFromS3(s3Key, localPath);
      }

      if (!existsSync(localPath)) {
        throw new Error(`Backup file not found: ${localPath}`);
      }

      const restoreUrl = this.configService.get<string>('RESTORE_DATABASE_URL');
      const parsed = restoreUrl ? new URL(restoreUrl) : null;
      const target = parsed ? {
        host: parsed.hostname, port: parsed.port || '5432', database: decodeURIComponent(parsed.pathname.slice(1)),
        user: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password),
        sslmode: parsed.searchParams.get('sslmode') || process.env.PGSSLMODE || 'prefer',
      } : { ...this.dbConfig, database: targetDatabase || '' };
      if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(target.database) || ['postgres','template0','template1'].includes(target.database) ||
          (target.host === this.dbConfig.host && target.port === this.dbConfig.port && target.database === this.dbConfig.database))
        throw new Error('Restore requires an explicit different, empty target database');
      if (parsed && !['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('Invalid restore database URL');
      const connection = ['-h', target.host, '-p', target.port, '-U', target.user, '-d', target.database];
      const environment = { ...process.env, PGPASSWORD: target.password, PGSSLMODE: target.sslmode, PGCONNECT_TIMEOUT: '10' };
      const probe = await execFileAsync('psql', ['--no-psqlrc', ...connection, '-v', 'ON_ERROR_STOP=1', '-tAc',
        "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S','f')"],
        { env: environment, timeout: 30000 });
      if (probe.stdout.trim() !== '0') throw new Error('Restore target must be empty');

      // Step 1: Decrypt
      const decryptedFile = `${localPath}.${randomBytes(8).toString('hex')}.dec`;
      temporaryFiles.push(decryptedFile);
      this.logger.log('Decrypting backup...');
      await this.decryptFile(localPath, decryptedFile);

      // Step 2: Decompress
      const decompressedFile = `${decryptedFile}.sql`;
      temporaryFiles.push(decompressedFile);
      this.logger.log('Decompressing backup...');
      const readStream = createReadStream(decryptedFile);
      const writeStream = createWriteStream(decompressedFile, { mode: 0o600 });
      const gunzip = createGunzip();
      await pipeline(readStream, gunzip, writeStream);

      // Step 3: Restore with psql
      const dbName = target.database;
      this.logger.log(`Restoring to database: ${dbName}`);
      
      const { stdout, stderr } = await execFileAsync('psql', ['--no-psqlrc', ...connection, '-v', 'ON_ERROR_STOP=1', '--single-transaction', '-f', decompressedFile], {
        env: environment, timeout: Number(this.configService.get('RESTORE_TIMEOUT_MS', 1800000)),
      });
      
      // Clean up temporary files
      try {
        if (existsSync(decryptedFile)) unlinkSync(decryptedFile);
        if (existsSync(decompressedFile)) unlinkSync(decompressedFile);
      } catch (cleanupErr: any) {
        this.logger.warn(`Failed to clean up temporary restore files: ${cleanupErr.message}`);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Restore completed successfully in ${duration}ms`);

      return {
        success: true,
        backupId,
        duration,
        recordsRestored: this.extractRecordCount(stdout + stderr),
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Restore failed after ${duration}ms: ${error.message}`, error.stack);
      
      return {
        success: false,
        backupId,
        duration,
        error: error.message,
      };
    } finally {
      for (const file of temporaryFiles) if (existsSync(file)) unlinkSync(file);
    }
  }

  /**
   * List all available backups (S3 and local)
   */
  async listBackups(): Promise<Array<{ backupId: string; source: string; size: number; timestamp: Date }>> {
    const backups: Array<{ backupId: string; source: string; size: number; timestamp: Date }> = [];

    // List local backups
    try {
      if (existsSync(this.localBackupDir)) {
        const files = readdirSync(this.localBackupDir);
        for (const file of files) {
          if (file.endsWith('.enc')) {
            const filePath = path.join(this.localBackupDir, file);
            const stats = statSync(filePath);
            const backupId = file.replace(/\.sql\.gz\.enc$/, '').replace(/\.enc$/, '');
            backups.push({
              backupId,
              source: 'local',
              size: stats.size,
              timestamp: stats.mtime,
            });
          }
        }
      }
    } catch (error: any) {
      this.logger.warn(`Failed to list local backups: ${error.message}`);
    }

    return backups;
  }

  /**
   * Delete old backups (retention policy)
   */
  async pruneOldBackups(retentionDays: number = 14): Promise<number> {
    this.logger.log(`Pruning backups older than ${retentionDays} days`);
    
    try {
      let deletedCount = 0;
      if (existsSync(this.localBackupDir)) {
        const files = readdirSync(this.localBackupDir);
        const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
        for (const file of files) {
          if (file.startsWith('backup_') && file.endsWith('.enc')) {
            const filePath = path.join(this.localBackupDir, file);
            const stats = statSync(filePath);
            if (stats.mtimeMs < cutoffTime) {
              unlinkSync(filePath);
              deletedCount++;
            }
          }
        }
      }
      this.logger.log(`Pruned ${deletedCount} old backups`);
      return deletedCount;
    } catch (error: any) {
      this.logger.error(`Failed to prune backups: ${error.message}`);
      return 0;
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  private backupFilename(backupId: string): string {
    if (!/^[A-Za-z0-9_-]+(?:\.sql\.gz\.enc|\.enc)?$/.test(backupId)) throw new Error('Invalid backup identifier');
    return backupId.endsWith('.enc') ? backupId : `${backupId}.sql.gz.enc`;
  }

  /** New archives authenticate their header and ciphertext with AES-256-GCM.
   * Legacy CBC archives remain readable for disaster recovery. */
  private async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    cipher.setAAD(BACKUP_MAGIC);
    const output = createWriteStream(outputPath, { mode: 0o600 });
    output.write(Buffer.concat([BACKUP_MAGIC, iv, Buffer.alloc(16)]));
    await pipeline(createReadStream(inputPath), cipher, output);
    const file = await open(outputPath, 'r+');
    try { await file.write(cipher.getAuthTag(), 0, 16, BACKUP_MAGIC.length + 12); }
    finally { await file.close(); }
  }

  private async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    const header = await this.readBytes(inputPath, BACKUP_MAGIC.length + 28);
    const modern = header.subarray(0, BACKUP_MAGIC.length).equals(BACKUP_MAGIC);
    const offset = modern ? BACKUP_MAGIC.length + 28 : 16;
    if (header.length < offset || statSync(inputPath).size <= offset) throw new Error('Backup file is truncated');
    const output = createWriteStream(outputPath, { mode: 0o600 });
    try {
      if (modern) {
        const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, header.subarray(BACKUP_MAGIC.length, BACKUP_MAGIC.length + 12));
        decipher.setAAD(BACKUP_MAGIC);
        decipher.setAuthTag(header.subarray(BACKUP_MAGIC.length + 12, offset));
        await pipeline(createReadStream(inputPath, { start: offset }), decipher, output);
      } else {
        const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, header.subarray(0, 16));
        await pipeline(createReadStream(inputPath, { start: 16 }), decipher, output);
      }
    } catch (error) {
      output.destroy();
      if (existsSync(outputPath)) unlinkSync(outputPath);
      throw error;
    }
  }

  /**
   * Read first N bytes from file
   */
  private async readBytes(filePath: string, count: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(filePath, { start: 0, end: count - 1 });
      
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Calculate SHA-256 checksum of file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Upload file to S3 with multipart upload for large files
   */
  private async uploadToS3(filePath: string, s3Key: string, checksum: string): Promise<void> {
    const fileStream = createReadStream(filePath);
    
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.s3Bucket,
        Key: s3Key,
        Body: fileStream,
        Metadata: {
          checksum,
          'backup-version': '2.0-gcm',
        },
      },
    });

    await upload.done();
  }

  /**
   * Download file from S3
   */
  private async downloadFromS3(s3Key: string, localPath: string): Promise<void> {
    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);
    const writeStream = createWriteStream(localPath);

    await pipeline(response.Body as any, writeStream);
  }

  /**
   * Extract record count from psql output
   */
  private extractRecordCount(output: string): number {
    const match = output.match(/(\d+)\s+rows/i);
    return match ? parseInt(match[1]) : 0;
  }
}
