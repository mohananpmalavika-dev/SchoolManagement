'use client';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, ChevronDown, ChevronRight, LogOut, LayoutGrid, Search, Settings, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navigationFor, portalLabels, type Portal } from '@/lib/navigation';
import { teacherRoles, schoolRoles } from '@/lib/session';
import { ProtectedRoute } from './ProtectedRoute';
import { FeatureBoundary } from './FeatureBoundary';
import { apiClient } from '@/lib/api-client';
import { portalDesign } from '@/lib/portal-design';

export function AppShell({ portal, children }: { portal: Portal; children: ReactNode }) {
  const [programme, setProgramme] = useState('COMBINED');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const restoreNavigationFocus = useRef(false);
  const focusDestination = useRef(false);
  const main = useRef<HTMLElement>(null);
  const base = portal === 'parent' ? '/dashboard' : '/' + portal;
  const PortalIcon = portalDesign[portal].icon;
  const groups = navigationFor(portal, user?.role || '', programme);
  useEffect(() => {
    if (!user || portal === 'admin' || portal === 'student') return;
    let active = true;
    const loadProgramme = () => { void apiClient.get('/preschool/navigation').then(({ data }) => { if (active && ['STANDARD','PRESCHOOL','COMBINED'].includes(data.programme)) setProgramme(data.programme); }).catch(() => undefined); };
    loadProgramme(); window.addEventListener('preschool-configuration-changed', loadProgramme);
    return () => { active = false; window.removeEventListener('preschool-configuration-changed', loadProgramme); };
  }, [user, portal]);
  useEffect(() => {
    if (programme !== 'PRESCHOOL' || !['school','teacher','parent'].includes(portal)) return;
    const overview = portal === 'parent' ? '/dashboard' : '/' + portal + '/dashboard';
    if (pathname === overview) router.replace(portal === 'parent' ? '/dashboard/preschool' : '/' + portal + '/preschool');
  }, [programme, portal, pathname, router]);
  const links = groups.flatMap(group => group.items);
  const matches = (href: string) => pathname === href || (href !== base && pathname.startsWith(href + '/'));
  const active = links.filter(link => matches(link.href)).sort((left, right) => right.href.length - left.href.length)[0];
  const selected = (href: string) => active?.href === href;
  const activeGroup = groups.find(group => group.items.some(item => selected(item.href)));
  const visibleGroup = expandedGroup ?? activeGroup?.label;
  const contextLinks = activeGroup?.items || groups[0]?.items || [];
  const results = links.filter(link => link.label.toLowerCase().includes(search.trim().toLowerCase()));
  const roles = portal === 'admin' ? ['SUPER_ADMIN'] : portal === 'teacher' ? teacherRoles : portal === 'school' ? schoolRoles : portal === 'student' ? ['STUDENT'] : ['PARENT'];
  const openSearch = () => { setSearch(''); dialog.current?.showModal(); };
  const closeNavigation = () => { restoreNavigationFocus.current = true; setOpen(false); };
  const browse = (label?: string) => { if (label) setExpandedGroup(label); setOpen(true); };

  useEffect(() => { focusDestination.current = !!sidebar.current?.classList.contains('is-open'); setOpen(false); setExpandedGroup(null); dialog.current?.close(); }, [pathname]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(false); setSearch(''); dialog.current?.showModal(); }
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
      if (event.key === 'Escape') { restoreNavigationFocus.current = true; setOpen(false); }
      if (event.key === 'Tab') {
        const targets = sidebar.current?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!targets?.length) return;
        const first = targets[0], last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', key); if (restoreNavigationFocus.current) { restoreNavigationFocus.current = false; menu.current?.focus(); } else if (focusDestination.current) { focusDestination.current = false; main.current?.focus({ preventScroll: true }); } };
  }, [open]);

  if (pathname.endsWith('/login')) return <>{children}</>;
  return <ProtectedRoute allowedRoles={roles}><div className="workspace" data-portal={portal}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {open && <button className="nav-scrim" aria-label="Close navigation" onClick={closeNavigation}/>}
    <aside ref={sidebar} id="workspace-navigation" className={'sidebar ' + (open ? 'is-open' : '')} aria-label="Main navigation" role={open ? 'dialog' : undefined} aria-modal={open || undefined}>
      <div className="sidebar-brand-row"><div className="drawer-title"><LayoutGrid size={22}/><div><strong>Explore your workspace</strong><small>{portalLabels[portal]}</small></div></div><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={closeNavigation}><X size={20}/></button></div>
      <div className="workspace-label"><span className="workspace-portal-icon"><PortalIcon size={20}/></span><span><strong>{portalLabels[portal]}</strong><small>Tools assigned to your account</small></span></div>
      <nav aria-label="Workspace sections">{groups.map((group, index) => {
        const expanded = index === 0 || visibleGroup === group.label;
        const groupId = 'nav-' + portal + '-' + index;
        return <div className="nav-group" key={group.label}>
          {index === 0 ? <p className="nav-caption">Your workspace</p> : <button className="nav-section-toggle" aria-expanded={expanded} aria-controls={groupId} onClick={() => setExpandedGroup(expanded ? '' : group.label)}><span>{group.label.toLowerCase()}</span><ChevronDown size={14}/></button>}
          <div id={groupId} hidden={!expanded}>{expanded && group.items.map(({href, label, icon: Icon}) => <Link key={href} href={href} className={'nav-link ' + (selected(href) ? 'active' : '')} aria-current={open && selected(href) ? 'page' : undefined}><Icon size={18}/><span>{label}</span>{selected(href) && <ChevronRight size={14}/>}</Link>)}</div>
        </div>;
      })}</nav>
      <div className="sidebar-bottom"><Link href="/account" className="sidebar-account"><span className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><span><strong>{user?.firstName} {user?.lastName}</strong><small>Account &amp; security</small></span><Settings size={16}/></Link><button className="signout" disabled={signingOut} onClick={async () => { setSigningOut(true); try { await logout(); } finally { setSigningOut(false); } }}><LogOut size={17}/>{signingOut ? 'Signing out...' : 'Sign out'}</button></div>
    </aside>
    <div className="workspace-body" inert={open || undefined}>
      <header className="topbar">
        <Link href={base + (portal === 'parent' ? '' : '/dashboard')} className="brand"><img src="/hustlertech-logo.png" alt="HustlerTech" className="brand-logo-img"/><span>HustlerTech<small>Connected school workspace</small></span></Link>
        <nav className="module-navigation" aria-label="Workspace modules">{groups.map(group => <button key={group.label} className={activeGroup?.label === group.label ? 'selected' : ''} aria-label={'Browse ' + group.label.toLowerCase()} onClick={() => browse(group.label)}>{group.label.toLowerCase()}<ChevronDown size={12}/></button>)}</nav>
        <div className="topbar-actions"><button className="command-trigger" onClick={openSearch} aria-label="Find a page"><Search size={17}/><span>Find anything</span><kbd>Ctrl K</kbd></button><Link href="/account" className="profile-link" aria-label="Account settings"><span className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><span className="hidden xl:block"><strong>{user?.firstName} {user?.lastName}</strong><small>{user?.role.replaceAll('_',' ').toLowerCase()}</small></span></Link><button ref={menu} className="module-launcher" onClick={() => browse()} aria-controls="workspace-navigation" aria-expanded={open} aria-label="Open navigation"><LayoutGrid size={19}/><span>Modules</span></button></div>
      </header>
      <div className="workspace-subnav"><span className="workspace-context"><PortalIcon size={16}/>{portalLabels[portal]}</span><nav aria-label="Current section">{contextLinks.map(({href, label}) => <Link key={href} href={href} className={selected(href) ? 'active' : ''} aria-current={selected(href) ? 'page' : undefined}>{label}</Link>)}</nav></div>
      <main ref={main} id="main-content" tabIndex={-1} className="page-content"><FeatureBoundary inWorkspace>{children}</FeatureBoundary></main>
      <footer className="workspace-footer"><span>&copy; {new Date().getFullYear()} HustlerTech School ERP</span><span>One connected school community</span></footer>
    </div>
    <dialog ref={dialog} className="command-dialog" aria-labelledby="command-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="command-header"><Search size={20}/><h2 id="command-title" className="sr-only">Find a page</h2><input autoFocus aria-label="Search workspace pages" placeholder="Where would you like to go?" value={search} onChange={event => setSearch(event.target.value)}/><button className="icon-button" aria-label="Close search" onClick={() => dialog.current?.close()}><X size={18}/></button></div><div className="command-results">{results.map(({href,label,icon:Icon}) => <Link key={href} href={href} onClick={() => dialog.current?.close()}><Icon size={18}/><span>{label}</span><ArrowUpRight size={16}/></Link>)}{!results.length && <p className="command-empty">No pages match &ldquo;{search}&rdquo;. Try another keyword.</p>}</div><div className="command-footer"><span>Search your {portalLabels[portal].toLowerCase()}</span><span><kbd>Esc</kbd> to close</span></div></dialog>
  </div></ProtectedRoute>;
}
