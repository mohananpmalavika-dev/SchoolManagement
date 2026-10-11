from pathlib import Path
import json
for name in ['database','types','utils']:
 p=Path('packages')/name/'package.json';j=json.loads(p.read_text());j['main']='./dist/index.js';j['types']='./dist/index.d.ts';j['scripts']['build']='tsc -p tsconfig.json';j['scripts']['type-check']='tsc --noEmit';p.write_text(json.dumps(j,indent=2)+'\n')
 p=Path('packages')/name/'tsconfig.json';j=json.loads(p.read_text());j['compilerOptions']['composite']=False;j['include']=['src/**/*'];p.write_text(json.dumps(j,indent=2)+'\n')
p=Path('apps/api/jest.config.js');s=p.read_text().replace("<rootDir>/../../../packages/","<rootDir>/../../../packages/");p.write_text(s)
p=Path('package.json');j=json.loads(p.read_text());j['scripts']['db:seed:demo']='pnpm --filter @krypton/database exec tsx ../../scripts/seed-demo.ts';j['scripts']['test:smoke']='node scripts/smoke-test.mjs';p.write_text(json.dumps(j,indent=2)+'\n')
