from pathlib import Path
import json
p=Path('apps/web/src/i18n/translations.ts');s=p.read_text(encoding='utf-8');adds=json.loads(Path('scripts/translation-additions.json').read_text(encoding='utf-8'))
s=s.replace('  parent: {\n','  parent: {\n    family: string;\n',1)
header,body=s.split('export const translations:',1)
for group,keys in adds.items():
 marker='    '+group+': {'
 for index in [1,0]:
  starts=[i for i in range(len(body)) if body.startswith(marker,i)]
  if len(starts)!=2:raise RuntimeError('Unexpected translation groups')
  offset=starts[index]+len(marker)
  inserted='\n'+''.join('      '+key+': '+json.dumps(values[index],ensure_ascii=False)+',\n' for key,values in keys.items())
  body=body[:offset]+inserted+body[offset:]
s=header+'export const translations:'+body;p.write_text(s,encoding='utf-8')
p=Path('apps/web/src/components/RecordModal.tsx');s=p.read_text().replace("f.type==='textarea'?<textarea id={'field-'+f.key} required={f.required&&!(initial&&f.type==='password')}","f.type==='textarea'?<textarea id={'field-'+f.key} required={f.required}");p.write_text(s)
p=Path('apps/api/src/modules/communications/communications.service.ts');s=p.read_text();line="    if(dto.scheduledAt) throw new BadRequestException('Scheduled delivery requires a configured job queue');\n    if(dto.channel===MessageChannel.PUSH) throw new BadRequestException('Push delivery is not configured');\n    if(!dto.recipients.length||dto.recipients.length>500) throw new BadRequestException('Select between 1 and 500 recipients');\n";s=s.replace(line+line,line);p.write_text(s)
p=Path('apps/api/src/modules/fees/fees.service.ts');s=p.read_text().replace('const items = feeStructure.feeItems.map((item) => ({\n          description: item.description,','const items = feeStructure.feeItems.map((item) => ({\n          description: item.description || item.name,');p.write_text(s)
