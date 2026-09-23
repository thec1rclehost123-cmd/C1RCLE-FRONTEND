import { applySlotRequestAction } from '@/lib/bff/slot-request-action';

import type { NextRequest } from 'next/server';

interface RouteParams {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(req: NextRequest, ctx: RouteParams) {
  const { id } = await ctx.params;
  return applySlotRequestAction(req, id, 'reject');
}