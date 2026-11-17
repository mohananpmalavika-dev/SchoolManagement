import { BadRequestException, ForbiddenException } from '@nestjs/common';
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
});
