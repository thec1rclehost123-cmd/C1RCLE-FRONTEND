import { NextResponse } from 'next/server';

import { safeNextPath } from '@/lib/auth/safe-next-path';
import {
  assertSameOrigin,
  forwardToGateway,
  gatewayUnreachable,
  rescopeSessionCookies,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const forbidden = assertSameOrigin(req);
  if (forbidden) return forbidden;
  try {
    const body = (await req.json()) as { next?: unknown };
    const upstream = await forwardToGateway('/api/v2/auth/google', {
      method: 'POST',
      body: { next: safeNextPath(typeof body.next === 'string' ? body.next : null) },
      headers: { origin: req.nextUrl.origin },
    });
    if (!upstream.ok) return gatewayUnreachable();
    const payload = (await upstream.json()) as { url?: unknown };
    if (
      typeof payload.url !== 'string' ||
      new URL(payload.url).origin !== 'https://accounts.google.com'
    )
      return gatewayUnreachable();
    const response = NextResponse.json({ url: payload.url });
    rescopeSessionCookies(upstream, response);
    response.headers.set('cache-control', 'no-store');
    return response;
  } catch {
    return gatewayUnreachable();
  }
}
