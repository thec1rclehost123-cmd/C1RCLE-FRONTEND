import { NextResponse } from 'next/server';

import {
  SESSION_COOKIE_NAME,
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/**
 * Shared shape of a state-changing BFF route that forwards one JSON body to a
 * gateway endpoint on behalf of the signed-in browser: same-origin check, a
 * session cookie must exist, double-submit CSRF, prototype-pollution-safe body,
 * then the gateway call with the browser's cookie. The gateway still decides
 * authorisation; the BFF only refuses requests that cannot possibly be valid.
 */
export interface ProxyWriteOptions {
  readonly gatewayPath: string;
  /** Status returned to the browser on success (the gateway's own, e.g. 201). */
  readonly successStatus: number;
  readonly unauthenticatedMessage: string;
  /** Send an `Idempotency-Key` (the client's if well-formed, else a fresh one). */
  readonly idempotent: boolean;
}

const CLIENT_KEY = /^[A-Za-z0-9_-]{8,128}$/;

/**
 * A key the browser supplies so that a double-click or a retry of the SAME
 * logical action replays instead of repeating (a second inventory hold, a
 * second payment order). Anything malformed is ignored and a fresh key minted.
 */
export function idempotencyKeyFor(req: NextRequest): string {
  const supplied = req.headers.get('idempotency-key');
  return supplied !== null && CLIENT_KEY.test(supplied) ? supplied : crypto.randomUUID();
}

export async function proxyGatewayWrite(
  req: NextRequest,
  options: ProxyWriteOptions,
): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) return originError;

  const hasSession =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ??
    req.cookies.get(`__Secure-${SESSION_COOKIE_NAME}`)?.value;
  if (!hasSession) return errorEnvelope('unauthorized', options.unauthenticatedMessage, 401);

  const csrfError = assertCsrf(req);
  if (csrfError !== null) return csrfError;

  let body: unknown;
  try {
    body = stripProtoKeys(await req.json());
  } catch {
    return errorEnvelope('validation', 'Request body must be valid JSON.', 400);
  }

  const gatewayResponse = await forwardToGateway(options.gatewayPath, {
    method: 'POST',
    body,
    cookie: req.headers.get('cookie'),
    ...(options.idempotent ? { headers: { 'Idempotency-Key': idempotencyKeyFor(req) } } : {}),
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) return passThroughGatewayError(gatewayResponse.status, bodyText);
  return NextResponse.json(parseJson(bodyText), { status: options.successStatus });
}
