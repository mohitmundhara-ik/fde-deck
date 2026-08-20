import { NextRequest, NextResponse } from 'next/server';
import { readSession, SESSION_COOKIE } from '@/lib/session';
import { isAllowed } from '@/lib/allow';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The deck lives outside /public, so the only way to it is through this
 *  handler - and this handler checks the session first. */
export async function GET(req: NextRequest) {
  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session?.email || !isAllowed(session.email)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  const file = path.join(process.cwd(), 'private', 'FDE-Webinar-Deck.html');
  const html = await readFile(file, 'utf8');
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
