import { NextResponse } from 'next/server';

import { proxyGatewayWrite } from '@/lib/bff/proxy-write';

import type { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ entryId: string }> },
): Promise<NextResponse> {
  const { entryId } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(entryId)) {
    return NextResponse.json(
      { code: 'not_found', message: 'Waitlist entry unavailable.', status: 404 },
      { status: 404 },
    );
  }
  return proxyGatewayWrite(req, {
    gatewayPath: `/api/v2/waitlist/${encodeURIComponent(entryId)}/accept`,
    successStatus: 200,
    unauthenticatedMessage: 'Sign in to accept this offer.',
    idempotent: true,
  });
}
