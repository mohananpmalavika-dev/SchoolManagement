from pathlib import Path
import re
for name in ['timetable','communications','subscriptions']:
 p=Path('apps/api/src/modules')/name/(name+'.module.ts');s=p.read_text();s=re.sub(r"import \{ (?:PrismaService|TenantService) \}[^\n]+\n",'',s);s=s.replace(', PrismaService, TenantService','').replace(', PrismaService','').replace(', TenantService','');p.write_text(s)
p=Path('apps/api/src/modules/communications/communications.service.ts');s=p.read_text();s="import * as nodemailer from 'nodemailer';\n"+s
s=s.replace("this.configService.get('SMTP_PASSWORD', '')","this.configService.get('SMTP_PASSWORD', this.configService.get('SMTP_PASS', ''))")
s=s.replace('    // Create communication record',"    if(dto.scheduledAt) throw new BadRequestException('Scheduled delivery requires a configured job queue');\n    if(dto.channel===MessageChannel.PUSH) throw new BadRequestException('Push delivery is not configured');\n    if(!dto.recipients.length||dto.recipients.length>500) throw new BadRequestException('Select between 1 and 500 recipients');\n    // Create communication record",1)
s=s.replace('    return communication;','    return this.prisma.communication.findUnique({where:{id:communication.id}});',1)
s=s.replace("status: results.failed > 0 ? 'PARTIALLY_SENT' : 'SENT'","status: results.success === 0 ? 'FAILED' : results.failed > 0 ? 'PARTIALLY_SENT' : 'SENT'")
start=s.index('  private async sendEmail(');end=s.index('  private async sendInApp(',start)
s=s[:start]+'''  private async sendEmail(communication:any,recipients:string[],results:any){
    if(!this.smtpHost){results.failed=recipients.length;return;}
    const transport=nodemailer.createTransport({host:this.smtpHost,port:Number(this.smtpPort),secure:this.configService.get('SMTP_SECURE')==='true',auth:this.smtpUser?{user:this.smtpUser,pass:this.smtpPassword}:undefined,connectionTimeout:10000,socketTimeout:20000,disableFileAccess:true,disableUrlAccess:true});
    for(const recipient of recipients){
      try{
        const response=await transport.sendMail({from:this.configService.get('EMAIL_FROM'),to:recipient,subject:communication.subject||'School update',text:communication.body});
        if(!response.accepted?.length)throw new Error('SMTP server rejected recipient');
        await this.prisma.communicationLog.create({data:{communicationId:communication.id,recipient,channel:'EMAIL',status:'SENT',sentAt:new Date()}});results.success++;
      }catch(error:any){
        await this.prisma.communicationLog.create({data:{communicationId:communication.id,recipient,channel:'EMAIL',status:'FAILED',errorMessage:'Email delivery failed'}});results.failed++;results.errors.push({recipient,error:'Email delivery failed'});
      }
    }
    transport.close();
  }

'''+s[end:]
# Provider acceptance is checked for every recipient; an HTTP 200 alone is not a delivery result.
s=s.replace("      // Log each recipient\n      for (const recipient of recipients) {", "      const reports = response.data?.SMSMessageData?.Recipients || [];\n      for (const recipient of recipients) {\n        const report = reports.find((item:any) => item.number === recipient);\n        const accepted = report?.status === 'Success';")
s=s.replace("            channel: MessageChannel.SMS,\n            status: 'SENT',","            channel: MessageChannel.SMS,\n            status: accepted ? 'SENT' : 'FAILED',")
s=s.replace('        results.success++;\n      }\n\n      this.logger.log(`SMS sent', '        if(accepted) results.success++; else results.failed++;\n      }\n\n      this.logger.log(`SMS sent')
p.write_text(s)
