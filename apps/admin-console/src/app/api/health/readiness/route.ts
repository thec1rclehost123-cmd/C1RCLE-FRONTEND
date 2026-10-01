import { NextResponse } from 'next/server';

import { fetchReadiness } from '@/lib/bff/health-proxy';

import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const { status, body } = await fetchReadiness();
  return NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });
}
