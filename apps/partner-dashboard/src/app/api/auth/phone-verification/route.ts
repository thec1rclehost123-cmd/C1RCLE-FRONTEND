import { NextResponse } from 'next/server';

import {
  assertCsrf,
  assertSameOrigin,
  errorEnvelope,
  forwardToGateway,
  parseJson,
  passThroughGatewayError,
  stripProtoKeys,
} from '@/lib/bff/auth-proxy';

import type { NextRequest } from 'next/server';

/**
 * Proxies `{ phoneNumber, idToken }` to the V2 gateway's
 * `POST /api/v2/onboarding/verify-document` (`documentType: 'phone'`,
 * `documentNumber: phoneNumber`, `proofToken: idToken` — the ID token from
 * the client's Firebase JS SDK `signInWithPhoneNumber` flow, GCP Identity
 * Platform-backed; see `C1RCLE-BACKEND`'s `firebase-phone-verifier.ts`).
 *
 * **Session-scoped, unlike `otp/send`/`otp/verify`.** This route requires an
 * existing account (it forwards the session cookie and checks CSRF, same as
 * `refresh`) — the gateway's `verify-document` route resolves the applicant
 * from the session, it does not accept an anonymous caller. If the signup
 * wizard's step order calls this *before* the account-creation step (the
 * `codex` UI's current step sequence has `phone_verify` ahead of `details`,
 * where the password/account is created), the Firebase phone confirmation
 * still happens client-side for immediate UX feedback, but this route's
 * call — the actual server-side record of a verified number — must be
 * deferred until after signup, then made once an account exists.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = assertSameOrigin(req);
  if (originError !== null) {
    return originError;
  }
  const csrfError = assertCsrf(req);
  if (csrfError !== null) {
    return csrfError;
  }

  let parsedBody: unknown;
  try {
    parsedBody = stripProtoKeys(await req.json());
  } catch {
    return errorEnvelope('validation', 'Request body must be valid JSON.', 400);
  }

  if (
    typeof parsedBody !== 'object' ||
    parsedBody === null ||
    typeof (parsedBody as { phoneNumber?: unknown }).phoneNumber !== 'string' ||
    typeof (parsedBody as { idToken?: unknown }).idToken !== 'string'
  ) {
    return errorEnvelope('validation', 'phoneNumber and idToken are required strings.', 400);
  }
  const { phoneNumber, idToken } = parsedBody as { phoneNumber: string; idToken: string };

  const gatewayResponse = await forwardToGateway('/api/v2/onboarding/verify-document', {
    method: 'POST',
    body: { documentType: 'phone', documentNumber: phoneNumber, proofToken: idToken },
    cookie: req.headers.get('cookie'),
  });
  const bodyText = await gatewayResponse.text();

  if (!gatewayResponse.ok) {
    return passThroughGatewayError(gatewayResponse.status, bodyText);
  }

  return NextResponse.json(parseJson(bodyText), { status: 200 });
}
