/**
 * Validates a post-login return target. Only same-origin absolute paths are
 * allowed: no scheme, no protocol-relative `//host`, no backslash tricks, no
 * control characters. Anything else falls back to `fallback`.
 */
export function safeNextPath(raw: string | null | undefined, fallback = '/profile'): string {
  if (raw === null || raw === undefined || raw.length === 0 || raw.length > 512) {
    return fallback;
  }
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return fallback;
  }
  // eslint-disable-next-line no-control-regex -- rejecting control characters is the point
  if (/[\u0000-\u001f\u007f]/.test(raw)) {
    return fallback;
  }
  try {
    const parsed = new URL(raw, 'http://placeholder.invalid');
    if (parsed.origin !== 'http://placeholder.invalid') {
      return fallback;
    }
  } catch {
    return fallback;
  }
  if (raw === '/login' || raw.startsWith('/login?') || raw.startsWith('/login/')) {
    return fallback;
  }
  return raw;
}
