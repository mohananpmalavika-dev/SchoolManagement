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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new staff member' })
  @ApiResponse({ status: 201, description: 'Staff member created successfully' })
  @ApiResponse({ status: 409, description: 'Staff number already exists' })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.RECEPTIONIST,
  )
  @ApiOperation({ summary: 'Query staff directory with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Staff directory retrieved successfully' })
  findAll(@Query() query: QueryStaffDto) {
    return this.staffService.findAll(query);
  }

  @Get('stats')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Get staff overview statistics' })
  @ApiResponse({ status: 200, description: 'Staff statistics' })
  getStats() {
    return this.staffService.getStats();
  }

  @Get('departments')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Get departmental staff distribution' })
  @ApiResponse({ status: 200, description: 'Departmental breakdown' })
  getDepartments() {
    return this.staffService.getDepartments();
  }

  @Get('teachers')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.EXAM_OFFICER,
  )
  @ApiOperation({ summary: 'Get active teaching staff' })
  @ApiResponse({ status: 200, description: 'Teachers list' })
  getTeachingStaff() {
    return this.staffService.getTeachingStaff();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Get detailed staff profile by ID' })
  @ApiParam({ name: 'id', description: 'Staff UUID' })
  @ApiResponse({ status: 200, description: 'Staff profile retrieved' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Update staff member profile' })
  @ApiParam({ name: 'id', description: 'Staff UUID' })
  @ApiResponse({ status: 200, description: 'Staff updated successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Deactivate / terminate a staff member' })
  @ApiParam({ name: 'id', description: 'Staff UUID' })
  @ApiResponse({ status: 200, description: 'Staff member deactivated' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}
