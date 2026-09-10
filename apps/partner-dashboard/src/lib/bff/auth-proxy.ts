/* eslint-disable no-restricted-globals, no-restricted-syntax --
 * This module is the sanctioned auth BFF proxy. The frontend architecture
 * README allows `app/api` routes only as approved BFFs, and this is the one
 * module permitted to call the gateway with a raw `fetch`: it must read the
 * raw `Set-Cookie` header off the gateway response to re-scope the Better
 * Auth session cookie to the frontend origin, which `@c1rcle/api-client`
 * (which only ever hands back parsed, validated JSON) structurally cannot do.
 * Configuration still comes only from `@c1rcle/config`, never the raw
 * environment.
 */
import { NextResponse } from 'next/server';

import { getClientEnv } from '@c1rcle/config';

import type { NextRequest } from 'next/server';

/** Non-httpOnly double-submit token cookie. Readable by `@c1rcle/auth` so it can echo the header. */
export const CSRF_COOKIE = 'c1rcle.csrf';
export const CSRF_HEADER = 'x-csrf-token';

function gatewayBaseUrl(): string {
  return getClientEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
}

function isProduction(): boolean {
  return getClientEnv().NEXT_PUBLIC_ENVIRONMENT === 'production';
}

function newRequestId(): string {
  return crypto.randomUUID();
}

/** Flat error envelope, matching the gateway's shape (`{ code, message, status, requestId }`). */
export function errorEnvelope(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ code, message, status, requestId: newRequestId() }, { status });
}

/**
 * Rejects a request whose `Origin` is present and not this app's origin, or
 * whose `Sec-Fetch-Site` is `cross-site`. A missing `Origin` (same-origin GET,
 * server-to-server) is allowed through — the CSRF token check is the second
 * line for state-changing routes.
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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Double-submit: the `c1rcle.csrf` cookie must equal the `x-csrf-token` header. */
export function assertCsrf(req: NextRequest): NextResponse | null {
  const cookie = req.cookies.get(CSRF_COOKIE)?.value ?? '';
  const header = req.headers.get(CSRF_HEADER) ?? '';
  if (!timingSafeEqual(cookie, header)) {
    return errorEnvelope('forbidden', 'CSRF check failed.', 403);
  }
  return null;
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Returns a structural copy of a parsed JSON value with any `__proto__` /
 * `constructor` / `prototype` own-keys removed at every depth. Non-mutating:
 * builds fresh objects so a polluting key is never re-assigned.
 */
export function stripProtoKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry: unknown) => stripProtoKeys(entry)) as T;
  }
  if (value !== null && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (!DANGEROUS_KEYS.has(key)) {
        clean[key] = stripProtoKeys(entry);
      }
    }
    return clean as T;
  }
  return value;
}

/** 32 random bytes, base64url, no padding. */
export function mintCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function setCsrfCookie(res: NextResponse, token: string): void {
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: isProduction(),
    path: '/',
  });
}

export function clearCsrfCookie(res: NextResponse): void {
  res.cookies.set(CSRF_COOKIE, '', { path: '/', maxAge: 0 });
}

interface ForwardInit {
  readonly method: 'GET' | 'POST';
  readonly body?: unknown;
  readonly cookie?: string | null;
}

/**
 * Calls the gateway server-side. Never logs the body, token, or cookie.
 * `redirect: 'manual'` + no ambient credentials — the only auth material is
 * whatever is explicitly passed in `init.cookie`.
 */
export async function forwardToGateway(path: string, init: ForwardInit): Promise<Response> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (init.body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (init.cookie !== undefined && init.cookie !== null && init.cookie.length > 0) {
    headers['cookie'] = init.cookie;
  }

  return fetch(`${gatewayBaseUrl()}${path}`, {
    method: init.method,
    headers,
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    redirect: 'manual',
    cache: 'no-store',
  });
}

interface ParsedSetCookie {
  readonly name: string;
  readonly value: string;
  readonly path: string | undefined;
  readonly maxAge: number | undefined;
  readonly expires: Date | undefined;
}

function parseSetCookie(raw: string): ParsedSetCookie | null {
  const segments = raw.split(';');
  const pair = segments[0]?.trim() ?? '';
  const eq = pair.indexOf('=');
  if (eq < 1) {
    return null;
  }

  let path: string | undefined;
  let maxAge: number | undefined;
  let expires: Date | undefined;

  for (const segment of segments.slice(1)) {
    const [rawKey, rawValue] = segment.split('=');
    const key = rawKey?.trim().toLowerCase();
    const attrValue = rawValue?.trim();
    if (key === 'path') {
      path = attrValue;
    } else if (key === 'max-age' && attrValue !== undefined) {
      const parsed = Number(attrValue);
      if (Number.isFinite(parsed)) {
        maxAge = parsed;
      }
    } else if (key === 'expires' && attrValue !== undefined) {
      const parsed = new Date(attrValue);
      if (!Number.isNaN(parsed.getTime())) {
        expires = parsed;
      }
    }
  }

  const rawValue = pair.slice(eq + 1).trim();
  // The gateway's `Set-Cookie` value is already percent-encoded (Better Auth's
  // session token contains raw `/`/`=` from base64). `res.cookies.set()` below
  // percent-encodes whatever value it's given, so passing this through as-is
  // double-encodes it — the browser then stores and replays a token that never
  // matches the original, and every `/refresh` 401s. Decode once here so the
  // round trip nets out to exactly one layer of encoding.
  let value: string;
  try {
    value = decodeURIComponent(rawValue);
  } catch {
    value = rawValue;
  }

  return { name: pair.slice(0, eq).trim(), value, path, maxAge, expires };
}

/**
 * Re-emits every `Set-Cookie` the gateway returned, scoped to the frontend
 * origin: `Domain` dropped (host-only), `HttpOnly` + `SameSite=Lax` +
 * `Secure` (prod) re-imposed regardless of what the gateway sent. Returns the
 * cookie names, so logout can also actively expire them.
 */
export function rescopeSessionCookies(gatewayResponse: Response, res: NextResponse): string[] {
  const names: string[] = [];
  for (const raw of gatewayResponse.headers.getSetCookie()) {
    const parsed = parseSetCookie(raw);
    if (parsed === null) {
      continue;
    }
    names.push(parsed.name);
    res.cookies.set(parsed.name, parsed.value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction(),
      path: parsed.path ?? '/',
      ...(parsed.maxAge !== undefined ? { maxAge: parsed.maxAge } : {}),
      ...(parsed.expires !== undefined ? { expires: parsed.expires } : {}),
    });
  }
  return names;
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
 * Passes a gateway error response through unchanged when it is already the
 * flat envelope (the gateway owns the messaging — including the login
 * account-existence-oracle suppression). Falls back to a generic envelope for
 * a non-JSON / malformed error body.
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
  return errorEnvelope('server', 'The authentication service is unavailable.', status);
}

/** Parses a gateway success body. Callers only reach this on `response.ok`. */
export function parseJson(bodyText: string): unknown {
  return JSON.parse(bodyText) as unknown;
}
