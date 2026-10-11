import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TransportService } from './transport.service';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/decorators/skip-tenant-check.decorator';
import {
  StartTripDto,
  LocationPingDto,
  UpdateStudentStatusDto,
  EndTripDto,
} from './dto/trip.dto';

@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Public()
  @SkipTenantCheck()
  @Get('routes')
  async getRoutes() {
    return this.transportService.getRoutes();
  }

  @Public()
  @SkipTenantCheck()
  @Get('trips/live')
  async getLiveTrips() {
    return this.transportService.getLiveTrips();
  }

  @Public()
  @SkipTenantCheck()
  @Get('trip/:id')
  async getTrip(@Param('id') id: string) {
    return this.transportService.getTripById(id);
  }

  @Public()
  @SkipTenantCheck()
  @Get('route/:routeId/active')
  async getActiveTripByRoute(@Param('routeId') routeId: string) {
    return this.transportService.getActiveTripByRoute(routeId);
  }

  @Public()
  @SkipTenantCheck()
  @Get('parent/:studentId')
  async getParentTracking(@Param('studentId') studentId: string) {
    return this.transportService.getParentTracking(studentId);
  }

  @Public()
  @SkipTenantCheck()
  @Get('parent')
  async getParentDefaultTracking(@Query('studentId') studentId?: string) {
    return this.transportService.getParentTracking(studentId);
  }

  @Public()
  @SkipTenantCheck()
  @Post('trip/start')
  async startTrip(@Body() dto: StartTripDto) {
    return this.transportService.startTrip(dto);
  }

  @Public()
  @SkipTenantCheck()
  @Post('trip/location')
  async recordLocation(@Body() dto: LocationPingDto) {
    return this.transportService.recordLocation(dto);
  }

  @Public()
  @SkipTenantCheck()
  @Post('trip/student-status')
  async updateStudentStatus(@Body() dto: UpdateStudentStatusDto) {
    return this.transportService.updateStudentStatus(dto);
  }

  @Public()
  @SkipTenantCheck()
  @Post('trip/end')
  async endTrip(@Body() dto: EndTripDto) {
    return this.transportService.endTrip(dto);
  }
}
