import { HrmsService } from './hrms.service';
import { HrCandidateDto, HrInterviewDto, HrInterviewReviewDto } from './hrms-recruitment.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const actor = { tenantId: 'school', userId: 'manager', role: 'PRINCIPAL' };
function fixture() {
  const fn = (value: any = null) => jest.fn().mockResolvedValue(value);
  const candidate = {
    id: 'candidate',
    name: 'Candidate',
    email: 'candidate@example.test',
    phone: '1234567890',
    vacancyId: 'vacancy',
    tenantId: 'school',
    status: 'SHORTLISTED',
    interviews: [],
    offer: null,
    vacancy: { id: 'vacancy', departmentId: 'department', positions: 1, status: 'OPEN' },
  };
  const db: any = {
    tenant: { update: fn({}), findUnique: fn({ timezone: 'Asia/Kolkata' }) },
    department: { findFirst: fn({ id: 'department' }) },
    recruitmentCandidate: {
      findFirst: fn(candidate),
      create: fn({ id: 'new' }),
      update: fn({ id: 'candidate' }),
      count: fn(0),
    },
    recruitmentVacancy: {
      findFirst: fn(candidate.vacancy),
      create: fn({ id: 'vacancy' }),
      update: fn({ id: 'vacancy' }),
    },
    recruitmentInterview: {
      findFirst: fn(null),
      create: fn({ id: 'interview' }),
      update: fn({ id: 'interview' }),
      updateMany: fn({ count: 0 }),
    },
    user: { findFirst: fn({ id: 'interviewer', firstName: 'School', lastName: 'Teacher' }) },
    jobOffer: { findFirst: fn(null), create: fn({ id: 'offer' }), update: fn({ id: 'offer' }) },
    auditLog: { create: fn({}) },
  };
  db.$transaction = jest.fn(async (work) => work(db));
  return { db, candidate, service: new HrmsService(db) };
}
const interview = (): HrInterviewDto => ({
  round: 'Demo lesson',
  interviewerId: 'interviewer',
  startsAt: new Date(Date.now() + 3600000).toISOString(),
  endsAt: new Date(Date.now() + 7200000).toISOString(),
  location: 'School office',
});
describe('Recruitment workflow safeguards', () => {
  it('denies non-manager reads and mutations', async () => {
    const { service, db } = fixture();
    await expect(service.recruitment({ ...actor, role: 'TEACHER' })).rejects.toThrow();
    await expect(
      service.candidateStage({ ...actor, role: 'ACCOUNTANT' }, 'candidate', {
        status: 'SCREENING',
        reason: 'Reviewed CV',
      })
    ).rejects.toThrow();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects skipped stages and selection without interview evidence', async () => {
    const { service, candidate } = fixture();
    candidate.status = 'APPLIED';
    await expect(
      service.candidateStage(actor, candidate.id, { status: 'SELECTED', reason: 'Reviewed CV' })
    ).rejects.toThrow('Invalid');
    candidate.status = 'INTERVIEWING';
    await expect(
      service.candidateStage(actor, candidate.id, { status: 'SELECTED', reason: 'Reviewed CV' })
    ).rejects.toThrow('recommended');
  });
  it('selects only after all interviews are resolved and records an audit', async () => {
    const { service, candidate, db } = fixture();
    candidate.status = 'INTERVIEWING';
    (candidate.interviews as any[]).push(
      { status: 'COMPLETED', result: 'RECOMMENDED' },
      { status: 'SCHEDULED' }
    );
    await expect(
      service.candidateStage(actor, candidate.id, { status: 'SELECTED', reason: 'Panel agreed' })
    ).rejects.toThrow();
    candidate.interviews.pop();
    await service.candidateStage(actor, candidate.id, {
      status: 'SELECTED',
      reason: 'Panel agreed',
    });
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'HR_CANDIDATE_STAGE_CHANGED' }),
      })
    );
  });
  it('cancels outstanding interviews on rejection', async () => {
    const { service, db } = fixture();
    await service.candidateStage(actor, 'candidate', {
      status: 'REJECTED',
      reason: 'Role requirements differ',
    });
    expect(db.recruitmentInterview.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'school', candidateId: 'candidate', status: 'SCHEDULED' },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      })
    );
  });
  it('blocks overlapping candidate or interviewer slots and validates timezone', async () => {
    const { service, db } = fixture();
    db.recruitmentInterview.findFirst.mockResolvedValue({ id: 'other' });
    await expect(service.scheduleInterview(actor, 'candidate', interview())).rejects.toThrow(
      'overlapping'
    );
    expect(db.recruitmentInterview.create).not.toHaveBeenCalled();
    db.recruitmentInterview.findFirst.mockResolvedValue(null);
    await expect(
      service.scheduleInterview(actor, 'candidate', {
        ...interview(),
        startsAt: '2030-01-01T09:00:00',
      })
    ).rejects.toThrow('timezone');
  });
  it('schedules a valid interview and advances to interviewing', async () => {
    const { service, db } = fixture();
    await service.scheduleInterview(actor, 'candidate', interview());
    expect(db.recruitmentCandidate.update).toHaveBeenCalledWith({
      where: { id: 'candidate', tenantId: 'school' },
      data: { status: 'INTERVIEWING' },
    });
  });
  it('refuses interviews for another school or an unshortlisted application', async () => {
    const { service, db, candidate } = fixture();
    candidate.status = 'APPLIED';
    await expect(service.scheduleInterview(actor, 'candidate', interview())).rejects.toThrow(
      'Shortlist'
    );
    db.recruitmentCandidate.findFirst.mockResolvedValue(null);
    await expect(service.scheduleInterview(actor, 'foreign', interview())).rejects.toThrow(
      'not found'
    );
  });
  it('requires completion evidence and prevents recording future or repeated outcomes', async () => {
    const { service, db } = fixture();
    db.recruitmentInterview.findFirst.mockResolvedValue({
      id: 'interview',
      status: 'SCHEDULED',
      startsAt: new Date(Date.now() - 1000),
    });
    const dto = { status: 'COMPLETED', feedback: 'Good subject knowledge' };
    await expect(service.reviewInterview(actor, 'interview', dto)).rejects.toThrow('rating');
    await service.reviewInterview(actor, 'interview', { ...dto, rating: 4, result: 'RECOMMENDED' });
    db.recruitmentInterview.findFirst.mockResolvedValue({ status: 'COMPLETED' });
    await expect(service.reviewInterview(actor, 'interview', dto)).rejects.toThrow('already');
  });
  it('refuses duplicate applications and closed vacancies', async () => {
    const { service, db, candidate } = fixture();
    const dto = {
      vacancyId: 'vacancy',
      name: 'Candidate',
      email: 'CANDIDATE@example.test',
      phone: '1234567890',
      source: 'DIRECT',
    };
    await expect(service.saveCandidate(actor, dto)).rejects.toThrow('already');
    db.recruitmentCandidate.findFirst.mockResolvedValue(null);
    candidate.vacancy.status = 'CLOSED';
    await expect(service.saveCandidate(actor, dto)).rejects.toThrow('open vacancy');
  });
  it('rejects forged DTO fields, invalid resume protocols and ratings', async () => {
    expect(
      (
        await validate(
          plainToInstance(HrCandidateDto, {
            vacancyId: 'invalid',
            name: 'A',
            resumeUrl: 'javascript:alert(1)',
            tenantId: 'foreign',
          }),
          { whitelist: true, forbidNonWhitelisted: true }
        )
      ).length
    ).toBeGreaterThan(0);
    expect(
      (
        await validate(
          plainToInstance(HrInterviewReviewDto, {
            status: 'COMPLETED',
            rating: 6,
            feedback: 'Reviewed feedback',
            result: 'RECOMMENDED',
          })
        )
      ).length
    ).toBeGreaterThan(0);
  });
  it('enforces vacancy capacity before creating a linked offer', async () => {
    const { service, db, candidate } = fixture();
    candidate.status = 'SELECTED';
    db.recruitmentCandidate.count.mockResolvedValue(1);
    await expect(
      service.createJobOffer(actor, {
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        candidatePhone: candidate.phone,
        departmentId: 'department',
        designationTitle: 'Teacher',
        joiningDate: '2030-01-01',
        offeredCtcMonthly: 40000,
        structureId: 'structure',
        accountRole: 'TEACHER',
        schoolDepartment: 'TEACHING',
      })
    ).rejects.toThrow('positions');
    expect(db.jobOffer.create).not.toHaveBeenCalled();
  });
  it('declines an open linked offer and releases its candidate reservation', async () => {
    const { service, db } = fixture();
    db.jobOffer.findFirst.mockResolvedValue({
      id: 'offer',
      status: 'OFFERED',
      candidateId: 'candidate',
    });
    await service.offerDecision(actor, 'offer', {
      status: 'DECLINED',
      reason: 'Candidate accepted another job',
    });
    expect(db.recruitmentCandidate.update).toHaveBeenCalledWith({
      where: { id: 'candidate', tenantId: 'school' },
      data: { status: 'WITHDRAWN', decisionReason: 'Candidate accepted another job' },
    });
    db.jobOffer.findFirst.mockResolvedValue({ status: 'JOINED', employeeId: 'employee' });
    await expect(
      service.offerDecision(actor, 'offer', { status: 'WITHDRAWN', reason: 'Cancel after joining' })
    ).rejects.toThrow('Only open');
  });
  it('rejects applications after the closing date in the school timezone', async () => {
    const { service, db, candidate } = fixture();
    (candidate.vacancy as any).closingDate = new Date('2000-01-01');
    db.recruitmentCandidate.findFirst.mockResolvedValue(null);
    await expect(
      service.saveCandidate(actor, {
        vacancyId: 'vacancy',
        name: 'Candidate',
        email: 'new@example.test',
        phone: '1234567890',
        source: 'DIRECT',
      })
    ).rejects.toThrow('closing date');
  });
});
