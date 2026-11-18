import * as bcrypt from 'bcryptjs';

import { EmailService } from '../../../common/services/email.service';

import { PasswordResetService } from './password-reset.service';

describe('Admission account invitation activation', () => {
  let service: PasswordResetService, db: any, redis: any, email: any;
  let now: number, values: Map<string, {value: string; expires: number}>;
  let user: any;
  beforeEach(async () => {
    now = Date.now();values = new Map();
    user = {id: 'new-user', tenantId: 'school', email: 'student.generated@students.krypton.invalid',
      firstName: 'New', lastName: 'Child', role: 'STUDENT', mustChangePassword: true,
      passwordHash: await bcrypt.hash('Unknowable!old123', 4)};
    redis = {
      set: jest.fn(async (key: string, value: string, ttl: number) => {values.set(key, {value, expires: now + ttl * 1000});}),
      get: jest.fn(async (key: string) => {const item = values.get(key);return item && item.expires > now ? item.value : null;}),
      keys: jest.fn(async () => [...values.keys()]),
      del: jest.fn(async (key: string) => values.delete(key)),
    };
    email = {sendAccountInvitation: jest.fn().mockResolvedValue(true), sendPasswordChanged: jest.fn()};
    db = {user: {findUnique: jest.fn(async () => ({...user})), update: jest.fn(async ({data}: any) => {Object.assign(user, data);})},
      $executeRaw: jest.fn().mockResolvedValue(1)};
    service = new PasswordResetService(db, redis, email, {} as any);
  });

  it('sends generated student login to guardian and activates through the existing password page', async () => {
    expect(await service.sendAccountInvitation(user, 'parent@example.test')).toBe(true);
    const [recipient, account, token] = email.sendAccountInvitation.mock.calls[0];
    expect(recipient).toBe('parent@example.test');expect(account.email).toBe(user.email);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const saved = redis.set.mock.calls[0];
    expect(saved[2]).toBe(86400);expect(saved[1]).not.toContain(token);
    expect((await service.verifyResetToken(token)).valid).toBe(true);
    await service.resetPassword(token, 'New!securePass456');
    expect(user.mustChangePassword).toBe(false);
    expect(await bcrypt.compare('New!securePass456', user.passwordHash)).toBe(true);
    expect((await service.verifyResetToken(token)).valid).toBe(false);
  });

  it('expires activation links after 24 hours and replaces them on resend', async () => {
    await service.sendAccountInvitation(user, 'parent@example.test');
    const first = email.sendAccountInvitation.mock.calls[0][2];
    await service.sendAccountInvitation(user, 'parent@example.test');
    const second = email.sendAccountInvitation.mock.calls[1][2];
    expect((await service.verifyResetToken(first)).valid).toBe(false);
    expect((await service.verifyResetToken(second)).valid).toBe(true);
    now += 86400001;
    expect((await service.verifyResetToken(second)).valid).toBe(false);
  });

  it('sends existing parents to sign in without resetting their password', async () => {
    user.mustChangePassword = false;user.role = 'PARENT';
    await service.sendAccountInvitation(user, 'parent@example.test');
    expect(redis.set).not.toHaveBeenCalled();
    expect(email.sendAccountInvitation.mock.calls[0][2]).toBeUndefined();
  });

  it('reports SMTP and token-store outages as failed delivery', async () => {
    email.sendAccountInvitation.mockResolvedValue(false);
    expect(await service.sendAccountInvitation(user, 'parent@example.test')).toBe(false);
    redis.set.mockRejectedValue(new Error('Redis offline'));
    email.sendAccountInvitation.mockClear();
    expect(await service.sendAccountInvitation(user, 'parent@example.test')).toBe(false);
    expect(email.sendAccountInvitation).not.toHaveBeenCalled();
  });

  it('escapes invite content and includes the correct setup URL and login ID', async () => {
    const config = {get: (key: string, fallback?: string) => ({WEB_URL: 'https://school.example.test/'}[key] || fallback)};
    const mail = new EmailService(config as any);
    const sendMail = jest.fn().mockResolvedValue({});
    (mail as any).transporter = {sendMail};
    await mail.sendAccountInvitation('parent@example.test', {...user, firstName: '<script>bad</script>'}, 'secret-token');
    const message = sendMail.mock.calls[0][0];
    expect(message.html).toContain('&lt;script&gt;');expect(message.html).not.toContain('<script>');
    expect(message.text).toContain(user.email);
    expect(message.text).toContain('https://school.example.test/reset-password?token=secret-token');
  });
});
