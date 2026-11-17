import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { StorageService } from '../../common/services/storage.service';
import { UploadMediaDto, MediaType } from './dto/upload-media.dto';
import { QueryMediaDto } from './dto/query-media.dto';
import { randomBytes } from 'crypto';
import * as path from 'path';
import 'multer';
import { Actor } from '../operations/operations.service';

@Injectable()
export class MediaService {
  async authorize(user: Actor, media: { studentId?: string | null; classId?: string | null; isVisibleToParents?: boolean | null }) {
    const tenantId = this.tenantService.requireTenantContext();
    if (['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'].includes(user.role)) return;
    if (user.role === 'PARENT') {
      if (!media.isVisibleToParents || !media.studentId && !media.classId) throw new ForbiddenException('Photo access denied');
      const link = await this.prisma.guardianStudentLink.findFirst({ where: { guardian: { tenantId, userId: user.userId }, student: { tenantId, deletedAt: null, ...(media.studentId ? { id: media.studentId } : { currentClassId: media.classId! }) } } });
      if (!link) throw new ForbiddenException('This photo is not shared with your family');
      return;
    }
    if (!['TEACHER', 'CLASS_TEACHER'].includes(user.role)) throw new ForbiddenException('Media access denied');
    const staff = await this.prisma.staff.findFirst({ where: { tenantId, userId: user.userId, status: 'ACTIVE', isTeacher: true } });
    const child = media.studentId ? await this.prisma.student.findFirst({ where: { id: media.studentId, tenantId, deletedAt: null }, select: { currentClassId: true } }) : null;
    const classId = child?.currentClassId || media.classId;
    if (!staff || !classId || media.classId && child?.currentClassId && media.classId !== child.currentClassId) throw new ForbiddenException('Choose a child in an assigned class');
    const [lesson, assignment] = await Promise.all([
      this.prisma.timetableEntry.findFirst({ where: { tenantId, teacherId: staff.id, classId } }),
      this.prisma.preschoolStaffAssignment.findFirst({ where: { tenantId, staffId: staff.id, classId } }),
    ]);
    if (!lesson && !assignment) throw new ForbiddenException('This class is not assigned to you');
  }
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private readonly allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  private readonly allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private storageService: StorageService,
  ) {}

  async upload(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    userId: string,
  ) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds maximum allowed (50MB)');
    }

    // Determine media type from mime type
    let mediaType: MediaType;
    let storageCategory: 'photos' | 'videos' | 'documents';
    
    if (this.allowedImageTypes.includes(file.mimetype)) {
      mediaType = MediaType.PHOTO;
      storageCategory = 'photos';
    } else if (this.allowedVideoTypes.includes(file.mimetype)) {
      mediaType = MediaType.VIDEO;
      storageCategory = 'videos';
    } else if (this.allowedDocumentTypes.includes(file.mimetype)) {
      mediaType = MediaType.DOCUMENT;
      storageCategory = 'documents';
    } else {
      throw new BadRequestException(
        'Unsupported file type. Allowed: images (jpg, png, gif, webp), videos (mp4, mpeg, mov, avi), documents (pdf, doc, docx)',
      );
    }

    // Verify associations belong to tenant
    if (dto.studentId) {
      const student = await this.prisma.student.findFirst({
        where: { id: dto.studentId, tenantId },
      });
      if (!student) {
        throw new NotFoundException('Student not found');
      }
    }

    if (dto.classId) {
      const classObj = await this.prisma.class.findFirst({
        where: { id: dto.classId, tenantId },
      });
      if (!classObj) {
        throw new NotFoundException('Class not found');
      }
    }

    if (dto.activityFeedId) {
      const activity = await this.prisma.activityFeed.findFirst({
        where: { id: dto.activityFeedId, tenantId },
      });
      if (!activity) {
        throw new NotFoundException('Activity not found');
      }
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const randomSuffix = randomBytes(8).toString('hex');
    const fileName = `${Date.now()}-${randomSuffix}${fileExt}`;

    // Upload to S3 with tenant isolation
    const uploadResult = await this.storageService.uploadFile(file, {
      tenantId,
      category: storageCategory,
      filename: fileName,
      mimeType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        studentId: dto.studentId || '',
        classId: dto.classId || '',
      },
    });

    // For images, we could generate thumbnails here
    // For now, we'll use the same URL for thumbnail
    const thumbnailUrl = mediaType === MediaType.PHOTO ? uploadResult.url : null;

    // Create media record with S3 key stored in fileUrl
    const media = await this.prisma.mediaItem.create({
      data: {
        tenantId,
        fileName: file.originalname,
        fileUrl: uploadResult.key, // Store S3 key, not full URL
        thumbnailUrl,
        fileType: mediaType,
        fileSize: file.size,
        mimeType: file.mimetype,
        studentId: dto.studentId,
        classId: dto.classId,
        activityFeedId: dto.activityFeedId,
        caption: dto.caption,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : null,
        uploadedBy: userId,
        isVisibleToParents: dto.isVisibleToParents ?? true,
      },
    });

    return {
      ...media,
      fileUrl: uploadResult.url, // Return public URL in response
    };
  }

  async findAll(query: QueryMediaDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.classId) {
      where.classId = query.classId;
    }

    if (query.activityFeedId) {
      where.activityFeedId = query.activityFeedId;
    }

    if (query.fileType) {
      where.fileType = query.fileType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [mediaItems, total] = await Promise.all([
      this.prisma.mediaItem.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.mediaItem.count({ where }),
    ]);

    return {
      data: mediaItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const media = await this.prisma.mediaItem.findFirst({
      where: { id, tenantId },
      include: {
        activityFeed: {
          select: {
            id: true,
            title: true,
            activityType: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async remove(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const media = await this.findOne(id);

    // Delete file from S3 (tenant validation handled by StorageService)
    try {
      await this.storageService.deleteFile(media.fileUrl, tenantId);
    } catch (error) {
      // Log error but don't fail the deletion
      console.error('Failed to delete file from S3:', error);
    }

    // Delete record
    await this.prisma.mediaItem.delete({
      where: { id },
    });

    return { message: 'Media deleted successfully' };
  }

  // Parent-facing methods
  async getStudentMedia(
    studentId: string,
    guardianId: string,
    query: QueryMediaDto,
  ) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access to this student
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: {
        guardianId,
        studentId,
      },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    const where: any = {
      tenantId,
      studentId,
      isVisibleToParents: true,
    };

    if (query.fileType) {
      where.fileType = query.fileType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [mediaItems, total] = await Promise.all([
      this.prisma.mediaItem.findMany({
        where,
        include: {
          activityFeed: {
            select: {
              id: true,
              title: true,
              activityType: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.mediaItem.count({ where }),
    ]);

    return {
      data: mediaItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get media gallery for class
  async getClassGallery(classId: string, query: QueryMediaDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const classObj = await this.prisma.class.findFirst({
      where: { id: classId, tenantId },
    });

    if (!classObj) {
      throw new NotFoundException('Class not found');
    }

    return this.findAll({ ...query, classId });
  }

  /**
   * Get pre-signed URL for secure file access
   * This method validates tenant ownership before generating the URL
   */
  async getPresignedUrl(mediaId: string, expiresIn: number = 3600): Promise<{ url: string; expiresIn: number }> {
    const tenantId = this.tenantService.requireTenantContext();

    // Get media item
    const media = await this.findOne(mediaId);

    // Generate pre-signed URL (tenant validation handled by StorageService)
    return this.storageService.getPresignedUrl(media.fileUrl, expiresIn, {
      tenantId,
      responseContentDisposition: `inline; filename="${media.fileName}"`,
    });
  }
}
