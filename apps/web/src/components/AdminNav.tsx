'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

export function AdminNav() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('adminUser');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img
                src="/hustlertech-logo.png"
                alt="HustlerTech"
                className="w-9 h-9 object-contain rounded-lg bg-white p-0.5 shadow-sm border border-gray-100"
              />
              <div className="ml-3">
                <span className="text-lg font-bold text-gray-900">
                  {t('admin.platformAdmin')}
                </span>
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                  {t('admin.superAdmin')}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/admin/dashboard">{t('common.dashboard')}</NavLink>
            <NavLink href="/admin/copilot">AI Copilot</NavLink>
            <NavLink href="/dashboard/ptm">Virtual PTM</NavLink>
            <NavLink href="/dashboard/whatsapp">WhatsApp Hub</NavLink>
            <NavLink href="/school/admissions">Admissions CRM</NavLink>
            <NavLink href="/dashboard/compliance">Govt Compliance</NavLink>
            <NavLink href="/dashboard/smart-attendance">Smart Attendance</NavLink>
            <NavLink href="/admin/schools">{t('admin.schools')}</NavLink>
            <NavLink href="/admin/subscriptions">{t('admin.subscriptions')}</NavLink>
            <NavLink href="/admin/users">{t('admin.users')}</NavLink>
            <NavLink href="/admin/system">{t('admin.system')}</NavLink>
            <NavLink href="/admin/reports">{t('admin.reports')}</NavLink>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" />
            
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 p-1 hover:bg-gray-50"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-700 font-medium text-sm">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <span className="hidden sm:block text-gray-700 pr-2">
                {user?.firstName} {user?.lastName}
              </span>
              <svg
                className="w-4 h-4 text-gray-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showMenu && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                ></div>

                {/* Dropdown Menu */}
                <div className="absolute right-4 top-14 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-purple-600 font-semibold mt-1">
                      {t('admin.platformAdministrator')}
                    </p>
                  </div>
                  
                  <a
                    href="/admin/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('common.profileSettings')}
                    </div>
                  </a>
                  
                  <a
                    href="/admin/security"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {t('admin.securityMFA')}
                    </div>
                  </a>
                  
                  <a
                    href="/admin/audit-logs"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('admin.auditLogs')}
                    </div>
                  </a>
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t('auth.signOut')}
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 py-2">
          <div className="flex items-center justify-around">
            <MobileNavItem href="/admin/dashboard" icon="dashboard" label={t('admin.mobileNav.dashboard')} />
            <MobileNavItem href="/admin/schools" icon="school" label={t('admin.mobileNav.schools')} />
            <MobileNavItem href="/admin/subscriptions" icon="billing" label={t('admin.mobileNav.billing')} />
            <MobileNavItem href="/admin/system" icon="system" label={t('admin.mobileNav.system')} />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isActive = typeof window !== 'undefined' && window.location.pathname === href;

  return (
    <a
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-purple-50 text-purple-700'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </a>
  );
}

function MobileNavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const isActive = typeof window !== 'undefined' && window.location.pathname === href;

  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    school: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    billing: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    system: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center py-2 transition-colors ${
        isActive ? 'text-purple-600' : 'text-gray-500'
      }`}
    >
      {icons[icon]}
      <span className="text-xs mt-1 font-medium">{label}</span>
    </a>
  );
}
