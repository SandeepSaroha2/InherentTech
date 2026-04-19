'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState('en');

  const locales = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  const navItems = [
    { href: '/portal', label: 'Dashboard', icon: '📊' },
    { href: '/portal/documents', label: 'Documents', icon: '📄' },
    { href: '/portal/placements', label: 'Placements', icon: '💼' },
    { href: '/portal/timesheets', label: 'Timesheets', icon: '⏱️' },
    { href: '/portal/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (href: string): boolean => {
    if (href === '/portal') {
      return pathname === '/portal';
    }
    return pathname.startsWith(href);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '280px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1e293b',
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            padding: '24px 16px',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            <span style={{ color: '#4f46e5' }}>InherentTech</span>
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Employee Portal
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: isActive(item.href) ? '#4f46e5' : '#cbd5e1',
                textDecoration: 'none',
                backgroundColor: isActive(item.href) ? '#1e293b' : 'transparent',
                borderLeft: isActive(item.href) ? '3px solid #4f46e5' : '3px solid transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.href)) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1e293b';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.href)) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#cbd5e1';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Language Switcher */}
        <div style={{ borderTop: '1px solid #1e293b', padding: '16px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>🌐 {locales.find((l) => l.code === selectedLocale)?.name}</span>
              <span style={{ fontSize: '10px' }}>{isLanguageOpen ? '▲' : '▼'}</span>
            </button>

            {isLanguageOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  zIndex: 10,
                }}
              >
                {locales.map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => {
                      setSelectedLocale(locale.code);
                      setIsLanguageOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor:
                        selectedLocale === locale.code ? '#334155' : 'transparent',
                      color: '#e2e8f0',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13px',
                      borderBottom:
                        locale.code !== locales[locales.length - 1].code
                          ? '1px solid #334155'
                          : 'none',
                    }}
                  >
                    {locale.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
              Welcome Back
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* User Avatar Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              JD
            </div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              <p style={{ margin: 0, fontWeight: '600' }}>John Doe</p>
              <p style={{ margin: '2px 0 0 0', color: '#94a3b8' }}>Employee</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
