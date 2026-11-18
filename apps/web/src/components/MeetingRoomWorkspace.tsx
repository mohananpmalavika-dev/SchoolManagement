'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { messageFor, dateLabel } from '@/lib/workspace';
import { PageHeading, Panel } from './WorkspaceUI';
export function MeetingRoomWorkspace({id}:{id:string}) {
 const [meeting,setMeeting]=useState<any>(null),[error,setError]=useState('');
 useEffect(()=>{apiClient.get('/bookings/'+encodeURIComponent(id)).then(({data})=>setMeeting(data)).catch(err=>setError(messageFor(err)));},[id]);
 return <div className="page-content max-w-4xl"><PageHeading eyebrow="FAMILY CONSULTATION" title="Virtual meeting" description="Join your school's saved appointment."/>{error?<div className="state-box" role="alert">{error}<Link className="panel-link mt-4" href="/login">Sign in</Link></div>:meeting?<Panel title={meeting.topic||'Parent consultation'}><div className="panel-body space-y-5"><p>{dateLabel(meeting.bookingDate)} · {meeting.startTime}–{meeting.endTime} IST</p><p>{meeting.purpose}</p>{meeting.status==='CONFIRMED'&&meeting.meetingLink?<a className="panel-link" href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">Join the school video meeting</a>:<p className="muted">Your teacher must confirm this appointment and add a video meeting link before you can join.</p>}<p className="text-sm muted">The video provider opens in a separate tab. Recording and video permissions are managed by that provider.</p></div></Panel>:<div className="skeleton h-48" aria-label="Loading appointment"/>}</div>;
}
