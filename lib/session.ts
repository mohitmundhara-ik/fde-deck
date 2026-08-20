import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'fde_session';
const HOURS = 12;
export const SESSION_MAX_AGE = HOURS * 60 * 60;

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET missing or under 32 chars');
  return new TextEncoder().encode(s);
}

export async function createSession(email: string, name?: string) {
  return new SignJWT({ email, name: name || '' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${HOURS}h`)
    .sign(secret());
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as { email: string; name?: string };
  } catch {
    return null;
  }
}
