import { ConfigService } from '@nestjs/config';
import { CommunicationsService } from '../communications/communications.service';
import { MessageChannel } from '../communications/dto/send-message.dto';

describe('Push communication inbox outbox', () => {
  let db: any, service: CommunicationsService;
  const message = {id: 'message', tenantId: 'school', channel: MessageChannel.PUSH, status: 'SENT', body: 'Private school message'};
  beforeEach(() => {
    db = {
      user: {findMany: jest.fn().mockResolvedValue([{id: 'parent'}])},
      student: {findMany: jest.fn()},
      communication: {create: jest.fn().mockResolvedValue(message), findUnique: jest.fn().mockResolvedValue(message), update: jest.fn()},
      communicationLog: {create: jest.fn()},
    };
    service = new CommunicationsService(db, {requireTenantContext: () => 'school'} as any,
      new ConfigService({WEB_PUSH_PUBLIC_KEY: 'public', WEB_PUSH_PRIVATE_KEY: 'private', WEB_PUSH_SUBJECT: 'mailto:school@example.test'}));
  });
  it('persists PUSH messages to recipient inbox logs for durable background delivery', async () => {
    await service.sendMessage({channel: MessageChannel.PUSH, recipients: ['parent'], subject: 'School update', message: 'Private school message'}, 'teacher');
    expect(db.communicationLog.create).toHaveBeenCalledWith({data: {communicationId: 'message', recipient: 'parent', channel: 'IN_APP', status: 'SENT', sentAt: expect.any(Date)}});
    expect(db.communication.update.mock.calls[0][0].data.status).toBe('SENT');
  });
  it('rejects recipients that are not active users in the same school before creating messages', async () => {
    db.user.findMany.mockResolvedValue([]);
    await expect(service.sendMessage({channel: MessageChannel.PUSH, recipients: ['foreign-user'], subject: 'School update', message: 'Private school message'})).rejects.toThrow('active user accounts');
    expect(db.user.findMany.mock.calls[0][0].where).toMatchObject({tenantId: 'school', isActive: true});
    expect(db.communication.create).not.toHaveBeenCalled();
  });
  it('uses linked account IDs, respects family update preferences and deduplicates bulk recipients', async () => {
    db.user.findMany.mockResolvedValue([{id: 'parent'}, {id: 'student'}]);
    db.student.findMany.mockResolvedValue([
      {userId: 'student', guardianLinks: [{guardian: {userId: 'parent'}, receiveUpdates: true}, {guardian: {userId: 'opted-out'}, receiveUpdates: false}]},
      {userId: null, guardianLinks: [{guardian: {userId: 'parent'}, receiveUpdates: true}]},
    ]);
    await service.sendBulkMessage({classId: 'class', channel: MessageChannel.PUSH, subject: 'School update', message: 'Private school message', includeParents: true, includeStudents: true});
    expect(db.user.findMany.mock.calls[0][0].where.id.in).toEqual(['parent', 'student']);
    expect(db.communication.create.mock.calls[0][0].data.recipientCount).toBe(2);
  });
  it('rejects explicit PUSH sends when provider credentials are absent', async () => {
    service = new CommunicationsService(db, {requireTenantContext: () => 'school'} as any, new ConfigService({}));
    await expect(service.sendMessage({channel: MessageChannel.PUSH, recipients: ['parent'], subject: 'School update', message: 'Private school message'})).rejects.toThrow('not configured');
    expect(db.communication.create).not.toHaveBeenCalled();
  });
});
