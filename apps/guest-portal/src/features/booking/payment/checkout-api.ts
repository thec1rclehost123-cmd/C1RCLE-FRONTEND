import {
  checkoutHoldResponseSchema,
  checkoutQuoteResponseSchema,
  entitlementsListResponseSchema,
  paymentAttemptResponseSchema,
  paymentConfirmResponseSchema,
} from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';

import { openRazorpayCheckout } from './razorpay-checkout';

import type { PaidCheckoutDeps } from './paid-checkout';
import type { CheckoutQuoteResponse } from '@c1rcle/contracts';

/** The double-submit CSRF token the auth BFF sets; echoed back on every write. */
function csrfHeader(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const match = /(?:^|;\s*)(?:[a-zA-Z0-9_-]+\.)?c1rcle\.csrf=([^;]+)/.exec(document.cookie);
  return match?.[1] ? { 'x-csrf-token': decodeURIComponent(match[1]) } : {};
}

const writeHeaders = (idempotencyKey?: string): Record<string, string> => ({
  ...csrfHeader(),
  ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
});

export function fetchQuote(input: {
  eventId: string;
  lines: { tierId: string; quantity: number }[];
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

/**
 * After a payment whose redirect confirmation failed, Razorpay's webhook still
 * fulfils the order server-side. Poll the buyer's tickets (about 30 seconds)
 * until one for this event appears.
 */
async function waitForTickets(eventId: string): Promise<boolean> {
  for (let attempt = 0; attempt < TICKET_POLL_ATTEMPTS; attempt += 1) {
    try {
      const tickets = await bffClient.get({
        path: '/api/wallet/tickets',
        schema: entitlementsListResponseSchema,
      });
      if (tickets.items.some((ticket) => ticket.eventId === eventId)) return true;
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
