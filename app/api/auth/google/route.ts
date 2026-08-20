import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { isAllowed } from '@/lib/allow';
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session';

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

async function logAccess(email: string, name: string, req: NextRequest) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const at = new Date().toISOString();
  try {
    await fetch(`${url}/rest/v1/deck_notes`, {
      method: 'POST',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([{
        key: `access:${at}:${email}`,
        content: JSON.stringify({
          email, name, at,
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
          ua: (req.headers.get('user-agent') || '').slice(0, 140),
        }),
      }]),
    });
  } catch { /* logging must never block sign-in */ }
}

export async function POST(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID is not set' }, { status: 500 });
  }

  let credential = '';
  try {
    const body = await req.json();
    credential = String(body?.credential || '');
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  let email = '', name = '';
  try {
    // Real verification: Google's signature, our client id, Google as issuer,
    // and an unexpired token. This is the bit a browser cannot do for itself.
    const { payload } = await jwtVerify(credential, JWKS, {
      audience: clientId,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });
    if (payload.email_verified === false) {
      return NextResponse.json({ error: 'That Google account has no verified email.' }, { status: 403 });
    }
    email = String(payload.email || '').toLowerCase();
    name = String(payload.name || '');
  } catch {
    return NextResponse.json({ error: 'Could not verify that sign-in. Try again.' }, { status: 401 });
  }

  if (!isAllowed(email)) {
    return NextResponse.json(
      { error: `${email} does not have access to this deck.` }, { status: 403 });
  }

  const token = await createSession(email, name);
  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  await logAccess(email, name, req);
  return res;
}
