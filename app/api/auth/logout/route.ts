import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
