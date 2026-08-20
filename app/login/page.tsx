'use client';
import { useEffect, useRef, useState } from 'react';

declare global { interface Window { google?: any } }

export default function Login() {
  const btn = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!clientId) { setErr('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set on this deployment.'); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: any) => {
          setBusy(true); setErr('');
          try {
            const r = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: resp.credential }),
            });
            if (r.ok) {
              const next = new URLSearchParams(window.location.search).get('next');
              window.location.href = next || '/deck';
            } else {
              const j = await r.json().catch(() => ({}));
              setErr(j.error || 'Sign-in failed.');
            }
          } catch { setErr('Network problem. Try again.'); }
          finally { setBusy(false); }
        },
      });
      if (btn.current) {
        window.google?.accounts.id.renderButton(btn.current, {
          theme: 'filled_blue', size: 'large', width: 320, shape: 'pill', text: 'signin_with',
        });
      }
    };
    document.body.appendChild(s);
  }, [clientId]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg,#0A1230 0%,#0D1B47 55%,#08102A 100%)',
      fontFamily: "'Manrope',system-ui,-apple-system,sans-serif", padding: 24,
    }}>
      <div style={{
        width: 'min(420px,100%)', background: 'rgba(255,255,255,.045)',
        border: '1px solid rgba(255,255,255,.14)', borderRadius: 20, padding: '34px 32px 30px',
      }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 21 }}>Interview Kickstart</div>
        <div style={{ color: '#9AA6BA', fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
          This deck is internal. Sign in with your Interview Kickstart Google account.
        </div>
        <div ref={btn} style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }} />
        {busy && <div style={{ color: '#9AA6BA', fontSize: 12.5, marginTop: 12 }}>Checking…</div>}
        {err && <div style={{ color: '#FF8A8A', fontSize: 12.5, lineHeight: 1.45, marginTop: 12 }}>{err}</div>}
        <div style={{
          color: '#66748C', fontSize: 11, lineHeight: 1.5, marginTop: 18,
          borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 14,
        }}>
          Forward Deployed AI Engineer · India masterclass. Not for external distribution.
        </div>
      </div>
    </div>
  );
}
