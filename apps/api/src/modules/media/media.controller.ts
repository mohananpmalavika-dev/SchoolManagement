import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { QueryMediaDto } from './dto/query-media.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadMediaDto: UploadMediaDto,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    await this.mediaService.authorize(req.user, uploadMediaDto);
    return this.mediaService.upload(file, uploadMediaDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  async findAll(@Query() query: QueryMediaDto, @Request() req: any) {
    await this.mediaService.authorize(req.user, query);
    return this.mediaService.findAll(query);
  }

  @Get('class/:classId/gallery')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  async getClassGallery(
    @Param('classId') classId: string,
    @Query() query: QueryMediaDto,
    @Request() req: any,
  ) {
    await this.mediaService.authorize(req.user, { classId });
    return this.mediaService.getClassGallery(classId, query);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  async findOne(@Param('id') id: string, @Request() req: any) {
    const media = await this.mediaService.findOne(id);
    await this.mediaService.authorize(req.user, media);
    return media;
  }

  @Get(':id/presigned-url')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN, UserRole.PARENT)
  async getPresignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
    @Request() req?: any,
  ) {
    const media = await this.mediaService.findOne(id);
    await this.mediaService.authorize(req.user, media);
    const expires = expiresIn ? Number(expiresIn) : 120;
    if (!Number.isInteger(expires) || expires < 1 || expires > 300) throw new BadRequestException('Photo links can last between 1 and 300 seconds');
    return this.mediaService.getPresignedUrl(id, expires);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.mediaService.authorize(req.user, await this.mediaService.findOne(id));
    return this.mediaService.remove(id);
  }
}
