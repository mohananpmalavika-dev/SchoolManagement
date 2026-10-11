import json
from pathlib import Path
for name in ['apps/web/package.json','apps/api/package.json','packages/database/package.json','package.json']:
 p=Path(name);j=json.loads(p.read_text())
 if name=='apps/web/package.json':
  j['dependencies'].update({'next':'^16.2.0','react':'^19.2.4','react-dom':'^19.2.4','postcss':'^8.5.23'})
  j['dependencies'].pop('next-auth',None)
  j['devDependencies'].update({'@types/react':'^19.2.0','@types/react-dom':'^19.2.0','eslint-config-next':'^16.2.0','eslint':'^9.0.0'})
  j['scripts']['lint']='eslint src'
  j['scripts']['build']='next build --webpack'
 if name=='apps/api/package.json':
  for k in ['common','core','platform-express']:j['dependencies']['@nestjs/'+k]='^11.1.18'
  j['dependencies'].update({'@nestjs/axios':'^4.0.0','@nestjs/config':'^4.0.0','@nestjs/swagger':'^11.0.0','@nestjs/throttler':'^6.0.0','nodemailer':'^7.0.0'})
  j['devDependencies'].update({'@nestjs/cli':'^11.0.0','@nestjs/schematics':'^11.0.0','@nestjs/testing':'^11.1.18','@types/nodemailer':'^7.0.0'})
  j['scripts']['lint']='eslint "src/**/*.ts"'
 if name=='packages/database/package.json':j['devDependencies']['bcryptjs']='^2.4.3';j['devDependencies']['@types/bcryptjs']='^2.4.6'
 if name=='package.json':
  j['engines']={'node':'>=22.0.0','pnpm':'>=8.0.0'}
  j['pnpm']={'overrides':{'lodash':'^4.18.0','js-yaml':'^4.3.2','qs':'^6.16.0','postcss':'^8.5.23','multer':'^2.3.0'}}
  j['scripts'].update({'db:migrate':'pnpm --filter @krypton/database db:migrate','db:push':'pnpm --filter @krypton/database db:push','db:studio':'pnpm --filter @krypton/database db:studio','db:seed':'pnpm --filter @krypton/database db:seed','db:deploy':'pnpm --filter @krypton/database db:migrate:deploy','db:generate':'pnpm --filter @krypton/database db:generate'})
 p.write_text(json.dumps(j,indent=2)+'\n')
