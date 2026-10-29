import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

const { forwardToGateway, assertSameOrigin } = vi.hoisted(() => ({
  forwardToGateway: vi.fn(),
  assertSameOrigin: vi.fn(),
}));

vi.mock('@/lib/bff/auth-proxy', () => ({
  assertSameOrigin,
  errorEnvelope: vi.fn((_code: string, message: string, status: number) =>
    NextResponse.json({ message }, { status }),
  ),
  forwardToGateway,
  parseJson: (text: string): unknown => JSON.parse(text) as unknown,
  passThroughGatewayError: vi.fn((status: number, body: string) =>
    NextResponse.json({ body }, { status }),
  ),
}));

beforeEach(() => {
  assertSameOrigin.mockReset().mockReturnValue(null);
  forwardToGateway.mockReset().mockResolvedValue(
    new Response(JSON.stringify({ items: [], pageInfo: { limit: 25 }, nextCursor: null }), {
      status: 200,
    }),
  );
});

describe('GET /api/notifications/me BFF', () => {
  it('forwards a bounded private inbox read with the session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications/me?limit=100', {
      headers: { cookie: 'session=opaque' },
    });
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(forwardToGateway).toHaveBeenCalledWith(
      '/api/v2/notifications/me?limit=100&unreadOnly=false',
      expect.objectContaining({ cookie: 'session=opaque' }),
    );
  });

  it('rejects cross-origin reads before forwarding', async () => {
    assertSameOrigin.mockReturnValueOnce(NextResponse.json({ error: 'origin' }, { status: 403 }));
    const response = await GET(new NextRequest('http://localhost:3000/api/notifications/me'));

    expect(response.status).toBe(403);
    expect(forwardToGateway).not.toHaveBeenCalled();
  });
});
