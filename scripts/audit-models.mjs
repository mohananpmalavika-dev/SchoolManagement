import fs from 'fs';
import path from 'path';

const schemaPath = path.resolve('packages/database/prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const models = [];
let currentModel = null;
let currentFields = [];

schemaContent.split('\n').forEach(line => {
  const modelMatch = line.match(/^model\s+(\w+)\s+\{/);
  if (modelMatch) {
    currentModel = modelMatch[1];
    currentFields = [];
  } else if (line.match(/^\}/) && currentModel) {
    models.push({ name: currentModel, fields: currentFields });
    currentModel = null;
  } else if (currentModel) {
    const fieldMatch = line.trim().match(/^(\w+)\s+(\w+)/);
    if (fieldMatch) {
      currentFields.push(fieldMatch[1]);
    }
  }
});

const tenantFilterPath = path.resolve('packages/database/src/middleware/tenant-filter.ts');
const tenantFilterContent = fs.readFileSync(tenantFilterPath, 'utf8');
const directMatch = tenantFilterContent.match(/directModels\s*=\s*new\s*Set\(\[([^\]]+)\]\)/);
const currentDirect = directMatch ? directMatch[1].replace(/['"\s]/g, '').split(',') : [];

const modelsWithTenantId = models.filter(m => m.fields.includes('tenantId')).map(m => m.name);
const missingFromDirect = modelsWithTenantId.filter(m => !currentDirect.includes(m));

console.log('Total models in schema:', models.length);
console.log('Models with tenantId:', modelsWithTenantId.length);
console.log('Models currently in directModels:', currentDirect.length);
console.log('MISSING from directModels:', missingFromDirect);
