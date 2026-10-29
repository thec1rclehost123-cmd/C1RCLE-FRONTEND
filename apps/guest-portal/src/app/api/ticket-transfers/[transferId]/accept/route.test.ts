import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const { mockProxy } = vi.hoisted(() => ({
  mockProxy: vi.fn<(...args: readonly unknown[]) => Promise<unknown>>(),
}));

vi.mock('@/lib/bff/proxy-write', () => ({
  proxyGatewayWrite: (...args: unknown[]) => mockProxy(...args),
}));

const ORIGIN = 'http://localhost:3000';

beforeEach(() => {
  mockProxy.mockReset();
  mockProxy.mockResolvedValue(NextResponse.json({ ok: true }, { status: 200 }));
});

describe('POST /api/ticket-transfers/:transferId/accept BFF', () => {
  it('forwards a valid invitation id to the authenticated gateway write proxy', async () => {
    const req = new NextRequest(`${ORIGIN}/api/ticket-transfers/TRF-transfer_1/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req, { params: Promise.resolve({ transferId: 'TRF-transfer_1' }) });

    expect(response.status).toBe(200);
    expect(mockProxy).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        gatewayPath: '/api/v2/ticket-transfers/TRF-transfer_1/accept',
        successStatus: 200,
        idempotent: true,
      }),
    );
  });

  it('rejects an invalid invitation id before forwarding', async () => {
    const req = new NextRequest(`${ORIGIN}/api/ticket-transfers/%2F/accept`, { method: 'POST' });
    const response = await POST(req, { params: Promise.resolve({ transferId: '/' }) });

    expect(response.status).toBe(404);
    expect(mockProxy).not.toHaveBeenCalled();
  });
});
