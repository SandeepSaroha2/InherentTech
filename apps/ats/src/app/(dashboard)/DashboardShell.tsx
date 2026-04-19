'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { I18nProvider, LanguageSwitcher, useTranslation } from '@inherenttech/ui';
import { locales, localeNames, defaultLocale, isRtl } from '@inherenttech/shared';
import type { Locale } from '@inherenttech/shared';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  Receipt,
  Settings,
  Menu,
  X,
  Bell,
  Inbox,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@inherenttech/ui';

const messageImports: Record<string, () => Promise<any>> = {
  en: () => import('../../messages/en.json'),
  es: () => import('../../messages/es.json'),
  hi: () => import('../../messages/hi.json'),
};

function getInitialLocale(): string {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/NEXT_LOCALE=([a-z]{2})/);
    if (match?.[1]) return match[1];
  }
  return defaultLocale;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<string>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  const loadMessages = useCallback(async (loc: string) => {
    const loader = messageImports[loc] || messageImports[defaultLocale];
    const mod = await loader();
    setMessages(mod.default || mod);
    setLocale(loc);
  }, []);

  useEffect(() => {
    loadMessages(getInitialLocale());
  }, [loadMessages]);

  const handleLocaleChange = useCallback(
    (newLocale: string) => {
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
      document.documentElement.lang = newLocale;
      document.documentElement.dir = isRtl(newLocale as Locale) ? 'rtl' : 'ltr';
      loadMessages(newLocale);
    },
    [loadMessages]
  );

  if (!messages) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <I18nProvider locale={locale} messages={messages} onLocaleChange={handleLocaleChange}>
      <ATSLayout onLocaleChange={handleLocaleChange} locale={locale}>
        {children}
      </ATSLayout>
    </I18nProvider>
  );
}

const NAV_ICON_MAP: Record<string, React.ElementType> = {
  '/dashboard': LayoutDashboard,
  '/inbox': Inbox,
  '/candidates': Users,
  '/jobs': Briefcase,
  '/submissions': Send,
  '/interviews': Calendar,
  '/placements': CheckCircle2,
  '/timesheets': Clock,
  '/invoices': Receipt,
  '/settings': Settings,
};

function ATSLayout({
  children,
  onLocaleChange,
  locale,
}: {
  children: React.ReactNode;
  onLocaleChange: (l: string) => void;
  locale: string;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Recruiter';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayRole = user?.role
    ? user.role.charAt(0) + user.role.slice(1).toLowerCase().replace('_', ' ')
    : 'Recruiter';

  const NAV_ITEMS = [
    { href: '/dashboard', label: t('common.dashboard') },
    { href: '/inbox', label: 'AI Inbox' },
    { href: '/candidates', label: t('common.candidates') },
    { href: '/jobs', label: t('common.jobs') },
    { href: '/submissions', label: t('common.submissions') },
    { href: '/interviews', label: t('common.interviews') },
    { href: '/placements', label: t('common.placements') },
    { href: '/timesheets', label: t('common.timesheets') },
    { href: '/invoices', label: t('common.invoices') },
    { href: '/settings', label: t('common.settings') },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-bold text-white">{t('common.appName')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Applicant Tracking</p>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = NAV_ICON_MAP[item.href] || LayoutDashboard;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors
                  border-l-[3px]
                  ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border-blue-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                  }
                `}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {displayInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{displayRole}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <LanguageSwitcher
              currentLocale={locale}
              locales={locales}
              localeNames={localeNames}
              onLocaleChange={onLocaleChange}
            />
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-semibold">
                {displayInitial}
              </div>
              <span className="hidden sm:block text-sm text-gray-600">{displayName}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
