'use client';
import { type FormEvent, useEffect, useRef, useState, useId } from 'react';
import Link from 'next/link';
import { X, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from './ui';
import { apiClient } from '@/lib/api-client';
import { getRows, messageFor } from '@/lib/workspace';
import { educationLevelLabels, preschoolStages } from '@/lib/academic-setup';
export interface Field {key:string;label:string;type?:string;required?:boolean;clearable?:boolean;options?:string[];source?:string;min?:number;max?:number}
function todayValue() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
export function RecordModal({title,endpoint,fields,initial,onClose,onSaved}:{title:string;endpoint:string;fields:Field[];initial?:Record<string,any>;onClose:()=>void;onSaved:()=>void}) {
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(field=> {
    const saved = field.type==='date'&&initial?.[field.key]?String(initial[field.key]).slice(0,10):field.type==='currency'&&initial?.[field.key]!=null?String(Number(initial[field.key])/100):String(initial?.[field.key]??'');
    const fallback = !initial && field.key === 'admissionDate' ? todayValue() : !initial && endpoint.endsWith('/students') && field.key === 'status' && field.options?.includes('ACTIVE') ? 'ACTIVE' : '';
    return [field.key, saved || fallback];
  }).concat([['preschoolStage', String(initial?.preschoolStage || '')]])));
  const [options,setOptions]=useState<Record<string,any[]>>({});
  const [busy,setBusy]=useState(false);
  const [detailsOpen,setDetailsOpen]=useState(!!initial);
  const [optionsLoading,setOptionsLoading]=useState(fields.some(field=>field.source));
  const [optionsError,setOptionsError]=useState('');
  const [optionsAttempt,setOptionsAttempt]=useState(0);
  const [error,setError]=useState('');
  const dialog=useRef<HTMLDivElement>(null);
  const busyRef=useRef(false);
  const titleId=useId();
  const required = (field: Field) => !!field.required && !(initial && field.type === 'password');
  const classForm = endpoint === '/workspace/classes';
  const sectionForm = endpoint === '/workspace/streams';
  const choicesFor = (field: Field) => (options[field.key] || []).filter(option => {
    if (field.key === 'schoolId') return option.isActive !== false;
    if (field.source === '/workspace/classes' && option.school?.isActive === false) return false;
    if (sectionForm && field.key === 'classId') return !!values.schoolId && option.schoolId === values.schoolId;
    return true;
  });
  const missingChoices = fields.filter(field => required(field) && field.source && !optionsLoading && !optionsError && !choicesFor(field).length && !(sectionForm && field.key === 'classId' && !values.schoolId));
  const prerequisiteLinks: Record<string, [string, string]> = {
    '/workspace/schools': ['/school/academics?section=schools', 'Add a campus'],
    '/workspace/years': ['/school/academics?section=years', 'Add a school year'],
    '/workspace/classes': ['/school/academics?section=classes', 'Add a class'],
    '/workspace/terms': ['/school/academics?section=terms', 'Add a term'],
    '/workspace/subjects': ['/school/academics?section=subjects', 'Add a subject'],
    '/workspace/students': ['/school/students', 'Add a student'],
    '/workspace/guardians': ['/school/guardians', 'Add a guardian'],
    '/workspace/staff': ['/school/staff', 'Add a staff member'],
    '/workspace/books': ['/school/library', 'Add a book'],
    '/workspace/invoices': ['/school/fees', 'Create an invoice'],
    '/workspace/vehicles': ['/school/transport/setup', 'Add a vehicle'],
  };
  const selectedSchool = options.schoolId?.find(school => school.id === values.schoolId);
  const selectedYear = options.academicYearId?.find(year => year.id === values.academicYearId);
  const preschoolClass = classForm && (selectedSchool?.programme === 'PRESCHOOL' || values.educationLevel === 'PRE_PRIMARY');
  const formFields = fields.flatMap(field => {
    if (!classForm) return [field];
    if (field.key === 'name') return [{ ...field, label: 'Class name' }];
    if (!selectedSchool && ['level', 'educationLevel'].includes(field.key)) return [];
    if (field.key === 'level' && preschoolClass) return [{ key: 'preschoolStage', label: 'Preschool stage', required: true, options: Object.keys(preschoolStages) }];
    if (field.key === 'educationLevel' && selectedSchool?.programme === 'PRESCHOOL') return [];
    return [field];
  });
  const essentials = formFields.filter(required);
  const optional = formFields.filter(field => !required(field));
  const entered = essentials.filter(field => values[field.key]?.trim()).length;
  useEffect(()=>{busyRef.current=busy;},[busy]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const element=dialog.current;
    element?.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea')?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&!busyRef.current)onClose();
      if(event.key==='Tab'){
        const targets=element?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type=hidden]),select:not(:disabled),textarea:not(:disabled)');
        if(!targets?.length)return;
        const first=targets[0],last=targets[targets.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',key);
    const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=previousOverflow;previous?.focus();};
  },[onClose]);
  useEffect(()=>{
    let active=true;
    setOptionsLoading(fields.some(field=>field.source));setOptionsError('');
    Promise.all(fields.filter(field=>field.source).map(async field=>[field.key,await getRows(field.source!)] as const))
      .then(result=>{if(active){const loaded = Object.fromEntries(result); setOptions(loaded); if (!initial) setValues(current => {
        const next = { ...current };
        const campuses = loaded.schoolId?.filter(school => school.isActive !== false);
        if (campuses?.length === 1 && !next.schoolId) next.schoolId = campuses[0].id;
        if (loaded.academicYearId?.length === 1 && !next.academicYearId) next.academicYearId = loaded.academicYearId[0].id;
        return next;
      });}})
      .catch(err=>{if(active)setOptionsError(messageFor(err));})
      .finally(()=>{if(active)setOptionsLoading(false);});
    return()=>{active=false;};
  },[fields,optionsAttempt,initial]);
  async function submit(event:FormEvent){
    event.preventDefault();if(busyRef.current||optionsLoading||optionsError||missingChoices.length)return;
    busyRef.current=true;
    setBusy(true);setError('');
    const data:Record<string,unknown>={};
    formFields.forEach(field=>{
      const value=values[field.key];
      if(initial&&field.clearable&&value===''&&initial[field.key]!=null)data[field.key]=null;
      else if(value!==undefined&&value!=='')data[field.key]=field.type==='currency'?Math.round(Number(value)*100):field.type==='number'?Number(value):value;
    });
    if (classForm && preschoolClass) {
      data.educationLevel = 'PRE_PRIMARY';
      data.preschoolStage = values.preschoolStage;
      data.level = preschoolStages[values.preschoolStage as keyof typeof preschoolStages];
    } else if (classForm && initial?.preschoolStage) data.preschoolStage = null;
    try {
      if(initial)await apiClient.patch(endpoint+'/'+initial.id,{data});
      else await apiClient.post(endpoint,{data});
      onSaved();
    } catch(err){setError(messageFor(err));} finally {busyRef.current=false;setBusy(false);}
  }
  function toggleDetails() {
    if (detailsOpen) {
      const invalid = dialog.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('.optional-details input:invalid, .optional-details select:invalid, .optional-details textarea:invalid');
      if (invalid) { invalid.reportValidity(); invalid.focus(); return; }
    }
    setDetailsOpen(value => !value);
  }
  function renderField(field: Field) {
    const id=titleId+'-'+field.key;
    const isRequired = required(field);
    const change=(value:string)=>setValues(current=>{
      const next = {...current,[field.key]:value};
      if (sectionForm && field.key === 'schoolId') next.classId = '';
      if (classForm && field.key === 'schoolId') {
        next.preschoolStage = '';
        next.level = '';
        next.educationLevel = '';
      }
      if (classForm && field.key === 'educationLevel' && (value === 'PRE_PRIMARY') !== (current.educationLevel === 'PRE_PRIMARY')) {
        next.preschoolStage = '';
        next.level = '';
      }
      return next;
    });
    return <div className="field" key={field.key}><label htmlFor={id}>{field.label}{isRequired?' *':''}</label>{field.options||field.source?<select id={id} required={isRequired} disabled={busy||!!field.source&&optionsLoading||sectionForm&&field.key==='classId'&&!values.schoolId} value={values[field.key] || ''} onChange={event=>change(event.target.value)}><option value="">{field.source&&optionsLoading?'Loading options...':sectionForm&&field.key==='classId'&&!values.schoolId?'Choose a campus first':'Select '+field.label.toLowerCase()}</option>{field.options?.map(option=><option key={option} value={option}>{field.key === 'educationLevel' ? educationLevelLabels[option] : field.key === 'preschoolStage' ? preschoolStages[option as keyof typeof preschoolStages] : option.replaceAll('_',' ')}</option>)}{choicesFor(field).map(option=><option key={option.id} value={option.id}>{option.name||option.title||option.invoiceNumber||[option.firstName,option.lastName].filter(Boolean).join(' ')}{option.schoolName ? ' ? ' + option.schoolName : option.academicYearName ? ' ? ' + option.academicYearName : ''}</option>)}</select>:field.type==='textarea'?<textarea id={id} required={isRequired} disabled={busy} maxLength={10000} value={values[field.key] || ''} onChange={event=>change(event.target.value)}/>:<input id={id} type={field.type==='currency'?'number':field.type||'text'} inputMode={field.type==='currency'?'decimal':undefined} step={field.type==='currency'?'.01':field.type==='number'?1:undefined} required={isRequired} disabled={busy} min={field.type==='date' ? field.key==='endDate' ? values.startDate || selectedYear?.startDate?.slice(0,10) : field.key==='startDate' ? selectedYear?.startDate?.slice(0,10) : undefined : field.type==='currency'&&field.min!=null?field.min/100:field.min} max={field.type==='date' ? field.key==='startDate' ? values.endDate || selectedYear?.endDate?.slice(0,10) : field.key==='endDate' ? selectedYear?.endDate?.slice(0,10) : undefined : field.type==='currency'&&field.max!=null?field.max/100:field.max} maxLength={field.type==='password'?128:255} value={values[field.key] || ''} onChange={event=>change(event.target.value)}/>}</div>;
  }
  return <div className="modal-backdrop record-drawer-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose();}}>
    <div ref={dialog} className="modal record-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="modal-header"><div><span className="eyebrow">{initial ? 'Make an update' : 'A fresh start'}</span><h2 id={titleId}>{title}</h2></div><button disabled={busy} onClick={onClose} className="icon-button" aria-label="Close dialog"><X size={20}/></button></div>
      <form onSubmit={submit}>
        <div className="record-form-body">
          {(error||optionsError)&&<div role="alert" className="state-box">{error||optionsError}{optionsError&&<div className="mt-3"><p>Reload the available choices to continue.</p><Button size="sm" variant="outline" onClick={() => setOptionsAttempt(value => value + 1)}>Reload choices</Button></div>}</div>}
          {!!missingChoices.length && <div role="status" className="state-box mb-4"><p>Complete these prerequisites before saving:</p><ul>{missingChoices.map(field => <li key={field.key}>No choices available for {field.label.toLowerCase()}. {prerequisiteLinks[field.source!] && <Link className="underline" href={prerequisiteLinks[field.source!][0]}>{prerequisiteLinks[field.source!][1]}</Link>}</li>)}</ul><Button size="sm" variant="outline" onClick={() => setOptionsAttempt(value => value + 1)}>Reload choices</Button></div>}
          {classForm && selectedSchool?.programme === 'PRESCHOOL' && <p className="muted mb-4">This campus is a preschool. Classes use the pre-primary education level automatically.</p>}
          {!!essentials.length && <><div className="form-section-heading"><h3>The essentials</h3><span>{entered} / {essentials.length} entered</span></div><div className="form-entry-track" aria-hidden="true"><span style={{width: entered / essentials.length * 100 + '%'}}/></div><div className="form-grid">{essentials.map(renderField)}</div></>}
          {!!optional.length && <section className="optional-details"><button className="optional-toggle" type="button" disabled={busy} aria-expanded={detailsOpen} aria-controls={titleId + '-optional'} onClick={toggleDetails}><SlidersHorizontal size={16}/><span>More details<small>{optional.length} optional fields</small></span><ChevronDown size={17}/></button><div id={titleId + '-optional'} className="form-grid" hidden={!detailsOpen}>{detailsOpen && optional.map(renderField)}</div></section>}
        </div>
        <div className="modal-actions"><Button variant="ghost" type="button" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy} disabled={optionsLoading||!!optionsError||!!missingChoices.length} leftIcon={<Check size={16}/>}>{initial?'Save changes':'Create record'}</Button></div>
      </form>
    </div>
  </div>;
}
