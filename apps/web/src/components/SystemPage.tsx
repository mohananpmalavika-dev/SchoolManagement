'use client';
import {useState,useEffect} from 'react';
import {ShieldCheck,Database,Clock,Server,RefreshCw} from 'lucide-react';
import {apiClient} from '@/lib/api-client';
import {PageHeading,StatCard,Panel} from './WorkspaceUI';
import {messageFor} from '@/lib/workspace';
import {Button} from './ui';
export function SystemPage(){
 const [data,setData]=useState<any>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(false);
 async function load(){setLoading(true);try{setData((await apiClient.get('/admin/system')).data);setError('');}catch(err){setError(messageFor(err));}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 return <><PageHeading title="System health" description="A live view of the services supporting your schools." actions={<Button size="sm" variant="outline" leftIcon={<RefreshCw size={15}/>} disabled={loading} onClick={()=>void load()}>Refresh</Button>}/>{error&&<div className="state-box" role="alert">{error}</div>}{data&&<><div className="metric-grid"><StatCard label="Database" value={data.database} note="Live connectivity check" icon={Database}/><StatCard label="Database latency" value={data.databaseLatency+' ms'} note="Latest query" icon={ShieldCheck}/><StatCard label="Process uptime" value={Math.floor(data.uptimeSeconds/60)+' min'} note="Since last API restart" icon={Clock}/><StatCard label="Process memory" value={data.memoryMB+' MB'} note="Resident memory usage" icon={Server}/></div><Panel title="Environment" subtitle="Latest observed runtime"><div className="panel-body"><p className="text-sm">Environment: <strong>{data.environment}</strong></p><p className="text-sm muted mt-2">Last checked: {new Date(data.timestamp).toLocaleString()}</p></div></Panel></>}</>;
}