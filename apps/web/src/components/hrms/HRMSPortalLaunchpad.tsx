'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase,
  ExternalLink,
  Clock,
  CreditCard,
  CalendarDays,
  Users,
  Building2,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Globe,
  Maximize2,
  Minimize2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { PageHeading, Panel, StatCard } from '@/components/WorkspaceUI';
import { Button } from '@/components/ui';

export function HRMSPortalLaunchpad() {
  const DEFAULT_HRMS_URL = process.env.NEXT_PUBLIC_HRMS_URL || 'http://localhost:3000';
  const [hrmsUrl, setHrmsUrl] = useState<string>(DEFAULT_HRMS_URL);
  const [customUrl, setCustomUrl] = useState<string>(DEFAULT_HRMS_URL);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('krypton_hrms_url');
      if (saved) {
        setHrmsUrl(saved);
        setCustomUrl(saved);
      }
    } catch {
      // Storage access is optional
    }
  }, []);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = customUrl.trim().replace(/\/$/, '');
    setHrmsUrl(formatted);
    try {
      localStorage.setItem('krypton_hrms_url', formatted);
    } catch {
      // Storage access is optional
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setIsConfigOpen(false);
  };

  const openModule = (path: string = '') => {
    const fullUrl = `${hrmsUrl}${path}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const MODULES = [
    {
      title: 'Staff Punching & Attendance',
      titleMl: 'സ്റ്റാഫ് പഞ്ചിംഗ് & ഹാജർ',
      description: 'Employee punch-in, punch-out, shift schedules, overtime tracking, and biometric device integration.',
      icon: Clock,
      path: '/attendance',
      badge: 'Biometric & Mobile',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      title: 'Payroll & Salary Slips',
      titleMl: 'ശമ്പളം & പേ സ്ലിപ്പുകൾ',
      description: 'Monthly payroll calculation, salary structures, statutory deductions (PF, ESI), and downloadable staff payslips.',
      icon: CreditCard,
      path: '/payroll',
      badge: 'Statutory Payroll',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    {
      title: 'Leave & Absence Management',
      titleMl: 'ലീവ് അപേക്ഷകളും അനുമതിയും',
      description: 'Staff leave applications, casual & medical leave quotas, and principal/manager approval workflows.',
      icon: CalendarDays,
      path: '/leave',
      badge: 'Leave Workflows',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      title: 'Employee & Staff Directory',
      titleMl: 'ജീവനക്കാരുടെ വിവരങ്ങൾ',
      description: 'Complete employee profiles, employment contracts, verified document locker, and department hierarchy.',
      icon: Users,
      path: '/employees',
      badge: 'HR Directory',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      title: 'Shifts & School Organization',
      titleMl: 'ഷിഫ്റ്റുകളും വർക്കിംഗ് ടൈമും',
      description: 'Define teaching and non-teaching shifts, grace time, weekly off days, and academic holiday calendars.',
      icon: Building2,
      path: '/setup',
      badge: 'Organization Setup',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeading
        eyebrow="INTEGRATED WORKFORCE SUITE"
        title="HR & Payroll (HRMS 360)"
        description="Connect with the dedicated HRMS 360 platform for employee punching, biometric logs, payroll disbursement, and staff leave management."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sliders size={15} />}
              onClick={() => setIsConfigOpen(!isConfigOpen)}
            >
              Configure URL
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Globe size={15} />}
              onClick={() => setIsEmbedded(!isEmbedded)}
            >
              {isEmbedded ? 'Hide Embedded View' : 'Embed in this Window'}
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<ExternalLink size={15} />}
              onClick={() => openModule('')}
            >
              Launch HRMS 360
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div role="status" className="state-box success flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>HRMS URL configuration saved successfully: <strong>{hrmsUrl}</strong></span>
        </div>
      )}

      {/* URL Configuration Drawer/Panel */}
      {isConfigOpen && (
        <section className="panel p-5 bg-gray-50 border border-gray-200 rounded-2xl">
          <h2 className="text-sm font-bold text-gray-900 mb-1">HRMS 360 Connection Settings</h2>
          <p className="text-xs text-gray-600 mb-4">
            Specify where your HRMS 360 system is hosted (e.g. local development port, local network IP, or public production domain).
          </p>
          <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="field flex-1 w-full">
              <label htmlFor="hrms-url" className="text-xs font-semibold text-gray-700">
                HRMS Web Portal Endpoint
              </label>
              <input
                id="hrms-url"
                type="url"
                required
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white"
                placeholder="http://localhost:3000 or http://140.245.200.162:3000"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="primary">
                Save & Connect
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCustomUrl(hrmsUrl);
                  setIsConfigOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Main Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                ACTIVE WORKFORCE BRIDGE • എൻ്റർപ്രൈസ് എച്ച്.ആർ & പേറോൾ കണക്ഷൻ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              HRMS 360 Workforce Intelligence
            </h1>
            <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
              സ്കൂളിലെ ജീവനക്കാരുടെയും അധ്യാപകരുടെയും പഞ്ചിംഗ് (Biometric & Mobile GPS), ശമ്പള വിതരണം (Payroll), ലീവ് മാനേജ്‌മെന്റ് എന്നിവ കൈകാര്യം ചെയ്യാൻ C:\HRMS സിസ്റ്റത്തിലേക്ക് നേരിട്ട് പ്രവേശിക്കുക.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => openModule('')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Open Portal</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-emerald-400 flex-shrink-0" />
            <span><strong>Biometric Punching:</strong> Device logs & mobile check-in</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-indigo-400 flex-shrink-0" />
            <span><strong>Salary Disbursement:</strong> Automated tax & PF calculations</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-amber-400 flex-shrink-0" />
            <span><strong>Leave Portal:</strong> Casual, sick & maternity leave approvals</span>
          </div>
        </div>
      </div>

      {/* Embedded Iframe Option */}
      {isEmbedded && (
        <section
          className={`panel p-4 bg-white border border-gray-200 rounded-2xl shadow-md transition-all ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none p-2' : ''
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-gray-700">
                Connected to: <code className="bg-gray-100 px-2 py-0.5 rounded text-indigo-600">{hrmsUrl}</code>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                leftIcon={isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEmbedded(false)}
              >
                Close View
              </Button>
            </div>
          </div>
          <iframe
            src={hrmsUrl}
            title="HRMS 360 Workspace"
            className={`w-full border-0 rounded-xl bg-gray-50 ${
              isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[750px]'
            }`}
          />
        </section>
      )}

      {/* Quick Launch Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Direct Module Launchers</h2>
            <p className="text-xs text-gray-500">Jump directly into dedicated operational areas within HRMS 360</p>
          </div>
          <span className="text-xs font-medium text-gray-500">Target: {hrmsUrl}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(mod => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="panel p-5 bg-white border border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-0.5">{mod.title}</h3>
                  <p className="text-[11px] text-gray-500 mb-2 font-medium">{mod.titleMl}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{mod.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-mono">{mod.path}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<ExternalLink size={13} />}
                    onClick={() => openModule(mod.path)}
                  >
                    Open Module
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
