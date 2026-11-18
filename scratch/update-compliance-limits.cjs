const fs = require('node:fs');
for (const name of ['compliance-reports.ts','compliance-audits.ts']) {
  const file = 'apps/api/src/modules/government/services/' + name;
  const value = fs.readFileSync(file,'utf8');
  fs.writeFileSync(file,value.replaceAll('take: 5001','take: 50001'));
}
