'use client';
import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { CalendarDays, Clock, RefreshCw, Plus, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { messageFor, dateLabel } from '@/lib/workspace';
import { PageHeading, Panel, EmptyState, StatusPill } from './WorkspaceUI';
import { Button } from './ui';
interface Teacher {id:string;name:string}
interface Availability {id:string;dayOfWeek:number;startTime:string;endTime:string;slotDuration:number}
interface Slot {startTime:string;endTime:string;duration:number}
interface Meeting {id:string;teacherId:string;studentId:string;bookingDate:string;startTime:string;endTime:string;topic?:string;purpose?:string;parentNotes?:string;teacherNotes?:string;location?:string;meetingLink?:string;status:string;student?:{firstName:string;lastName:string};guardian?:{firstName:string;lastName:string}}
const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export function MeetingsWorkspace() {
  const {user}=useAuth();const family=user?.role==='PARENT';
  const [teachers,setTeachers]=useState<Teacher[]>([]);
  const [children,setChildren]=useState<any[]>([]);
  const [teacherId,setTeacher]=useState('');const [studentId,setStudent]=useState('');
  const [meetings,setMeetings]=useState<Meeting[]>([]);const [availability,setAvailability]=useState<Availability[]>([]);
  const [date,setDate]=useState('');const [slots,setSlots]=useState<Slot[]>([]);const [slotKey,setSlot]=useState('');
  const [purpose,setPurpose]=useState('');const [topic,setTopic]=useState('');
  const [day,setDay]=useState('1');const [start,setStart]=useState('15:00');const [end,setEnd]=useState('17:00');const [duration,setDuration]=useState('30');
  const [error,setError]=useState('');const [slotError,setSlotError]=useState('');const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(true);const [slotsLoading,setSlotsLoading]=useState(false);const [busy,setBusy]=useState('');const [reload,setReload]=useState(0);const [today,setToday]=useState('');
  const [meetingLink,setMeetingLink]=useState('');
  const [details,setDetails]=useState<Meeting|null>(null);const [location,setLocation]=useState('');const [notes,setNotes]=useState('');const [detailsError,setDetailsError]=useState('');const detailsDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(details)detailsDialog.current?.showModal();else detailsDialog.current?.close();},[details]);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try {
      const [options,bookings,linked]=await Promise.all([apiClient.get('/bookings/options'),apiClient.get('/bookings'),family?apiClient.get('/workspace/children'):Promise.resolve({data:[]})]);
      setTeachers(options.data.teachers);setMeetings(bookings.data);setChildren(linked.data);
      setStudent(current=>linked.data.some((child:any)=>child.id===current)?current:linked.data[0]?.id||'');
      setTeacher(current=>options.data.teachers.some((teacher:Teacher)=>teacher.id===current)?current:options.data.teacherId||options.data.teachers[0]?.id||'');
      if(!family&&options.data.teacherId)setAvailability((await apiClient.get('/bookings/availability/teacher/'+options.data.teacherId)).data);
    }catch(err){setError(messageFor(err));}finally{setLoading(false);}
  },[family]);
  useEffect(()=>{void load();const now=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());setToday(now);setDate(now);},[load]);
  useEffect(()=>{
    if(!family||!teacherId||!date)return;
    const controller=new AbortController();setSlots([]);setSlot('');setSlotError('');setSlotsLoading(true);
    apiClient.get('/bookings/available-slots/'+teacherId+'/'+date,{signal:controller.signal})
      .then(({data})=>{if(!controller.signal.aborted)setSlots(data);})
      .catch(err=>{if(!controller.signal.aborted)setSlotError(messageFor(err));})
      .finally(()=>{if(!controller.signal.aborted)setSlotsLoading(false);});
    return()=>controller.abort();
  },[family,teacherId,date,reload]);
  async function createAvailability(event:FormEvent){
    event.preventDefault();if(busy)return;setBusy('availability');setError('');
    try {await apiClient.post('/bookings/availability',{dayOfWeek:Number(day),startTime:start,endTime:end,slotDuration:Number(duration)});setNotice('Your meeting availability has been saved.');await load();}
    catch(err){setError(messageFor(err));}finally{setBusy('');}
  }
  async function requestMeeting(event:FormEvent){
    event.preventDefault();if(busy)return;const slot=slots.find(item=>item.startTime+'-'+item.endTime===slotKey);if(!slot)return;
    setBusy('request');setError('');
    try {await apiClient.post('/parent-portal/bookings',{studentId,teacherId,bookingDate:date,startTime:slot.startTime,endTime:slot.endTime,topic:topic.trim(),purpose:purpose.trim()});setNotice('Meeting requested. Your teacher will confirm the appointment and location.');setTopic('');setPurpose('');setReload(current=>current+1);await load();}
    catch(err){setError(messageFor(err));setReload(current=>current+1);}finally{setBusy('');}
  }
  async function action(id:string,kind:'confirm'|'complete'|'cancel') {
    if(busy)return;setBusy(id);setError('');
    try {await apiClient.post('/bookings/'+id+'/'+kind,kind==='cancel'?{cancellationReason:'Cancelled from the school workspace'}:undefined);setNotice(kind==='cancel'?'Meeting cancelled.':kind==='confirm'?'Meeting confirmed.':'Meeting marked complete.');setReload(current=>current+1);await load();}
    catch(err){setError(messageFor(err));}finally{setBusy('');}
  }
  async function removeAvailability(id:string){
    if(busy)return;setBusy(id);setError('');
    try{await apiClient.delete('/bookings/availability/'+id);setNotice('Availability removed. Existing appointments remain saved.');await load();}
    catch(err){setError(messageFor(err));}finally{setBusy('');}
  }
  async function saveDetails(event:FormEvent){
    event.preventDefault();if(busy||!details)return;setBusy(details.id);setDetailsError('');
    try{await apiClient.patch('/bookings/'+details.id,{location:location.trim(),teacherNotes:notes.trim(),...(meetingLink.trim()?{meetingLink:meetingLink.trim()}:{})});setDetails(null);setNotice('Meeting details have been saved for the family.');await load();}
    catch(err){setDetailsError(messageFor(err));}finally{setBusy('');}
  }
  return <>
    <PageHeading eyebrow={family?'FAMILY CONNECTIONS':'TEACHING WORKSPACE'} title="Parent meetings" description={family?'Make time for a conversation about your child’s progress.':'Publish consultation hours and manage family appointments.'} actions={<Button size="sm" variant="outline" disabled={loading||!!busy} leftIcon={<RefreshCw size={15}/>} onClick={()=>{setReload(current=>current+1);void load();}}>Refresh</Button>}/>
    {error&&<div className="state-box" role="alert">{error}<button className="underline ml-3" disabled={loading||!!busy} onClick={()=>void load()}>Try again</button></div>}
    {notice&&<div className="state-box success" role="status">{notice}</div>}
    {loading?<div className="skeleton h-64" aria-label="Loading meetings" aria-busy="true"/>:!error&&<div className="content-stack">
      <section className="overview-hero"><div><span className="eyebrow">SHARED GOALS. BETTER CONVERSATIONS.</span><h2>A little time, a lasting difference.</h2><p>{family?'Choose a teacher and an available consultation time. Requests are saved to your school and await teacher confirmation.':'Set aside time for families. Confirm requests, review their questions, and keep each appointment organized.'}</p></div><CalendarDays className="welcome-emblem" size={85} strokeWidth={1}/></section>
      {family?<Panel title="Request a conversation" subtitle="Consultation times use the school’s East Africa time zone">{!children.length?<EmptyState title="No children linked to your account" description="Ask your school office to link your guardian record."/>:!teachers.length?<EmptyState title="No teachers available yet"/>:<form className="panel-body space-y-5" onSubmit={requestMeeting}><div className="form-grid"><div className="field"><label htmlFor="meeting-child">Your child</label><select id="meeting-child" disabled={!!busy} value={studentId} onChange={event=>setStudent(event.target.value)}>{children.map(child=><option key={child.id} value={child.id}>{child.firstName} {child.lastName}</option>)}</select></div><div className="field"><label htmlFor="meeting-teacher">Teacher</label><select id="meeting-teacher" disabled={!!busy} value={teacherId} onChange={event=>setTeacher(event.target.value)}>{teachers.map(teacher=><option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></div><div className="field"><label htmlFor="meeting-date">Meeting date</label><input id="meeting-date" type="date" required min={today} disabled={!!busy} value={date} onChange={event=>setDate(event.target.value)}/></div><div className="field"><label htmlFor="meeting-slot">Available time</label><select id="meeting-slot" required disabled={!!busy||slotsLoading||!!slotError||!slots.length} value={slotKey} onChange={event=>setSlot(event.target.value)}><option value="">{slotsLoading?'Loading times…':!slots.length?'No available times':'Choose a time'}</option>{slots.map(slot=><option key={slot.startTime+'-'+slot.endTime} value={slot.startTime+'-'+slot.endTime}>{slot.startTime}–{slot.endTime} · {slot.duration} minutes</option>)}</select></div><div className="field"><label htmlFor="meeting-topic">Topic</label><input id="meeting-topic" required disabled={!!busy} maxLength={150} placeholder="Learning progress, support, or a school question" value={topic} onChange={event=>setTopic(event.target.value)}/></div><div className="field"><label htmlFor="meeting-purpose">Anything to prepare? (optional)</label><textarea id="meeting-purpose" disabled={!!busy} maxLength={2000} rows={2} value={purpose} onChange={event=>setPurpose(event.target.value)}/></div></div>{slotError&&<div className="state-box" role="alert">{slotError}<button type="button" className="underline ml-3" onClick={()=>setReload(current=>current+1)}>Reload times</button></div>}<Button type="submit" isLoading={busy==='request'} disabled={!!busy||!slotKey||slotsLoading||!!slotError} leftIcon={<Plus size={16}/>}>Request meeting</Button></form>}</Panel>:<div className="dashboard-grid"><Panel title="Publish consultation hours" subtitle="Recurring weekly availability · East Africa time"><form className="panel-body space-y-5" onSubmit={createAvailability}><div className="form-grid"><div className="field"><label htmlFor="availability-day">Day</label><select id="availability-day" value={day} disabled={!!busy} onChange={event=>setDay(event.target.value)}>{weekdays.map((name,index)=><option key={name} value={index+1}>{name}</option>)}</select></div><div className="field"><label htmlFor="availability-duration">Appointment length</label><select id="availability-duration" disabled={!!busy} value={duration} onChange={event=>setDuration(event.target.value)}>{[15,20,30,45,60].map(minutes=><option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></div><div className="field"><label htmlFor="availability-start">Start time</label><input id="availability-start" type="time" required disabled={!!busy} value={start} onChange={event=>setStart(event.target.value)}/></div><div className="field"><label htmlFor="availability-end">End time</label><input id="availability-end" type="time" required disabled={!!busy} value={end} onChange={event=>setEnd(event.target.value)}/></div></div><Button type="submit" isLoading={busy==='availability'} disabled={!!busy} leftIcon={<Plus size={16}/>}>Publish availability</Button></form></Panel><Panel title="Your consultation hours">{availability.length?<div className="panel-body">{availability.map(item=><div className="activity-row" key={item.id}><div className="activity-icon"><Clock size={20}/></div><div className="flex-1"><strong>{weekdays[item.dayOfWeek-1]}</strong><p>{item.startTime}–{item.endTime} · {item.slotDuration} minute appointments</p></div><button className="icon-button" disabled={!!busy} aria-label={'Remove '+weekdays[item.dayOfWeek-1]+' availability'} onClick={()=>void removeAvailability(item.id)}><X size={16}/></button></div>)}</div>:<EmptyState title="Make space for a conversation" description="Publish consultation hours to let families request appointments."/>}</Panel></div>}
      <Panel title={family?'Your appointments':'Family appointments'} subtitle="Requests remain pending until confirmed by the teacher">{meetings.length?<div className="panel-body">{meetings.map(meeting=><article className="activity-row items-start" key={meeting.id}><div className="activity-icon"><CalendarDays size={19}/></div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><strong>{meeting.topic||'Parent consultation'}</strong><StatusPill value={meeting.status}/></div><p>{meeting.student?.firstName} {meeting.student?.lastName} · {family?teachers.find(teacher=>teacher.id===meeting.teacherId)?.name||'School teacher':[meeting.guardian?.firstName,meeting.guardian?.lastName].filter(Boolean).join(' ')}</p><time>{dateLabel(meeting.bookingDate)} · {meeting.startTime}–{meeting.endTime} EAT</time>{meeting.purpose&&<p className="whitespace-pre-wrap mt-2">{meeting.purpose}</p>}{meeting.meetingLink&&meeting.status==='CONFIRMED'&&<a className="panel-link" href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">Join virtual meeting</a>}{meeting.location&&<p>Location: {meeting.location}</p>}{meeting.teacherNotes&&<p className="whitespace-pre-wrap">Teacher notes: {meeting.teacherNotes}</p>}<div className="flex gap-2 flex-wrap mt-3">{!family&&['PENDING','CONFIRMED'].includes(meeting.status)&&<Button variant="outline" size="sm" disabled={!!busy} onClick={()=>{setDetails(meeting);setLocation(meeting.location||'');setNotes(meeting.teacherNotes||'');setMeetingLink(meeting.meetingLink||'');setDetailsError('');}}>Edit meeting details</Button>}{!family&&meeting.status==='PENDING'&&<Button size="sm" disabled={!!busy} leftIcon={<Check size={14}/>} onClick={()=>void action(meeting.id,'confirm')}>Confirm</Button>}{!family&&meeting.status==='CONFIRMED'&&<Button size="sm" disabled={!!busy} onClick={()=>void action(meeting.id,'complete')}>Mark complete</Button>}{['PENDING','CONFIRMED'].includes(meeting.status)&&<Button variant="outline" size="sm" disabled={!!busy} onClick={()=>void action(meeting.id,'cancel')}>Cancel appointment</Button>}</div></div></article>)}</div>:<EmptyState title="No appointments yet" description={family?'Choose an available consultation time to request a meeting.':'Saved family requests will appear here.'}/>}</Panel>
    </div>}
    <dialog ref={detailsDialog} className="submission-dialog" aria-labelledby="meeting-details-title" onCancel={event=>{if(busy)event.preventDefault();else setDetails(null);}}>{details&&<><div className="modal-header"><h2 id="meeting-details-title">Meeting details</h2><button className="icon-button" disabled={!!busy} aria-label="Close meeting details" onClick={()=>setDetails(null)}><X size={18}/></button></div><form className="p-6 space-y-5" onSubmit={saveDetails}>{detailsError&&<div role="alert" className="state-box">{detailsError}</div>}<p className="muted text-sm">These details are visible to the family.</p><div className="field"><label htmlFor="meeting-location">Meeting location</label><input id="meeting-location" maxLength={500} autoFocus disabled={!!busy} value={location} onChange={event=>setLocation(event.target.value)}/></div><div className="field"><label htmlFor="virtual-meeting-link">Virtual meeting link (HTTPS)</label><input id="virtual-meeting-link" type="url" maxLength={2048} disabled={!!busy} value={meetingLink} onChange={event=>setMeetingLink(event.target.value)}/></div><div className="field"><label htmlFor="teacher-meeting-notes">Notes for the family</label><textarea id="teacher-meeting-notes" maxLength={4000} rows={5} disabled={!!busy} value={notes} onChange={event=>setNotes(event.target.value)}/></div><Button type="submit" fullWidth isLoading={!!busy}>Save meeting details</Button></form></>}</dialog>
  </>;
}