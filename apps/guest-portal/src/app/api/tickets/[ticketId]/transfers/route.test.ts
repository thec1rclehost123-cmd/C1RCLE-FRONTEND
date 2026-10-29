import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';

const { mockProxy, mockForward } = vi.hoisted(() => ({
  mockProxy: vi.fn<(...args: readonly unknown[]) => Promise<unknown>>(),
  mockForward: vi.fn<(...args: readonly unknown[]) => Promise<Response>>(),
}));

vi.mock('@/lib/bff/proxy-write', () => ({
  proxyGatewayWrite: (...args: unknown[]) => mockProxy(...args),
}));

vi.mock('@/lib/bff/auth-proxy', () => {
  return {
    assertSameOrigin: () => null,
    errorEnvelope: (_code: string, message: string, status: number) =>
      Response.json({ message }, { status }),
    forwardToGateway: (...args: unknown[]) => mockForward(...args),
    parseJson: (value: string) => JSON.parse(value) as unknown,
    passThroughGatewayError: (status: number, body: string) => new Response(body, { status }),
  };
});

const ORIGIN = 'http://localhost:3000';

beforeEach(() => {
  mockProxy.mockReset();
  mockForward.mockReset();
  mockProxy.mockResolvedValue(NextResponse.json({ ok: true }, { status: 201 }));
  mockForward.mockResolvedValue(Response.json([], { status: 200 }));
});

describe('POST /api/tickets/:ticketId/transfers BFF', () => {
  it('forwards a valid ticket id to the authenticated gateway write proxy', async () => {
    const req = new NextRequest(`${ORIGIN}/api/tickets/ENT-ticket_1/transfers`, {
      method: 'POST',
      body: JSON.stringify({ recipientEmail: 'guest@example.test' }),
    });
    const response = await POST(req, { params: Promise.resolve({ ticketId: 'ENT-ticket_1' }) });

    expect(response.status).toBe(201);
    expect(mockProxy).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        gatewayPath: '/api/v2/tickets/ENT-ticket_1/transfers',
        successStatus: 201,
        idempotent: true,
      }),
    );
  });

  it('rejects an invalid ticket id before forwarding', async () => {
    const req = new NextRequest(`${ORIGIN}/api/tickets/%2F/transfers`, { method: 'POST' });
    const response = await POST(req, { params: Promise.resolve({ ticketId: '/' }) });

    expect(response.status).toBe(404);
    expect(mockProxy).not.toHaveBeenCalled();
  });

  it('reads transfer status through the authenticated gateway session', async () => {
    const req = new NextRequest(`${ORIGIN}/api/tickets/ENT-ticket_1/transfers`, {
      headers: { cookie: 'session=test' },
    });
    const response = await GET(req, { params: Promise.resolve({ ticketId: 'ENT-ticket_1' }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(mockForward).toHaveBeenCalledWith(
      '/api/v2/tickets/ENT-ticket_1/transfers',
      expect.objectContaining({ method: 'GET', cookie: 'session=test' }),
    );
  });

  it('rejects an invalid transfer history ticket id before forwarding', async () => {
    const req = new NextRequest(`${ORIGIN}/api/tickets/%2F/transfers`);
    const response = await GET(req, { params: Promise.resolve({ ticketId: '/' }) });

    expect(response.status).toBe(404);
    expect(mockForward).not.toHaveBeenCalled();
  });
});
