import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TransportService } from './transport.service';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/decorators/skip-tenant-check.decorator';
import {
  StartTripDto,
  LocationPingDto,
  UpdateStudentStatusDto,
  EndTripDto,
} from './dto/trip.dto';
import {
  UpdateSchoolLocationDto,
  CreateRouteDto,
  AutoGenerateRouteDto,
} from './dto/route-planner.dto';

@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Public()
  @SkipTenantCheck()
  @Get('school-location')
  async getSchoolLocation() {
    return this.transportService.getSchoolLocation();
  }

  @Public()
  @SkipTenantCheck()
  @Post('school-location')
  async updateSchoolLocation(@Body() dto: UpdateSchoolLocationDto) {
    return this.transportService.updateSchoolLocation(dto);
  }

  @Public()
  @SkipTenantCheck()
  @Get('places/search')
  async searchPlaces(
    @Query('q') q: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    return this.transportService.searchNearbyPlaces(q || '', latNum, lngNum);
  }

  @Public()
  @SkipTenantCheck()
  @Get('places/nearby')
  async getNearbyStops(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    const radiusKm = radius ? parseFloat(radius) : 15;
    return this.transportService.getNearbySuggestedStops(latNum, lngNum, radiusKm);
  }

  @Public()
  @SkipTenantCheck()
  @Get('routes')
  async getRoutes() {
    return this.transportService.getRoutes();
  }

  @Public()
  @SkipTenantCheck()
  @Post('routes')
  async createRoute(@Body() dto: CreateRouteDto) {
    return this.transportService.createRoute(dto);
  }

  @Public()
  @SkipTenantCheck()
  @Put('routes/:id')
  async updateRoute(@Param('id') id: string, @Body() dto: Partial<CreateRouteDto>) {
    return this.transportService.updateRoute(id, dto);
  }

  @Public()
  @SkipTenantCheck()
  @Delete('routes/:id')
  async deleteRoute(@Param('id') id: string) {
    return this.transportService.deleteRoute(id);
  }

  @Public()
  @SkipTenantCheck()
  @Post('routes/auto-generate')
  async autoGenerateRoute(@Body() dto: AutoGenerateRouteDto) {
    return this.transportService.autoGenerateRoute(dto);
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
