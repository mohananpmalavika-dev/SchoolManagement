'use client';
import {useState,useEffect} from 'react';
import {Download,School,Users,GraduationCap,CreditCard} from 'lucide-react';
import {apiClient} from '@/lib/api-client';
import {PageHeading,StatCard,Panel} from './WorkspaceUI';
import {Button} from './ui';
import {exportCsv,messageFor,money} from '@/lib/workspace';
export function ReportsPage(){
 const [data,setData]=useState<any>(null);const [error,setError]=useState('');
 useEffect(()=>{apiClient.get('/admin/overview').then(r=>setData(r.data)).catch(err=>setError(messageFor(err)));},[]);
 const rows=data?[{id:'schools',metric:'School communities',value:data.schools},{id:'students',metric:'Active students',value:data.students},{id:'staff',metric:'Active staff',value:data.staff},{id:'subscriptions',metric:'Active subscriptions',value:data.subscriptions},{id:'value',metric:'Annual plan value (INR paise)',value:data.balance}]:[];
 return <><PageHeading title="Platform reports" description="A current snapshot of your school communities." actions={<Button size="sm" disabled={!data} leftIcon={<Download size={15}/>} onClick={()=>exportCsv('platform-report',[{key:'metric',label:'Metric'},{key:'value',label:'Value'}],rows)}>Export report</Button>}/>{error&&<div className="state-box" role="alert">{error}</div>}{data&&<><div className="metric-grid"><StatCard label="Schools" value={data.schools} note="Across the platform" icon={School}/><StatCard label="Students" value={data.students} note="Active students" icon={Users}/><StatCard label="Staff" value={data.staff} note="Active staff" icon={GraduationCap}/><StatCard label="Annual plan value" value={money(data.balance)} note="Active subscriptions" icon={CreditCard}/></div><Panel title="Report snapshot" subtitle="Values reflect current records"><div className="table-wrap"><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.metric}</td><td>{r.value}</td></tr>)}</tbody></table></div></Panel></>}</>;
}