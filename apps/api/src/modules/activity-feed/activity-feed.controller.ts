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
  Request,
} from '@nestjs/common';
import { ActivityFeedService } from './activity-feed.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@Controller('activity-feed')
export class ActivityFeedController {
  constructor(private readonly activityFeedService: ActivityFeedService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  create(@Body() createActivityDto: CreateActivityDto, @Request() req: any) {
    return this.activityFeedService.create(createActivityDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  findAll(@Query() query: QueryActivitiesDto) {
    return this.activityFeedService.findAll(query);
  }

  @Get('student/:studentId')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  findByStudent(
    @Param('studentId') studentId: string,
    @Query() query: QueryActivitiesDto,
  ) {
    return this.activityFeedService.findByStudent(studentId, query);
  }

  @Get('student/:studentId/summary')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  getActivitySummary(@Param('studentId') studentId: string) {
    return this.activityFeedService.getActivitySummary(studentId);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  findOne(@Param('id') id: string) {
    return this.activityFeedService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    return this.activityFeedService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  remove(@Param('id') id: string) {
    return this.activityFeedService.remove(id);
  }
}
