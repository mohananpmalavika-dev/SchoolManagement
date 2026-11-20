import { Controller, Post, Get, Delete, Param, Query, UseGuards, HttpCode, HttpStatus, GoneException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BackupService, BackupResult, RestoreResult } from './backup.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '@krypton/types';

@ApiTags('Backup')
@ApiBearerAuth()
@Controller('backups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new database backup (SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Backup created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires SUPER_ADMIN role' })
  async createBackup(): Promise<BackupResult> {
    return this.backupService.createBackup();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all available backups' })
  @ApiResponse({ status: 200, description: 'List of backups' })
  async listBackups(): Promise<Array<{ backupId: string; source: string; size: number; timestamp: Date }>> {
    return this.backupService.listBackups();
  }

  @Post(':backupId/verify')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify backup integrity' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyBackup(@Param('backupId') backupId: string): Promise<{ success: boolean; backupId: string }> {
    const success = await this.backupService.verifyBackup(backupId);
    return { success, backupId };
  }

  @Post(':backupId/restore')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Online restore retired (HTTP 410)',
    description: 'Use the operator CLI to restore into a separate empty database and verify reviewed counts.'
  })
  @ApiQuery({ name: 'targetDatabase', required: false, description: 'Deprecated; use the operator CLI' })
  @ApiResponse({ status: 200, description: 'Restore completed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async restoreBackup(
    @Param('backupId') backupId: string,
    @Query('targetDatabase') targetDatabase?: string,
  ): Promise<RestoreResult> {
    throw new GoneException('Online database restore is disabled. Use the operator restore command with a separate empty target and reviewed verification counts.');
  }

  @Delete('prune')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete old backups based on retention policy' })
  @ApiQuery({ name: 'retentionDays', required: false, type: Number, description: 'Number of days to retain backups (default: 14)' })
  @ApiResponse({ status: 200, description: 'Number of backups deleted' })
  async pruneOldBackups(@Query('retentionDays') retentionDays?: number): Promise<{ deletedCount: number }> {
    const deletedCount = await this.backupService.pruneOldBackups(retentionDays ? parseInt(retentionDays.toString()) : 14);
    return { deletedCount };
  }
}
