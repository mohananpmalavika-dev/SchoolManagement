'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/contexts/AuthContext';
import {ProtectedRoute} from '@/components/ProtectedRoute';
import {PageHeading,Panel} from '@/components/WorkspaceUI';
import {Button,Input} from '@/components/ui';
import {apiClient} from '@/lib/api-client';
import {clearSession,homeForRole} from '@/lib/session';
import {messageFor} from '@/lib/workspace';
export default function AccountPage(){
 const {user}=useAuth();const router=useRouter();const [current,setCurrent]=useState('');const [next,setNext]=useState('');const [confirm,setConfirm]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setError('');if(next!==confirm){setError('The new passwords do not match.');return;}setBusy(true);try{await apiClient.post('/auth/password',{currentPassword:current,newPassword:next});clearSession();window.location.assign('/login');}catch(err){setError(messageFor(err));}finally{setBusy(false);}}
 return <ProtectedRoute><main className="page-content max-w-3xl"><PageHeading title="Your account" description="Manage your access to the school workspace." actions={<Button variant="outline" size="sm" onClick={()=>router.push(homeForRole(user?.role||''))}>Back to workspace</Button>}/><div className="content-stack"><Panel title="Profile"><div className="panel-body"><h2>{user?.firstName} {user?.lastName}</h2><p className="muted text-sm mt-2">{user?.email}</p><span className="pill mt-4">{user?.role.replaceAll('_',' ').toLowerCase()}</span></div></Panel><Panel title="Change password" subtitle="Changing your password signs out all existing sessions"><form className="panel-body space-y-5" onSubmit={submit}>{error&&<div className="state-box" role="alert">{error}</div>}<Input label="Current password" type="password" autoComplete="current-password" required value={current} onChange={e=>setCurrent(e.target.value)}/><Input label="New password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={next} onChange={e=>setNext(e.target.value)} helpText="Use at least 12 characters."/><Input label="Confirm new password" type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)}/><Button type="submit" isLoading={busy}>Change password</Button></form></Panel></div></main></ProtectedRoute>;
}