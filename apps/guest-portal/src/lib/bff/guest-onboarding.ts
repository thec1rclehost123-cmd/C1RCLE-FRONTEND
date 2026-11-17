import { NextResponse } from 'next/server';

import {
  guestOnboardingPatchSchema,
  guestOnboardingStatusSchema,
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

export async function proxyGuestOnboarding(
  req: NextRequest,
  operation: 'read' | 'status' | 'save' | 'phone',
) {
  const origin = assertSameOrigin(req);
  if (origin) return origin;
  if (
    !req.cookies.get('better-auth.session_token')?.value &&
    !req.cookies.get('__Secure-better-auth.session_token')?.value
  )
    return errorEnvelope('unauthorized', 'Sign in to continue.', 401);
  if (operation !== 'read' && operation !== 'status') {
    const csrf = assertCsrf(req);
    if (csrf) return csrf;
  }
  try {
    let body: unknown;
    if (operation !== 'read' && operation !== 'status') {
      const parsed = (
        operation === 'phone' ? guestPhoneProofSchema : guestOnboardingPatchSchema
      ).safeParse(await req.json());
      if (!parsed.success)
        return errorEnvelope('validation', 'Check your details and try again.', 422);
      body = parsed.data;
    }
    const response = await forwardToGateway(
      `/api/v2/profile/onboarding${operation === 'phone' ? '/phone' : operation === 'status' ? '/status' : ''}`,
      {
        method:
          operation === 'read' || operation === 'status'
            ? 'GET'
            : operation === 'save'
              ? 'PUT'
              : 'POST',
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
    if (operation !== 'read' && operation !== 'status')
      return new NextResponse(null, {
        status: 204,
        headers: { 'cache-control': 'private, no-store' },
      });
    const parsed =
      operation === 'status'
        ? guestOnboardingStatusSchema.safeParse(await response.json())
        : guestOnboardingStateSchema.safeParse(await response.json());
    if (!parsed.success) return gatewayUnreachable();
    return NextResponse.json(parsed.data, { headers: { 'cache-control': 'private, no-store' } });
  } catch {
    return gatewayUnreachable();
  }
}
