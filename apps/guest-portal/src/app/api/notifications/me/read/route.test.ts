import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const { proxyGatewayWrite } = vi.hoisted(() => ({ proxyGatewayWrite: vi.fn() }));

vi.mock('@/lib/bff/proxy-write', () => ({ proxyGatewayWrite }));

beforeEach(() => {
  proxyGatewayWrite.mockReset().mockResolvedValue(NextResponse.json({ updated: 1 }));
});

describe('POST /api/notifications/me/read BFF', () => {
  it('uses the authenticated CSRF-checked gateway write proxy', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications/me/read', {
      method: 'POST',
      body: JSON.stringify({ ids: ['notification_1'] }),
    });
    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(proxyGatewayWrite).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        gatewayPath: '/api/v2/notifications/me/read',
        successStatus: 200,
        idempotent: true,
      }),
    );
  });
});
