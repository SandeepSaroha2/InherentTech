import type { Locale } from '@inherenttech/shared';
import { defaultLocale } from '@inherenttech/shared';

const messageImports: Record<string, () => Promise<any>> = {
  en: () => import('../messages/en.json'),
  es: () => import('../messages/es.json'),
  hi: () => import('../messages/hi.json'),
};

export async function getMessages(locale?: string): Promise<Record<string, any>> {
  const targetLocale = locale && locale in messageImports ? locale : defaultLocale;
  try {
    const mod = await messageImports[targetLocale]();
    return mod.default || mod;
  } catch {
    const fallback = await messageImports[defaultLocale]();
    return fallback.default || fallback;
  }
}

export function getLocaleFromCookie(cookieHeader?: string | null): Locale {
  if (!cookieHeader) return defaultLocale;
  const match = cookieHeader.match(/NEXT_LOCALE=([a-z]{2})/);
  return (match?.[1] as Locale) || defaultLocale;
}
