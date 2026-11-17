import { SchoolRecordAccessGuard } from '../../common/guards/school-record-access.guard';
import { UseGuards as ScopedGuard } from '@nestjs/common';
import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { QueryHomeworkDto } from './dto/query-homework.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@Controller('homework')
@ScopedGuard(SchoolRecordAccessGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  // Note: These endpoints are designed for parent portal access
  // Guardian ID would typically come from authenticated user context
  // For now, accepting it as a parameter

  @Get('student/:studentId/guardian/:guardianId')
  @Roles(UserRole.PARENT)
  getStudentHomework(
    @Param('studentId') studentId: string,
    @Param('guardianId') guardianId: string,
    @Query() query: QueryHomeworkDto,
  ) {
    return this.homeworkService.getStudentHomework(studentId, guardianId, query);
  }

  @Get('student/:studentId/guardian/:guardianId/summary')
  @Roles(UserRole.PARENT)
  getHomeworkSummary(
    @Param('studentId') studentId: string,
    @Param('guardianId') guardianId: string,
  ) {
    return this.homeworkService.getHomeworkSummary(studentId, guardianId);
  }

  @Get('student/:studentId/guardian/:guardianId/upcoming')
  @Roles(UserRole.PARENT)
  getUpcomingHomework(
    @Param('studentId') studentId: string,
    @Param('guardianId') guardianId: string,
  ) {
    return this.homeworkService.getUpcomingHomework(studentId, guardianId);
  }

  @Get('assignment/:assignmentId/student/:studentId/guardian/:guardianId')
  @Roles(UserRole.PARENT)
  getAssignmentDetails(
    @Param('assignmentId') assignmentId: string,
    @Param('studentId') studentId: string,
    @Param('guardianId') guardianId: string,
  ) {
    return this.homeworkService.getAssignmentDetails(assignmentId, studentId, guardianId);
  }
}
