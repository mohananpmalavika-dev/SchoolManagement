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
  ApiQuery,
} from '@nestjs/swagger';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { LinkStudentDto } from './dto/link-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@ApiTags('guardians')
@ApiBearerAuth()
@Controller('guardians')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new guardian' })
  @ApiResponse({ status: 201, description: 'Guardian created successfully' })
  create(@Body() createGuardianDto: CreateGuardianDto) {
    return this.guardiansService.create(createGuardianDto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get all guardians' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, phone, or email' })
  @ApiResponse({ status: 200, description: 'Guardians retrieved successfully' })
  findAll(@Query('search') search?: string) {
    return this.guardiansService.findAll(search);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get guardian by ID' })
  @ApiParam({ name: 'id', description: 'Guardian ID' })
  @ApiResponse({ status: 200, description: 'Guardian retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Guardian not found' })
  findOne(@Param('id') id: string) {
    return this.guardiansService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Update guardian information' })
  @ApiParam({ name: 'id', description: 'Guardian ID' })
  @ApiResponse({ status: 200, description: 'Guardian updated successfully' })
  @ApiResponse({ status: 404, description: 'Guardian not found' })
  update(@Param('id') id: string, @Body() updateGuardianDto: UpdateGuardianDto) {
    return this.guardiansService.update(id, updateGuardianDto);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete guardian' })
  @ApiParam({ name: 'id', description: 'Guardian ID' })
  @ApiResponse({ status: 200, description: 'Guardian deleted successfully' })
  @ApiResponse({ status: 404, description: 'Guardian not found' })
  @ApiResponse({ status: 409, description: 'Guardian is linked to students' })
  remove(@Param('id') id: string) {
    return this.guardiansService.remove(id);
  }

  @Post(':id/link-student')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Link guardian to a student' })
  @ApiParam({ name: 'id', description: 'Guardian ID' })
  @ApiResponse({ status: 200, description: 'Student linked successfully' })
  @ApiResponse({ status: 404, description: 'Guardian or student not found' })
  @ApiResponse({ status: 409, description: 'Link already exists' })
  linkStudent(@Param('id') id: string, @Body() linkStudentDto: LinkStudentDto) {
    return this.guardiansService.linkStudent(id, linkStudentDto);
  }

  @Delete(':id/students/:studentId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink student from guardian' })
  @ApiParam({ name: 'id', description: 'Guardian ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  unlinkStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.guardiansService.unlinkStudent(id, studentId);
  }

  @Get(':id/students')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
  )
  @ApiOperation({ summary: 'Get all students linked to guardian' })
  @ApiParam({ name: 'id', description: 'Guardian ID' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Guardian not found' })
  getStudents(@Param('id') id: string) {
    return this.guardiansService.getStudents(id);
  }
}
