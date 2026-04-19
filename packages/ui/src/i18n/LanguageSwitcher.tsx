'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface LanguageSwitcherProps {
  currentLocale: string;
  locales: readonly string[];
  localeNames: Record<string, string>;
  onLocaleChange: (locale: string) => void;
  compact?: boolean;
}

export function LanguageSwitcher({
  currentLocale,
  locales,
  localeNames,
  onLocaleChange,
  compact = false,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '4px 8px' : '8px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          background: 'white',
          cursor: 'pointer',
          fontSize: compact ? '13px' : '14px',
          color: '#374151',
          transition: 'all 0.15s ease',
        }}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: compact ? '14px' : '16px' }}>🌐</span>
        {!compact && <span>{localeNames[currentLocale] || currentLocale}</span>}
        <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            minWidth: '160px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 50,
            overflow: 'hidden',
          }}
          role="menu"
        >
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => {
                onLocaleChange(locale);
                setIsOpen(false);
              }}
              role="menuitem"
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 14px',
                textAlign: 'left',
                border: 'none',
                background: locale === currentLocale ? '#f0f4ff' : 'transparent',
                color: locale === currentLocale ? '#3b82f6' : '#374151',
                fontWeight: locale === currentLocale ? 600 : 400,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (locale !== currentLocale) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (locale !== currentLocale) e.currentTarget.style.background = 'transparent';
              }}
            >
              {localeNames[locale] || locale}
              {locale === currentLocale && (
                <span style={{ float: 'right', color: '#3b82f6' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
