import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';
import { TenantService } from './database/tenant.service';
import { StorageService } from './common/services/storage.service';
import { EmailService } from './common/services/email.service';
import { BackupService } from './modules/backup/backup.service';

@Injectable()
export class OperationsHealthService {
  private pending: Promise<any> | null = null;
  private cached: { at: number; report: any } | null = null;
  constructor(private core: AppService, private db: PrismaService, private tenants: TenantService,
    private storage: StorageService, private email: EmailService, private backups: BackupService, private config: ConfigService) {}
  report() {
    if (this.cached && Date.now() - this.cached.at < 15000) return Promise.resolve(this.cached.report);
    return this.pending ||= this.inspect().then(report => { this.cached = {at:Date.now(),report}; return report; }).finally(() => { this.pending = null; });
  }
  private async probe(work: () => Promise<any>) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([Promise.resolve().then(work), new Promise<never>((_,reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), 3500);
      })]);
    } catch { return 'unhealthy'; } finally { if (timer) clearTimeout(timer); }
  }
  private async inspect() {
    const [core, storage, smtp, backups, admin] = await Promise.all([
      this.probe(async () => { await this.core.getDetailedHealth(); return 'healthy'; }),
      this.probe(() => this.storage.checkConnectivity()), this.probe(() => this.email.checkConnectivity()),
      this.probe(() => this.backups.operationalStatus()),
      this.probe(() => this.tenants.run(async () => await this.db.user.count({where:{
        role:'SUPER_ADMIN',isActive:true,mustChangePassword:false,mfaEnabled:true,
      }}) > 0 ? 'healthy' : 'unconfigured')),
    ]);
    const checks = { core, storage, smtp, administrator: admin,
      backupStorage: backups?.localStorage || 'unhealthy', backupFreshness: backups?.backup || 'unhealthy',
      offsiteBackup: backups?.offsite || 'unhealthy', restoreRehearsal: backups?.rehearsal || 'unverified' };
    const required = (['core','administrator'] as string[]).concat(
      ['storage','smtp','backupStorage','backupFreshness','offsiteBackup','restoreRehearsal'].filter(key =>
        this.config.get('OPS_REQUIRE_' + key.replace(/[A-Z]/g, c=>'_'+c).toUpperCase(), this.config.get('NODE_ENV') === 'production' ? 'true' : 'false') === 'true'));
    return {status:required.every(key => (checks as any)[key] === 'healthy') ? 'ready' : 'degraded',
      timestamp:new Date().toISOString(), scope:'operator-go-live-checks', checks, required,
      backups:{lastSuccessAt:backups?.lastSuccessAt || null,lastRehearsalAt:backups?.lastRehearsalAt || null},
      acceptance:{cctv:'real-device-required',turnWebrtc:'cross-network-required',push:'real-device-required',gps:'real-device-required',
        government:'manual-submission-only',ci:'review-run-artifacts'},
      note:'Storage reachability and SMTP authentication do not certify bucket privacy or final inbox delivery.'};
  }
}
