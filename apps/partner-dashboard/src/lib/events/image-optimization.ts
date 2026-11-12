export function shouldBypassEventImageOptimizer(src: string): boolean {
  if (/^blob:/i.test(src)) return true;
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(src)) return true;

  try {
    const url = new URL(src);
    const path = url.pathname.split('/').filter(Boolean);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'storage.googleapis.com' &&
      path.length >= 4 &&
      path[1] === 'posters'
    );
  } catch {
    return false;
  }
}
