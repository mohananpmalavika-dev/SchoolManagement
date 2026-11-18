import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PreschoolMediaService } from './preschool-media.service';
import { PreschoolPhotoDto } from './preschool.dto';
import { PreschoolCopilotDto } from './preschool.dto';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { PreschoolService } from './preschool.service';
import { PreschoolContentService } from './preschool-content.service';
import { ClassroomCameraService } from './classroom-camera.service';
import { PreschoolPickupService } from './preschool-pickup.service';
import {
  CameraConsentDto,
  CameraDto,
  CareRecordDto,
  CheckOutDto,
  GeneratePreschoolDto,
  ObservationDto,
  PickupPassDto,
  PreschoolAssignmentDto,
  PreschoolClassDto,
  PreschoolQueryDto,
  PublishPreschoolContentDto,
  SavePreschoolContentDto,
  SchoolProgrammeDto,
  UpdatePreschoolContentDto,
  PickupPermissionDto,
} from './preschool.dto';

@Controller('preschool')
export class PreschoolController {
  @Get('navigation') navigation(@CurrentUser() user: CurrentUserData) {
    return this.service.navigation(user);
  }
  constructor(
    private service: PreschoolService,
    private contentService: PreschoolContentService,
    private cameras: ClassroomCameraService,
    private media: PreschoolMediaService,
    private pickup: PreschoolPickupService
  ) {}
  @Post('students/:id/photos')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1 },
    })
  )
  upload(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: PreschoolPhotoDto
  ) {
    return this.media.upload(user, id, file, dto.caption);
  }
  @Get('students/:id/photos') photos(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PreschoolQueryDto
  ) {
    return this.media.list(user, id, query.offset);
  }
  @Get('students/:id/photos/:photoId/view') photo(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string
  ) {
    return this.media.view(user, id, photoId);
  }
  @Patch('students/:id/guardians/:guardianId/pickup')
  pickupPermission(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
    @Body() dto: PickupPermissionDto
  ) {
    return this.service.pickupPermission(user, id, guardianId, dto.canPickup);
  }
  @Get('options') options(@CurrentUser() user: CurrentUserData) {
    return this.service.options(user);
  }
  @Post('copilot') @Throttle({ default: { limit: 8, ttl: 60000 } }) copilot(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: PreschoolCopilotDto
  ) {
    return this.contentService.copilot(user, dto);
  }
  @Patch('schools/:id') programme(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SchoolProgrammeDto
  ) {
    return this.service.programme(user, id, dto);
  }
  @Patch('classes/:id') stage(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PreschoolClassDto
  ) {
    return this.service.stage(user, id, dto.stage);
  }
  @Post('staff-assignments') assign(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: PreschoolAssignmentDto
  ) {
    return this.service.assign(user, dto);
  }
  @Get('classes/:id/roster') roster(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PreschoolQueryDto
  ) {
    return this.service.roster(user, id, query.offset);
  }
  @Get('students/:id') child(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PreschoolQueryDto
  ) {
    return this.service.child(user, id, query);
  }
  @Post('students/:id/check-in') checkIn(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.service.checkIn(user, id);
  }
  @Post('students/:id/check-out') checkOut(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckOutDto
  ) {
    return this.service.checkOut(user, id, dto);
  }
  @Get('students/:id/pickup-pass') pickupPassStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.pickup.status(user, id);
  }
  @Post('students/:id/pickup-pass')
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  issuePickupPass(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PickupPassDto
  ) {
    return this.pickup.issue(user, id, dto);
  }
  @Post('students/:id/pickup-pass/revoke')
  revokePickupPass(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.pickup.revoke(user, id);
  }
  @Post('students/:id/care') care(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CareRecordDto
  ) {
    return this.service.care(user, id, dto);
  }
  @Post('observations') observe(@CurrentUser() user: CurrentUserData, @Body() dto: ObservationDto) {
    return this.service.observe(user, dto);
  }
  @Get('content') content(@CurrentUser() user: CurrentUserData, @Query() query: PreschoolQueryDto) {
    return this.service.content(user, query);
  }
  @Post('content/generate') @Throttle({ default: { limit: 8, ttl: 60000 } }) generate(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: GeneratePreschoolDto
  ) {
    return this.contentService.generate(user, dto);
  }
  @Post('content') saveContent(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SavePreschoolContentDto
  ) {
    return this.service.saveContent(user, dto);
  }
  @Patch('content/:id') updateContent(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePreschoolContentDto
  ) {
    return this.service.updateContent(user, id, dto);
  }
  @Post('content/:id/publish') publish(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishPreschoolContentDto
  ) {
    return this.service.publish(user, id, dto.version, dto.reviewed);
  }
  @Get('reports') report(@CurrentUser() user: CurrentUserData, @Query() query: PreschoolQueryDto) {
    return this.service.report(user, query);
  }
  @Get('classes/:id/cameras') cameraList(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.cameras.list(user, id);
  }
  @Post('cameras') cameraCreate(@CurrentUser() user: CurrentUserData, @Body() dto: CameraDto) {
    return this.cameras.save(user, dto);
  }
  @Patch('cameras/:id') cameraUpdate(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CameraDto
  ) {
    return this.cameras.save(user, dto, id);
  }
  @Get('students/:id/cameras') cameraParentList(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.cameras.parentList(user, id);
  }
  @Post('students/:id/camera-consent') consent(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CameraConsentDto
  ) {
    return this.cameras.consent(user, id, dto.consent);
  }
  @Post('students/:id/cameras/:cameraId/session')
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  session(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('cameraId', ParseUUIDPipe) cameraId: string
  ) {
    return this.cameras.session(user, id, cameraId);
  }
}
