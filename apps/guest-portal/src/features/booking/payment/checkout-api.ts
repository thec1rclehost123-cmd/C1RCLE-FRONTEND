import { z } from 'zod';

import { isApiClientError } from '@c1rcle/api-client';
import {
  checkoutHoldResponseSchema,
  checkoutQuoteResponseSchema,
  paymentAttemptResponseSchema,
  paymentConfirmResponseSchema,
  paymentRecoveryResponseSchema,
} from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import { pollAuthoritativePaymentStatus } from './payment-recovery-poll';
import { openRazorpayCheckout } from './razorpay-checkout';

import type { PaidCheckoutDeps } from './paid-checkout';
import type { CheckoutQuoteResponse, PaymentRecoveryResponse } from '@c1rcle/contracts';

const writeHeaders = (idempotencyKey?: string): Record<string, string> => ({
  ...csrfHeaders(),
  ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
});

export function fetchQuote(input: {
  eventId: string;
  lines: {
    tierId: string;
    quantity: number;
    accessGrantId?: string;
    eligibilityAttested?: boolean;
    ticketAddons?: { addonId: string; quantityPerEntitlement: number }[];
  }[];
  promoCode?: string | null;
  referralCode?: string | null;
  upgradeFromEntitlementId?: string;
}): Promise<CheckoutQuoteResponse> {
  return bffClient.post({
    path: '/api/checkout/quote',
    body: input,
    headers: writeHeaders(),
    schema: checkoutQuoteResponseSchema,
  });
}

const TICKET_POLL_INTERVAL_MS = 2_000;
const TICKET_POLL_ATTEMPTS = 15;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const RECOVERY_POLL_ATTEMPTS = 15;
const RECOVERY_POLL_INTERVAL_MS = 2_000;
const recoveryClearedSchema = z.object({ cleared: z.literal(true) });

export async function clearPaymentRecovery(): Promise<void> {
  await bffClient.delete({ path: '/api/payments/recovery', schema: recoveryClearedSchema });
}

export async function pollPaymentRecovery(
  eventId: string,
  onStatus: (status: PaymentRecoveryResponse) => void,
): Promise<PaymentRecoveryResponse | null> {
  return pollAuthoritativePaymentStatus(
    {
      read: async () => {
        try {
          return await bffClient.get({
            path: '/api/payments/recovery',
            schema: paymentRecoveryResponseSchema,
          });
        } catch (error) {
          if (isApiClientError(error) && error.status === 404) return null;
          throw error;
        }
      },
      reconcile: () =>
        bffClient.post({
          path: '/api/payments/recovery/reconcile',
          body: {},
          headers: writeHeaders('m3-payment-recovery-reconcile'),
          schema: paymentRecoveryResponseSchema,
        }),
      pause: () => sleep(RECOVERY_POLL_INTERVAL_MS),
    },
    eventId,
    onStatus,
    RECOVERY_POLL_ATTEMPTS,
  );
}

/**
 * After redirect confirmation fails, wait for this hold's authoritative
 * fulfillment. A pre-existing ticket for the same event proves nothing about
 * the current payment.
 */
async function waitForTickets(eventId: string, holdId: string): Promise<boolean> {
  for (let attempt = 0; attempt < TICKET_POLL_ATTEMPTS; attempt += 1) {
    try {
      const status = await bffClient.get({
        path: '/api/payments/recovery',
        schema: paymentRecoveryResponseSchema,
      });
      if (status.holdId !== holdId || status.eventId !== eventId) return false;
      if (status.status === 'fulfilled' && status.orderId !== null) return true;
      if (status.status !== 'pending' && status.status !== 'processing') return false;
    } catch {
      // A transient failure is the same as "not yet": keep waiting.
    }
    await sleep(TICKET_POLL_INTERVAL_MS);
  }
  return false;
}

export const paidCheckoutDeps: PaidCheckoutDeps = {
  createHold: ({ idempotencyKey, ...body }) =>
    bffClient.post({
      path: '/api/checkout/holds',
      body,
      headers: writeHeaders(idempotencyKey),
      schema: checkoutHoldResponseSchema,
    }),
  createAttempt: ({ holdId, idempotencyKey }) =>
    bffClient.post({
      path: '/api/payments/attempts',
      body: { holdId },
      headers: writeHeaders(idempotencyKey),
      schema: paymentAttemptResponseSchema,
    }),
  openCheckout: openRazorpayCheckout,
  verify: ({ paymentId, idempotencyKey, ...body }) =>
    bffClient.post({
      path: `/api/payments/${encodeURIComponent(paymentId)}/verify`,
      body,
      headers: writeHeaders(idempotencyKey),
      schema: paymentConfirmResponseSchema,
    }),
  waitForTickets,
};
