from pathlib import Path
import re
p=Path('apps/api/src/modules/attendance/attendance.service.ts');s=p.read_text().replace('checkInTime: item.checkInTime','timeIn: item.checkInTime').replace('checkOutTime: item.checkOutTime','timeOut: item.checkOutTime').replace('checkInTime: dto.checkInTime','timeIn: dto.checkInTime').replace('checkOutTime: dto.checkOutTime','timeOut: dto.checkOutTime');s=s.replace('            markedBy: userId,','            markedBy: userId,');p.write_text(s)
p=Path('packages/database/prisma/schema.prisma');s=p.read_text().replace('model StaffAttendance {','model StaffAttendance {\n  markedBy String?');p.write_text(s)
p=Path('apps/api/src/modules/students/students.service.ts');s=re.sub(r'\s+relationship: false,','',p.read_text());p.write_text(s)
p=Path('apps/api/src/modules/timetable/timetable.service.ts');s=p.read_text().replace('dto.room || existing.room,','dto.room || existing.room || undefined,');p.write_text(s)
p=Path('apps/api/src/modules/mpesa/mpesa.service.ts');s=p.read_text().replace('transaction.initiatedBy,','transaction.initiatedBy || undefined,').replace('const tenantId = this.tenantService.getTenantContext();','const tenantId = this.tenantService.getTenantId();').replace("transactionType: 'MANUAL',","transactionType: 'MANUAL',\n          accountReference: dto.invoiceId,")
s=s.replace('    const amountInShillings = Math.floor(dto.amount / 100);',"    if (dto.amount % 100 !== 0) throw new BadRequestException('M-Pesa payments must use whole shilling amounts');\n    const amountInShillings = dto.amount / 100;")
s=s.replace("    const tenantId = this.tenantService.requireTenantContext();\n\n    // Validate invoice exists", "    const tenantId = this.tenantService.requireTenantContext();\n    if (!this.consumerKey || !this.consumerSecret || !this.passkey || !this.callbackUrl) throw new BadRequestException('M-Pesa is not configured. Contact your school office.');\n\n    // Validate invoice exists",1)
# Callback payment metadata must match the original request before money is allocated.
s=s.replace('      const mpesaReceiptNumber = metadata.MpesaReceiptNumber;',"      if (Math.round(Number(metadata.Amount) * 100) !== transaction.amount || String(metadata.PhoneNumber) !== transaction.phoneNumber) throw new BadRequestException('Payment callback does not match the original request');\n      const mpesaReceiptNumber = metadata.MpesaReceiptNumber;")
p.write_text(s)
p=Path('apps/api/src/modules/fees/fees.service.ts');s=p.read_text();s="import { randomUUID } from 'node:crypto';\nimport { FeeCategory } from '@krypton/types';\n"+s
s=s.replace('description: item.description || item.name,','description: item.description,',1)
s=s.replace('feeCategory: item.feeCategory,\n        }));','feeCategory: item.feeCategory as FeeCategory,\n        }));')
start=s.index('  async recordPayment(');end=s.index('  async findAllPayments(',start)
s=s[:start]+'''  async recordPayment(dto: RecordPaymentDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();
    if (!Number.isSafeInteger(dto.amount) || dto.amount <= 0) throw new BadRequestException('Amount must be positive minor units');
    const existing = await this.prisma.payment.findFirst({where:{tenantId,reference:dto.reference}});
    if(existing){
      if(existing.invoiceId===dto.invoiceId&&existing.amount===dto.amount&&existing.status==='COMPLETED')return existing;
      throw new ConflictException('Payment reference is already in use');
    }
    try {
      return await this.prisma.$transaction(async tx=>{
        // The conditional decrement obtains the invoice row lock and prevents concurrent overpayments.
        const changed=await tx.invoice.updateMany({where:{id:dto.invoiceId,tenantId,status:{in:['PENDING','PARTIALLY_PAID','OVERDUE']},balanceAmount:{gte:dto.amount}},data:{paidAmount:{increment:dto.amount},balanceAmount:{decrement:dto.amount}}});
        if(!changed.count)throw new BadRequestException('Invoice unavailable or payment exceeds the remaining balance');
        const invoice=await tx.invoice.findFirstOrThrow({where:{id:dto.invoiceId,tenantId}});
        await tx.invoice.update({where:{id:invoice.id,tenantId},data:{status:invoice.balanceAmount===0?'PAID':'PARTIALLY_PAID'}});
        return tx.payment.create({data:{tenantId,invoiceId:dto.invoiceId,amount:dto.amount,paymentMethod:dto.paymentMethod,reference:dto.reference,status:'COMPLETED',paymentDate:dto.paymentDate?new Date(dto.paymentDate):new Date(),receiptNumber:'RCT-'+randomUUID().slice(0,12).toUpperCase(),receiptIssued:true,receiptIssuedAt:new Date(),notes:dto.notes,processedBy:userId}});
      });
    }catch(error:any){
      if(error.code==='P2002'){
        const duplicate=await this.prisma.payment.findFirst({where:{tenantId,reference:dto.reference}});
        if(duplicate?.invoiceId===dto.invoiceId&&duplicate.amount===dto.amount&&duplicate.status==='COMPLETED')return duplicate;
        throw new ConflictException('Payment reference is already in use');
      }
      throw error;
    }
  }

'''+s[end:]
# Collision-resistant identifiers rather than count + 1 under concurrent admissions/payments.
s=re.sub(r'return `INV-\$\{year\}-\$\{String\(count \+ 1\).padStart\(6, \'0\'\)\}`;',"return 'INV-'+year+'-'+randomUUID().slice(0,8).toUpperCase();",s)
p.write_text(s)
