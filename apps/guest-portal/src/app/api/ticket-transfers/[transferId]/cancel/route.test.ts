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
  mockProxy.mockResolvedValue(NextResponse.json({ ok: true }));
});

describe('POST /api/ticket-transfers/:transferId/cancel BFF', () => {
  it('forwards a valid transfer id to the authenticated gateway write proxy', async () => {
    const req = new NextRequest(`${ORIGIN}/api/ticket-transfers/TRF-test_1/cancel`, {
      method: 'POST',
    });
    const response = await POST(req, { params: Promise.resolve({ transferId: 'TRF-test_1' }) });

    expect(response.status).toBe(200);
    expect(mockProxy).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        gatewayPath: '/api/v2/ticket-transfers/TRF-test_1/cancel',
        successStatus: 200,
        idempotent: true,
      }),
    );
  });

  it('rejects an invalid transfer id before forwarding', async () => {
    const req = new NextRequest(`${ORIGIN}/api/ticket-transfers/%2F/cancel`, { method: 'POST' });
    const response = await POST(req, { params: Promise.resolve({ transferId: '/' }) });

    expect(response.status).toBe(404);
    expect(mockProxy).not.toHaveBeenCalled();
  });
});
