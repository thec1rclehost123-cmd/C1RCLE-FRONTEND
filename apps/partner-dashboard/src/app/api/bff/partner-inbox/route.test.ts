import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { csrfCookieName, forwardToGateway } from '@/lib/bff/auth-proxy';

import { GET, PATCH } from './route';

vi.mock('@/lib/bff/auth-proxy', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vitest mock factory
  const actual = await importOriginal<typeof import('@/lib/bff/auth-proxy')>();
  return { ...actual, forwardToGateway: vi.fn() };
});

const APP_ORIGIN = 'http://localhost:3001';
const mockForward = vi.mocked(forwardToGateway);

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function request(
  path: string,
  method: 'GET' | 'PATCH',
  headers: Record<string, string>,
  body?: unknown,
) {
  return new NextRequest(`${APP_ORIGIN}${path}`, {
    method,
    headers: {
      origin: APP_ORIGIN,
      cookie: `better-auth.session_token=sess_abc; ${csrfCookieName()}=csrf-token`,
      'x-csrf-token': 'csrf-token',
      ...headers,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const dto = {
  id: 'notification_1',
  recipientId: 'promoter_org_1',
  recipientType: 'promoter',
  type: 'promoter_assignment.invited',
  title: 'New campaign invitation',
  body: 'A Host invited your organization to promote an event.',
  read: false,
  readAt: null,
  data: { assignmentId: 'assignment_1' },
  action: null,
  priority: 'normal',
  createdAt: '2026-10-28T12:00:00.000Z',
};

beforeEach(() => mockForward.mockReset());
afterEach(() => vi.restoreAllMocks());

describe('/api/bff/partner-inbox', () => {
  it('loads a bounded organization inbox and validates the backend response', async () => {
    mockForward.mockResolvedValue(
      response({
        items: [dto],
        pageInfo: { page: 1, pageSize: 10, total: 12, hasNextPage: true },
        nextCursor: 'cursor_2',
        unreadCount: 1,
      }),
    );

    const result = await GET(
      request('/api/bff/partner-inbox?organizationId=promoter_org_1&limit=10', 'GET', {}),
    );

    expect(result.status).toBe(200);
    expect(mockForward.mock.calls[0]?.[0]).toBe(
      '/api/v2/organizations/promoter_org_1/notifications?limit=10',
    );
    expect(mockForward.mock.calls[0]?.[1].cookie).toContain('better-auth.session_token=sess_abc');
    expect(mockForward.mock.calls[0]?.[1]).toMatchObject({
      method: 'GET',
      headers: { 'x-organization-id': 'promoter_org_1' },
    });
    await expect(result.json()).resolves.toMatchObject({ nextCursor: 'cursor_2', unreadCount: 1 });
  });

  it('rejects cross-origin reads and invalid organization identifiers', async () => {
    const crossOrigin = await GET(
      new NextRequest(`${APP_ORIGIN}/api/bff/partner-inbox?organizationId=org_1`, {
        headers: { origin: 'https://example.invalid' },
      }),
    );
    const invalid = await GET(
      request('/api/bff/partner-inbox?organizationId=../other&limit=10', 'GET', {}),
    );

    expect(crossOrigin.status).toBe(403);
    expect(invalid.status).toBe(400);
    expect(mockForward).not.toHaveBeenCalled();
  });

  it('forwards one-read mutations only after CSRF validation', async () => {
    mockForward.mockResolvedValue(
      response({ ...dto, read: true, readAt: '2026-10-28T12:05:00.000Z' }),
    );
    const result = await PATCH(
      request(
        '/api/bff/partner-inbox',
        'PATCH',
        {},
        {
          organizationId: 'promoter_org_1',
          notificationId: 'notification_1',
        },
      ),
    );

    expect(result.status).toBe(200);
    expect(mockForward).toHaveBeenCalledWith(
      '/api/v2/organizations/promoter_org_1/notifications/notification_1/read',
      expect.objectContaining({
        method: 'PATCH',
        body: {},
        headers: { 'x-organization-id': 'promoter_org_1' },
      }),
    );

    const denied = await PATCH(
      new NextRequest(`${APP_ORIGIN}/api/bff/partner-inbox`, {
        method: 'PATCH',
        headers: { origin: APP_ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'promoter_org_1',
          notificationId: 'notification_1',
        }),
      }),
    );
    expect(denied.status).toBe(403);
    expect(mockForward).toHaveBeenCalledTimes(1);
  });

  it('routes mark-all to the organization endpoint and passes backend authorization failures through', async () => {
    mockForward.mockResolvedValueOnce(response({ selected: 4 }));
    const result = await PATCH(
      request(
        '/api/bff/partner-inbox',
        'PATCH',
        {},
        {
          organizationId: 'promoter_org_1',
          readAll: true,
        },
      ),
    );
    expect(result.status).toBe(200);
    expect(mockForward).toHaveBeenLastCalledWith(
      '/api/v2/organizations/promoter_org_1/notifications/read-all',
      expect.objectContaining({ method: 'PATCH' }),
    );

    mockForward.mockResolvedValueOnce(
      response({ code: 'forbidden', message: 'Denied', status: 403 }, 403),
    );
    const denied = await GET(
      request('/api/bff/partner-inbox?organizationId=promoter_org_1', 'GET', {}),
    );
    expect(denied.status).toBe(403);
    await expect(denied.json()).resolves.toMatchObject({ code: 'forbidden' });
  });
});
