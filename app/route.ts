import { NextRequest, NextResponse } from 'next/server';
import { readSession, SESSION_COOKIE } from '@/lib/session';
import { isAllowed } from '@/lib/allow';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One address for everything. Signed in -> the deck. Not signed in -> the
 *  sign-in card, rendered at "/" so the URL never changes. */
export async function GET(req: NextRequest) {
  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);

  if (session?.email && isAllowed(session.email)) {
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

  return new NextResponse(loginPage(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function loginPage(clientId: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Interview Kickstart</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
    background:linear-gradient(160deg,#0A1230 0%,#0D1B47 55%,#08102A 100%);
    font-family:'Manrope',system-ui,-apple-system,sans-serif}
  body::before{content:"";position:fixed;width:640px;height:640px;border-radius:50%;
    background:radial-gradient(circle,rgba(0,162,255,.22),transparent 62%);top:-180px;right:-140px}
  body::after{content:"";position:fixed;width:520px;height:520px;border-radius:50%;
    background:radial-gradient(circle,rgba(0,162,255,.14),transparent 62%);bottom:-190px;left:-120px}
  .card{position:relative;width:min(420px,100%);background:rgba(255,255,255,.045);
    border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:34px 32px 30px;
    backdrop-filter:blur(10px);box-shadow:0 30px 70px -30px rgba(0,0,0,.7)}
  h1{color:#fff;font-weight:800;font-size:21px;margin:0;letter-spacing:-.01em}
  p.sub{color:#9AA6BA;font-size:13px;line-height:1.5;margin:8px 0 0}
  #gbtn{display:flex;justify-content:center;margin-top:22px;min-height:44px}
  #msg{font-size:12.5px;line-height:1.45;margin-top:12px;min-height:1em;color:#FF8A8A}
  #msg.info{color:#9AA6BA}
  .foot{color:#66748C;font-size:11px;line-height:1.5;margin-top:18px;
    border-top:1px solid rgba(255,255,255,.1);padding-top:14px}
</style></head><body>
<div class="card">
  <h1>Interview Kickstart</h1>
  <p class="sub">This deck is internal. Sign in with your Interview Kickstart Google account.</p>
  <div id="gbtn"></div>
  <div id="msg"></div>
  <div class="foot">Forward Deployed AI Engineer &middot; India masterclass. Not for external distribution.</div>
</div>
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script>
  var CLIENT_ID = ${JSON.stringify(clientId)};
  function say(t, info){ var m=document.getElementById('msg'); m.textContent=t; m.className=info?'info':''; }
  function onCred(resp){
    say('Checking\\u2026', true);
    fetch('/api/auth/google', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ credential: resp.credential }) })
      .then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
      .then(function(o){ if(o.ok){ window.location.replace('/'); } else { say(o.j.error || 'Sign-in failed.'); } })
      .catch(function(){ say('Network problem. Try again.'); });
  }
  var tries = 0;
  (function init(){
    if(!CLIENT_ID){ say('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set on this deployment.'); return; }
    if(window.google && google.accounts && google.accounts.id){
      google.accounts.id.initialize({ client_id: CLIENT_ID, callback: onCred });
      google.accounts.id.renderButton(document.getElementById('gbtn'),
        { theme:'filled_blue', size:'large', width:320, shape:'pill', text:'signin_with' });
      return;
    }
    if(++tries > 30){ say('Could not load Google sign-in. Check your connection.'); return; }
    setTimeout(init, 250);
  })();
</script></body></html>`;
}
