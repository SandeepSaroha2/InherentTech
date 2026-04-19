'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { I18nProvider, LanguageSwitcher, useTranslation } from '@inherenttech/ui';
import { locales, localeNames, defaultLocale, isRtl } from '@inherenttech/shared';
import type { Locale } from '@inherenttech/shared';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  PenTool,
  Settings,
  Menu,
  X,
  Bell,
  ChevronDown,
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
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Loading KudoDoc...</span>
        </div>
      </div>
    );
  }

  return (
    <I18nProvider locale={locale} messages={messages} onLocaleChange={handleLocaleChange}>
      <KudoDocLayout onLocaleChange={handleLocaleChange} locale={locale}>
        {children}
      </KudoDocLayout>
    </I18nProvider>
  );
}

const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'common.dashboard', icon: LayoutDashboard },
  { href: '/templates', labelKey: 'common.templates', icon: FolderOpen },
  { href: '/documents', labelKey: 'common.documents', icon: FileText },
  { href: '/signatures', labelKey: 'common.signatures', icon: PenTool },
  { href: '/settings', labelKey: 'common.settings', icon: Settings },
];

function KudoDocLayout({
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-blue-900 text-blue-100
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-blue-800">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">{t('common.appName')}</h1>
            <p className="text-xs text-blue-300 mt-0.5">Digital Signatures</p>
          </div>
          <button
            className="lg:hidden p-1 rounded hover:bg-blue-800 text-blue-300"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium
                  transition-colors duration-150 border-l-[3px]
                  ${
                    isActive
                      ? 'bg-blue-800/60 text-white border-blue-400'
                      : 'text-blue-300 border-transparent hover:bg-blue-800/40 hover:text-blue-100'
                  }
                `}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-5 py-4 border-t border-blue-800">
          <p className="text-xs text-blue-400">KudoDoc v1.0</p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 justify-between flex-shrink-0">
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <LanguageSwitcher
              currentLocale={locale}
              locales={locales}
              localeNames={localeNames}
              onLocaleChange={onLocaleChange}
            />
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                U
              </div>
              <span className="hidden sm:block text-sm text-gray-700 font-medium">{t('common.user')}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
