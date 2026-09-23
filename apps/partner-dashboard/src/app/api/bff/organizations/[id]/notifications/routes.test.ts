import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as actionsPost } from './[notificationId]/actions/route';
import { PATCH as readPatch } from './[notificationId]/read/route';
import { PATCH as readAllPatch } from './read-all/route';
import { GET as notificationsGet } from './route';

import { forwardToGateway } from '@/lib/bff/auth-proxy';

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

function sessionHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { origin: APP_ORIGIN, cookie: 'better-auth.session_token=sess_abc', ...extra };
}

describe('GET /api/bff/organizations/[id]/notifications', () => {
  it('forwards the org id as path + x-organization-id and returns the inbox', async () => {
    mockForward.mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ id: 'n-1', title: 'New request' }],
          pageInfo: {},
          unreadCount: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const res = await notificationsGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/notifications?limit=20`, {
        headers: sessionHeaders(),
      }),
      { params: Promise.resolve({ id: 'org-1' }) },
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith('/api/v2/organizations/org-1/notifications?limit=20', {
      method: 'GET',
      cookie: 'better-auth.session_token=sess_abc',
      headers: { 'x-organization-id': 'org-1' },
    });
    await expect(res.json()).resolves.toMatchObject({ unreadCount: 1 });
  });

  it('passes a gateway error through', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ code: 'not_found', message: 'Org not found', status: 404 }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await notificationsGet(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-9/notifications`, {
        headers: sessionHeaders(),
      }),
      { params: Promise.resolve({ id: 'org-9' }) },
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ code: 'not_found' });
  });
});

describe('PATCH /api/bff/organizations/[id]/notifications/read-all', () => {
  it('rejects a request without a matching CSRF token', async () => {
    const res = await readAllPatch(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/notifications/read-all`, {
        headers: sessionHeaders(),
      }),
      { params: Promise.resolve({ id: 'org-1' }) },
    );

    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('mints an idempotency key and marks every unread row server-side', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ selected: 2 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await readAllPatch(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/notifications/read-all`, {
        headers: sessionHeaders({
          'x-csrf-token': 'tok-abc',
          cookie: 'better-auth.session_token=sess_abc; c1rcle.csrf=tok-abc',
        }),
      }),
      { params: Promise.resolve({ id: 'org-1' }) },
    );

    expect(res.status).toBe(200);
    const call = mockForward.mock.calls[0];
    expect(call?.[0]).toBe('/api/v2/organizations/org-1/notifications/read-all');
    expect(call?.[1]).toMatchObject({
      method: 'PATCH',
      cookie: 'better-auth.session_token=sess_abc; c1rcle.csrf=tok-abc',
      headers: { 'x-organization-id': 'org-1' },
    });
    expect(call?.[1]?.headers).toHaveProperty('Idempotency-Key', expect.any(String));
    await expect(res.json()).resolves.toMatchObject({ selected: 2 });
  });
});

describe('PATCH /api/bff/organizations/[id]/notifications/[notificationId]/read', () => {
  it('forwards the read patch with the org header and no idempotency key', async () => {
    mockForward.mockResolvedValue(
      new Response(JSON.stringify({ id: 'n-1', read: true, readAt: '2026-09-22T00:00:00.000Z' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await readPatch(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/notifications/n-1/read`, {
        headers: sessionHeaders({
          'x-csrf-token': 'tok-abc',
          cookie: 'better-auth.session_token=sess_abc; c1rcle.csrf=tok-abc',
        }),
      }),
      { params: Promise.resolve({ id: 'org-1', notificationId: 'n-1' }) },
    );

    expect(res.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith('/api/v2/organizations/org-1/notifications/n-1/read', {
      method: 'PATCH',
      cookie: 'better-auth.session_token=sess_abc; c1rcle.csrf=tok-abc',
      headers: { 'x-organization-id': 'org-1' },
    });
  });
});

describe('POST /api/bff/organizations/[id]/notifications/[notificationId]/actions', () => {
  it('rejects a state-changing action without a CSRF token', async () => {
    const res = await actionsPost(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/notifications/n-1/actions`, {
        method: 'POST',
        headers: sessionHeaders(),
        body: JSON.stringify({ decision: 'approve' }),
      }),
      { params: Promise.resolve({ id: 'org-1', notificationId: 'n-1' }) },
    );

    expect(res.status).toBe(403);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('forwards the decision body and a minted idempotency key', async () => {
    mockForward.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'n-1',
          read: true,
          action: { resourceType: 'partnership', resourceId: 'p-1' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const res = await actionsPost(
      new NextRequest(`${APP_ORIGIN}/api/bff/organizations/org-1/notifications/n-1/actions`, {
        method: 'POST',
        headers: sessionHeaders({
          'x-csrf-token': 'tok-abc',
          cookie: 'better-auth.session_token=sess_abc; c1rcle.csrf=tok-abc',
        }),
        body: JSON.stringify({ decision: 'approve' }),
      }),
      { params: Promise.resolve({ id: 'org-1', notificationId: 'n-1' }) },
    );

    expect(res.status).toBe(200);
    const call = mockForward.mock.calls[0];
    expect(call?.[0]).toBe('/api/v2/organizations/org-1/notifications/n-1/actions');
    expect(call?.[1]).toMatchObject({
      method: 'POST',
      body: { decision: 'approve' },
      cookie: 'better-auth.session_token=sess_abc; c1rcle.csrf=tok-abc',
      headers: { 'x-organization-id': 'org-1' },
    });
    expect(call?.[1]?.headers).not.toHaveProperty('If-Match');
    await expect(res.json()).resolves.toMatchObject({ read: true });
  });
});
