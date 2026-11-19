'use client';
import {useState,useEffect,useCallback} from 'react';
import {MessageSquare,Check} from 'lucide-react';
import {PageHeading,Panel,EmptyState} from './WorkspaceUI';
import {apiClient} from '@/lib/api-client';
import {getRows,dateLabel,messageFor} from '@/lib/workspace';
import {Button} from './ui';
import {PushNotificationSettings} from './PushNotificationSettings';
export function NotificationsPage(){
 const [rows,setRows]=useState<any[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState<string|null>(null);const load=useCallback(async()=>{try{setRows(await getRows('/workspace/notifications'));setError('');}catch(err){setError(messageFor(err));}},[]);
 useEffect(()=>{void load();},[load]);
 async function read(id:string){setBusy(id);try{await apiClient.post('/workspace/notifications/'+id+'/read');setRows(rows.map(r=>r.id===id?{...r,read:true}:r));}catch(err){setError(messageFor(err));}finally{setBusy(null);}}
 return <><PageHeading title="Notifications" description="Updates and announcements for your account."/>{error&&<div role="alert" className="state-box">{error}</div>}<div className="mb-6"><PushNotificationSettings/></div><Panel title="Your inbox" subtitle={rows.filter(r=>!r.read).length+' unread messages'}>{rows.length?<div className="panel-body">{rows.map(r=><article key={r.id} className="activity-row"><div className="activity-icon"><MessageSquare size={17}/></div><div className="flex-1"><strong>{r.title}{!r.read&&<span className="pill ml-2">New</span>}</strong><p className="whitespace-pre-wrap">{r.body}</p><time>{dateLabel(r.createdAt)}{r.platform?' ? Platform update':''}</time></div>{!r.read&&<Button variant="ghost" size="sm" disabled={busy===r.id} onClick={()=>void read(r.id)} leftIcon={<Check size={15}/>}>Mark read</Button>}</article>)}</div>:<EmptyState title="You?re all caught up" description="School updates will arrive here."/>}</Panel></>;
}