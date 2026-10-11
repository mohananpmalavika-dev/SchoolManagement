import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Admission number already exists' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Get all students with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  findAll(@Query() query: QueryStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get('stats')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Get student statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats() {
    return this.studentsService.getStats();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Update student information' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete student (soft delete)' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Post(':id/assign-class')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Assign student to a class and stream' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student assigned successfully' })
  @ApiResponse({ status: 404, description: 'Student, class, or stream not found' })
  assignClass(@Param('id') id: string, @Body() assignClassDto: AssignClassDto) {
    return this.studentsService.assignClass(id, assignClassDto);
  }

  @Get(':id/guardians')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Get student guardians' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Guardians retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getGuardians(@Param('id') id: string) {
    return this.studentsService.getGuardians(id);
  }
}
