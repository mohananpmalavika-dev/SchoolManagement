import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { BehaviorService } from './behavior.service';
import { CreateBehaviorDto } from './dto/create-behavior.dto';
import { UpdateBehaviorDto } from './dto/update-behavior.dto';
import { QueryBehaviorDto } from './dto/query-behavior.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@Controller('behavior')
export class BehaviorController {
  constructor(private readonly behaviorService: BehaviorService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  create(@Body() createBehaviorDto: CreateBehaviorDto, @Request() req: any) {
    return this.behaviorService.create(createBehaviorDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  findAll(@Query() query: QueryBehaviorDto) {
    return this.behaviorService.findAll(query);
  }

  @Get('student/:studentId')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  findByStudent(
    @Param('studentId') studentId: string,
    @Query() query: QueryBehaviorDto,
  ) {
    return this.behaviorService.findAll({ ...query, studentId });
  }

  @Get('student/:studentId/summary')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  getBehaviorSummary(@Param('studentId') studentId: string) {
    return this.behaviorService.getBehaviorSummary(studentId);
  }

  @Get('student/:studentId/recent')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  getRecentBehavior(@Param('studentId') studentId: string) {
    return this.behaviorService.getRecentBehavior(studentId);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  findOne(@Param('id') id: string) {
    return this.behaviorService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  update(@Param('id') id: string, @Body() updateBehaviorDto: UpdateBehaviorDto) {
    return this.behaviorService.update(id, updateBehaviorDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  remove(@Param('id') id: string) {
    return this.behaviorService.remove(id);
  }
}
