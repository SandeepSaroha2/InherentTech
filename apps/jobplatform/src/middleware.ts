import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Inline locale config to avoid importing from @inherenttech/shared
// which pulls in agents module with dynamic code eval (Edge Runtime incompatible)
const locales = ['en', 'es', 'hi', 'fr', 'de', 'zh', 'ja', 'pt', 'ar', 'te'] as const;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check for locale cookie
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;

  if (!localeCookie) {
    // Detect from Accept-Language header
    const acceptLang = request.headers.get('accept-language');
    if (acceptLang) {
      const preferred = acceptLang
        .split(',')
        .map(lang => lang.split(';')[0].trim().substring(0, 2))
        .find(code => (locales as readonly string[]).includes(code));

      if (preferred) {
        response.cookies.set('NEXT_LOCALE', preferred, {
          path: '/',
          maxAge: 31536000,
          sameSite: 'lax'
        });
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
