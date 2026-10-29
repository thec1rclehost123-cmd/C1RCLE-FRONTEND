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
  mockProxy.mockResolvedValue(NextResponse.json({ requested: true }, { status: 202 }));
});

describe('POST /api/ticket-transfers/:transferId/resend BFF', () => {
  it('forwards the authenticated idempotent resend command', async () => {
    const req = new NextRequest(`${ORIGIN}/api/ticket-transfers/TRF-test_1/resend`, {
      method: 'POST',
    });
    const response = await POST(req, { params: Promise.resolve({ transferId: 'TRF-test_1' }) });

    expect(response.status).toBe(202);
    expect(mockProxy).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        gatewayPath: '/api/v2/ticket-transfers/TRF-test_1/resend',
        successStatus: 202,
        idempotent: true,
      }),
    );
  });

  it('rejects an invalid transfer id before forwarding', async () => {
    const req = new NextRequest(`${ORIGIN}/api/ticket-transfers/%2F/resend`, { method: 'POST' });
    const response = await POST(req, { params: Promise.resolve({ transferId: '/' }) });

    expect(response.status).toBe(404);
    expect(mockProxy).not.toHaveBeenCalled();
  });
});
