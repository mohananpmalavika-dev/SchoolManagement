import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { UploadMediaDto, MediaType } from './dto/upload-media.dto';
import { QueryMediaDto } from './dto/query-media.dto';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class MediaService {
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private readonly allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  private readonly allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
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
    if (this.allowedImageTypes.includes(file.mimetype)) {
      mediaType = MediaType.PHOTO;
    } else if (this.allowedVideoTypes.includes(file.mimetype)) {
      mediaType = MediaType.VIDEO;
    } else if (this.allowedDocumentTypes.includes(file.mimetype)) {
      mediaType = MediaType.DOCUMENT;
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

    // Create directory structure: uploads/{tenantId}/{year}/{month}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadPath = path.join(this.uploadDir, tenantId, String(year), month);

    try {
      await mkdir(uploadPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = path.join(uploadPath, fileName);
    const relativeUrl = `/uploads/${tenantId}/${year}/${month}/${fileName}`;

    // Save file to disk
    await writeFile(filePath, file.buffer);

    // For images, we could generate thumbnails here
    // For now, we'll use the same URL for thumbnail
    const thumbnailUrl = mediaType === MediaType.PHOTO ? relativeUrl : null;

    // Create media record
    const media = await this.prisma.mediaItem.create({
      data: {
        tenantId,
        fileName: file.originalname,
        fileUrl: relativeUrl,
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

    return media;
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

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), media.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but don't fail the deletion
      console.error('Failed to delete file from disk:', error);
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
}
