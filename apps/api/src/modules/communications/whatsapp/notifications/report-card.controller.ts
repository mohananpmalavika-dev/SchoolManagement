import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportCardService } from './report-card.service';
import { SendReportCardsDto } from './dto/send-report-cards.dto';

@ApiTags('WhatsApp - Report Cards')
@Controller('whatsapp/report-cards')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is set up
export class ReportCardController {
  constructor(private readonly reportCardService: ReportCardService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send report cards via WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Report cards sent successfully',
    schema: {
      example: {
        totalProcessed: 30,
        successful: 28,
        failed: 2,
        details: [
          {
            studentId: 'uuid',
            studentName: 'John Doe',
            guardianPhone: '+254712345678',
            success: true,
          },
        ],
      },
    },
  })
  async sendReportCards(@Body() dto: SendReportCardsDto) {
    return this.reportCardService.sendReportCards({
      reportCardId: dto.reportCardId,
      termId: dto.termId,
      classId: dto.classId,
      studentId: dto.studentId,
      language: dto.language,
      includeRemarks: dto.includeRemarks,
    });
  }

  @Post('send-by-term')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send all report cards for a specific term' })
  @ApiResponse({
    status: 200,
    description: 'Term report cards sent',
  })
  async sendByTerm(
    @Body()
    dto: {
      termId: string;
      classId?: string;
      language?: 'en' | 'sw';
      includeRemarks?: boolean;
    },
  ) {
    return this.reportCardService.sendReportCards({
      termId: dto.termId,
      classId: dto.classId,
      language: dto.language || 'en',
      includeRemarks: dto.includeRemarks !== false,
    });
  }

  @Post('send-by-class')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send report cards for all students in a class' })
  @ApiResponse({
    status: 200,
    description: 'Class report cards sent',
  })
  async sendByClass(
    @Body()
    dto: {
      classId: string;
      termId?: string;
      language?: 'en' | 'sw';
      includeRemarks?: boolean;
    },
  ) {
    return this.reportCardService.sendReportCards({
      classId: dto.classId,
      termId: dto.termId,
      language: dto.language || 'en',
      includeRemarks: dto.includeRemarks !== false,
    });
  }

  @Post('send-with-pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send individual report card with PDF attachment',
  })
  @ApiResponse({
    status: 200,
    description: 'Report card with PDF sent',
  })
  async sendWithPdf(
    @Body()
    dto: {
      reportCardId: string;
      pdfUrl: string;
      language?: 'en' | 'sw';
    },
  ) {
    const result = await this.reportCardService.sendReportCardWithPdf(
      dto.reportCardId,
      dto.pdfUrl,
      dto.language || 'en',
    );

    return {
      success: result,
      message: result
        ? 'Report card sent successfully with PDF'
        : 'Failed to send report card',
    };
  }

  @Post('send-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send report card summary (grades overview without PDF)',
  })
  @ApiResponse({
    status: 200,
    description: 'Report card summary sent',
  })
  async sendSummary(
    @Body()
    dto: {
      reportCardId: string;
      language?: 'en' | 'sw';
    },
  ) {
    const result = await this.reportCardService.sendReportCardSummary(
      dto.reportCardId,
      dto.language || 'en',
    );

    return {
      success: result,
      message: result
        ? 'Report card summary sent successfully'
        : 'Failed to send summary',
    };
  }
}

