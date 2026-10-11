'use client';
import {useState} from 'react';
import {ResourcePage} from './ResourcePage';
import {schoolResources,adminResources} from '@/lib/resources';
export function ResourceTabs({resources,admin=false}:{resources:{key:string;label:string}[];admin?:boolean}){
 const [tab,setTab]=useState(resources[0].key);const config=(admin?adminResources:schoolResources)[tab];
 return <><div className="section-tabs" aria-label="Sections">{resources.map(r=><button key={r.key} className={tab===r.key?'selected':''} aria-pressed={tab===r.key} onClick={()=>setTab(r.key)}>{r.label}</button>)}</div><ResourcePage key={tab} {...config}/></>;
}
