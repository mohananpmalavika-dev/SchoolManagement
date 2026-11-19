'use client';
import { Suspense, useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, ChevronRight, LogOut, Menu, Search, Settings, X, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navigationFor, navigationMatches, preschoolSectionsFor, portalLabels, type Portal, type PreschoolSection } from '@/lib/navigation';
import { teacherRoles, schoolRoles } from '@/lib/session';
import { ProtectedRoute } from './ProtectedRoute';
import { FeatureBoundary } from './FeatureBoundary';
import { apiClient } from '@/lib/api-client';
import { portalDesign } from '@/lib/portal-design';
import { PreschoolSectionLocation } from './PreschoolSectionLocation';

export function AppShell({ portal, children }: { portal: Portal; children: ReactNode }) {
  const [programme, setProgramme] = useState('STANDARD');
  const [section, setSection] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [desktopNavigation, setDesktopNavigation] = useState(false);
  const [search, setSearch] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const navigationTrigger = useRef<HTMLButtonElement | null>(null);
  const restoreNavigationFocus = useRef(false);
  const focusDestination = useRef(false);
  const main = useRef<HTMLElement>(null);
  const base = portal === 'parent' ? '/dashboard' : '/' + portal;
  const PortalIcon = portalDesign[portal].icon;
  const accountPage = pathname === '/account' || pathname.startsWith('/account/');
  const modalNavigation = open && !desktopNavigation;
  const groups = navigationFor(portal, user?.role || '', programme);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1100px)');
    const syncNavigation = () => { setDesktopNavigation(query.matches); setOpen(false); };
    syncNavigation();
    query.addEventListener('change', syncNavigation);
    return () => query.removeEventListener('change', syncNavigation);
  }, []);
  useEffect(() => {
    if (!user || portal === 'admin' || portal === 'student') return;
    let active = true;
    setProgramme('STANDARD');
    const loadProgramme = () => { void apiClient.get('/preschool/navigation').then(({ data }) => { if (active && ['STANDARD','PRESCHOOL','COMBINED'].includes(data.programme)) setProgramme(data.programme); }).catch(() => undefined); };
    loadProgramme(); window.addEventListener('preschool-configuration-changed', loadProgramme);
    return () => { active = false; window.removeEventListener('preschool-configuration-changed', loadProgramme); };
  }, [user, portal]);
  useEffect(() => {
    if (programme !== 'PRESCHOOL' || !['school','teacher','parent'].includes(portal) || !preschoolSectionsFor(user?.role || '').length) return;
    const overview = portal === 'parent' ? '/dashboard' : '/' + portal + '/dashboard';
    if (pathname === overview) router.replace(portal === 'parent' ? '/dashboard/preschool' : '/' + portal + '/preschool');
  }, [programme, portal, pathname, router, user?.role]);
  const links = groups.flatMap(group => group.items);
  const currentSection = preschoolSectionsFor(user?.role || '').includes(section as PreschoolSection) ? section : 'daily';
  const matches = (href: string) => navigationMatches(href, pathname, currentSection);
  const active = links.filter(link => matches(link.href)).sort((left, right) => right.href.length - left.href.length)[0];
  const selected = (href: string) => active?.href === href;
  const activeGroup = groups.find(group => group.items.some(item => selected(item.href)));
  const visibleGroup = groups.find(group => group.label === expandedGroup) || activeGroup || groups[0];
  const results = links.filter(link => link.label.toLowerCase().includes(search.trim().toLowerCase()));
  const roles = portal === 'admin' ? ['SUPER_ADMIN'] : portal === 'teacher' ? teacherRoles : portal === 'school' ? schoolRoles : portal === 'student' ? ['STUDENT'] : ['PARENT'];
  const openSearch = () => { setSearch(''); dialog.current?.showModal(); };
  const closeNavigation = () => { restoreNavigationFocus.current = true; setOpen(false); };
  const browse = () => { navigationTrigger.current = menu.current; setOpen(true); };
  const followMenuLink = () => { focusDestination.current = true; setOpen(false); };

  useEffect(() => {
    if (desktopNavigation || open) sidebar.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  }, [desktopNavigation, open, pathname, section, visibleGroup?.label]);
  useEffect(() => {
    if (desktopNavigation && focusDestination.current) { focusDestination.current = false; main.current?.focus({ preventScroll: true }); }
    else focusDestination.current = !!sidebar.current?.classList.contains('is-open');
    setOpen(false); setExpandedGroup(null); dialog.current?.close();
  }, [pathname, section, desktopNavigation]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(false); setSearch(''); dialog.current?.showModal(); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (!modalNavigation) return;
    const previousOverflow = document.body.style.overflow;
    const destination = main.current;
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
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', key); if (restoreNavigationFocus.current) { restoreNavigationFocus.current = false; navigationTrigger.current?.focus(); } else if (focusDestination.current) { focusDestination.current = false; destination?.focus({ preventScroll: true }); } };
  }, [modalNavigation]);

  if (pathname.endsWith('/login')) return <>{children}</>;
  return <ProtectedRoute allowedRoles={roles}><div className="workspace" data-portal={portal} data-page={accountPage ? 'account' : undefined}>
    <Suspense fallback={null}><PreschoolSectionLocation onChange={setSection}/></Suspense>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {modalNavigation && <button className="nav-scrim" aria-label="Close navigation" onClick={closeNavigation}/>}
    <aside ref={sidebar} id="workspace-navigation" className={'sidebar ' + (open ? 'is-open' : '')} aria-label="Main navigation" role={modalNavigation ? 'dialog' : undefined} aria-modal={modalNavigation || undefined}>
      <div className="sidebar-brand-row"><Link href={base + (portal === 'parent' ? '' : '/dashboard')} className="brand" onClick={followMenuLink}><span className="brand-mark"><PortalIcon size={22}/></span><span>Krypton<small>{portalLabels[portal]}</small></span></Link><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={closeNavigation}><X size={20}/></button></div>
      <div className="workspace-label"><span className="workspace-portal-icon"><PortalIcon size={20}/></span><span><strong>{portalLabels[portal]}</strong><small>{user?.role.replaceAll('_', ' ').toLowerCase()}</small></span></div>
      <nav className="school-navigation" aria-label="Workspace sections">
        <p className="nav-caption">Explore modules</p>
        <div className="school-module-grid" role="group" aria-label="Choose a module">{groups.map(group => {
          const Icon = group.items[0].icon;
          return <button type="button" key={group.label} className="school-module-tile" aria-label={group.label.toLowerCase()} aria-pressed={visibleGroup?.label === group.label} aria-controls="school-module-pages" onClick={() => setExpandedGroup(group.label)}><span className="school-module-icon"><Icon size={19}/></span><span>{group.label.toLowerCase()}</span></button>;
        })}</div>
        {visibleGroup && <div className="school-menu-pages" id="school-module-pages" key={visibleGroup.label}>
          <div className="school-navigation-heading"><strong>{visibleGroup.label.toLowerCase()}</strong><span>{visibleGroup.items.length} {visibleGroup.items.length === 1 ? 'page' : 'pages'}</span></div>
          {visibleGroup.items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={followMenuLink} className={'nav-link ' + (selected(href) ? 'active' : '')} aria-current={selected(href) ? 'page' : undefined}><span className="nav-link-icon"><Icon size={18}/></span><span>{label}</span>{selected(href) ? <i className="nav-active-dot" aria-hidden="true"/> : <ArrowUpRight className="nav-page-arrow" size={13}/>}</Link>)}
        </div>}
      </nav>
      <div className="sidebar-bottom">
        <button type="button" className="sidebar-install-pwa flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl transition-colors mb-2 w-full text-left" onClick={() => { closeNavigation(); window.dispatchEvent(new CustomEvent('open-pwa-install')); }}>
          <Smartphone size={16} className="text-teal-600 dark:text-teal-400" />
          <span>Install School App</span>
        </button>
        <Link href="/account" className="sidebar-account" aria-current={accountPage ? 'page' : undefined}><span className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><span><strong>{user?.firstName} {user?.lastName}</strong><small>Account &amp; security</small></span><Settings size={16}/></Link><button className="signout" disabled={signingOut} onClick={async () => { setSigningOut(true); try { await logout(); } finally { setSigningOut(false); } }}><LogOut size={17}/>{signingOut ? 'Signing out...' : 'Sign out'}</button></div>
    </aside>
    <div className="workspace-body" inert={modalNavigation || undefined}>
      <header className="topbar">
        <Link href={base + (portal === 'parent' ? '' : '/dashboard')} className="brand"><span className="brand-mark"><PortalIcon size={21}/></span><span>Krypton<small>{portalLabels[portal]}</small></span></Link>
        <div className="school-page-context">{accountPage ? <Settings size={18}/> : <PortalIcon size={18}/>}<span>{accountPage ? 'Settings' : activeGroup?.label.toLowerCase() || portalLabels[portal]}</span><ChevronRight size={14}/><strong>{accountPage ? 'Account settings' : pathname === '/notifications' ? 'Notifications' : active?.label || 'Workspace'}</strong></div>
        <div className="topbar-actions"><button className="command-trigger" onClick={openSearch} aria-label="Find a page"><Search size={17}/><span>Find anything</span><kbd>Ctrl K</kbd></button><Link href="/account" className="profile-link" aria-label="Account settings"><span className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</span><span className="hidden xl:block"><strong>{user?.firstName} {user?.lastName}</strong><small>{user?.role.replaceAll('_',' ').toLowerCase()}</small></span></Link><button ref={menu} className="module-launcher" onClick={() => browse()} aria-controls="workspace-navigation" aria-expanded={open} aria-label="Open navigation"><Menu size={20}/><span>Menu</span></button></div>
      </header>

      <main ref={main} id="main-content" tabIndex={-1} className="page-content"><FeatureBoundary inWorkspace>{children}</FeatureBoundary></main>
      <footer className="workspace-footer"><span>&copy; {new Date().getFullYear()} Krypton School ERP</span><span>One connected school community</span></footer>
    </div>
    <dialog ref={dialog} className="command-dialog" aria-labelledby="command-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="command-header"><Search size={20}/><h2 id="command-title" className="sr-only">Find a page</h2><input autoFocus aria-label="Search workspace pages" placeholder="Where would you like to go?" value={search} onChange={event => setSearch(event.target.value)}/><button className="icon-button" aria-label="Close search" onClick={() => dialog.current?.close()}><X size={18}/></button></div><div className="command-results">{results.map(({href,label,icon:Icon}) => <Link key={href} href={href} onClick={() => { dialog.current?.close(); followMenuLink(); }}><Icon size={18}/><span>{label}</span><ArrowUpRight size={16}/></Link>)}{!results.length && <p className="command-empty">No pages match &ldquo;{search}&rdquo;. Try another keyword.</p>}</div><div className="command-footer"><span>Search your {portalLabels[portal].toLowerCase()}</span><span><kbd>Esc</kbd> to close</span></div></dialog>
  </div></ProtectedRoute>;
}
