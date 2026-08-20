# FDE Webinar Deck - access controlled

The deck, behind real server-side Google sign-in. Anyone at `interviewkickstart.com`
gets in automatically, plus any individual addresses you list. Everyone else is
refused **before the HTML is sent**, so the slide content never reaches them.

Every successful sign-in is logged.

---

## Why this exists

The previous version checked the email in the browser. That could be bypassed by
opening devtools, and the slide content was in the page source either way.

Here the check happens on the server:

- Google's ID token is verified against **Google's own public keys** - a forged
  token is rejected
- The deck HTML lives in `private/`, outside `public/`, so there is no URL that
  serves it directly. The only route to it checks the session first
- The session is a signed, httpOnly cookie. Editing it invalidates it
- The allowlist is re-checked on **every request**, so removing someone takes
  effect immediately rather than when their session happens to expire

---

## One-time setup

### 1. Google OAuth client

Google Cloud Console -> **Google Auth Platform**

- **Audience**: set user type to **External** and click **Publish app**.
  (Publishing is safe here - the server enforces the allowlist, so an
  unlisted Google account gets refused even though it can authenticate.)
- **Clients** -> **Create client** -> Application type **Web application**
- **Authorised JavaScript origins**: your deployed URL, no trailing slash,
  e.g. `https://fde-deck.vercel.app`. Add `http://localhost:3000` for local work.
- **Authorised redirect URIs**: leave empty
- Copy the **Client ID**

### 2. Environment variables

In Vercel: Project -> Settings -> Environment Variables. Add all of these to
Production, Preview and Development.

| Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | your client id |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the same client id |
| `SESSION_SECRET` | 32+ random chars. `openssl rand -base64 32` |
| `ALLOWED_DOMAINS` | `interviewkickstart.com` |
| `ALLOWED_EMAILS` | `sdizzthebest@gmail.com` |
| `NEXT_PUBLIC_SITE_URL` | your deployed URL |
| `SUPABASE_URL` | optional, for the sign-in log |
| `SUPABASE_ANON_KEY` | optional, for the sign-in log |

`ALLOWED_DOMAINS` and `ALLOWED_EMAILS` are comma-separated. Changing them takes a
redeploy but no code edit.

### 3. Deploy

```bash
git init && git add -A && git commit -m "FDE deck, access controlled"
# push to GitHub, then import the repo in Vercel
```

Vercel detects Next.js automatically. No build settings to change.

---

## Local development

```bash
cp .env.example .env.local     # fill in the values
npm install
npm run dev                    # http://localhost:3000
```

Add `http://localhost:3000` to your Google authorised origins or sign-in will
fail locally.

---

## Updating the deck

Replace `private/FDE-Webinar-Deck.html` and redeploy. Nothing else changes.

---

## Verified behaviour

| Request | Result |
|---|---|
| `/deck` with no session | 307 -> `/login` |
| `/deck` with a session for an IK address | 200, deck served |
| `/deck` with a session for a listed outside address | 200, deck served |
| `/deck` with a session for any other address | 307 -> `/login` |
| `/deck` with a cookie signed with the wrong secret | 307 -> `/login` |
| Forged Google token posted to the API | 401, rejected |

---

## The sign-in log

Written to the Supabase `deck_notes` table under keys prefixed `access:`, with
email, name, timestamp, IP and user agent.

```sql
select key, content from deck_notes
where key like 'access:%'
order by key desc;
```

If you would rather keep it out of the notes table, create a dedicated table and
change the endpoint in `app/api/auth/google/route.ts`.

---

## Routes

| Path | What it does |
|---|---|
| `/` | redirects to `/deck` |
| `/login` | Google sign-in button |
| `/deck` | the deck, session required |
| `/api/auth/google` | verifies the Google token, sets the session |
| `/api/auth/logout` | clears the session |

---

## Housekeeping

The Supabase anon key still allows anonymous writes to `deck_notes`. It is now
only reachable from the server for logging, but the key sits in the deck HTML for
the speaker-notes sync. Worth adding a row-level security policy when there is time.
