'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

type Messages = Record<string, any>;

interface I18nContextType {
  locale: string;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

export interface I18nProviderProps {
  locale: string;
  messages: Messages;
  onLocaleChange?: (locale: string) => void;
  children: React.ReactNode;
}

export function I18nProvider({ locale: initialLocale, messages: initialMessages, onLocaleChange, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setLocaleState(initialLocale);
    setMessages(initialMessages);
  }, [initialLocale, initialMessages]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const value = getNestedValue(messages, key);
      if (value === undefined) {
        console.warn(`[i18n] Missing translation: "${key}" for locale "${locale}"`);
        return key;
      }
      if (typeof value !== 'string') return key;
      return params ? interpolate(value, params) : value;
    },
    [messages, locale]
  );

  const setLocale = useCallback(
    (newLocale: string) => {
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
        document.documentElement.lang = newLocale;
      }
      onLocaleChange?.(newLocale);
    },
    [onLocaleChange]
  );

  return (
    <I18nContext.Provider value={{ locale, messages, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
