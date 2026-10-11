import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { BonafidePurpose, IDCardOrientation } from '@krypton/types';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('students')
  @ApiOperation({ summary: 'Get list of students eligible for certificates' })
  getStudents() {
    return this.certificatesService.getStudents();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get school certificate branding and principal settings' })
  getSettings() {
    return this.certificatesService.getSchoolSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update school certificate branding settings' })
  updateSettings(@Body() body: any) {
    return this.certificatesService.updateSchoolSettings(body);
  }

  @Get('transfer/:studentId')
  @ApiOperation({ summary: 'Generate Transfer Certificate (TC) for student' })
  getTransferCertificate(
    @Param('studentId') studentId: string,
    @Query('reason') reason?: string
  ) {
    return this.certificatesService.generateTransferCertificate(studentId, {
      reasonForLeaving: reason,
    });
  }

  @Get('bonafide/:studentId')
  @ApiOperation({ summary: 'Generate Bonafide Certificate for student' })
  getBonafideCertificate(
    @Param('studentId') studentId: string,
    @Query('purpose') purpose?: BonafidePurpose
  ) {
    return this.certificatesService.generateBonafideCertificate(studentId, purpose);
  }

  @Get('character/:studentId')
  @ApiOperation({ summary: 'Generate Character & Conduct Certificate for student' })
  getCharacterCertificate(@Param('studentId') studentId: string) {
    return this.certificatesService.generateCharacterCertificate(studentId);
  }

  @Get('id-card/:studentId')
  @ApiOperation({ summary: 'Generate Digital Student ID Card with live QR payload' })
  getIDCard(
    @Param('studentId') studentId: string,
    @Query('orientation') orientation?: IDCardOrientation
  ) {
    return this.certificatesService.generateIDCard(studentId, orientation);
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Cryptographic public verification of certificate hash or admission no' })
  verifyCertificate(@Param('code') code: string) {
    return this.certificatesService.verifyCertificate(code);
  }
}
