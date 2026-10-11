'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, GraduationCap, CreditCard, ClipboardCheck, ArrowUpRight, CalendarDays, BookOpen, School, RefreshCw, MessageSquare, Sparkles, Bot, type LucideIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { money, dateLabel, messageFor } from '@/lib/workspace';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeading, StatCard, Panel, EmptyState, StatusPill } from './WorkspaceUI';
import { Button } from './ui';
import { AtRiskStudentsPanel } from './AtRiskStudentsPanel';
import { predictiveAnalyticsRoles, teacherRoles } from '@/lib/session';
import { navigationFor } from '@/lib/navigation';
import { CampusArtwork } from './CampusArtwork';
interface Overview {
  schools?: number; students: number; classes?: number; staff: number; balance: number;
  examinations?: number; subscriptions?: number; attendanceTotal: number; attendanceRate: number;
  weekly: {date: string; total: number; rate: number}[];
  recentSchools?: {id: string; name: string; status: string; createdAt: string}[];
  events: {id: string; title: string; location?: string; category?: string; startDate: string}[];
  activities: {id: string; action: string; entityType: string; createdAt: string}[];
}
type QuickAction = [string, string, string, LucideIcon];
export function OverviewPage({ portal }: { portal: 'admin' | 'teacher' | 'school' }) {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<Date | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await apiClient.get<Overview>(portal === 'admin' ? '/admin/overview' : '/workspace/overview')).data); }
    catch (err) { setError(messageFor(err)); } finally { setLoading(false); }
  }, [portal]);
  useEffect(() => { void load(); setToday(new Date()); }, [load]);
  const base = '/' + portal;
  const permitted = new Set(navigationFor(portal, user?.role || '').flatMap(group => group.items.map(item => item.href)));
  const actions: QuickAction[] = portal === 'admin' ? [
    ['schools','Manage schools','School communities & campuses',School], ['users','People & access','Manage accounts and roles',Users], ['subscriptions','Subscriptions','Plans, renewals and billing',CreditCard], ['reports','Platform reports','Understand your school network',BookOpen]
  ] : portal === 'teacher' ? [
    ['attendance','Take attendance','Complete your daily register',ClipboardCheck], ['grades','Open gradebook','Record learning progress',BookOpen], ['ai-studio','AI teaching studio','Prepare and review teaching drafts',Sparkles], ['messages','Send a message','Connect with families',MessageSquare]
  ] : [
    ['students','Student directory','Manage your school community',Users], ['fees','Fees & invoices','Track payments and balances',CreditCard], ['attendance','Take attendance','Keep daily records up to date',ClipboardCheck], ['examinations','Examinations','Plan and manage assessments',BookOpen]
  ];
  const quick = actions.filter(([slug]) => permitted.has(base + '/' + slug));
  const lead = portal === 'admin' ? ['schools','Manage schools'] : portal === 'teacher' ? ['attendance','Open today’s register'] : ['students','View student directory'];
  const count = (value?: number) => value == null ? '—' : value.toLocaleString('en-KE');
  return <><PageHeading eyebrow={portal === 'admin' ? 'PLATFORM COMMAND CENTER' : portal === 'teacher' ? 'TEACHING WORKSPACE' : 'SCHOOL COMMAND CENTER'} title={portal === 'admin' ? 'Platform overview' : portal === 'teacher' ? 'Your teaching day' : 'School overview'} description={portal === 'admin' ? 'Your school network, people, and operations at a glance.' : 'Everything you need to keep your school day moving.'} actions={<Button variant="outline" size="sm" disabled={loading} leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>} onClick={() => void load()}>Refresh</Button>}/>
    <section className="overview-hero" aria-label="Welcome"><div className="overview-hero-copy"><span className="eyebrow">A NEW DAY. A CLEARER PICTURE.</span><h2>Welcome back, {user?.firstName || 'there'}.</h2><p>{portal === 'teacher' ? 'Your classes, learning progress, and conversations, together in one workspace.' : portal === 'admin' ? 'Keep every school supported, every team connected, and your platform moving forward.' : 'Bring people, learning, and operations together. Focus on what matters to your school.'}</p><Link href={base + '/' + lead[0]} className="overview-hero-link">{lead[1]}<ArrowUpRight size={16}/></Link></div><CampusArtwork compact/><div className="hero-calendar"><span>{today?.toLocaleDateString('en-KE',{weekday:'long'}) || 'Today'}</span><strong>{today?.getDate() || '—'}</strong><small>{today?.toLocaleDateString('en-KE',{month:'long',year:'numeric'}) || 'School workspace'}</small><span className="hero-calendar-note"><CalendarDays size={13}/>Your school day, organized</span></div></section>
    {error && <div className="state-box" role="alert">{error} <button className="underline ml-3" disabled={loading} onClick={() => void load()}>Try again</button>{data && <p>Showing the last loaded overview. Refresh to retrieve current figures.</p>}</div>}
    {loading && !data ? <div className="metric-grid" aria-busy="true" aria-label="Loading school metrics">{[1,2,3,4].map(i => <div key={i} className="skeleton h-32"/>)}</div> : data && <div className="metric-grid"><StatCard label={portal === 'admin' ? 'School communities' : 'Students'} value={count(portal === 'admin' ? data.schools : data.students)} note={portal === 'admin' ? 'Across your platform' : 'Students in your workspace'} icon={portal === 'admin' ? School : Users}/><StatCard label={portal === 'teacher' ? 'Assigned classes' : 'Staff members'} value={count(portal === 'teacher' ? data.classes : data.staff)} note={portal === 'teacher' ? 'From your saved timetable' : 'Your school team'} icon={GraduationCap}/><StatCard label={portal === 'admin' ? 'Annual plan value' : portal === 'teacher' ? 'Assessments' : 'Outstanding fees'} value={portal === 'teacher' ? count(data.examinations) : data.balance == null ? '—' : money(data.balance)} note={portal === 'admin' ? 'Active subscription plans' : portal === 'teacher' ? 'Scheduled examinations' : 'Based on saved invoices'} icon={portal === 'teacher' ? BookOpen : CreditCard}/><StatCard label={portal === 'admin' ? 'Active subscriptions' : 'Attendance today'} value={portal === 'admin' ? count(data.subscriptions) : data.attendanceTotal ? data.attendanceRate + '%' : '—'} note={portal === 'admin' ? 'Schools with active plans' : count(data.attendanceTotal || 0) + ' students recorded'} icon={ClipboardCheck}/></div>}
    <div className="dashboard-grid"><div className="content-stack"><Panel title={portal === 'admin' ? 'School communities' : 'Attendance this week'} subtitle={portal === 'admin' ? 'The latest schools to join your platform' : 'Present and late students across recorded school days'} href={permitted.has(base + (portal === 'admin' ? '/schools' : '/attendance')) ? base + (portal === 'admin' ? '/schools' : '/attendance') : undefined}>{portal === 'admin' ? <div className="table-wrap"><table><caption className="sr-only">Recent school communities</caption><thead><tr><th scope="col">School</th><th scope="col">Status</th><th scope="col">Joined</th></tr></thead><tbody>{data?.recentSchools?.map(s => <tr key={s.id}><td>{s.name}</td><td><StatusPill value={s.status}/></td><td>{dateLabel(s.createdAt)}</td></tr>)}</tbody></table>{!data?.recentSchools?.length && <EmptyState title="Your next school starts here" description="Add a school to build your community."/>}</div> : <div className="panel-body">{data?.weekly?.some(day => day.total > 0) ? <><div className="chart-bars" role="img" aria-label={data.weekly.map(day => dateLabel(day.date) + ': ' + (day.total ? day.rate + '%' : 'not recorded')).join('; ')}>{data.weekly.map(day => <div className="chart-column" key={day.date}><span>{day.total ? day.rate + '%' : '—'}</span><div className="bar" style={{height: Math.max(day.total ? day.rate : 0, 0) + '%', minHeight: day.total ? '2px' : '0'}}/><small>{new Date(day.date).toLocaleDateString('en-KE',{weekday:'short'})}</small></div>)}</div><div className="chart-summary"><span><span className="workspace-dot inline-block mr-2"/>Attendance rate</span><span>Based on saved registers</span></div></> : <EmptyState title="Every day counts" description="Attendance trends appear after registers are saved."/>}</div>}</Panel>
      <Panel title="Upcoming dates" subtitle="Keep your community one step ahead" href={portal === 'admin' ? '/admin/support' : portal === 'teacher' ? '/teacher/timetable' : permitted.has('/school/calendar') ? '/school/calendar' : undefined}><div className="panel-body">{data?.events?.length ? data.events.map(event => <div className="activity-row" key={event.id}><div className="activity-icon"><CalendarDays size={17}/></div><div><strong>{event.title}</strong><p>{event.location || event.category}</p><time>{dateLabel(event.startDate)}</time></div></div>) : <EmptyState title="Your calendar is clear" description="Upcoming school events will appear here when scheduled."/>}</div></Panel>
      {portal !== 'admin' && [...predictiveAnalyticsRoles, ...teacherRoles].includes(user?.role || '') && <AtRiskStudentsPanel/>}
    </div><div className="content-stack"><Panel title="Quick actions" subtitle="The tools you use, one click away"><div className="panel-body quick-actions">{quick.map(([slug,label,subtitle,Icon]) => <Link key={slug} href={base + '/' + slug} className="quick-action"><Icon size={21} strokeWidth={1.6}/><div><strong>{label}</strong><small>{subtitle}</small></div><ArrowUpRight size={14} className="ml-auto"/></Link>)}</div></Panel><Panel title="Recent activity" subtitle="The latest changes in your workspace"><div className="panel-body">{data?.activities?.length ? data.activities.map(activity => <div className="activity-row" key={activity.id}><div className="activity-icon"><ArrowUpRight size={16}/></div><div><strong>{activity.action.replaceAll('_',' ').toLowerCase()}</strong><p>{activity.entityType}</p><time>{dateLabel(activity.createdAt)}</time></div></div>) : <EmptyState title="You’re all caught up" description="Changes to school records will appear here."/>}</div></Panel>{permitted.has(base + '/copilot') && <Link href={base + '/copilot'} className="overview-assistant"><span className="metric-icon"><Bot size={22}/></span><div><strong>A little help with your school day</strong><p>Ask ERP Copilot to find information in your workspace.</p></div><ArrowUpRight size={18}/></Link>}</div></div></>;
}
