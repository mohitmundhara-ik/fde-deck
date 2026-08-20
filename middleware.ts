import { NextRequest, NextResponse } from 'next/server';
import { readSession, SESSION_COOKIE } from './lib/session';
import { isAllowed } from './lib/allow';

/** Everything except the login page and the auth endpoints requires a session. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const open =
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico';
  if (open) return NextResponse.next();

  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  // re-check the allowlist on every request, so removing someone takes
  // effect immediately instead of when their session happens to expire
  if (session?.email && isAllowed(session.email)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
