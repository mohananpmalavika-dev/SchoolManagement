import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { CompleteRolloverDto, RolloverPlanDto } from './academic-rollover.dto';
import { AcademicRolloverService } from './academic-rollover.service';

@Controller('academic-rollover')
export class AcademicRolloverController {
  constructor(private service: AcademicRolloverService) {}

  @Get('options') options(@Request() req: any) { return this.service.options(req.user); }
  @Post('preview') preview(@Request() req: any, @Body() plan: RolloverPlanDto) {
    return this.service.preview(req.user, plan);
  }
  @Post('complete') complete(@Request() req: any, @Body() plan: CompleteRolloverDto) {
    return this.service.complete(req.user, plan);
  }
}
