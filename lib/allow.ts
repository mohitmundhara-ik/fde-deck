/** Who may open the deck. Read from env so the list changes without a redeploy. */
export function allowedDomains(): string[] {
  return (process.env.ALLOWED_DOMAINS || 'interviewkickstart.com')
    .split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
}
export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}
export function isAllowed(rawEmail: string | undefined | null): boolean {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  if (allowedEmails().includes(email)) return true;
  const domain = email.slice(email.lastIndexOf('@') + 1);
  return allowedDomains().includes(domain);
}
