import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PreschoolMediaService } from './preschool-media.service';
import { MediaService } from '../media/media.service';
describe('Preschool private media', () => {
  it('authorizes the child before attempting any object-storage upload', async () => {
    const storage: any = { uploadFile: jest.fn() },
      access: any = {
        allow: jest.fn(),
        student: jest.fn().mockRejectedValue(new ForbiddenException()),
        tenant: () => 'tenant',
      };
    const service = new PreschoolMediaService({} as any, storage, access, {} as any);
    await expect(
      service.upload({ userId: 'teacher', role: 'TEACHER' }, 'foreign-child', {} as any, '')
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });
  it('rejects an HTML upload even if the declared MIME type is JPEG', async () => {
    const storage: any = { isConfigured: () => true, uploadFile: jest.fn() },
      access: any = {
        allow: jest.fn(),
        student: jest.fn().mockResolvedValue({ currentClassId: 'class' }),
        tenant: () => 'tenant',
      };
    const service = new PreschoolMediaService({} as any, storage, access, {} as any);
    await expect(
      service.upload(
        { userId: 'teacher', role: 'TEACHER' },
        'child',
        {
          buffer: Buffer.from('<html>not a photo</html>'),
          size: 25,
          mimetype: 'image/jpeg',
        } as any,
        ''
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });
  it('closes the legacy presigned-photo route to unlinked parents', async () => {
    const db: any = { guardianStudentLink: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new MediaService(
      db,
      { requireTenantContext: () => 'tenant' } as any,
      {} as any
    );
    await expect(
      service.authorize(
        { userId: 'parent', role: 'PARENT' },
        { studentId: 'other-child', isVisibleToParents: true }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.guardianStudentLink.findFirst.mock.calls[0][0].where.guardian).toEqual({
      tenantId: 'tenant',
      userId: 'parent',
    });
    await expect(
      service.authorize(
        { userId: 'parent', role: 'PARENT' },
        { studentId: 'child', isVisibleToParents: false }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('deletes a mistakenly uploaded photo from DB and object storage with audit trail and denies parents', async () => {
    const db: any = {
      mediaItem: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'photo-1',
          fileUrl: 'tenant/photos/wrong.jpg',
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (work: (tx: any) => unknown) => work(db)),
    };
    const storage: any = {
      isConfigured: () => true,
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const access: any = {
      allow: jest.fn((user: { role: string }) => {
        if (user.role === 'PARENT') throw new ForbiddenException();
      }),
      student: jest.fn().mockResolvedValue({ id: 'child', currentClassId: 'class' }),
      tenant: () => 'tenant',
    };
    const preschool: any = { audit: jest.fn().mockResolvedValue(undefined) };
    const service = new PreschoolMediaService(db, storage, access, preschool);

    await expect(
      service.remove({ userId: 'parent', role: 'PARENT' }, 'child', 'photo-1')
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.mediaItem.deleteMany).not.toHaveBeenCalled();

    const result = await service.remove({ userId: 'teacher', role: 'TEACHER' }, 'child', 'photo-1');
    expect(result).toEqual({ deleted: true, id: 'photo-1', storageRemoved: true });
    expect(db.mediaItem.deleteMany).toHaveBeenCalledWith({
      where: { id: 'photo-1', tenantId: 'tenant', studentId: 'child', fileType: 'PHOTO' },
    });
    expect(preschool.audit).toHaveBeenCalledWith(
      db,
      { userId: 'teacher', role: 'TEACHER' },
      'PRESCHOOL_PHOTO_DELETED',
      'photo-1'
    );
    expect(storage.deleteFile).toHaveBeenCalledWith('tenant/photos/wrong.jpg', 'tenant');

    db.mediaItem.findFirst.mockResolvedValue(null);
    await expect(
      service.remove({ userId: 'teacher', role: 'TEACHER' }, 'child', 'missing-photo')
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
