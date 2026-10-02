/* eslint-disable no-restricted-globals, no-restricted-syntax --
 * This module is the sanctioned health BFF proxy, alongside `auth-proxy.ts`.
 * It calls the gateway with a raw `fetch` because it must relay the
 * readiness response body even when the gateway answers non-2xx (readiness
 * returns 503 with the per-dependency `checks` when anything is down), which
 * `@c1rcle/api-client` (which turns every non-2xx into a thrown
 * `ApiClientError` and drops the body) structurally cannot do.
 * Configuration still comes only from `@c1rcle/config`, never the raw
 * environment.
 */
import { NextResponse } from 'next/server';

import { getClientEnv, getServerEnv } from '@c1rcle/config';

const NO_STORE = { 'cache-control': 'no-store' } as const;

/**
 * Proxies one of the gateway's token-gated `/api/v2/internal/*` checks.
 *
 * Those endpoints are locked behind a shared-secret header at the nginx edge
 * (see `C1RCLE-BACKEND/deploy/nginx/templates/*.template` --
 * `$c1rcle_readiness_allowed`), so a browser can never call them directly.
 * This holds the secret server-side only (`GATEWAY_READINESS_TOKEN`) and
 * forwards the result same-origin.
 *
 * Whenever the gateway answered with a JSON body, it is relayed with 200 (the
 * gateway's own status goes in `x-gateway-status`): the body itself says
 * what is up or down, and the admin health page needs it either way. Only
 * "no answer at all" — no token configured, gateway unreachable, or a
 * non-JSON body — is a 503.
 */
export async function proxyGatewayHealth(check: 'readiness' | 'version'): Promise<NextResponse> {
  const token = getServerEnv().GATEWAY_READINESS_TOKEN;
  if (token === undefined) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503, headers: NO_STORE });
  }

  const base = getClientEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  let response: Response;
  try {
    response = await fetch(`${base}/api/v2/internal/${check}`, {
      headers: { 'x-readiness-token': token },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'gateway_unreachable' }, { status: 503, headers: NO_STORE });
  }

  const body: unknown = await response.json().catch(() => undefined);
  if (body === undefined) {
    return NextResponse.json({ error: 'gateway_bad_response' }, { status: 503, headers: NO_STORE });
  }

  return NextResponse.json(body, {
    status: 200,
    headers: { ...NO_STORE, 'x-gateway-status': String(response.status) },
  });
}
