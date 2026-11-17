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

@Injectable()
export class PreschoolMediaService {
  constructor(
    private db: PrismaService,
    private storage: StorageService,
    private access: PreschoolAccessService,
    private preschool: PreschoolService
  ) {}
  async upload(user: Actor, studentId: string, file: Express.Multer.File, caption: string) {
    this.access.allow(user);
    const child = await this.access.student(user, studentId);
    if (!this.storage.isConfigured())
      throw new ServiceUnavailableException(
        'Photo storage has not been connected. Contact your school administrator'
      );
    if (!file?.buffer || file.size > 5 * 1024 * 1024)
      throw new BadRequestException('Choose a JPEG or PNG photo up to 5 MB');
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
    const name = randomUUID() + (png ? '.png' : '.jpg'),
      mimeType = png ? 'image/png' : 'image/jpeg';
    const result = await this.storage.uploadFile(b, {
      tenantId: this.access.tenant(),
      category: 'photos',
      filename: name,
      mimeType,
    });
    try {
      return await this.db.$transaction(async (tx) => {
        const row = await tx.mediaItem.create({
          data: {
            tenantId: this.access.tenant(),
            studentId,
            classId: child.currentClassId,
            fileName: name,
            fileUrl: result.key,
            fileType: 'PHOTO',
            fileSize: b.length,
            mimeType,
            caption: caption.trim(),
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
            description: caption.trim() || 'Your teacher shared a classroom photo.',
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
  async list(user: Actor, studentId: string, offset = 0) {
    await this.access.student(user, studentId);
    const rows = await this.db.mediaItem.findMany({
      where: {
        tenantId: this.access.tenant(),
        studentId,
        fileType: 'PHOTO',
        isVisibleToParents: true,
      },
      select: { id: true, caption: true, createdAt: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: offset,
      take: 21,
    });
    return { items: rows.slice(0, 20), hasMore: rows.length > 20 };
  }
  async view(user: Actor, studentId: string, id: string) {
    await this.access.student(user, studentId);
    const media = await this.db.mediaItem.findFirst({
      where: {
        id,
        tenantId: this.access.tenant(),
        studentId,
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
}
