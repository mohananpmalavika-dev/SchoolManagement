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

    return this.mediaService.upload(file, uploadMediaDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  findAll(@Query() query: QueryMediaDto) {
    return this.mediaService.findAll(query);
  }

  @Get('class/:classId/gallery')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  getClassGallery(
    @Param('classId') classId: string,
    @Query() query: QueryMediaDto,
  ) {
    return this.mediaService.getClassGallery(classId, query);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Get(':id/presigned-url')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN, UserRole.PARENT)
  async getPresignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const expires = expiresIn ? parseInt(expiresIn) : 3600;
    return this.mediaService.getPresignedUrl(id, expires);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
