import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import {
  CreateExaminationDto,
  UpdateExaminationDto,
  GradingSystem,
} from './dto/create-examination.dto';
import {
  EnterGradeDto,
  BulkEnterGradesDto,
  UpdateGradeDto,
  QueryGradesDto,
  CompetencyLevel,
} from './dto/marks-entry.dto';
import {
  GenerateReportCardDto,
  BulkGenerateReportCardsDto,
  UpdateReportCardDto,
  ApproveReportCardDto,
  QueryReportCardsDto,
  ReportCardStatus,
} from './dto/report-card.dto';

@Injectable()
export class ExaminationsService {
  private readonly logger = new Logger(ExaminationsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  // ==================== EXAMINATIONS ====================

  async createExamination(dto: CreateExaminationDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate term exists
    const term = await this.prisma.term.findFirst({
      where: { id: dto.termId, tenantId },
    });

    if (!term) {
      throw new NotFoundException('Term not found');
    }

    // Validate class exists
    const classExists = await this.prisma.class.findFirst({
      where: { id: dto.classId, tenantId },
    });

    if (!classExists) {
      throw new NotFoundException('Class not found');
    }

    // Validate stream if provided
    if (dto.streamId) {
      const streamExists = await this.prisma.stream.findFirst({
        where: { id: dto.streamId, classId: dto.classId, tenantId },
      });

      if (!streamExists) {
        throw new NotFoundException('Stream not found');
      }
    }

    // Validate all subjects exist
    const subjectIds = dto.subjects.map((s) => s.subjectId);
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds }, tenantId },
    });

    if (subjects.length !== subjectIds.length) {
      throw new BadRequestException('Some subjects not found');
    }

    // Create examination
    const examination = await this.prisma.examination.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        termId: dto.termId,
        classId: dto.classId,
        streamId: dto.streamId,
        examinationType: dto.examinationType,
        gradingSystem: dto.gradingSystem,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        createdBy: userId,
      },
    });

    // Create subject configurations
    await this.prisma.examinationSubject.createMany({
      data: dto.subjects.map((subject) => ({
        examinationId: examination.id,
        subjectId: subject.subjectId,
        totalMarks: subject.totalMarks,
        passMark: subject.passMark,
        weight: subject.weight || 1.0,
      })),
    });

    this.logger.log(
      `Examination created: ${examination.name} for ${classExists.name}`,
    );

    return this.findOneExamination(examination.id);
  }

  async findAllExaminations(
    termId?: string,
    classId?: string,
    streamId?: string,
  ) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (termId) {
      where.termId = termId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (streamId) {
      where.streamId = streamId;
    }

    const examinations = await this.prisma.examination.findMany({
      where,
      include: {
        term: {
          select: { name: true, termNumber: true },
        },
        class: {
          select: { name: true, level: true },
        },
        stream: {
          select: { name: true },
        },
        _count: {
          select: { grades: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return examinations;
  }

  async findOneExamination(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const examination = await this.prisma.examination.findFirst({
      where: { id, tenantId },
      include: {
        term: true,
        class: true,
        stream: true,
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    return examination;
  }

  async updateExamination(
    id: string,
    dto: UpdateExaminationDto,
    userId?: string,
  ) {
    const tenantId = this.tenantService.requireTenantContext();

    await this.findOneExamination(id);

    const updated = await this.prisma.examination.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      },
    });

    return this.findOneExamination(updated.id);
  }

  async deleteExamination(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const examination = await this.findOneExamination(id);

    // Check if grades have been entered
    const gradesCount = await this.prisma.grade.count({
      where: { examinationId: id },
    });

    if (gradesCount > 0) {
      throw new BadRequestException(
        'Cannot delete examination with existing grades',
      );
    }

    // Delete subject configurations first
    await this.prisma.examinationSubject.deleteMany({
      where: { examinationId: id },
    });

    // Delete examination
    await this.prisma.examination.delete({
      where: { id },
    });

    return { success: true, message: 'Examination deleted successfully' };
  }

  // ==================== GRADES ====================

  async enterGrade(dto: EnterGradeDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate examination exists
    const examination = await this.findOneExamination(dto.examinationId);

    // Validate student exists and belongs to the class
    const student = await this.prisma.student.findFirst({
      where: {
        id: dto.studentId,
        tenantId,
        currentClassId: examination.classId,
        ...(examination.streamId && { currentStreamId: examination.streamId }),
      },
    });

    if (!student) {
      throw new NotFoundException(
        'Student not found or does not belong to examination class',
      );
    }

    // Validate subject is part of examination
    const examSubject = await this.prisma.examinationSubject.findFirst({
      where: {
        examinationId: dto.examinationId,
        subjectId: dto.subjectId,
      },
    });

    if (!examSubject) {
      throw new BadRequestException('Subject not part of this examination');
    }

    // Validate score doesn't exceed total marks
    if (dto.score > examSubject.totalMarks) {
      throw new BadRequestException(
        `Score (${dto.score}) exceeds total marks (${examSubject.totalMarks})`,
      );
    }

    // Check for existing grade
    const existing = await this.prisma.grade.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        examinationId: dto.examinationId,
        subjectId: dto.subjectId,
      },
    });

    if (existing) {
      throw new ConflictException('Grade already entered for this student/subject');
    }

    // Calculate grade and position
    const percentage = (dto.score / examSubject.totalMarks) * 100;
    const letterGrade = this.calculateLetterGrade(percentage);

    // Create grade
    const grade = await this.prisma.grade.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        examinationId: dto.examinationId,
        subjectId: dto.subjectId,
        score: dto.score,
        totalMarks: examSubject.totalMarks,
        percentage: Math.round(percentage * 100) / 100,
        letterGrade,
        competencyLevel: dto.competencyLevel,
        remarks: dto.remarks,
        enteredBy: userId,
      },
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    this.logger.log(
      `Grade entered: ${student.firstName} ${student.lastName} - ${examSubject.totalMarks} - ${dto.score}`,
    );

    return grade;
  }

  async bulkEnterGrades(dto: BulkEnterGradesDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate examination and subject
    const examination = await this.findOneExamination(dto.examinationId);

    const examSubject = await this.prisma.examinationSubject.findFirst({
      where: {
        examinationId: dto.examinationId,
        subjectId: dto.subjectId,
      },
    });

    if (!examSubject) {
      throw new BadRequestException('Subject not part of this examination');
    }

    // Validate all students
    const studentIds = dto.grades.map((g) => g.studentId);
    const students = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
        tenantId,
        currentClassId: examination.classId,
      },
    });

    if (students.length !== studentIds.length) {
      throw new BadRequestException('Some students not found or not in class');
    }

    // Check for existing grades
    const existing = await this.prisma.grade.findMany({
      where: {
        tenantId,
        studentId: { in: studentIds },
        examinationId: dto.examinationId,
        subjectId: dto.subjectId,
      },
    });

    if (existing.length > 0) {
      throw new ConflictException(
        `Grades already exist for ${existing.length} student(s)`,
      );
    }

    // Validate scores
    for (const grade of dto.grades) {
      if (grade.score > examSubject.totalMarks) {
        throw new BadRequestException(
          `Score ${grade.score} exceeds total marks ${examSubject.totalMarks}`,
        );
      }
    }

    // Create grades in transaction
    const grades = await this.prisma.$transaction(
      dto.grades.map((grade) => {
        const percentage = (grade.score / examSubject.totalMarks) * 100;
        const letterGrade = this.calculateLetterGrade(percentage);

        return this.prisma.grade.create({
          data: {
            tenantId,
            studentId: grade.studentId,
            examinationId: dto.examinationId,
            subjectId: dto.subjectId,
            score: grade.score,
            totalMarks: examSubject.totalMarks,
            percentage: Math.round(percentage * 100) / 100,
            letterGrade,
            competencyLevel: grade.competencyLevel,
            remarks: grade.remarks,
            enteredBy: userId,
          },
        });
      }),
    );

    this.logger.log(
      `Bulk grades entered: ${grades.length} students for subject ${dto.subjectId}`,
    );

    return {
      success: true,
      gradesEntered: grades.length,
      examinationId: dto.examinationId,
      subjectId: dto.subjectId,
    };
  }

  async updateGrade(id: string, dto: UpdateGradeDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const grade = await this.prisma.grade.findFirst({
      where: { id, tenantId },
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    let percentage = grade.percentage;
    let letterGrade = grade.letterGrade;

    if (dto.score !== undefined) {
      percentage = (dto.score / grade.totalMarks) * 100;
      letterGrade = this.calculateLetterGrade(percentage);
    }

    const updated = await this.prisma.grade.update({
      where: { id },
      data: {
        ...(dto.score !== undefined && {
          score: dto.score,
          percentage: Math.round(percentage * 100) / 100,
          letterGrade,
        }),
        ...(dto.competencyLevel && { competencyLevel: dto.competencyLevel }),
        ...(dto.remarks !== undefined && { remarks: dto.remarks }),
        enteredBy: userId,
      },
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    return updated;
  }

  async queryGrades(query: QueryGradesDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const { examinationId, studentId, subjectId, classId, termId } = query;

    const where: any = { tenantId };

    if (examinationId) {
      where.examinationId = examinationId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (classId || termId) {
      where.examination = {};
      if (classId) {
        where.examination.classId = classId;
      }
      if (termId) {
        where.examination.termId = termId;
      }
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        examination: {
          select: {
            id: true,
            name: true,
            examinationType: true,
            gradingSystem: true,
          },
        },
      },
      orderBy: [
        { examination: { createdAt: 'desc' } },
        { student: { lastName: 'asc' } },
      ],
    });

    return grades;
  }

  // ==================== REPORT CARDS ====================

  async generateReportCard(dto: GenerateReportCardDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate student and term
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
      include: {
        currentClass: true,
        currentStream: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const term = await this.prisma.term.findFirst({
      where: { id: dto.termId, tenantId },
    });

    if (!term) {
      throw new NotFoundException('Term not found');
    }

    // Check if report card already exists
    const existing = await this.prisma.reportCard.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        termId: dto.termId,
      },
    });

    if (existing) {
      throw new ConflictException('Report card already generated for this term');
    }

    // Get all grades for this student in this term
    const grades = await this.prisma.grade.findMany({
      where: {
        tenantId,
        studentId: dto.studentId,
        examination: {
          termId: dto.termId,
        },
      },
      include: {
        subject: true,
        examination: true,
      },
    });

    if (grades.length === 0) {
      throw new BadRequestException(
        'No grades found for this student in this term',
      );
    }

    // Calculate overall statistics
    const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
    const totalPossible = grades.reduce((sum, g) => sum + g.totalMarks, 0);
    const averagePercentage = (totalScore / totalPossible) * 100;
    const overallGrade = this.calculateLetterGrade(averagePercentage);

    // Create report card
    const reportCard = await this.prisma.reportCard.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        termId: dto.termId,
        classId: student.currentClassId,
        streamId: student.currentStreamId,
        totalScore,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        overallGrade,
        classTeacherComments: dto.classTeacherComments,
        principalComments: dto.principalComments,
        status: ReportCardStatus.DRAFT,
        generatedBy: userId,
      },
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        term: {
          select: {
            name: true,
            termNumber: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Report card generated: ${student.firstName} ${student.lastName} - ${term.name}`,
    );

    return reportCard;
  }

  async bulkGenerateReportCards(dto: BulkGenerateReportCardsDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Get all students in the class/stream
    const where: any = {
      tenantId,
      currentClassId: dto.classId,
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (dto.streamId) {
      where.currentStreamId = dto.streamId;
    }

    const students = await this.prisma.student.findMany({
      where,
      select: { id: true, firstName: true, lastName: true },
    });

    if (students.length === 0) {
      throw new BadRequestException('No students found in this class/stream');
    }

    const results = {
      total: students.length,
      generated: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (const student of students) {
      try {
        await this.generateReportCard(
          {
            studentId: student.id,
            termId: dto.termId,
          },
          userId,
        );
        results.generated++;
      } catch (error: any) {
        if (error instanceof ConflictException) {
          results.skipped++;
        } else {
          results.errors.push({
            student: `${student.firstName} ${student.lastName}`,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  async findAllReportCards(query: QueryReportCardsDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const { termId, studentId, classId, status } = query;

    const where: any = { tenantId };

    if (termId) {
      where.termId = termId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (status) {
      where.status = status;
    }

    const reportCards = await this.prisma.reportCard.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        term: {
          select: {
            name: true,
            termNumber: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ term: { termNumber: 'desc' } }, { student: { lastName: 'asc' } }],
    });

    return reportCards;
  }

  async findOneReportCard(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const reportCard = await this.prisma.reportCard.findFirst({
      where: { id, tenantId },
      include: {
        student: {
          include: {
            currentClass: true,
            currentStream: true,
          },
        },
        term: true,
        class: true,
        stream: true,
      },
    });

    if (!reportCard) {
      throw new NotFoundException('Report card not found');
    }

    // Get all grades for this report card
    const grades = await this.prisma.grade.findMany({
      where: {
        tenantId,
        studentId: reportCard.studentId,
        examination: {
          termId: reportCard.termId,
        },
      },
      include: {
        subject: true,
        examination: {
          select: {
            name: true,
            examinationType: true,
          },
        },
      },
      orderBy: { subject: { name: 'asc' } },
    });

    return {
      ...reportCard,
      grades,
    };
  }

  async updateReportCard(id: string, dto: UpdateReportCardDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    await this.findOneReportCard(id);

    const updated = await this.prisma.reportCard.update({
      where: { id },
      data: {
        ...(dto.classTeacherComments !== undefined && {
          classTeacherComments: dto.classTeacherComments,
        }),
        ...(dto.principalComments !== undefined && {
          principalComments: dto.principalComments,
        }),
        ...(dto.status && { status: dto.status }),
      },
    });

    return this.findOneReportCard(updated.id);
  }

  async approveReportCard(dto: ApproveReportCardDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const reportCard = await this.findOneReportCard(dto.reportCardId);

    if (reportCard.status === ReportCardStatus.PUBLISHED) {
      throw new BadRequestException('Report card already published');
    }

    const updated = await this.prisma.reportCard.update({
      where: { id: dto.reportCardId },
      data: {
        status: ReportCardStatus.APPROVED,
        principalComments: dto.principalComments || reportCard.principalComments,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    return this.findOneReportCard(updated.id);
  }

  // ==================== UTILITIES ====================

  private calculateLetterGrade(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
  }

  async getExaminationStats(examinationId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const [totalGrades, gradeDistribution, subjectStats] = await Promise.all([
      this.prisma.grade.count({
        where: { tenantId, examinationId },
      }),
      this.prisma.grade.groupBy({
        by: ['letterGrade'],
        where: { tenantId, examinationId },
        _count: true,
      }),
      this.prisma.grade.groupBy({
        by: ['subjectId'],
        where: { tenantId, examinationId },
        _avg: { percentage: true },
        _count: true,
      }),
    ]);

    const distribution = gradeDistribution.reduce((acc, item) => {
      acc[item.letterGrade] = item._count;
      return acc;
    }, {} as any);

    return {
      totalGrades,
      distribution,
      subjectStats,
    };
  }
}
