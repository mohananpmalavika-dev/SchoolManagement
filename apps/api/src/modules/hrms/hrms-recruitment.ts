import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@krypton/database';
import { HrActor } from './hrms.policy';
import {
  HrCandidateDto,
  HrCandidateStageDto,
  HrInterviewDto,
  HrInterviewReviewDto,
  HrVacancyDto,
} from './hrms-recruitment.dto';
import { hrDate } from './hrms.engine';

type Db = Prisma.TransactionClient;
export const candidateInclude = {
  vacancy: true,
  interviews: { orderBy: { startsAt: 'asc' as const } },
  offer: true,
};
export async function recruitmentCandidate(db: Db, u: HrActor, id: string) {
  const row = await db.recruitmentCandidate.findFirst({
    where: { id, tenantId: u.tenantId },
    include: candidateInclude,
  });
  if (!row) throw new NotFoundException('Candidate not found');
  return row;
}
export async function saveVacancy(db: Db, u: HrActor, dto: HrVacancyDto, id?: string) {
  if (dto.title.trim().length < 2 || dto.description.trim().length < 10)
    throw new BadRequestException('Enter a vacancy title and job description');
  if (!(await db.department.findFirst({ where: { id: dto.departmentId, tenantId: u.tenantId } })))
    throw new BadRequestException('Choose a department in this school');
  if (id) {
    const row = await db.recruitmentVacancy.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!row) throw new NotFoundException('Vacancy not found');
    const committed = await db.recruitmentCandidate.count({
      where: { vacancyId: id, tenantId: u.tenantId, status: { in: ['OFFERED', 'HIRED'] } },
    });
    if (dto.positions < committed)
      throw new ConflictException('Positions cannot be fewer than offered and hired candidates');
    if (
      row.departmentId !== dto.departmentId &&
      (await db.recruitmentCandidate.count({ where: { vacancyId: id, tenantId: u.tenantId } }))
    )
      throw new ConflictException('A vacancy with applications cannot change department');
  }
  const data = {
    ...dto,
    title: dto.title.trim(),
    description: dto.description.trim(),
    closingDate: dto.closingDate ? hrDate(dto.closingDate) : null,
  };
  return id
    ? db.recruitmentVacancy.update({ where: { id, tenantId: u.tenantId }, data })
    : db.recruitmentVacancy.create({ data: { ...data, tenantId: u.tenantId } });
}
export async function saveCandidate(db: Db, u: HrActor, dto: HrCandidateDto, id?: string) {
  const vacancy = await db.recruitmentVacancy.findFirst({
    where: { id: dto.vacancyId, tenantId: u.tenantId },
  });
  if (!vacancy) throw new NotFoundException('Vacancy not found');
  const previous = id ? await recruitmentCandidate(db, u, id) : null;
  if (
    previous &&
    (['OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'].includes(previous.status) ||
      previous.vacancyId !== dto.vacancyId)
  )
    throw new ConflictException(
      'Only active applications can be edited; the vacancy cannot change'
    );
  // Closing date is inclusive in the school timezone.
  const tenant = await db.tenant.findUnique({
    where: { id: u.tenantId },
    select: { timezone: true },
  });
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: tenant?.timezone || 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  if (
    !id &&
    (vacancy.status !== 'OPEN' ||
      (vacancy.closingDate && vacancy.closingDate.toISOString().slice(0, 10) < today))
  )
    throw new ConflictException('Applications require an open vacancy within its closing date');
  const email = dto.email.trim().toLowerCase();
  if (dto.name.trim().length < 2 || dto.phone.trim().length < 5)
    throw new BadRequestException('Enter candidate name and phone');
  if (
    await db.recruitmentCandidate.findFirst({
      where: {
        tenantId: u.tenantId,
        vacancyId: dto.vacancyId,
        email,
        ...(id ? { id: { not: id } } : {}),
      },
    })
  )
    throw new ConflictException('This email already has an application for this vacancy');
  const data = {
    ...dto,
    name: dto.name.trim(),
    email,
    phone: dto.phone.trim(),
    resumeUrl: dto.resumeUrl || null,
    notes: dto.notes?.trim() || '',
  };
  return id
    ? db.recruitmentCandidate.update({ where: { id, tenantId: u.tenantId }, data })
    : db.recruitmentCandidate.create({ data: { ...data, tenantId: u.tenantId } });
}
export async function changeCandidateStage(
  db: Db,
  u: HrActor,
  id: string,
  dto: HrCandidateStageDto
) {
  const row = await recruitmentCandidate(db, u, id);
  const transitions: Record<string, string[]> = {
    APPLIED: ['SCREENING', 'REJECTED', 'WITHDRAWN'],
    SCREENING: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
    SHORTLISTED: ['REJECTED', 'WITHDRAWN'],
    INTERVIEWING: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
    SELECTED: ['REJECTED', 'WITHDRAWN'],
  };
  if (!transitions[row.status]?.includes(dto.status))
    throw new ConflictException('Invalid candidate stage change');
  if (dto.reason.trim().length < 5) throw new BadRequestException('Enter a decision reason');
  if (
    dto.status === 'SELECTED' &&
    (row.interviews.some((i) => i.status === 'SCHEDULED') ||
      !row.interviews.some((i) => i.status === 'COMPLETED' && i.result === 'RECOMMENDED'))
  )
    throw new ConflictException(
      'Resolve scheduled interviews and record a recommended interview before selection'
    );
  if (['REJECTED', 'WITHDRAWN'].includes(dto.status))
    await db.recruitmentInterview.updateMany({
      where: { tenantId: u.tenantId, candidateId: id, status: 'SCHEDULED' },
      data: {
        status: 'CANCELLED',
        feedback: dto.reason.trim(),
        reviewedBy: u.userId,
        reviewedAt: new Date(),
      },
    });
  return db.recruitmentCandidate.update({
    where: { id, tenantId: u.tenantId },
    data: { status: dto.status, decisionReason: dto.reason.trim() },
  });
}
export async function scheduleInterview(
  db: Db,
  u: HrActor,
  candidateId: string,
  dto: HrInterviewDto,
  id?: string
) {
  const row = await recruitmentCandidate(db, u, candidateId);
  if (!['SHORTLISTED', 'INTERVIEWING'].includes(row.status))
    throw new ConflictException('Shortlist the candidate before scheduling interviews');
  if (id && !row.interviews.some((i) => i.id === id && i.status === 'SCHEDULED'))
    throw new ConflictException('Only scheduled interviews can be rescheduled');
  const startsAt = new Date(dto.startsAt),
    endsAt = new Date(dto.endsAt);
  if (
    !/([zZ]|[+-]\d{2}:\d{2})$/.test(dto.startsAt) ||
    !/([zZ]|[+-]\d{2}:\d{2})$/.test(dto.endsAt) ||
    !Number.isFinite(+startsAt) ||
    !Number.isFinite(+endsAt) ||
    +startsAt <= Date.now() ||
    +endsAt <= +startsAt ||
    +endsAt - +startsAt > 8 * 3600000
  )
    throw new BadRequestException(
      'Choose a future interview of up to eight hours with timezone offsets'
    );
  const interviewer = await db.user.findFirst({
    where: {
      id: dto.interviewerId,
      tenantId: u.tenantId,
      isActive: true,
      role: {
        in: [
          'PRINCIPAL',
          'SCHOOL_ADMIN',
          'SCHOOL_OWNER',
          'DEPUTY_PRINCIPAL',
          'TEACHER',
          'CLASS_TEACHER',
        ],
      },
    },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!interviewer) throw new BadRequestException('Choose an active school interviewer');
  if (
    await db.recruitmentInterview.findFirst({
      where: {
        tenantId: u.tenantId,
        status: 'SCHEDULED',
        ...(id ? { id: { not: id } } : {}),
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        OR: [{ interviewerId: dto.interviewerId }, { candidateId }],
      },
    })
  )
    throw new ConflictException(
      'The candidate or interviewer already has an overlapping interview'
    );
  if (dto.round.trim().length < 2 || dto.location.trim().length < 2)
    throw new BadRequestException('Enter interview round and location');
  const data = {
    ...dto,
    startsAt,
    endsAt,
    round: dto.round.trim(),
    location: dto.location.trim(),
    interviewerName: `${interviewer.firstName} ${interviewer.lastName}`,
  };
  const interview = id
    ? await db.recruitmentInterview.update({ where: { id, tenantId: u.tenantId }, data })
    : await db.recruitmentInterview.create({
        data: { ...data, tenantId: u.tenantId, candidateId },
      });
  await db.recruitmentCandidate.update({
    where: { id: candidateId, tenantId: u.tenantId },
    data: { status: 'INTERVIEWING' },
  });
  return interview;
}
export async function reviewInterview(db: Db, u: HrActor, id: string, dto: HrInterviewReviewDto) {
  const row = await db.recruitmentInterview.findFirst({ where: { id, tenantId: u.tenantId } });
  if (!row) throw new NotFoundException('Interview not found');
  if (row.status !== 'SCHEDULED') throw new ConflictException('This interview is already resolved');
  if (dto.feedback.trim().length < 5)
    throw new BadRequestException('Enter interview feedback or a cancellation reason');
  if (dto.status !== 'CANCELLED' && +row.startsAt > Date.now())
    throw new ConflictException('The interview has not started');
  if (dto.status === 'COMPLETED' && (!dto.result || !dto.rating))
    throw new BadRequestException('Completed interviews require a result and rating');
  return db.recruitmentInterview.update({
    where: { id, tenantId: u.tenantId },
    data: {
      status: dto.status,
      result: dto.status === 'COMPLETED' ? dto.result : null,
      rating: dto.status === 'COMPLETED' ? dto.rating : null,
      feedback: dto.feedback.trim(),
      reviewedBy: u.userId,
      reviewedAt: new Date(),
    },
  });
}
