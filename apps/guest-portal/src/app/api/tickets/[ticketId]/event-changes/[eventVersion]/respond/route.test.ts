import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const { mockProxy } = vi.hoisted(() => ({
  mockProxy: vi.fn<(...args: readonly unknown[]) => Promise<unknown>>(),
}));

vi.mock('@/lib/bff/proxy-write', () => ({
  proxyGatewayWrite: (...args: unknown[]) => mockProxy(...args),
}));

vi.mock('@/lib/bff/auth-proxy', () => ({
  errorEnvelope: (_code: string, message: string, status: number) =>
    Response.json({ message }, { status }),
}));

const ORIGIN = 'http://localhost:3000';

beforeEach(() => {
  mockProxy.mockReset();
  mockProxy.mockResolvedValue(NextResponse.json({ response: 'accepted' }, { status: 200 }));
});

describe('POST /api/tickets/:ticketId/event-changes/:eventVersion/respond BFF', () => {
  it('forwards a valid ticket and version through the authenticated write proxy', async () => {
    const req = new NextRequest(`${ORIGIN}/api/tickets/ENT-ticket_1/event-changes/2/respond`, {
      method: 'POST',
      body: JSON.stringify({ response: 'accepted' }),
    });
    const response = await POST(req, {
      params: Promise.resolve({ ticketId: 'ENT-ticket_1', eventVersion: '2' }),
    });

    expect(response.status).toBe(200);
    expect(mockProxy).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        gatewayPath: '/api/v2/tickets/ENT-ticket_1/event-changes/2/respond',
        successStatus: 200,
        idempotent: true,
      }),
    );
  });

  it('rejects invalid route values before forwarding', async () => {
    const req = new NextRequest(`${ORIGIN}/api/tickets/%2F/event-changes/0/respond`, {
      method: 'POST',
    });
    const response = await POST(req, {
      params: Promise.resolve({ ticketId: '/', eventVersion: '0' }),
    });

    expect(response.status).toBe(404);
    expect(mockProxy).not.toHaveBeenCalled();
  });
});
