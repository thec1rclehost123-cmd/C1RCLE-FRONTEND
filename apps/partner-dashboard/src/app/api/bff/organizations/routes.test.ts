import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

import { GET as accessGet } from './[id]/access/route';
import { GET as organizationsGet } from './route';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest's documented mock-factory pattern
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const APP_ORIGIN = 'http://localhost:3001';
const mockForward = vi.mocked(forwardToGateway);

beforeEach(() => {
  mockForward.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/bff/organizations', () => {
  it('forwards the session cookie to the gateway and returns the paginated orgs', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: 'org-1', role: 'owner' }], total: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await organizationsGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations`, {
        headers: {
          origin: APP_ORIGIN,
          cookie: 'better-auth.session_token=sess_abc',
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith('/api/v2/organizations', {
      method: 'GET',
      cookie: 'better-auth.session_token=sess_abc',
    });
    await expect(res.json()).resolves.toMatchObject({ items: [{ id: 'org-1' }] });
  });

  it('relays an in-memory bearer so the gateway can resolve the session', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await organizationsGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations`, {
        headers: {
          origin: APP_ORIGIN,
          cookie: 'better-auth.session_token=sess_abc',
          authorization: 'Bearer fe_session_tok_123',
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith('/api/v2/organizations', {
      method: 'GET',
      cookie: 'better-auth.session_token=sess_abc',
      headers: { Authorization: 'Bearer fe_session_tok_123' },
    });
  });

  it('rejects a cross-origin request', async () => {
    const res = await organizationsGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations`, {
        headers: { origin: 'http://evil.example' },
      }),
    );

    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('passes a gateway error through', async () => {
    mockForward.mockResolvedValue(
      new Response(
        JSON.stringify({ code: 'unauthorized', message: 'No session', status: 401 }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      ),
    );

    const res = await organizationsGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations`, {
        headers: { origin: APP_ORIGIN },
      }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'unauthorized' });
  });
});

describe('GET /api/bff/organizations/[id]/access', () => {
  it('forwards the intercepted id as the path and as the x-organization-id header', async () => {
    mockForward.mockResolvedValue(
      new Response(
        JSON.stringify({ organizationId: 'org-1', partnerType: 'venue', role: 'owner' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const res = await accessGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/access`, {
        headers: {
          origin: APP_ORIGIN,
          cookie: 'better-auth.session_token=sess_abc',
        },
      }),
      { params: Promise.resolve({ id: 'org-1' }) },
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith('/api/v2/organizations/org-1/access', {
      method: 'GET',
      cookie: 'better-auth.session_token=sess_abc',
      headers: { 'x-organization-id': 'org-1' },
    });
    await expect(res.json()).resolves.toMatchObject({ partnerType: 'venue' });
  });

  it('relays the bearer alongside the x-organization-id header', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ organizationId: 'org-2', partnerType: 'host' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await accessGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-2/access`, {
        headers: {
          origin: APP_ORIGIN,
          cookie: 'better-auth.session_token=sess_abc',
          authorization: 'Bearer fe_session_tok_123',
        },
      }),
      { params: Promise.resolve({ id: 'org-2' }) },
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith('/api/v2/organizations/org-2/access', {
      method: 'GET',
      cookie: 'better-auth.session_token=sess_abc',
      headers: {
        Authorization: 'Bearer fe_session_tok_123',
        'x-organization-id': 'org-2',
      },
    });
  });

  it('rejects a cross-origin request', async () => {
    const res = await accessGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/access`, {
        headers: { origin: 'http://evil.example' },
      }),
      { params: Promise.resolve({ id: 'org-1' }) },
    );

    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('passes a suspended-org 403 through', async () => {
    mockForward.mockResolvedValue(
      new Response(
        JSON.stringify({ code: 'forbidden', message: 'Organization suspended', status: 403 }),
        { status: 403, headers: { 'content-type': 'application/json' } },
      ),
    );

    const res = await accessGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/access`, {
        headers: { origin: APP_ORIGIN },
      }),
      { params: Promise.resolve({ id: 'org-1' }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ code: 'forbidden' });
  });
});