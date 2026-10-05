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

import { assertSameOrigin, errorEnvelope } from './gateway-proxy';

function newRequestId(): string {
  return crypto.randomUUID();
}

import type { NextRequest } from 'next/server';

export { assertSameOrigin, errorEnvelope };

/**
 * Non-httpOnly double-submit token cookie. Readable by `@c1rcle/auth` so it
 * can echo the header. Namespaced by `NEXT_PUBLIC_APP_ID` (must match
 * `@c1rcle/auth`'s `csrfCookieName()`) so this doesn't collide with
 * the other apps' CSRF cookies on shared-host dev ports.
 * Resolved lazily (a function, not a module-level const) so
 * `getClientEnv()`'s validation runs at first call, not at import time —
 * important for tests that stub env vars in `beforeEach`.
 */
export function csrfCookieName(): string {
  return `${getClientEnv().NEXT_PUBLIC_APP_ID}.c1rcle.csrf`;
}
export const CSRF_HEADER = 'x-csrf-token';

function gatewayBaseUrl(): string {
  return getClientEnv().NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
}

/** Name the frontend uses for the Better-Auth session cookie (proxy + BFF). */
export const SESSION_COOKIE_NAME = 'better-auth.session_token';

/**
 * A production gateway (`useSecureCookies`) itself reads the `__Secure-`
 * prefixed session cookie; a development gateway reads the unprefixed name.
 * The frontend always stores the unprefixed name (see `rescopeSessionCookies`),
 * so when forwarding browser cookies to the gateway we emit both names with
 * the same value — the gateway picks whichever name it is configured for, and
 * the other is ignored.
 */
function withGatewaySessionCookieName(
  cookieHeader: string | null | undefined,
): string | null | undefined {
  if (cookieHeader === undefined || cookieHeader === null || cookieHeader.length === 0) {
    return cookieHeader;
  }
  if (cookieHeader.includes(`__Secure-${SESSION_COOKIE_NAME}=`)) {
    return cookieHeader;
  }
  const match = new RegExp(`(?:^|;)\\s*${escapeRegExp(SESSION_COOKIE_NAME)}=([^;]+)`).exec(
    cookieHeader,
  );
  if (match === null) {
    return cookieHeader;
  }
  const value = match[1];
  if (value === undefined) {
    return cookieHeader;
  }
  return `${cookieHeader}; __Secure-${SESSION_COOKIE_NAME}=${value}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isProduction(): boolean {
  return getClientEnv().NEXT_PUBLIC_ENVIRONMENT === 'production';
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
  const cookie = req.cookies.get(csrfCookieName())?.value ?? '';
  const header = req.headers.get(CSRF_HEADER) ?? '';
  if (!timingSafeEqual(cookie, header)) {
    return errorEnvelope('forbidden', 'CSRF check failed.', 403);
  }
  return null;
}

/**
 * A dynamic `[id]` segment is URL-decoded by Next before it reaches the
 * handler, so `..%2F..%2Fx` would otherwise be spliced into the gateway path.
 * Gateway ids are opaque `[A-Za-z0-9_-]` tokens; anything else is rejected.
 */
export function assertPathId(id: string): NextResponse | null {
  return /^[A-Za-z0-9_-]{1,128}$/.test(id)
    ? null
    : errorEnvelope('validation', 'Invalid identifier.', 400);
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
  res.cookies.set(csrfCookieName(), token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: isProduction(),
    path: '/',
  });
}

/**
 * Actively expires the frontend-scoped session cookie. Logout must not depend
 * on the gateway: if its revoke call fails (or its response carries no
 * `Set-Cookie`), the browser would otherwise keep a live session cookie.
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction(),
    path: '/',
    maxAge: 0,
  });
  if (isProduction()) {
    res.cookies.set(`__Secure-${SESSION_COOKIE_NAME}`, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 0,
    });
  }
}

export function clearCsrfCookie(res: NextResponse): void {
  res.cookies.set(csrfCookieName(), '', { path: '/', maxAge: 0 });
}

export interface ForwardInit {
  readonly method: 'GET' | 'POST';
  readonly body?: unknown;
  readonly cookie?: string | null;
  /** Extra headers to forward verbatim (e.g. `Idempotency-Key`). */
  readonly headers?: Readonly<Record<string, string>>;
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
  const cookieHeader = withGatewaySessionCookieName(init.cookie);
  if (cookieHeader !== undefined && cookieHeader !== null && cookieHeader.length > 0) {
    headers['cookie'] = cookieHeader;
  }
  for (const [key, value] of Object.entries(init.headers ?? {})) {
    headers[key] = value;
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
    /*
     * Normalize to the frontend's fixed, unprefixed cookie name. A production
     * gateway (useSecureCookies) emits `__Secure-better-auth.session_token` —
     * the browser only accepts names with that prefix over HTTPS AND with the
     * `Secure` attribute, so on an http://localhost dev origin the cookie is
     * silently rejected and the edge's presence check would redirect every
     * `/onboard` request to `/login`. Stripping the prefix makes it store on
     * any origin; `Secure` is still imposed in production where the frontend
     * origin is HTTPS. `forwardToGateway` re-adds the prefixed twin for the
     * gateway, which may expect it.
     */
    const name = parsed.name.replace(/^__Secure-/, '');
    names.push(name);
    res.cookies.set(name, parsed.value, {
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
 * Passes a gateway error through when it is already the flat envelope (the
 * gateway owns the messaging, including the login account-existence-oracle
 * suppression). Only the documented envelope fields are copied, so nothing
 * else an upstream might attach (stack, hostnames) can reach the browser.
 * A 429's `Retry-After` is relayed so the UI can back off. Anything that is
 * not a flat envelope collapses to a generic one.
 */
export function passThroughGatewayError(
  status: number,
  bodyText: string,
  retryAfter?: string | null,
): NextResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText) as unknown;
  } catch {
    parsed = undefined;
  }
  const effective = status >= 400 && status <= 599 ? status : 502;
  let res: NextResponse;
  if (isFlatEnvelope(parsed)) {
    const envelope: Record<string, unknown> = {
      code: parsed['code'],
      message: parsed['message'],
      status: effective,
      requestId: typeof parsed['requestId'] === 'string' ? parsed['requestId'] : newRequestId(),
    };
    if (typeof parsed['fieldErrors'] === 'object' && parsed['fieldErrors'] !== null) {
      envelope['fieldErrors'] = parsed['fieldErrors'];
    }
    res = NextResponse.json(envelope, { status: effective });
  } else {
    res = errorEnvelope('server', 'The authentication service is unavailable.', effective);
  }
  if (effective === 429 && retryAfter !== undefined && retryAfter !== null) {
    res.headers.set('Retry-After', retryAfter);
  }
  return res;
}

/** Generic 502 for a gateway that could not be reached (never echoes the cause). */
export function gatewayUnreachable(): NextResponse {
  return errorEnvelope('server', 'The authentication service is unavailable.', 502);
}

/** Parses a gateway success body; `undefined` when it is not valid JSON. */
export function parseJson(bodyText: string): unknown {
  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    return undefined;
  }
}
