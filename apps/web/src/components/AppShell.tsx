'use client';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ChevronRight, GraduationCap, LogOut, Menu, Search, Settings, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navigationFor, portalLabels, type Portal } from '@/lib/navigation';
import { teacherRoles, schoolRoles } from '@/lib/session';
import { ProtectedRoute } from './ProtectedRoute';
import { FeatureBoundary } from './FeatureBoundary';

export function AppShell({ portal, children }: { portal: Portal; children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const base = portal === 'parent' ? '/dashboard' : '/' + portal;
  const groups = navigationFor(portal, user?.role || '');
  const links = groups.flatMap(group => group.items);
  const selected = (href: string) => pathname === href || (href !== base && pathname.startsWith(href + '/'));
  const active = links.find(link => selected(link.href));
  const results = links.filter(link => link.label.toLowerCase().includes(search.trim().toLowerCase()));
  const roles = portal === 'admin' ? ['SUPER_ADMIN'] : portal === 'teacher' ? teacherRoles : portal === 'school' ? schoolRoles : portal === 'student' ? ['STUDENT'] : ['PARENT'];
  const openSearch = () => { setSearch(''); dialog.current?.showModal(); };

  useEffect(() => { setOpen(false); dialog.current?.close(); }, [pathname]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearch(''); dialog.current?.showModal(); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector<HTMLElement>('button, a')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); menu.current?.focus(); }
      if (event.key === 'Tab') {
        const targets = sidebar.current?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!targets?.length) return;
        const first = targets[0], last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const media = window.matchMedia('(min-width: 961px)');
    const resize = () => { if (media.matches) setOpen(false); };
    document.addEventListener('keydown', key); media.addEventListener('change', resize);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', key); media.removeEventListener('change', resize); };
  }, [open]);

  if (pathname.endsWith('/login')) return <>{children}</>;
  return <ProtectedRoute allowedRoles={roles}><div className="workspace">
    <a className="skip-link" href="#main-content">Skip to content</a>
    {open && <button className="nav-scrim" aria-label="Close navigation" onClick={() => { setOpen(false); menu.current?.focus(); }}/>}
    <aside ref={sidebar} id="workspace-navigation" className={'sidebar ' + (open ? 'is-open' : '')} aria-label="Main navigation">
      <div className="sidebar-brand-row"><Link href={base + (portal === 'parent' ? '' : '/dashboard')} className="brand"><span className="brand-symbol"><GraduationCap size={25}/></span><span>Krypton<small>SCHOOL OPERATING SYSTEM</small></span></Link><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => {setOpen(false);menu.current?.focus();}}><X size={20}/></button></div>
      <div className="workspace-label"><span className="workspace-portal-icon"><GraduationCap size={18}/></span><span><strong>{portalLabels[portal]}</strong><small>Your connected workspace</small></span></div>
      <nav>{groups.map(group => <div className="nav-group" key={group.label}><p className="nav-caption">{group.label}</p>{group.items.map(({href, label, icon: Icon}) => <Link key={href} href={href} className={'nav-link ' + (selected(href) ? 'active' : '')} aria-current={selected(href) ? 'page' : undefined}><Icon size={18}/><span>{label}</span>{selected(href) && <ChevronRight size={14}/>}</Link>)}</div>)}</nav>
      <div className="sidebar-bottom"><Link href="/account" className="sidebar-account"><span className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><span><strong>{user?.firstName} {user?.lastName}</strong><small>Account & security</small></span><Settings size={16}/></Link><button className="signout" disabled={signingOut} onClick={async () => {setSigningOut(true);try {await logout();} finally {setSigningOut(false);}}}><LogOut size={17}/>{signingOut ? 'Signing out…' : 'Sign out'}</button></div>
    </aside>
    <div className="workspace-body" inert={open || undefined}><header className="topbar"><div className="breadcrumbs"><button ref={menu} className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-controls="workspace-navigation" aria-expanded={open} aria-label="Open navigation"><Menu size={20}/></button><span className="hidden sm:inline">{portal === 'admin' ? 'Platform' : 'Workspace'}</span><ChevronRight size={14}/><strong>{active?.label || 'Account'}</strong></div><div className="topbar-actions"><button className="command-trigger" onClick={openSearch} aria-label="Find a page"><Search size={17}/><span>Search workspace</span><kbd>Ctrl K</kbd></button><span className="topbar-divider"/><Link href="/account" className="profile-link" aria-label="Account settings"><span className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><span className="hidden lg:block"><strong>{user?.firstName} {user?.lastName}</strong><small>{user?.role.replaceAll('_',' ').toLowerCase()}</small></span></Link></div></header><main id="main-content" tabIndex={-1} className="page-content"><FeatureBoundary inWorkspace>{children}</FeatureBoundary></main><footer className="workspace-footer"><span>© {new Date().getFullYear()} Krypton School ERP</span><span>One connected school community</span></footer></div>
    <dialog ref={dialog} className="command-dialog" aria-labelledby="command-title" onClick={event => {if (event.target === event.currentTarget) dialog.current?.close();}}><div className="command-header"><Search size={20}/><h2 id="command-title" className="sr-only">Find a page</h2><input autoFocus aria-label="Search workspace pages" placeholder="Where would you like to go?" value={search} onChange={event => setSearch(event.target.value)}/><button className="icon-button" aria-label="Close search" onClick={() => dialog.current?.close()}><X size={18}/></button></div><div className="command-results">{results.map(({href,label,icon:Icon}) => <Link key={href} href={href} onClick={() => dialog.current?.close()}><Icon size={18}/><span>{label}</span><ArrowUpRight size={16}/></Link>)}{!results.length && <p className="command-empty">No pages match “{search}”. Try another keyword.</p>}</div><div className="command-footer"><span>Search your {portalLabels[portal].toLowerCase()}</span><span><kbd>Esc</kbd> to close</span></div></dialog>
  </div></ProtectedRoute>;
}

