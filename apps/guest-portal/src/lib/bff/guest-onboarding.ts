import { NextResponse } from 'next/server';

import {
  guestOnboardingPatchSchema,
  guestOnboardingStateSchema,
  guestPhoneProofSchema,
} from '@c1rcle/contracts/guest-onboarding';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  gatewayUnreachable,
  passThroughGatewayError,
} from './auth-proxy';

import type { NextRequest } from 'next/server';

export async function proxyGuestOnboarding(req: NextRequest, operation: 'read' | 'save' | 'phone') {
  const origin = assertSameOrigin(req);
  if (origin) return origin;
  if (
    !req.cookies.get('better-auth.session_token')?.value &&
    !req.cookies.get('__Secure-better-auth.session_token')?.value
  )
    return errorEnvelope('unauthorized', 'Sign in to continue.', 401);
  if (operation !== 'read') {
    const csrf = assertCsrf(req);
    if (csrf) return csrf;
  }
  try {
    let body: unknown;
    if (operation !== 'read') {
      const parsed = (
        operation === 'phone' ? guestPhoneProofSchema : guestOnboardingPatchSchema
      ).safeParse(await req.json());
      if (!parsed.success)
        return errorEnvelope('validation', 'Check your details and try again.', 422);
      body = parsed.data;
    }
    const response = await forwardToGateway(
      `/api/v2/profile/onboarding${operation === 'phone' ? '/phone' : ''}`,
      {
        method: operation === 'read' ? 'GET' : operation === 'save' ? 'PUT' : 'POST',
        ...(body !== undefined ? { body } : {}),
        cookie: req.headers.get('cookie'),
      },
    );
    if (!response.ok)
      return passThroughGatewayError(
        response.status,
        await response.text(),
        response.headers.get('retry-after'),
      );
    if (operation !== 'read')
      return new NextResponse(null, {
        status: 204,
        headers: { 'cache-control': 'private, no-store' },
      });
    const parsed = guestOnboardingStateSchema.safeParse(await response.json());
    if (!parsed.success) return gatewayUnreachable();
    return NextResponse.json(parsed.data, { headers: { 'cache-control': 'private, no-store' } });
  } catch {
    return gatewayUnreachable();
  }
}
