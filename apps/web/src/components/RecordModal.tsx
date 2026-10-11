'use client';
import { type FormEvent, useEffect, useRef, useState, useId } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui';
import { apiClient } from '@/lib/api-client';
import { getRows, messageFor } from '@/lib/workspace';
export interface Field {key:string;label:string;type?:string;required?:boolean;options?:string[];source?:string;min?:number;max?:number}
export function RecordModal({title,endpoint,fields,initial,onClose,onSaved}:{title:string;endpoint:string;fields:Field[];initial?:Record<string,any>;onClose:()=>void;onSaved:()=>void}) {
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(field=>[field.key,field.type==='date'&&initial?.[field.key]?String(initial[field.key]).slice(0,10):field.type==='currency'&&initial?.[field.key]!=null?String(Number(initial[field.key])/100):String(initial?.[field.key]??'')])));
  const [options,setOptions]=useState<Record<string,any[]>>({});
  const [busy,setBusy]=useState(false);
  const [optionsLoading,setOptionsLoading]=useState(fields.some(field=>field.source));
  const [optionsError,setOptionsError]=useState('');
  const [error,setError]=useState('');
  const dialog=useRef<HTMLDivElement>(null);
  const busyRef=useRef(false);
  const titleId=useId();
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
    Promise.all(fields.filter(field=>field.source).map(async field=>[field.key,await getRows(field.source!)] as const))
      .then(result=>{if(active)setOptions(Object.fromEntries(result));})
      .catch(err=>{if(active)setOptionsError(messageFor(err));})
      .finally(()=>{if(active)setOptionsLoading(false);});
    return()=>{active=false;};
  },[fields]);
  async function submit(event:FormEvent){
    event.preventDefault();if(busy||optionsLoading||optionsError)return;
    setBusy(true);setError('');
    const data:Record<string,unknown>={};
    fields.forEach(field=>{if(values[field.key]!=='')data[field.key]=field.type==='currency'?Math.round(Number(values[field.key])*100):field.type==='number'?Number(values[field.key]):values[field.key];});
    try {
      if(initial)await apiClient.patch(endpoint+'/'+initial.id,{data});
      else await apiClient.post(endpoint,{data});
      onSaved();
    } catch(err){setError(messageFor(err));} finally {setBusy(false);}
  }
  return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose();}}><div ref={dialog} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}><div className="modal-header"><h2 id={titleId}>{title}</h2><button disabled={busy} onClick={onClose} className="icon-button" aria-label="Close dialog"><X size={20}/></button></div><form onSubmit={submit}>{(error||optionsError)&&<div role="alert" className="state-box">{error||optionsError}{optionsError&&<p>Close this form and try again to reload the available options.</p>}</div>}<div className="form-grid">{fields.map(field=>{
    const id=titleId+'-'+field.key;
    const required=field.required&&!(initial&&field.type==='password');
    const change=(value:string)=>setValues(current=>({...current,[field.key]:value}));
    return <div className="field" key={field.key}><label htmlFor={id}>{field.label}{required?' *':''}</label>{field.options||field.source?<select id={id} required={required} disabled={busy||!!field.source&&optionsLoading} value={values[field.key]} onChange={event=>change(event.target.value)}><option value="">{field.source&&optionsLoading?'Loading options…':'Select '+field.label.toLowerCase()}</option>{field.options?.map(option=><option key={option} value={option}>{option.replaceAll('_',' ')}</option>)}{options[field.key]?.map(option=><option key={option.id} value={option.id}>{option.name||option.title||option.invoiceNumber||[option.firstName,option.lastName].filter(Boolean).join(' ')}</option>)}</select>:field.type==='textarea'?<textarea id={id} required={required} disabled={busy} maxLength={10000} value={values[field.key]} onChange={event=>change(event.target.value)}/>:<input id={id} type={field.type==='currency'?'number':field.type||'text'} inputMode={field.type==='currency'?'decimal':undefined} step={field.type==='currency'?'.01':field.type==='number'?1:undefined} required={required} disabled={busy} min={field.type==='currency'&&field.min!=null?field.min/100:field.min} max={field.type==='currency'&&field.max!=null?field.max/100:field.max} maxLength={field.type==='password'?128:255} value={values[field.key]} onChange={event=>change(event.target.value)}/>}</div>;
  })}</div><div className="modal-actions"><Button variant="ghost" type="button" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy} disabled={optionsLoading||!!optionsError}>{initial?'Save changes':'Create record'}</Button></div></form></div></div>;
}
