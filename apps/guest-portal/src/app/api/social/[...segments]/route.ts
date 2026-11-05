import { NextResponse } from 'next/server';

import { opaqueIdSchema } from '@c1rcle/contracts';
import {
  guestSocialPrivacySchema,
  guestSocialPrivacyStateSchema,
  socialGuestProfileSchema,
  socialGuestlistSchema,
  socialListQuerySchema,
  socialHiddenEventSchema,
  socialBlockSchema,
  socialReportSchema,
  socialReportReceiptSchema,
  socialMutationReceiptSchema,
} from '@c1rcle/contracts/guest-social';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayUnreachable,
  passThroughGatewayError,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

interface Context {
  params: Promise<{ segments: string[] }>;
}
async function proxy(request: NextRequest, context: Context) {
  const origin = assertSameOrigin(request);
  if (origin) return origin;
  if (
    !request.cookies.get('better-auth.session_token')?.value &&
    !request.cookies.get('__Secure-better-auth.session_token')?.value
  )
    return errorEnvelope('unauthorized', 'Sign in to continue.', 401);
  if (request.method !== 'GET') {
    const csrf = assertCsrf(request);
    if (csrf) return csrf;
  }
  const { segments } = await context.params;
  const [group, id, action] = segments;
  const targetValid = id !== undefined && opaqueIdSchema.safeParse(id).success;
  const path = `/api/v2/social/${segments.map(encodeURIComponent).join('/')}`;
  try {
    let response: Response;
    if (request.method === 'GET') {
      if (segments.length === 1 && group === 'privacy') {
        response = await forwardToGateway(path, {
          method: 'GET',
          cookie: request.headers.get('cookie'),
        });
      } else if (segments.length === 2 && group === 'profiles' && targetValid) {
        response = await forwardToGateway(path, {
          method: 'GET',
          cookie: request.headers.get('cookie'),
        });
      } else if (
        segments.length === 3 &&
        group === 'events' &&
        action === 'guestlist' &&
        targetValid
      ) {
        const query = socialListQuerySchema.safeParse(
          Object.fromEntries(request.nextUrl.searchParams),
        );
        if (!query.success) return errorEnvelope('validation', 'Invalid guestlist page.', 422);
        const search = new URLSearchParams({
          limit: String(query.data.limit),
          ...(query.data.cursor ? { cursor: query.data.cursor } : {}),
        });
        response = await forwardToGateway(`${path}?${search}`, {
          method: 'GET',
          cookie: request.headers.get('cookie'),
        });
      } else return errorEnvelope('not_found', 'Social action unavailable.', 404);
      if (!response.ok) return passThroughGatewayError(response.status, await response.text());
      const schema =
        group === 'privacy'
          ? guestSocialPrivacyStateSchema
          : group === 'profiles'
            ? socialGuestProfileSchema
            : socialGuestlistSchema;
      const body = schema.safeParse(await response.json());
      return body.success ? NextResponse.json(body.data) : gatewayUnreachable();
    }
    const body: unknown = await request.json();
    let parsed: unknown;
    if (request.method === 'PUT' && segments.length === 1 && group === 'privacy')
      parsed = guestSocialPrivacySchema.parse(body);
    else if (
      request.method === 'PUT' &&
      segments.length === 3 &&
      group === 'events' &&
      action === 'visibility' &&
      targetValid
    )
      parsed = socialHiddenEventSchema.parse(body);
    else if (request.method === 'PUT' && segments.length === 2 && group === 'blocks' && targetValid)
      parsed = socialBlockSchema.parse(body);
    else if (
      request.method === 'POST' &&
      segments.length === 2 &&
      group === 'reports' &&
      targetValid
    )
      parsed = socialReportSchema.parse(body);
    else return errorEnvelope('not_found', 'Social action unavailable.', 404);
    const key = request.headers.get('idempotency-key');
    if (request.method === 'POST' && (!key || key.length > 128))
      return errorEnvelope('validation', 'A report request key is required.', 422);
    response = await forwardToGateway(path, {
      method: request.method === 'POST' ? 'POST' : 'PUT',
      body: parsed,
      cookie: request.headers.get('cookie'),
      ...(key ? { headers: { 'idempotency-key': key } } : {}),
    });
    if (!response.ok) return passThroughGatewayError(response.status, await response.text());
    const json: unknown = await response.json();
    const schema =
      group === 'privacy'
        ? guestSocialPrivacyStateSchema
        : group === 'reports'
          ? socialReportReceiptSchema
          : socialMutationReceiptSchema;
    const result = schema.safeParse(json);
    return result.success
      ? NextResponse.json(result.data, { status: group === 'reports' ? 201 : 200 })
      : gatewayUnreachable();
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.name === 'ZodError'))
      return errorEnvelope('validation', 'Check your social settings and try again.', 422);
    return gatewayUnreachable();
  }
}
async function handle(request: NextRequest, context: Context) {
  const response = await proxy(request, context);
  response.headers.set('cache-control', 'private, no-store');
  return response;
}
export const GET = handle;
export const PUT = handle;
export const POST = handle;
