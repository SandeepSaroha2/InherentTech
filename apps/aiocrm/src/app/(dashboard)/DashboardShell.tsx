'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { I18nProvider, LanguageSwitcher, useTranslation } from '@inherenttech/ui';
import { locales, localeNames, defaultLocale, isRtl } from '@inherenttech/shared';
import type { Locale } from '@inherenttech/shared';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  GitBranch,
  ClipboardList,
  Mail,
  Bot,
  Megaphone,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

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

  const handleLocaleChange = useCallback((newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    document.documentElement.lang = newLocale;
    document.documentElement.dir = isRtl(newLocale as Locale) ? 'rtl' : 'ltr';
    loadMessages(newLocale);
  }, [loadMessages]);

  if (!messages) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <I18nProvider locale={locale} messages={messages} onLocaleChange={handleLocaleChange}>
      <DashboardLayout onLocaleChange={handleLocaleChange} locale={locale}>
        {children}
      </DashboardLayout>
    </I18nProvider>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
};

function DashboardLayout({
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

  const NAV_ITEMS: NavItem[] = [
    { href: '/', label: t('common.dashboard'), icon: <LayoutDashboard className="w-4 h-4" />, section: 'main' },
    { href: '/leads', label: t('common.leads'), icon: <Target className="w-4 h-4" />, section: 'main' },
    { href: '/pipeline', label: t('common.pipeline'), icon: <GitBranch className="w-4 h-4" />, section: 'main' },
    { href: '/activities', label: t('common.activities'), icon: <ClipboardList className="w-4 h-4" />, section: 'main' },
    { href: '/email', label: 'Email', icon: <Mail className="w-4 h-4" />, section: 'communicate' },
    { href: '/outreach', label: t('common.outreach'), icon: <Megaphone className="w-4 h-4" />, section: 'communicate' },
    { href: '/agents', label: 'AI Agents', icon: <Bot className="w-4 h-4" />, section: 'intelligence' },
    { href: '/payments', label: t('common.payments'), icon: <CreditCard className="w-4 h-4" />, section: 'manage' },
    { href: '/reports', label: t('common.reports'), icon: <BarChart3 className="w-4 h-4" />, section: 'manage' },
    { href: '/settings', label: t('common.settings'), icon: <Settings className="w-4 h-4" />, section: 'manage' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sections: { key: string; label: string }[] = [
    { key: 'main', label: 'CRM' },
    { key: 'communicate', label: 'Communicate' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'manage', label: 'Manage' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-slate-900 text-slate-300
          flex flex-col flex-shrink-0
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">AIOCRM</h1>
            <p className="text-xs text-slate-500 mt-0.5">InherentTech</p>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sections.map((section) => {
            const items = NAV_ITEMS.filter((item) => item.section === section.key);
            if (items.length === 0) return null;
            return (
              <div key={section.key} className="mb-6">
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          router.push(item.href);
                          setSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                          transition-colors duration-150
                          ${active
                            ? 'bg-blue-600/20 text-white font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }
                        `}
                      >
                        <span className={active ? 'text-blue-400' : ''}>{item.icon}</span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {active && <ChevronRight className="w-3 h-3 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-600">{t('common.phase2Build')}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 justify-between flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <LanguageSwitcher
              currentLocale={locale}
              locales={locales}
              localeNames={localeNames}
              onLocaleChange={onLocaleChange}
            />
            <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                A
              </div>
              <span className="text-sm text-gray-600 hidden sm:inline">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
