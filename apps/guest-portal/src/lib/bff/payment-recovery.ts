import type { NextRequest, NextResponse } from 'next/server';

export const PAYMENT_RECOVERY_COOKIE = 'c1rcle.payment-recovery-hold';

export function setPaymentRecoveryCookie(
  response: NextResponse,
  request: NextRequest,
  holdId: string,
): void {
  response.cookies.set(PAYMENT_RECOVERY_COOKIE, holdId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 15 * 60,
  });
}
