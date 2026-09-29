/* eslint-disable no-restricted-globals, no-restricted-syntax --
 * Module is a sanctioned BFF proxy (the guest Help intake). `@c1rcle/api-client`
 * only ever hands back parsed JSON and cannot forward raw cookies, so these
 * routes use `fetch` directly against the gateway. Config still comes only
 * from `@c1rcle/config`.
 *
 * Auth model: the guest's browser holds the Better Auth session cookie
 * (host-scoped, SameSite=Lax). These routes forward that exact cookie header
 * to the gateway, whose auth plugin resolves the actor from it — the same
 * path `requireGuestSession`/`getServerSession` already uses. SameSite=Lax
 * already stops cross-site POSTs from carrying the cookie; `assertSameOrigin`
 * is the second line for state-changing routes.
 */
import { NextResponse } from 'next/server';

import { getClientEnv } from '@c1rcle/config';

import type { NextRequest } from 'next/server';

function gatewayBaseUrl(): string {
  return getClientEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
}

function newRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Rejects a request whose `Origin` is present and not this app's origin, or
 * whose `Sec-Fetch-Site` is `cross-site`. Missing `Origin` (same-origin GET)
 * is allowed through.
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  if (origin !== null && origin !== req.nextUrl.origin) {
    return errorEnvelope('forbidden', 'Cross-origin request rejected.', 403);
  }
  if (req.headers.get('sec-fetch-site') === 'cross-site') {
    return errorEnvelope('forbidden', 'Cross-site request rejected.', 403);
  }
  return null;
}

/** Flat error envelope, matching the gateway's shape (`{ code, message, status, requestId }`). */
export function errorEnvelope(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ code, message, status, requestId: newRequestId() }, { status });
}

interface ForwardInit {
  readonly method: 'GET' | 'POST';
  readonly body?: unknown;
  readonly cookie?: string | null;
}

/**
 * Calls the gateway server-side. Never logs the body or cookie. Every POST
 * carries a freshly minted `Idempotency-Key` so a gateway-enforced retry
 * replays the command instead of double-executing.
 */
export async function forwardToGateway(path: string, init: ForwardInit): Promise<Response> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (init.body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (init.cookie !== undefined && init.cookie !== null && init.cookie.length > 0) {
    headers['cookie'] = init.cookie;
  }
  if (init.method === 'POST') {
    headers['idempotency-key'] = crypto.randomUUID();
  }

  return fetch(`${gatewayBaseUrl()}${path}`, {
    method: init.method,
    headers,
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    redirect: 'manual',
    cache: 'no-store',
  });
}

function isFlatEnvelope(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['code'] === 'string' &&
    typeof (value as Record<string, unknown>)['message'] === 'string'
  );
}

/**
 * Passes a gateway error through unchanged when it is already the flat
 * envelope; falls back to a generic envelope for a non-JSON error body.
 */
export function passThroughGatewayError(status: number, bodyText: string): NextResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText) as unknown;
  } catch {
    parsed = undefined;
  }
  if (isFlatEnvelope(parsed)) {
    return NextResponse.json(parsed, { status });
  }
  return errorEnvelope('server', 'The support service is unavailable.', status);
}

/** Parses a gateway success body. Callers only reach this on `response.ok`. */
export function parseJson(bodyText: string): unknown {
  return JSON.parse(bodyText) as unknown;
}
