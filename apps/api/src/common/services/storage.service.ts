import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TenantService } from '../../database/tenant.service';
import { createHash } from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  checksum: string;
}

export interface PresignedUrlResult {
  url: string;
  expiresIn: number;
}

@Injectable()
export class StorageService {
  isConfigured() { return this.s3Enabled; }
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly s3Bucket: string;
  private readonly s3Enabled: boolean;
  private readonly s3PublicUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantService: TenantService,
  ) {
    // S3 Configuration
    const s3Endpoint = this.configService.get<string>('S3_ENDPOINT');
    const s3AccessKey = this.configService.get<string>('S3_ACCESS_KEY');
    const s3SecretKey = this.configService.get<string>('S3_SECRET_KEY');
    const s3Region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const s3UseSSL = this.configService.get<string>('S3_USE_SSL', 'true') === 'true';
    
    this.s3Bucket = this.configService.get<string>('S3_BUCKET', 'krypton-media');
    this.s3PublicUrl = this.configService.get<string>('S3_PUBLIC_URL', s3Endpoint || '');
    this.s3Enabled = !!s3Endpoint && !!s3AccessKey && !!s3SecretKey;

    if (this.s3Enabled) {
      this.s3Client = new S3Client({
        endpoint: s3Endpoint,
        region: s3Region,
        credentials: {
          accessKeyId: s3AccessKey || '',
          secretAccessKey: s3SecretKey || '',
        },
        forcePathStyle: true, // Required for MinIO
      });
      this.logger.log('S3 storage service initialized');
    } else {
      this.logger.warn('S3 storage not configured - file uploads will fail');
    }
  }

  /**
   * Upload file to S3 with tenant isolation
   * Files are stored with key pattern: {tenantId}/media/{category}/{year}/{month}/{filename}
   */
  async uploadFile(
    file: Buffer | Express.Multer.File,
    options: {
      tenantId?: string;
      category: 'photos' | 'documents' | 'videos' | 'exports' | 'imports';
      filename: string;
      mimeType: string;
      metadata?: Record<string, string>;
    },
  ): Promise<UploadResult> {
    // Get tenant ID (from parameter or current context)
    const tenantId = options.tenantId || this.tenantService.requireTenantContext();

    if (!this.s3Enabled) {
      throw new Error('S3 storage not configured');
    }

    // Generate S3 key with tenant prefix
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // CRITICAL: Always prefix with tenantId for tenant isolation
    const s3Key = `${tenantId}/${options.category}/${year}/${month}/${options.filename}`;

    // Get file buffer
    const fileBuffer = Buffer.isBuffer(file) ? file : file.buffer;

    // Calculate checksum
    const checksum = createHash('sha256').update(fileBuffer).digest('hex');

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: options.mimeType,
      Metadata: {
        tenantId, // Store tenant ID in metadata for additional verification
        checksum,
        ...options.metadata,
      },
    });

    await this.s3Client.send(command);

    this.logger.log(`File uploaded: ${s3Key} (${fileBuffer.length} bytes, tenant: ${tenantId})`);

    return {
      key: s3Key,
      url: this.getPublicUrl(s3Key),
      size: fileBuffer.length,
      mimeType: options.mimeType,
      checksum,
    };
  }

  /**
   * Get pre-signed URL for secure file download
   * CRITICAL: Validates tenant ownership before generating URL
   */
  async getPresignedUrl(
    s3Key: string,
    expiresIn: number = 3600, // 1 hour default
    options?: {
      tenantId?: string;
      responseContentDisposition?: string;
    },
  ): Promise<PresignedUrlResult> {
    // Extract tenant ID from S3 key (format: {tenantId}/...)
    const keyTenantId = this.extractTenantIdFromKey(s3Key);
    if (!keyTenantId) {
      throw new ForbiddenException('Invalid S3 key format - tenant ID missing');
    }

    // Get current tenant context
    const currentTenantId = options?.tenantId || this.tenantService.requireTenantContext();

    // CRITICAL SECURITY CHECK: Verify tenant ownership
    if (keyTenantId !== currentTenantId) {
      this.logger.warn(
        `Cross-tenant access attempt blocked: tenant ${currentTenantId} tried to access file from tenant ${keyTenantId}`
      );
      throw new ForbiddenException('Access denied - file belongs to different tenant');
    }

    if (!this.s3Enabled) {
      throw new Error('S3 storage not configured');
    }

    // Verify file exists and metadata matches
    await this.verifyFileOwnership(s3Key, currentTenantId);

    // Generate pre-signed URL
    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: s3Key,
      ResponseContentDisposition: options?.responseContentDisposition,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    this.logger.log(`Pre-signed URL generated: ${s3Key} (expires in ${expiresIn}s, tenant: ${currentTenantId})`);

    return {
      url,
      expiresIn,
    };
  }

  /**
   * Delete file from S3 with tenant validation
   */
  async deleteFile(s3Key: string, tenantId?: string): Promise<void> {
    // Extract tenant ID from S3 key
    const keyTenantId = this.extractTenantIdFromKey(s3Key);
    if (!keyTenantId) {
      throw new ForbiddenException('Invalid S3 key format - tenant ID missing');
    }

    // Get current tenant context
    const currentTenantId = tenantId || this.tenantService.requireTenantContext();

    // CRITICAL SECURITY CHECK: Verify tenant ownership
    if (keyTenantId !== currentTenantId) {
      this.logger.warn(
        `Cross-tenant delete attempt blocked: tenant ${currentTenantId} tried to delete file from tenant ${keyTenantId}`
      );
      throw new ForbiddenException('Access denied - file belongs to different tenant');
    }

    if (!this.s3Enabled) {
      throw new Error('S3 storage not configured');
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: this.s3Bucket,
      Key: s3Key,
    });

    await this.s3Client.send(command);

    this.logger.log(`File deleted: ${s3Key} (tenant: ${currentTenantId})`);
  }

  /**
   * Get file metadata (including tenant verification)
   */
  async getFileMetadata(s3Key: string, tenantId?: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    metadata: Record<string, string>;
  }> {
    // Extract tenant ID from S3 key
    const keyTenantId = this.extractTenantIdFromKey(s3Key);
    if (!keyTenantId) {
      throw new ForbiddenException('Invalid S3 key format - tenant ID missing');
    }

    // Get current tenant context
    const currentTenantId = tenantId || this.tenantService.requireTenantContext();

    // CRITICAL SECURITY CHECK: Verify tenant ownership
    if (keyTenantId !== currentTenantId) {
      throw new ForbiddenException('Access denied - file belongs to different tenant');
    }

    if (!this.s3Enabled) {
      throw new Error('S3 storage not configured');
    }

    const command = new HeadObjectCommand({
      Bucket: this.s3Bucket,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);

    // Verify metadata tenant ID matches
    if (response.Metadata?.tenantid !== currentTenantId) {
      this.logger.error(
        `Metadata tenant mismatch for ${s3Key}: key=${keyTenantId}, metadata=${response.Metadata?.tenantid}, current=${currentTenantId}`
      );
      throw new ForbiddenException('File metadata verification failed');
    }

    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType || 'application/octet-stream',
      metadata: response.Metadata || {},
    };
  }

  /**
   * List files for a tenant with optional prefix
   */
  async listFiles(
    tenantId: string,
    prefix?: string,
  ): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    // Verify tenant context
    const currentTenantId = this.tenantService.requireTenantContext();
    if (tenantId !== currentTenantId) {
      throw new ForbiddenException('Cannot list files for different tenant');
    }

    // Build prefix with tenant isolation
    const fullPrefix = prefix ? `${tenantId}/${prefix}` : `${tenantId}/`;

    if (!this.s3Enabled) {
      this.logger.log(`List files requested for tenant ${tenantId} with prefix: ${fullPrefix}`);
      return [];
    }

    // Note: ListObjectsV2 is used for listing, but implementation would require pagination
    // For now, returning empty array as placeholder
    // In production, implement with ListObjectsV2Command and pagination

    this.logger.log(`List files requested for tenant ${tenantId} with prefix: ${fullPrefix}`);
    return [];
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Extract tenant ID from S3 key
   * Expected format: {tenantId}/...
   */
  private extractTenantIdFromKey(s3Key: string): string | null {
    const parts = s3Key.split('/');
    if (parts.length < 2 || parts[0] === 'no-tenant-prefix' || !parts[0]) {
      return null;
    }
    return parts[0];
  }

  /**
   * Verify file ownership by checking S3 metadata
   */
  private async verifyFileOwnership(s3Key: string, expectedTenantId: string): Promise<void> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.s3Bucket,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);

      // Verify metadata tenant ID matches
      // Note: S3 metadata keys are lowercased
      const metadataTenantId = response.Metadata?.tenantid || response.Metadata?.tenantId;
      
      if (metadataTenantId && metadataTenantId !== expectedTenantId) {
        throw new ForbiddenException('File metadata verification failed - tenant mismatch');
      }
    } catch (error: any) {
      if (error.name === 'NotFound' || error.statusCode === 404) {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  /**
   * Get public URL for S3 object
   * Note: This returns a direct URL, not pre-signed. Use getPresignedUrl() for private files.
   */
  private getPublicUrl(s3Key: string): string {
    if (this.s3PublicUrl) {
      return `${this.s3PublicUrl}/${this.s3Bucket}/${s3Key}`;
    }
    return `https://${this.s3Bucket}.s3.amazonaws.com/${s3Key}`;
  }
}
