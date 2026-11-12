import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { RedisService } from '../../common/services/redis.service';
import { OperationsService, Actor } from './operations.service';

@Injectable()
export class CheckInService {
  constructor(private db: PrismaService, private tenants: TenantService, private redis: RedisService, private operations: OperationsService) {}
  private key(id: string) { return 'attendance-session:' + this.tenants.requireTenantContext() + ':' + id; }
  private today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  private async session(id: string) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new NotFoundException('Check-in session not found');
    const value = await this.redis.get(this.key(id));
    if (!value) throw new NotFoundException('Check-in session has ended');
    return JSON.parse(value);
  }
  async open(user: Actor, classId: string) {
    await this.operations.classAccess(user, classId);
    const id = randomUUID();
    await this.redis.set(this.key(id), JSON.stringify({ classId, owner: user.userId, date: this.today(), secret: randomBytes(32).toString('hex') }), 900);
    return this.code(user, id);
  }
  async code(user: Actor, id: string) {
    const session = await this.session(id);
    if (session.owner !== user.userId) throw new ForbiddenException('Session belongs to another teacher');
    await this.operations.classAccess(user, session.classId);
    const epoch = Math.floor(Date.now() / 30000);
    const payload = id + '.' + epoch;
    return { id, token: payload + '.' + createHmac('sha256', session.secret).update(payload).digest('hex'), expiresAt: new Date((epoch + 1) * 30000), sessionExpiresIn: await this.redis.ttl(this.key(id)) };
  }
  async close(user: Actor, id: string) {
    const session = await this.session(id);
    if (session.owner !== user.userId) throw new ForbiddenException('Session belongs to another teacher');
    await this.redis.del(this.key(id));
    return { closed: true };
  }
  async attend(user: Actor, token: string) {
    if (user.role !== 'STUDENT') throw new ForbiddenException('Student sign-in required');
    if (typeof token !== 'string' || !/^[a-f0-9-]{36}\.\d{1,12}\.[a-f0-9]{64}$/.test(token)) throw new BadRequestException('Invalid check-in code');
    const [id, epoch, signature] = token.split('.');
    const session = await this.session(id);
    if (Number(epoch) !== Math.floor(Date.now() / 30000) || session.date !== this.today()) throw new BadRequestException('Code expired. Scan the current classroom code');
    const expected = createHmac('sha256', session.secret).update(id + '.' + epoch).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new BadRequestException('Invalid check-in code');
    const tenantId = this.tenants.requireTenantContext();
    const student = await this.db.student.findFirst({ where: { tenantId, userId: user.userId, currentClassId: session.classId, status: 'ACTIVE', deletedAt: null } });
    if (!student) throw new ForbiddenException('This check-in is for another class');
    const date = new Date(session.date + 'T00:00:00.000Z');
    // A student's scan can create presence; it cannot override a teacher's saved correction.
    await this.db.attendanceRecord.upsert({ where: { tenantId_studentId_date_period: { tenantId, studentId: student.id, date, period: 1 } }, create: { tenantId, studentId: student.id, classId: session.classId, date, period: 1, status: 'PRESENT' }, update: {} });
    return { saved: true, date: session.date };
  }
}
