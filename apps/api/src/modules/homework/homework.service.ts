import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { QueryHomeworkDto, HomeworkStatus } from './dto/query-homework.dto';

@Injectable()
export class HomeworkService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  // Get assignments for a student (parent-facing)
  async getStudentHomework(
    studentId: string,
    guardianId: string,
    query: QueryHomeworkDto,
  ) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access to this student
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: { guardianId, studentId },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    // Get student's class
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      select: { currentClassId: true },
    });

    if (!student || !student.currentClassId) {
      throw new NotFoundException('Student not found or not enrolled in a class');
    }

    const where: any = {
      tenantId,
      classId: student.currentClassId,
    };

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }

    if (query.startDate || query.endDate) {
      where.dueDate = {};
      if (query.startDate) {
        where.dueDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.dueDate.lte = new Date(query.endDate);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: {
          subject: {
            select: {
              name: true,
              code: true,
            },
          },
          class: {
            select: {
              name: true,
            },
          },
          submissions: {
            where: { studentId },
            select: {
              id: true,
              status: true,
              score: true,
              feedback: true,
              submittedAt: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.assignment.count({ where }),
    ]);

    // Enhance with status
    const now = new Date();
    const homeworkList = assignments.map((assignment) => {
      const submission = assignment.submissions[0];
      let status: HomeworkStatus;

      if (!submission) {
        // Not submitted
        status = new Date(assignment.dueDate) < now
          ? HomeworkStatus.LATE
          : HomeworkStatus.NOT_SUBMITTED;
      } else if (submission.score !== null && submission.score !== undefined) {
        status = HomeworkStatus.GRADED;
      } else {
        status = HomeworkStatus.SUBMITTED;
      }

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks,
        subject: assignment.subject,
        class: assignment.class,
        submission,
        status,
      };
    });

    // Filter by status if requested
    const filteredHomework = query.status
      ? homeworkList.filter((hw) => hw.status === query.status)
      : homeworkList;

    return {
      data: filteredHomework,
      pagination: {
        total: query.status ? filteredHomework.length : total,
        page,
        limit,
        totalPages: Math.ceil((query.status ? filteredHomework.length : total) / limit),
      },
    };
  }

  // Get homework summary/statistics for student
  async getHomeworkSummary(studentId: string, guardianId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: { guardianId, studentId },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    // Get student's class
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      select: { currentClassId: true },
    });

    if (!student || !student.currentClassId) {
      throw new NotFoundException('Student not found or not enrolled in a class');
    }

    const now = new Date();
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    thisWeek.setHours(0, 0, 0, 0);

    // Get all assignments for the student's class
    const assignments = await this.prisma.assignment.findMany({
      where: {
        tenantId,
        classId: student.currentClassId,
      },
      include: {
        submissions: {
          where: { studentId },
          select: {
            status: true,
            score: true,
            submittedAt: true,
          },
        },
      },
    });

    let total = 0;
    let submitted = 0;
    let graded = 0;
    let pending = 0;
    let overdue = 0;
    let dueSoon = 0; // Due in next 3 days

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    assignments.forEach((assignment) => {
      total++;
      const submission = assignment.submissions[0];
      const dueDate = new Date(assignment.dueDate);

      if (!submission) {
        if (dueDate < now) {
          overdue++;
        } else {
          pending++;
          if (dueDate <= threeDaysFromNow) {
            dueSoon++;
          }
        }
      } else {
        submitted++;
        if (submission.score !== null && submission.score !== undefined) {
          graded++;
        }
      }
    });

    // Calculate average score for graded assignments
    const gradedAssignments = await this.prisma.assignmentSubmission.findMany({
      where: {
        tenantId,
        studentId,
        score: { not: null },
      },
      include: {
        assignment: {
          select: {
            maxMarks: true,
          },
        },
      },
    });

    let totalPercentage = 0;
    gradedAssignments.forEach((sub) => {
      if (sub.score !== null && sub.assignment.maxMarks > 0) {
        totalPercentage += (sub.score / sub.assignment.maxMarks) * 100;
      }
    });

    const averageScore = gradedAssignments.length > 0
      ? totalPercentage / gradedAssignments.length
      : 0;

    return {
      total,
      submitted,
      graded,
      pending,
      overdue,
      dueSoon,
      submissionRate: total > 0 ? (submitted / total) * 100 : 0,
      averageScore: Math.round(averageScore * 10) / 10,
    };
  }

  // Get upcoming homework (due in next 7 days)
  async getUpcomingHomework(studentId: string, guardianId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: { guardianId, studentId },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    // Get student's class
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      select: { currentClassId: true },
    });

    if (!student || !student.currentClassId) {
      throw new NotFoundException('Student not found or not enrolled in a class');
    }

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const assignments = await this.prisma.assignment.findMany({
      where: {
        tenantId,
        classId: student.currentClassId,
        dueDate: {
          gte: now,
          lte: nextWeek,
        },
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        submissions: {
          where: { studentId },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Filter out already submitted assignments
    const upcomingAssignments = assignments.filter(
      (assignment) => assignment.submissions.length === 0,
    );

    return upcomingAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.subject.name,
      dueDate: assignment.dueDate,
      maxMarks: assignment.maxMarks,
    }));
  }

  // Get assignment details
  async getAssignmentDetails(assignmentId: string, studentId: string, guardianId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: { guardianId, studentId },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        tenantId,
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
        submissions: {
          where: { studentId },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }
}
