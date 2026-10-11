import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import {
  AdmissionStage,
  CreateAdmissionInput,
  AdmissionInterview,
  AdmissionPayment,
  AdmissionEnrollment,
} from '@krypton/types';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('stage') stage?: AdmissionStage,
    @Query('grade') grade?: string
  ) {
    return {
      success: true,
      data: this.admissionsService.findAll({ search, stage, grade }),
    };
  }

  @Get('stats')
  getStats() {
    return {
      success: true,
      data: this.admissionsService.getFunnelStats(),
    };
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return {
      success: true,
      data: this.admissionsService.findById(id),
    };
  }

  @Post()
  create(@Body() input: CreateAdmissionInput) {
    return {
      success: true,
      data: this.admissionsService.create(input),
      message: 'Admission inquiry registered successfully',
    };
  }

  @Post(':id/stage')
  updateStage(
    @Param('id') id: string,
    @Body() body: { stage: AdmissionStage; actor?: string; note?: string }
  ) {
    return {
      success: true,
      data: this.admissionsService.updateStage(id, body.stage, body.actor, body.note),
      message: `Stage updated to ${body.stage}`,
    };
  }

  @Post(':id/interview')
  scheduleInterview(
    @Param('id') id: string,
    @Body() interview: AdmissionInterview
  ) {
    return {
      success: true,
      data: this.admissionsService.scheduleInterview(id, interview),
      message: 'Interview scheduled successfully',
    };
  }

  @Post(':id/payment')
  recordPayment(
    @Param('id') id: string,
    @Body() payment: AdmissionPayment
  ) {
    return {
      success: true,
      data: this.admissionsService.recordPayment(id, payment),
      message: 'Admission payment recorded successfully',
    };
  }

  @Post(':id/admit')
  completeAdmission(
    @Param('id') id: string,
    @Body() enrollment: AdmissionEnrollment
  ) {
    return {
      success: true,
      data: this.admissionsService.completeAdmission(id, enrollment),
      message: 'Student officially admitted to school',
    };
  }
}
