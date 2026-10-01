/* eslint-disable no-restricted-globals, no-restricted-syntax --
 * This module is the sanctioned health-check BFF proxy. The frontend
 * architecture README allows `app/api` routes only as approved BFFs, and this
 * is the one module permitted to call the gateway with a raw `fetch`: the
 * gateway's `/api/v2/internal/{readiness,version}` routes are deliberately
 * locked behind a shared-secret header at the nginx edge (see
 * `C1RCLE-BACKEND/deploy/nginx/templates/*.template` —
 * `$c1rcle_readiness_allowed`), so a browser can never legitimately hold that
 * secret. This module holds it server-side only and forwards the response,
 * same-origin, to the admin-console health page. Configuration still comes
 * only from `@c1rcle/config`, never the raw environment.
 */
import { getClientEnv, getServerEnv } from '@c1rcle/config';

export interface ReadinessBody {
  ok: boolean;
  checks: Record<string, 'up' | 'down'>;
}

export interface VersionBody {
  version: string;
  buildSha: string;
  commit: string;
  startedAt: string;
}

const UNREACHABLE_READINESS: ReadinessBody = { ok: false, checks: {} };
const UNREACHABLE_VERSION: VersionBody = {
  version: 'unknown',
  buildSha: 'unknown',
  commit: 'unknown',
  startedAt: '',
};

async function proxyInternal<T>(path: string, fallback: T): Promise<{ status: number; body: T }> {
  const token = getServerEnv().GATEWAY_READINESS_TOKEN;
  if (token === undefined || token.length === 0) {
    return { status: 503, body: fallback };
  }

  const base = getClientEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  const response = await fetch(`${base}${path}`, {
    headers: { 'x-readiness-token': token },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => fallback)) as T;
  return { status: response.status, body };
}

export function fetchReadiness(): Promise<{ status: number; body: ReadinessBody }> {
  return proxyInternal('/api/v2/internal/readiness', UNREACHABLE_READINESS);
}

export function fetchVersion(): Promise<{ status: number; body: VersionBody }> {
  return proxyInternal('/api/v2/internal/version', UNREACHABLE_VERSION);
}
