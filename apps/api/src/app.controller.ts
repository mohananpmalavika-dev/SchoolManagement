import { Public } from './common/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health')
  @ApiOperation({ summary: 'Detailed health check' })
  getDetailedHealth() {
    return this.appService.getDetailedHealth();
  }
}
