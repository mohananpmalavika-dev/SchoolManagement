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

  const validJpeg = () =>
    ({
      buffer: Buffer.from([255, 216, 255, 224, 0, 16, 255, 217]),
      size: 8,
      mimetype: 'image/jpeg',
    }) as any;
  const validPng = () => {
    const buf = Buffer.alloc(32);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buf, 0);
    return { buffer: buf, size: 32, mimetype: 'image/png' } as any;
  };

  it('uploads multiple photos for a child in one batch and rejects invalid or oversized batches before touching storage', async () => {
    let createdSeq = 0;
    const db: any = {
      mediaItem: {
        create: jest.fn(async () => ({ id: 'photo-' + ++createdSeq })),
      },
      activityFeed: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn(async (work: (tx: any) => unknown) => work(db)),
    };
    const storage: any = {
      isConfigured: () => true,
      uploadFile: jest.fn(async (_buf: Buffer, opts: { filename: string }) => ({
        key: 'tenant/photos/' + opts.filename,
      })),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const access: any = {
      allow: jest.fn(),
      student: jest.fn().mockResolvedValue({ id: 'child', currentClassId: 'class-1' }),
      tenant: () => 'tenant',
    };
    const preschool: any = { audit: jest.fn().mockResolvedValue(undefined) };
    const service = new PreschoolMediaService(db, storage, access, preschool);

    // Reject if any file in the batch is invalid before uploading any file
    await expect(
      service.uploadMany(
        { userId: 'teacher', role: 'TEACHER' },
        'child',
        [validJpeg(), { buffer: Buffer.from('<html>bad</html>'), size: 16 } as any],
        'Art time'
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.uploadFile).not.toHaveBeenCalled();

    // Reject batches over 10 photos
    await expect(
      service.uploadMany(
        { userId: 'teacher', role: 'TEACHER' },
        'child',
        Array.from({ length: 11 }, validJpeg),
        'Too many'
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.uploadFile).not.toHaveBeenCalled();

    // Valid multi-photo upload
    const result = await service.uploadMany(
      { userId: 'teacher', role: 'TEACHER' },
      'child',
      [validJpeg(), validPng()],
      'Finger painting'
    );
    expect(result).toEqual({ id: 'photo-1', ids: ['photo-1', 'photo-2'], count: 2 });
    expect(storage.uploadFile).toHaveBeenCalledTimes(2);
    expect(db.mediaItem.create).toHaveBeenCalledTimes(2);
    expect(db.activityFeed.create).toHaveBeenCalledTimes(1);
    expect(db.activityFeed.create.mock.calls[0][0].data.title).toBe('2 new preschool photos');
  });

  it('shares class-wide multi-photos with all active students without duplicating storage objects and exposes them in student listings', async () => {
    let createdSeq = 0;
    const db: any = {
      mediaItem: {
        create: jest.fn(async ({ data }: { data: any }) => ({
          id: 'class-photo-' + ++createdSeq,
          ...data,
        })),
        findMany: jest.fn().mockResolvedValue([
          { id: 'class-photo-1', caption: 'Garden walk', createdAt: new Date(), studentId: null },
          { id: 'child-photo-1', caption: 'Blocks', createdAt: new Date(), studentId: 'child-1' },
        ]),
        findFirst: jest.fn().mockResolvedValue({
          id: 'class-photo-1',
          studentId: null,
          classId: 'class-1',
          fileUrl: 'tenant/photos/class-1.jpg',
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      student: {
        findMany: jest.fn().mockResolvedValue([{ id: 'child-1' }, { id: 'child-2' }]),
      },
      activityFeed: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: jest.fn(async (work: (tx: any) => unknown) => work(db)),
    };
    const storage: any = {
      isConfigured: () => true,
      uploadFile: jest.fn(async (_buf: Buffer, opts: { filename: string }) => ({
        key: 'tenant/photos/' + opts.filename,
      })),
      getPresignedUrl: jest.fn().mockResolvedValue({ url: 'https://signed.example/class-1.jpg' }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    const access: any = {
      allow: jest.fn((user: { role: string }) => {
        if (user.role === 'PARENT') throw new ForbiddenException();
      }),
      classroom: jest.fn().mockResolvedValue({ id: 'class-1', name: 'Nursery' }),
      student: jest.fn().mockResolvedValue({ id: 'child-1', currentClassId: 'class-1' }),
      tenant: () => 'tenant',
    };
    const preschool: any = { audit: jest.fn().mockResolvedValue(undefined) };
    const service = new PreschoolMediaService(db, storage, access, preschool);

    // Parents cannot upload class photos
    await expect(
      service.uploadClassPhotos({ userId: 'parent', role: 'PARENT' }, 'class-1', [validJpeg()], '')
    ).rejects.toBeInstanceOf(ForbiddenException);

    // Teacher uploads 2 class-wide photos
    const uploaded = await service.uploadClassPhotos(
      { userId: 'teacher', role: 'TEACHER' },
      'class-1',
      [validJpeg(), validPng()],
      'Garden walk'
    );
    expect(uploaded).toEqual({
      classId: 'class-1',
      id: 'class-photo-1',
      ids: ['class-photo-1', 'class-photo-2'],
      count: 2,
      sharedWithStudents: 2,
    });
    expect(storage.uploadFile).toHaveBeenCalledTimes(2);
    expect(db.mediaItem.create.mock.calls[0][0].data).toMatchObject({
      studentId: null,
      classId: 'class-1',
      caption: 'Garden walk',
      isVisibleToParents: true,
    });
    expect(db.activityFeed.createMany).toHaveBeenCalledTimes(1);
    expect(db.activityFeed.createMany.mock.calls[0][0].data).toHaveLength(2);
    expect(preschool.audit).toHaveBeenCalledWith(
      db,
      { userId: 'teacher', role: 'TEACHER' },
      'PRESCHOOL_CLASS_PHOTO_SHARED',
      'class-1'
    );

    // Parent listing child's photos gets both CLASS and CHILD scopes
    const list = await service.list({ userId: 'parent', role: 'PARENT' }, 'child-1', 0);
    expect(list.items.map((item) => ({ id: item.id, scope: item.scope }))).toEqual([
      { id: 'class-photo-1', scope: 'CLASS' },
      { id: 'child-photo-1', scope: 'CHILD' },
    ]);
    expect(db.mediaItem.findMany.mock.calls[0][0].where.OR).toEqual([
      { studentId: 'child-1' },
      { studentId: null, classId: 'class-1' },
    ]);

    // Parent can view a class-wide photo via their child's route
    const viewed = await service.view(
      { userId: 'parent', role: 'PARENT' },
      'child-1',
      'class-photo-1'
    );
    expect(viewed).toEqual({ url: 'https://signed.example/class-1.jpg' });

    // Teacher deletes a class-wide photo
    const removed = await service.removeClassPhoto(
      { userId: 'teacher', role: 'TEACHER' },
      'class-1',
      'class-photo-1'
    );
    expect(removed).toEqual({ deleted: true, id: 'class-photo-1', storageRemoved: true });
    expect(preschool.audit).toHaveBeenLastCalledWith(
      db,
      { userId: 'teacher', role: 'TEACHER' },
      'PRESCHOOL_CLASS_PHOTO_DELETED',
      'class-photo-1'
    );
  });
});
