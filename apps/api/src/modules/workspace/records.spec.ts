import {parseRecord,recordSpecs} from './records';
describe('record validation',()=>{
 it('rejects mass assignment of a tenant or administrative field',()=>expect(()=>parseRecord(recordSpecs.books,{title:'Book',quantity:1,tenantId:'other-school'})).toThrow('Unknown field'));
 it('rejects negative stock and noninteger monetary values',()=>{
  expect(()=>parseRecord(recordSpecs.books,{title:'Book',quantity:-1})).toThrow();
  expect(()=>parseRecord(recordSpecs.payments,{amount:1.5})).toThrow();
 });
 it('rejects invalid dates and inverted date ranges',()=>{
  expect(()=>parseRecord(recordSpecs.years,{name:'Year',startDate:'bad',endDate:'2026-12-31'})).toThrow();
  expect(()=>parseRecord(recordSpecs.years,{name:'Year',startDate:'2026-12-31',endDate:'2026-01-01'})).toThrow();
 });
 it('validates reference IDs before database queries',()=>expect(()=>parseRecord(recordSpecs.borrowings,{bookId:'not-a-uuid',borrowerId:'not-a-uuid',dueDate:'2027-01-01'})).toThrow());
 it('accepts partial edits without requiring absent fields',()=>expect(parseRecord(recordSpecs.books,{title:'Updated'},true)).toEqual({title:'Updated'}));
 it('clears only explicitly nullable fields and never erases required fields',()=>{
  expect(parseRecord(recordSpecs.guardians,{email:null,userId:''},true)).toEqual({email:null,userId:null});
  expect(parseRecord(recordSpecs.inventory,{quantity:0},true)).toEqual({quantity:0});
  expect(()=>parseRecord(recordSpecs.books,{title:''},true)).toThrow('title is required');
  expect(()=>parseRecord(recordSpecs.inventory,{reorderLevel:null},true)).toThrow('cannot be cleared');
 });
 it('normalizes email addresses while preserving valid data',()=>expect(parseRecord(recordSpecs.guardians,{firstName:' Jane ',lastName:'Doe',phone:'919847000101',email:'JANE@example.com'})).toMatchObject({firstName:'Jane',email:'jane@example.com'}));
});
