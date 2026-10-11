'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

export function DashboardNav() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900 hidden sm:block">
                {t('common.appName')}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink href="/dashboard">{t('common.dashboard')}</NavLink>
            <NavLink href="/dashboard/ptm">Virtual PTM</NavLink>
            <NavLink href="/dashboard/lms">LMS & Quizzes</NavLink>
            <NavLink href="/dashboard/smart-attendance">Smart Attendance</NavLink>
            <NavLink href="/dashboard/whatsapp">WhatsApp Hub</NavLink>
            <NavLink href="/dashboard/substitution">Proxy Engine</NavLink>
            <NavLink href="/dashboard/certificates">Certificates & IDs</NavLink>
            <NavLink href="/dashboard/fees">{t('parent.fees')}</NavLink>
            <NavLink href="/dashboard/attendance">{t('parent.attendance')}</NavLink>
            <NavLink href="/dashboard/grades">{t('parent.grades')}</NavLink>
            <NavLink href="/dashboard/transport">Bus Tracking</NavLink>
            <NavLink href="/dashboard/notifications">{t('parent.notifications')}</NavLink>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" />
            
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 tap-area"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <span className="hidden sm:block text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <svg
                className="w-4 h-4 text-gray-500"
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
                <div className="absolute right-4 top-14 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <a
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('common.profileSettings')}
                  </a>
                  <a
                    href="/dashboard/help"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('common.helpSupport')}
                  </a>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-gray-50 transition-colors"
                  >
                    {t('auth.signOut')}
                  </button>
                </div>
              </>
            )}
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
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </a>
  );
}
