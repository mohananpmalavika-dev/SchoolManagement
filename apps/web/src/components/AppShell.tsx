'use client';
import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, LayoutDashboard, Users, School, CreditCard, BookOpen, CalendarDays, MessageSquare, Settings, LifeBuoy, LogOut, Menu, X, Search, ChevronRight, ArrowUpRight, Library, Bus, ClipboardCheck, BarChart3, ShieldCheck, LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { teacherRoles, schoolRoles, predictiveAnalyticsRoles } from '@/lib/session';
type Portal = 'admin' | 'teacher' | 'parent' | 'school' | 'student';
const items = {
 admin: [['dashboard','Overview',LayoutDashboard],['schools','Schools',School],['subscriptions','Subscriptions',CreditCard],['users','People & access',Users],['reports','Reports',BarChart3],['system','System health',ShieldCheck],['support','Support center',LifeBuoy]],
 teacher: [['dashboard','Overview',LayoutDashboard],['classes','My classes',Users],['attendance','Attendance',ClipboardCheck],['grades','Gradebook',BookOpen],['timetable','My schedule',CalendarDays],['messages','Messages',MessageSquare],['performance','Performance',BarChart3]],
 parent: [['','Overview',LayoutDashboard],['transport','Bus Tracking',Bus],['fees','Fees & payments',CreditCard],['attendance','Attendance',ClipboardCheck],['grades','Learning progress',BookOpen],['notifications','School updates',MessageSquare]],
 school: [['dashboard','Overview',LayoutDashboard],['students','Students',Users],['guardians','Guardians',Users],['staff','Staff directory',GraduationCap],['academics','Academic setup',BookOpen],['fees','Fees & invoices',CreditCard],['attendance','Attendance',ClipboardCheck],['grades','Gradebook',BookOpen],['examinations','Examinations',ClipboardCheck],['calendar','School calendar',CalendarDays],['timetable','Timetable',CalendarDays],['library','Library',Library],['transport','Transport',Bus],['inventory','Inventory',Library],['support','Support',LifeBuoy],['messages','Communications',MessageSquare]],
 student: [['dashboard','Overview',LayoutDashboard],['timetable','My Schedule',CalendarDays],['academics','Academics & CBC',BookOpen],['assignments','Assignments',ClipboardCheck],['attendance','My Attendance',ClipboardCheck],['library','Library & Notes',Library],['profile','Student Profile',GraduationCap]],
} as const;
export function AppShell({ portal, children }: { portal: Portal; children: ReactNode }) {
 const pathname = usePathname(); const {user, logout} = useAuth();
 const [open,setOpen] = useState(false); const [search,setSearch] = useState('');
 const base = portal === 'parent' ? '/dashboard' : '/' + portal;
 const links:ReadonlyArray<readonly [string,string,LucideIcon]> = portal === 'school' && predictiveAnalyticsRoles.includes(user?.role ?? '') ? [items.school[0], ['predictive-analytics','AI Predictive Analytics',BarChart3], ...items.school.slice(1)] : items[portal]; const active = links.find(([slug]) => pathname === base + (slug ? '/' + slug : ''));
 const roles = portal === 'admin' ? ['SUPER_ADMIN'] : portal === 'teacher' ? teacherRoles : portal === 'school' ? schoolRoles : portal === 'student' ? ['STUDENT'] : ['PARENT'];
 useEffect(() => {setOpen(false);setSearch('');},[pathname]);
 useEffect(() => {
  if (!open) return;
  const handle = (e: KeyboardEvent) => { if(e.key === 'Escape') setOpen(false); };
  document.addEventListener('keydown',handle); return () => document.removeEventListener('keydown',handle);
 },[open]);
 if (pathname.endsWith('/login')) return <>{children}</>;
 return <ProtectedRoute allowedRoles={roles}><div className="workspace">
 <a className="skip-link" href="#main-content">Skip to content</a>
 {open && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
 <aside className={`sidebar ${open?'is-open':''}`} aria-label="Main navigation">
  <Link href={base + (portal === 'parent' ? '' : '/dashboard')} className="brand"><span className="brand-symbol">K</span><span>Krypton<small>SCHOOL WORKSPACE</small></span></Link>
  <div className="workspace-label"><span className="workspace-dot"/>{portal === 'admin' ? 'Platform administration' : portal === 'teacher' ? 'Teaching workspace' : portal === 'school' ? 'School management' : portal === 'student' ? 'Student workspace' : 'Family workspace'}</div>
  <p className="nav-caption">WORKSPACE</p>
  <nav>{links.map(([slug,label,Icon]) => {const href=base+(slug?'/'+slug:'');const selected=pathname===href;return <Link key={href} href={href} className={`nav-link ${selected?'active':''}`} aria-current={selected?'page':undefined}><Icon size={18}/><span>{label}</span>{selected&&<ChevronRight size={14}/>}</Link>;})}</nav>
  <div className="sidebar-bottom"><div className="sidebar-note"><GraduationCap size={24}/><strong>A little more connected.</strong><p>Everything your school needs, in one place.</p></div><button className="signout" onClick={()=>void logout()}><LogOut size={17}/>Sign out</button></div>
 </aside>
 <div className="workspace-body"><header className="topbar">
  <div className="breadcrumbs"><button className="icon-button mobile-menu" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Open navigation">{open?<X size={20}/>:<Menu size={20}/>}</button><span className="hidden sm:inline">Workspace</span><ChevronRight size={14}/><strong>{active?.[1]||'Account'}</strong></div>
  <div className="topbar-actions"><div className="navigation-search"><Search size={16}/><input aria-label="Find a page" placeholder="Find a page?" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<div className="search-results">{links.filter(([,label])=>label.toLowerCase().includes(search.toLowerCase())).map(([slug,label])=><Link key={slug} href={base+(slug?'/'+slug:'')}>{label}<ArrowUpRight size={15}/></Link>)}{!links.some(([,label])=>label.toLowerCase().includes(search.toLowerCase()))&&<p>No matching pages</p>}</div>}</div>
  <Link href="/account" className="profile-link" aria-label="Account settings"><span className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><span className="hidden lg:block"><strong>{user?.firstName} {user?.lastName}</strong><small>{user?.role.replaceAll('_',' ').toLowerCase()}</small></span><Settings size={16}/></Link></div>
 </header><main id="main-content" className="page-content">{children}</main><footer className="workspace-footer"><span>? {new Date().getFullYear()} Krypton School ERP</span><span>Built for better school days</span></footer></div>
 </div></ProtectedRoute>;
}
