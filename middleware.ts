import { NextRequest, NextResponse } from 'next/server';

/** "/" handles both states itself, so the middleware only has to stop anything
 *  else from being reachable. No redirects, so the URL never changes. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/' || pathname.startsWith('/api/auth/')) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/';
  url.search = '';
  return NextResponse.rewrite(url);
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
