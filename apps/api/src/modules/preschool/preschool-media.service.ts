import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { Actor } from '../operations/operations.service';
import { PreschoolAccessService } from './preschool-access.service';
import { PreschoolService } from './preschool.service';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_UPLOAD = 10;

@Injectable()
export class PreschoolMediaService {
  constructor(
    private db: PrismaService,
    private storage: StorageService,
    private access: PreschoolAccessService,
    private preschool: PreschoolService
  ) {}
  private validatePhotoFile(file: Express.Multer.File) {
    if (!file?.buffer || file.size > MAX_PHOTO_BYTES)
      throw new BadRequestException('Choose JPEG or PNG photos up to 5 MB each');
    const b = file.buffer;
    const png =
      b.length > 24 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg =
      b.length > 4 &&
      b[0] === 255 &&
      b[1] === 216 &&
      b[2] === 255 &&
      b[b.length - 2] === 255 &&
      b[b.length - 1] === 217;
    if (!png && !jpeg) throw new BadRequestException('Choose a valid JPEG or PNG photo');
    return {
      buffer: b,
      name: randomUUID() + (png ? '.png' : '.jpg'),
      mimeType: png ? 'image/png' : 'image/jpeg',
    };
  }
  private validatePhotoBatch(files: Express.Multer.File[]) {
    if (!Array.isArray(files) || !files.length)
      throw new BadRequestException('Choose at least one JPEG or PNG photo');
    if (files.length > MAX_PHOTOS_PER_UPLOAD)
      throw new BadRequestException(`Upload up to ${MAX_PHOTOS_PER_UPLOAD} photos at a time`);
    return files.map((file) => this.validatePhotoFile(file));
  }
  private async uploadValidatedFiles(
    validated: { buffer: Buffer; name: string; mimeType: string }[]
  ) {
    const tenantId = this.access.tenant();
    const uploaded: { key: string; name: string; mimeType: string; size: number }[] = [];
    try {
      for (const item of validated) {
        const result = await this.storage.uploadFile(item.buffer, {
          tenantId,
          category: 'photos',
          filename: item.name,
          mimeType: item.mimeType,
        });
        uploaded.push({
          key: result.key,
          name: item.name,
          mimeType: item.mimeType,
          size: item.buffer.length,
        });
      }
      return uploaded;
    } catch (error) {
      await Promise.all(
        uploaded.map((item) => this.storage.deleteFile(item.key, tenantId).catch(() => undefined))
      );
      throw error;
    }
  }
  async upload(user: Actor, studentId: string, file: Express.Multer.File, caption = '') {
    this.access.allow(user);
    const child = await this.access.student(user, studentId);
    if (!this.storage.isConfigured())
      throw new ServiceUnavailableException(
        'Photo storage has not been connected. Contact your school administrator'
      );
    const validated = this.validatePhotoFile(file);
    const result = await this.storage.uploadFile(validated.buffer, {
      tenantId: this.access.tenant(),
      category: 'photos',
      filename: validated.name,
      mimeType: validated.mimeType,
    });
    const cleanCaption = (caption || '').trim();
    try {
      return await this.db.$transaction(async (tx) => {
        const row = await tx.mediaItem.create({
          data: {
            tenantId: this.access.tenant(),
            studentId,
            classId: child.currentClassId,
            fileName: validated.name,
            fileUrl: result.key,
            fileType: 'PHOTO',
            fileSize: validated.buffer.length,
            mimeType: validated.mimeType,
            caption: cleanCaption,
            uploadedBy: user.userId,
            isVisibleToParents: true,
          },
        });
        await tx.activityFeed.create({
          data: {
            tenantId: this.access.tenant(),
            studentId,
            activityType: 'OTHER',
            title: 'New preschool photo',
            description: cleanCaption || 'Your teacher shared a classroom photo.',
            createdBy: user.userId,
            isVisibleToParents: true,
          },
        });
        await this.preschool.audit(tx, user, 'PRESCHOOL_PHOTO_SHARED', row.id);
        return { id: row.id };
      });
    } catch (error) {
      await this.storage.deleteFile(result.key, this.access.tenant()).catch(() => undefined);
      throw error;
    }
  }
  async uploadMany(
    user: Actor,
    studentId: string,
    files: Express.Multer.File[],
    caption = ''
  ) {
    this.access.allow(user);
    const child = await this.access.student(user, studentId);
    if (!this.storage.isConfigured())
      throw new ServiceUnavailableException(
        'Photo storage has not been connected. Contact your school administrator'
      );
    const validated = this.validatePhotoBatch(files);
    if (validated.length === 1) {
      const single = await this.upload(user, studentId, files[0], caption);
      return { id: single.id, ids: [single.id], count: 1 };
    }
    const tenantId = this.access.tenant();
    const cleanCaption = (caption || '').trim();
    const uploaded = await this.uploadValidatedFiles(validated);
    try {
      return await this.db.$transaction(async (tx) => {
        const ids: string[] = [];
        for (const item of uploaded) {
          const row = await tx.mediaItem.create({
            data: {
              tenantId,
              studentId,
              classId: child.currentClassId,
              fileName: item.name,
              fileUrl: item.key,
              fileType: 'PHOTO',
              fileSize: item.size,
              mimeType: item.mimeType,
              caption: cleanCaption,
              uploadedBy: user.userId,
              isVisibleToParents: true,
            },
          });
          ids.push(row.id);
        }
        await tx.activityFeed.create({
          data: {
            tenantId,
            studentId,
            activityType: 'OTHER',
            title: `${ids.length} new preschool photos`,
            description:
              cleanCaption || `Your teacher shared ${ids.length} classroom photos.`,
            createdBy: user.userId,
            isVisibleToParents: true,
          },
        });
        await this.preschool.audit(tx, user, 'PRESCHOOL_PHOTO_SHARED', ids[0]);
        return { id: ids[0], ids, count: ids.length };
      });
    } catch (error) {
      await Promise.all(
        uploaded.map((item) => this.storage.deleteFile(item.key, tenantId).catch(() => undefined))
      );
      throw error;
    }
  }
  async uploadClassPhotos(
    user: Actor,
    classId: string,
    files: Express.Multer.File[],
    caption = ''
  ) {
    this.access.allow(user);
    await this.access.classroom(user, classId);
    if (!this.storage.isConfigured())
      throw new ServiceUnavailableException(
        'Photo storage has not been connected. Contact your school administrator'
      );
    const validated = this.validatePhotoBatch(files);
    const tenantId = this.access.tenant();
    const cleanCaption = (caption || '').trim();
    const uploaded = await this.uploadValidatedFiles(validated);
    try {
      return await this.db.$transaction(async (tx) => {
        const ids: string[] = [];
        for (const item of uploaded) {
          const row = await tx.mediaItem.create({
            data: {
              tenantId,
              studentId: null,
              classId,
              fileName: item.name,
              fileUrl: item.key,
              fileType: 'PHOTO',
              fileSize: item.size,
              mimeType: item.mimeType,
              caption: cleanCaption,
              uploadedBy: user.userId,
              isVisibleToParents: true,
            },
          });
          ids.push(row.id);
        }
        const students = await tx.student.findMany({
          where: {
            tenantId,
            currentClassId: classId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: { id: true },
        });
        if (students.length) {
          const title =
            ids.length === 1
              ? 'New classroom photo'
              : `${ids.length} new classroom photos`;
          const description =
            cleanCaption ||
            (ids.length === 1
              ? 'Your teacher shared a classroom activity photo with the class.'
              : `Your teacher shared ${ids.length} classroom activity photos with the class.`);
          await tx.activityFeed.createMany({
            data: students.map((s) => ({
              tenantId,
              studentId: s.id,
              classId,
              activityType: 'OTHER' as const,
              title,
              description,
              createdBy: user.userId,
              isVisibleToParents: true,
            })),
          });
        }
        await this.preschool.audit(tx, user, 'PRESCHOOL_CLASS_PHOTO_SHARED', classId);
        return {
          classId,
          id: ids[0],
          ids,
          count: ids.length,
          sharedWithStudents: students.length,
        };
      });
    } catch (error) {
      await Promise.all(
        uploaded.map((item) => this.storage.deleteFile(item.key, tenantId).catch(() => undefined))
      );
      throw error;
    }
  }
  async list(user: Actor, studentId: string, offset = 0) {
    const child = await this.access.student(user, studentId);
    const scopeFilter = child.currentClassId
      ? [{ studentId }, { studentId: null, classId: child.currentClassId }]
      : [{ studentId }];
    const rows = await this.db.mediaItem.findMany({
      where: {
        tenantId: this.access.tenant(),
        fileType: 'PHOTO',
        isVisibleToParents: true,
        OR: scopeFilter,
      },
      select: { id: true, caption: true, createdAt: true, studentId: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: offset,
      take: 21,
    });
    return {
      items: rows.slice(0, 20).map(({ studentId: sid, ...row }) => ({
        ...row,
        scope: sid === null ? ('CLASS' as const) : ('CHILD' as const),
      })),
      hasMore: rows.length > 20,
    };
  }
  async listClassPhotos(user: Actor, classId: string, offset = 0) {
    this.access.allow(user);
    await this.access.classroom(user, classId);
    const rows = await this.db.mediaItem.findMany({
      where: {
        tenantId: this.access.tenant(),
        studentId: null,
        classId,
        fileType: 'PHOTO',
        isVisibleToParents: true,
      },
      select: { id: true, caption: true, createdAt: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: offset,
      take: 21,
    });
    return {
      items: rows.slice(0, 20).map((row) => ({ ...row, scope: 'CLASS' as const })),
      hasMore: rows.length > 20,
    };
  }
  async view(user: Actor, studentId: string, id: string) {
    const child = await this.access.student(user, studentId);
    const scopeFilter = child.currentClassId
      ? [{ studentId }, { studentId: null, classId: child.currentClassId }]
      : [{ studentId }];
    const media = await this.db.mediaItem.findFirst({
      where: {
        id,
        tenantId: this.access.tenant(),
        fileType: 'PHOTO',
        isVisibleToParents: true,
        OR: scopeFilter,
      },
    });
    if (!media) throw new NotFoundException('Photo not found');
    return this.storage.getPresignedUrl(media.fileUrl, 120, {
      tenantId: this.access.tenant(),
      responseContentDisposition: 'inline',
    });
  }
  async viewClassPhoto(user: Actor, classId: string, id: string) {
    this.access.allow(user);
    await this.access.classroom(user, classId);
    const media = await this.db.mediaItem.findFirst({
      where: {
        id,
        tenantId: this.access.tenant(),
        studentId: null,
        classId,
        fileType: 'PHOTO',
        isVisibleToParents: true,
      },
    });
    if (!media) throw new NotFoundException('Photo not found');
    return this.storage.getPresignedUrl(media.fileUrl, 120, {
      tenantId: this.access.tenant(),
      responseContentDisposition: 'inline',
    });
  }
  async remove(user: Actor, studentId: string, id: string) {
    this.access.allow(user);
    const child = await this.access.student(user, studentId);
    const tenantId = this.access.tenant();
    const scopeFilter = child.currentClassId
      ? [{ studentId }, { studentId: null, classId: child.currentClassId }]
      : [{ studentId }];
    const media = await this.db.mediaItem.findFirst({
      where: {
        id,
        tenantId,
        fileType: 'PHOTO',
        OR: scopeFilter,
      },
    });
    if (!media) throw new NotFoundException('Photo not found');
    const isClassPhoto = media.studentId === null;
    await this.db.$transaction(async (tx) => {
      await tx.mediaItem.deleteMany({
        where: isClassPhoto
          ? { id: media.id, tenantId, studentId: null, classId: child.currentClassId, fileType: 'PHOTO' }
          : { id: media.id, tenantId, studentId, fileType: 'PHOTO' },
      });
      await this.preschool.audit(
        tx,
        user,
        isClassPhoto ? 'PRESCHOOL_CLASS_PHOTO_DELETED' : 'PRESCHOOL_PHOTO_DELETED',
        media.id
      );
    });
    const storageRemoved = this.storage.isConfigured()
      ? await this.storage
          .deleteFile(media.fileUrl, tenantId)
          .then(() => true)
          .catch(() => false)
      : false;
    return { deleted: true, id: media.id, storageRemoved };
  }
  async removeClassPhoto(user: Actor, classId: string, id: string) {
    this.access.allow(user);
    await this.access.classroom(user, classId);
    const tenantId = this.access.tenant();
    const media = await this.db.mediaItem.findFirst({
      where: {
        id,
        tenantId,
        studentId: null,
        classId,
        fileType: 'PHOTO',
      },
    });
    if (!media) throw new NotFoundException('Photo not found');
    await this.db.$transaction(async (tx) => {
      await tx.mediaItem.deleteMany({
        where: { id: media.id, tenantId, studentId: null, classId, fileType: 'PHOTO' },
      });
      await this.preschool.audit(tx, user, 'PRESCHOOL_CLASS_PHOTO_DELETED', media.id);
    });
    const storageRemoved = this.storage.isConfigured()
      ? await this.storage
          .deleteFile(media.fileUrl, tenantId)
          .then(() => true)
          .catch(() => false)
      : false;
    return { deleted: true, id: media.id, storageRemoved };
  }
}
