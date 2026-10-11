from pathlib import Path
import re
p=Path('apps/api/src/app.module.ts');s=p.read_text();s=s.replace('import { Module }','import { Module, MiddlewareConsumer, NestModule }')
s="import { APP_GUARD } from '@nestjs/core';\nimport { ThrottlerGuard } from '@nestjs/throttler';\nimport { JwtAuthGuard } from './common/guards/jwt-auth.guard';\nimport { RolesGuard } from './common/guards/roles.guard';\nimport { PortalScopeGuard } from './common/guards/portal-scope.guard';\nimport { TenantService } from './database/tenant.service';\nimport { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';\nimport { WorkspaceModule } from './modules/workspace/workspace.module';\n"+s
s=s.replace('    AuthModule,','    AuthModule,\n    WorkspaceModule,')
s=s.replace('  providers: [AppService],',"  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_GUARD, useClass: RolesGuard }, { provide: APP_GUARD, useClass: PortalScopeGuard }],")
s=s.replace('export class AppModule {}',"""export class AppModule implements NestModule {
 constructor(private tenants:TenantService){}
 configure(consumer:MiddlewareConsumer){
  consumer.apply((req:any,res:any,next:()=>void)=>this.tenants.run(next),TenantResolutionMiddleware).forRoutes('*');
 }
}""");p.write_text(s)
p=Path('apps/api/src/common/filters/http-exception.filter.ts');s=p.read_text().replace('      success: false,','      success: false,\n      message: this.getErrorMessage(exceptionResponse),');p.write_text(s)
p=Path('apps/api/src/app.controller.ts');s=p.read_text();s="import { Public } from './common/decorators/public.decorator';\n"+s;s=s.replace('@Controller()','@Controller()\n@Public()');p.write_text(s)
p=Path('apps/api/src/app.service.ts');s=p.read_text().replace('import { Injectable }','import { Injectable, ServiceUnavailableException }');s=s.replace('    return health;',"    if (health.status !== 'ok') throw new ServiceUnavailableException('Database unavailable');\n    return health;");p.write_text(s)
p=Path('packages/database/prisma/schema.prisma');s=p.read_text().replace('model User {','model User {\n  tokenVersion Int @default(0)').replace('model StaffAttendance {','model StaffAttendance {\n  remarks String?')
s=s.replace('model Invoice {','model Invoice {\n  feeStructureId String?\n  feeStructure FeeStructure? @relation(fields: [feeStructureId], references: [id])').replace('model FeeStructure {','model FeeStructure {\n  invoices Invoice[]')
s=s.replace('model MpesaTransaction {','model MpesaTransaction {\n  payment Payment? @relation("AllocatedPayment", fields: [paymentId], references: [id])').replace('model Payment {','model Payment {\n  allocatedTransactions MpesaTransaction[] @relation("AllocatedPayment")')
s=s.replace('merchantRequestId String   @unique','merchantRequestId String?  @unique').replace('checkoutRequestId String   @unique','checkoutRequestId String?  @unique').replace('enum MpesaTransactionType {\n','enum MpesaTransactionType {\n  MANUAL\n');p.write_text(s)
p=Path('apps/api/src/modules/attendance/attendance.service.ts');s=p.read_text();s=re.sub(r'\s*\|\|\s*r.status === AttendanceStatus.ABSENT','',s);s=re.sub(r'\s*\|\|\s*record.status === AttendanceStatus.ABSENT','',s);p.write_text(s)
p=Path('apps/api/src/modules/communications/communications.service.ts');s=p.read_text().replace("this.configService.get('SMTP_PORT', '')","this.configService.get<number>('SMTP_PORT', 1025)");p.write_text(s)
p=Path('apps/api/src/modules/fees/fees.service.ts');s=p.read_text().replace('description: item.description,','description: item.description || item.name,');p.write_text(s)
p=Path('apps/api/src/modules/students/students.service.ts');s=re.sub(r'\s+relationship: true,','',p.read_text());p.write_text(s)
p=Path('apps/api/src/modules/timetable/timetable.service.ts');s=p.read_text().replace('const grouped = {};','const grouped: Record<string, any[]> = {};').replace('        existing.streamId,','        existing.streamId || undefined,').replace('        existing.room,','        existing.room || undefined,');p.write_text(s)
p=Path('apps/api/src/modules/mpesa/mpesa.service.ts');s=p.read_text();s="import { PaymentMethod } from '@krypton/types';\n"+s
s=s.replace("paymentMethod: 'MPESA'",'paymentMethod: PaymentMethod.MPESA').replace('reference: transaction.mpesaReceiptNumber,','reference: transaction.mpesaReceiptNumber || (() => { throw new BadRequestException("Missing M-Pesa receipt"); })(),').replace('phoneNumber: dto.customerPhone,',"phoneNumber: dto.customerPhone || '',").replace('payment.id','payment!.id')
s=s.replace('    // Check if already processed','    this.tenantService.setTenantId(transaction.tenantId);\n\n    // Check if already processed')
s=s.replace("new Date(\n        metadata.TransactionDate?.toString() || Date.now(),\n      )",'this.parseProviderDate(metadata.TransactionDate)').replace('new Date(dto.TransTime)','this.parseProviderDate(dto.TransTime)')
s=s.replace('  // ==================== AUTHENTICATION ====================',r"""  private parseProviderDate(value:unknown):Date {
    const text=String(value);
    if(!/^\d{14}$/.test(text))throw new BadRequestException('Invalid payment date');
    const date=new Date(text.slice(0,4)+'-'+text.slice(4,6)+'-'+text.slice(6,8)+'T'+text.slice(8,10)+':'+text.slice(10,12)+':'+text.slice(12,14)+'+03:00');
    if(!Number.isFinite(date.getTime()))throw new BadRequestException('Invalid payment date');
    return date;
  }
  // ==================== AUTHENTICATION ====================""");p.write_text(s)
