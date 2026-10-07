/**
 * Post-login redirect targets come from an attacker-controllable query string
 * (`?next=` / `?callbackUrl=`). Only same-origin absolute paths are honoured;
 * `//host`, `/\host`, `https://host`, `javascript:` and control characters all
 * return `null` so the caller falls back to its role-based landing route.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value?.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return null;
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/login/')) return null;
  return value;
}
