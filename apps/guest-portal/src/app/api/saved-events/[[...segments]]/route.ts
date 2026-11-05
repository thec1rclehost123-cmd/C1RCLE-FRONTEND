import { NextResponse } from 'next/server';

import { opaqueIdSchema } from '@c1rcle/contracts';
import {
  savedEventStateSchema,
  savedEventPageSchema,
  savedEventListQuerySchema,
} from '@c1rcle/contracts/saved-events';

import {
  assertSameOrigin,
  assertCsrf,
  errorEnvelope,
  forwardToGateway,
  gatewayUnreachable,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface Context {
  params: Promise<{ segments?: string[] }>;
}
async function handle(req: NextRequest, context: Context) {
  const response = await proxy(req, context);
  response.headers.set('cache-control', 'private, no-store');
  return response;
}
async function proxy(req: NextRequest, context: Context) {
  const origin = assertSameOrigin(req);
  if (origin) return origin;
  if (
    !req.cookies.get('better-auth.session_token')?.value &&
    !req.cookies.get('__Secure-better-auth.session_token')?.value
  )
    return errorEnvelope('unauthorized', 'Sign in to continue.', 401);
  if (req.method !== 'GET') {
    const csrf = assertCsrf(req);
    if (csrf) return csrf;
  }
  const { segments = [] } = await context.params;
  if (
    segments.length > 1 ||
    (segments.length === 1 && !opaqueIdSchema.safeParse(segments[0]).success) ||
    (req.method === 'PUT' && segments.length !== 1)
  )
    return errorEnvelope('not_found', 'Saved events unavailable.', 404);
  const query = savedEventListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!query.success) return errorEnvelope('validation', 'Invalid saved events page.', 422);
  let body: unknown;
  if (req.method === 'PUT') {
    try {
      const result = savedEventStateSchema.safeParse(await req.json());
      if (!result.success) return errorEnvelope('validation', 'Check your save request.', 422);
      body = result.data;
    } catch {
      return errorEnvelope('validation', 'Check your save request.', 422);
    }
  }
  const path = `/api/v2/saved-events${segments.length ? `/${encodeURIComponent(segments[0] ?? '')}` : ''}${!segments.length && query.data.cursor ? `?cursor=${encodeURIComponent(query.data.cursor)}` : ''}`;
  try {
    const upstream = await forwardToGateway(path, {
      method: req.method === 'PUT' ? 'PUT' : 'GET',
      cookie: req.headers.get('cookie'),
      ...(body === undefined ? {} : { body }),
    });
    if (!upstream.ok) return passThroughGatewayError(upstream.status, await upstream.text());
    const result = (segments.length ? savedEventStateSchema : savedEventPageSchema).safeParse(
      await upstream.json(),
    );
    return result.success ? NextResponse.json(result.data) : gatewayUnreachable();
  } catch {
    return gatewayUnreachable();
  }
}
export const GET = handle;
export const PUT = handle;
