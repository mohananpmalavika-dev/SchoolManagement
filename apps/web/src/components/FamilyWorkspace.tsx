'use client';
import { useEffect, useState, useCallback, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { Users, CreditCard, ClipboardCheck, BookOpen, CalendarDays, ArrowUpRight, RefreshCw, Printer, X, Smartphone } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { money, dateLabel, messageFor } from '@/lib/workspace';
import { PageHeading, StatCard, Panel, EmptyState, StatusPill } from './WorkspaceUI';
import { Button } from './ui';
import { WorkspaceScene } from './WorkspaceScene';
export function FamilyWorkspace({view='overview'}:{view?:'overview'|'fees'|'attendance'|'grades'}) {
  const [children,setChildren]=useState<any[]>([]);
  const [studentId,setStudent]=useState('');
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  const [childError,setChildError]=useState('');
  const [loading,setLoading]=useState(true);
  const [invoice,setInvoice]=useState<any>(null);
  const [phone,setPhone]=useState('');
  const [amount,setAmount]=useState('');
  const [busy,setBusy]=useState(false);
  const [paymentError,setPaymentError]=useState('');
  const [notice,setNotice]=useState('');
  const [refresh,setRefresh]=useState(0);
  const dialog=useRef<HTMLDialogElement>(null);
  const loadChildren=useCallback(async()=>{
    setLoading(true);setChildError('');
    try {const {data:linked}=await apiClient.get('/workspace/children');setChildren(linked);setStudent(current=>linked.some((child:any)=>child.id===current)?current:linked[0]?.id||'');}
    catch(err){setChildError(messageFor(err));} finally {setLoading(false);}
  },[]);
  useEffect(()=>{void loadChildren();},[loadChildren]);
  useEffect(()=>{
    if(!studentId)return;
    const controller=new AbortController();setLoading(true);setError('');setData(null);
    apiClient.get('/workspace/student/'+studentId,{signal:controller.signal})
      .then(({data:records})=>{if(!controller.signal.aborted)setData(records);})
      .catch(err=>{if(!controller.signal.aborted)setError(messageFor(err));})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[studentId,refresh]);
  useEffect(()=>{if(invoice)dialog.current?.showModal();else dialog.current?.close();},[invoice]);
  const reload=()=>{if(childError||!studentId)void loadChildren();else setRefresh(current=>current+1);};
  const activeInvoices=data?.invoices.filter((item:any)=>item.status!=='CANCELLED')||[];
  const total=activeInvoices.reduce((sum:number,item:any)=>sum+item.totalAmount,0);
  const balance=activeInvoices.reduce((sum:number,item:any)=>sum+item.balanceAmount,0);
  const latest=data?.grades[0];
  async function pay(event:FormEvent) {
    event.preventDefault();if(busy)return;setBusy(true);setPaymentError('');
    try {
      const cents=Math.round(Number(amount)*100);
      if(!Number.isSafeInteger(cents)||cents<100||cents>invoice.balanceAmount)throw new Error('Enter an amount between KES 1 and the invoice balance.');
      let normalized=phone.replace(/[\s+]/g,'');if(normalized.startsWith('0'))normalized='254'+normalized.slice(1);
      if(!/^254[17]\d{8}$/.test(normalized))throw new Error('Enter a valid Kenyan mobile number.');
      await apiClient.post('/workspace/pay',{invoiceId:invoice.id,amount:cents,phoneNumber:normalized});
      setInvoice(null);setNotice('Payment request sent. Enter your M-Pesa PIN on your phone. Your balance updates after confirmation; refresh to check.');
    }catch(err){setPaymentError(messageFor(err));}finally{setBusy(false);}
  }
  const titles={overview:'Your family, connected',fees:'Fees & payments',attendance:'Attendance',grades:'Learning progress'};
  return <>
    <PageHeading eyebrow="FAMILY WORKSPACE" title={titles[view]} description="Stay close to your child’s school day." actions={<Button size="sm" variant="outline" disabled={loading} leftIcon={<RefreshCw size={15}/>} onClick={reload}>Refresh</Button>}/>
    {(error||childError)&&<div role="alert" className="state-box">{error||childError}<button className="underline ml-3" onClick={reload}>Try again</button></div>}
    {notice&&<div role="status" className="state-box success">{notice}</div>}
    {!!children.length&&<div className="family-context panel mb-6"><div className="student-summary"><span className="avatar">{data?.student.firstName?.[0]||<Users size={20}/>}</span><div className="flex-1 min-w-0"><label className="text-xs muted" htmlFor="child">Viewing your child</label><select className="block bg-transparent font-semibold mt-1 max-w-full" id="child" value={studentId} disabled={busy} onChange={event=>{setStudent(event.target.value);setNotice('');}}>{children.map(child=><option key={child.id} value={child.id}>{child.firstName} {child.lastName}</option>)}</select><p>{data?.student.currentClass?.name||'Class not assigned'} · {data?.student.admissionNumber||'—'}</p></div><span className="pill hidden sm:inline-block">Family portal</span></div></div>}
    {loading?<div className="metric-grid" aria-busy="true" aria-label="Loading family records">{[1,2,3,4].map(index=><div className="skeleton h-32" key={index}/>)}</div>:!children.length&&!childError?<EmptyState title="Let’s connect your family" description="Ask your school office to link your parent account to your child’s guardian record."/>:data&&!error&&<>
      {view==='overview'&&<>
        <div className="dashboard-stage"><section className="overview-hero family-hero"><div className="overview-hero-copy"><span className="eyebrow">A LITTLE CLOSER TO THEIR DAY</span><h2>Growing, learning, belonging.</h2><p>Everything you need to support {data.student.firstName}’s next step.</p><Link className="overview-hero-link" href="/dashboard/grades">View learning progress<ArrowUpRight size={17}/></Link></div><WorkspaceScene/></section><div className="dashboard-metrics"><div className="metric-grid"><StatCard label="Outstanding fees" value={money(balance)} note="Across active invoices" icon={CreditCard}/><StatCard label="Fees paid" value={money(total-balance)} note="Confirmed payments" icon={ClipboardCheck}/><StatCard label="Attendance" value={data.attendance.length?data.attendanceSummary.attendanceRate+'%':'—'} note={data.attendanceSummary.totalDays+' records'} icon={CalendarDays}/><StatCard label="Latest grade" value={latest?.letterGrade||'—'} note={latest?.subject.name||'Awaiting published results'} icon={BookOpen}/></div>
        </div></div><section className="dashboard-actions"><div className="start-actions-heading"><h2>Quick access</h2><span>Your everyday tools</span></div><nav className="home-shortcuts" aria-label="Family shortcuts">{[['/dashboard/fees','Fees & payments',CreditCard],['/dashboard/attendance','Attendance',ClipboardCheck],['/dashboard/ptm','Meetings',CalendarDays],['/dashboard/notifications','School updates',BookOpen]].map(([href,label,Icon]) => {const ShortcutIcon=Icon as typeof BookOpen;return <Link key={String(href)} href={String(href)}><ShortcutIcon size={21}/><span>{String(label)}</span><ArrowUpRight size={15}/></Link>;})}</nav></section><div className="dashboard-grid"><div className="content-stack"><Panel title="Recent learning progress" subtitle="Published assessment results" href="/dashboard/grades">{data.grades.length?<div className="table-wrap"><table><thead><tr><th>Subject</th><th>Assessment</th><th>Result</th></tr></thead><tbody>{data.grades.slice(0,5).map((grade:any)=><tr key={grade.id}><td>{grade.subject.name}</td><td>{grade.examination.name}</td><td><StatusPill value={grade.letterGrade}/> <span className="ml-2">{Math.round(grade.percentage)}%</span></td></tr>)}</tbody></table></div>:<EmptyState title="Progress takes time" description="Published grades will appear here."/>}</Panel><Panel title="Recent payments" href="/dashboard/fees">{data.payments.length?<div className="table-wrap"><table><thead><tr><th>Receipt</th><th>Amount</th><th>Date</th></tr></thead><tbody>{data.payments.slice(0,3).map((payment:any)=><tr key={payment.id}><td>{payment.receiptNumber}</td><td>{money(payment.amount)}</td><td>{dateLabel(payment.paymentDate)}</td></tr>)}</tbody></table></div>:<EmptyState title="No payments recorded" description="Confirmed payments appear here."/>}</Panel></div><div className="content-stack"><Panel title="What’s coming up" subtitle="Dates for your family calendar">{data.events.length?<div className="panel-body">{data.events.map((event:any)=><div className="activity-row" key={event.id}><div className="activity-icon"><CalendarDays size={17}/></div><div><strong>{event.title}</strong><p>{event.location}</p><time>{dateLabel(event.startDate)}</time></div></div>)}</div>:<EmptyState title="No upcoming school events"/>}</Panel><Link href="/dashboard/notifications" className="overview-assistant"><div><span className="eyebrow">KEEP IN THE LOOP</span><h3 className="mt-2">School updates</h3><p>News from your school community.</p></div><ArrowUpRight size={24}/></Link></div></div>
      </>}
      {view==='fees'&&<div className="content-stack"><div className="metric-grid"><StatCard label="Total fees" value={money(total)} note="Active invoices" icon={BookOpen}/><StatCard label="Paid to date" value={money(total-balance)} note="Confirmed payments" icon={ClipboardCheck}/><StatCard label="Remaining balance" value={money(balance)} note="Awaiting payment" icon={CreditCard}/><StatCard label="Payment records" value={data.payments.length} note="Completed transactions" icon={Smartphone}/></div><Panel title="School invoices" subtitle="Pay with M-Pesa">{data.invoices.length?<div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Term</th><th>Due</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.invoices.map((item:any)=><tr key={item.id}><td>{item.invoiceNumber}</td><td>{item.term.name}</td><td>{dateLabel(item.dueDate)}</td><td>{money(item.balanceAmount)}</td><td><StatusPill value={item.status}/></td><td>{item.balanceAmount>0&&item.status!=='CANCELLED'&&<Button size="sm" onClick={()=>{setInvoice(item);setAmount(String(item.balanceAmount/100));setPhone('');setPaymentError('');}}>Pay with M-Pesa</Button>}</td></tr>)}</tbody></table></div>:<EmptyState title="No invoices yet"/>}</Panel><Panel title="Payment receipts" subtitle="Confirmed payments from your school"><div className="panel-heading"><span className="muted text-xs">Print or save this statement as PDF</span><Button variant="outline" size="sm" leftIcon={<Printer size={15}/>} onClick={()=>window.print()}>Print statement</Button></div>{data.payments.length?<div className="table-wrap"><table><thead><tr><th>Receipt</th><th>Reference</th><th>Amount</th><th>Date</th></tr></thead><tbody>{data.payments.map((payment:any)=><tr key={payment.id}><td>{payment.receiptNumber}</td><td>{payment.reference}</td><td>{money(payment.amount)}</td><td>{dateLabel(payment.paymentDate)}</td></tr>)}</tbody></table></div>:<EmptyState title="No payments recorded"/>}</Panel></div>}
      {view==='attendance'&&<Panel title="Attendance history" subtitle="The latest 365 saved attendance records">{data.attendance.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{data.attendance.map((record:any)=><tr key={record.id}><td>{dateLabel(record.date)}</td><td><StatusPill value={record.status}/></td><td>{record.remarks||'—'}</td></tr>)}</tbody></table></div>:<EmptyState title="Every day counts" description="Your child’s saved attendance will appear here."/>}</Panel>}
      {view==='grades'&&<div className="content-stack"><Panel title="Assessment results" subtitle="Published results from your child’s school">{data.grades.length?<div className="table-wrap"><table><thead><tr><th>Subject</th><th>Assessment</th><th>Marks</th><th>Percentage</th><th>Grade</th></tr></thead><tbody>{data.grades.map((grade:any)=><tr key={grade.id}><td>{grade.subject.name}</td><td>{grade.examination.name}</td><td>{grade.score} / {grade.totalMarks}</td><td>{Math.round(grade.percentage)}%</td><td><StatusPill value={grade.letterGrade}/></td></tr>)}</tbody></table></div>:<EmptyState title="Their story is still unfolding" description="Results appear after your school publishes them."/>}</Panel><Panel title="Report cards" subtitle="Reports published by the school">{data.reportCards.length?<div className="panel-body">{data.reportCards.map((report:any)=><div key={report.id} className="activity-row"><BookOpen size={22}/><div className="flex-1"><strong>{report.term.name}</strong><p>{report.classTeacherComments}</p><p>{report.principalComments}</p><time>Overall grade: {report.overallGrade||'—'} · {Math.round(report.averagePercentage)}%</time></div></div>)}<Button variant="outline" size="sm" leftIcon={<Printer size={15}/>} onClick={()=>window.print()}>Print learning summary</Button></div>:<EmptyState title="No published report cards" description="Your school will publish reports when they are ready."/>}</Panel></div>}
    </>}
    <dialog ref={dialog} className="submission-dialog" aria-labelledby="pay-title" onCancel={event=>{if(busy)event.preventDefault();else setInvoice(null);}}>{invoice&&<><div className="modal-header"><h2 id="pay-title">Pay with M-Pesa</h2><button disabled={busy} className="icon-button" aria-label="Close payment dialog" onClick={()=>setInvoice(null)}><X size={18}/></button></div><form onSubmit={pay} className="space-y-5 p-6">{paymentError&&<div role="alert" className="state-box">{paymentError}</div>}<p className="muted text-sm">{invoice.invoiceNumber} · Balance {money(invoice.balanceAmount)}</p><div className="field"><label htmlFor="phone">M-Pesa mobile number</label><input id="phone" type="tel" required autoFocus disabled={busy} placeholder="0712 345 678" value={phone} onChange={event=>setPhone(event.target.value)}/></div><div className="field"><label htmlFor="amount">Amount (KES)</label><input id="amount" type="number" required disabled={busy} min="1" max={invoice.balanceAmount/100} step="1" value={amount} onChange={event=>setAmount(event.target.value)}/></div><p className="muted text-xs">You’ll receive a payment request on your phone. Payment is confirmed only after M-Pesa processes it.</p><Button type="submit" fullWidth isLoading={busy}>Send payment request</Button></form></>}</dialog>
  </>;
}
