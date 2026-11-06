/** Mirrors existing Guest private-route boundaries; public discovery stays browseable. */
export function isGuestProtectedPath(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0] ?? '';
  return ['/profile', '/tickets', '/help', '/checkout', '/confirmation'].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
