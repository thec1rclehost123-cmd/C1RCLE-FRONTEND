import type { OpenCheckoutArgs, RazorpayOutcome } from './razorpay-checkout';
import type {
  CheckoutHoldResponse,
  PaymentAttemptResponse,
  PaymentConfirmResponse,
} from '@c1rcle/contracts';

/**
 * The paid-ticket journey, as one function with every side effect injected.
 *
 *   hold the inventory -> create the provider order -> let the buyer pay in
 *   Razorpay's widget -> have the server verify the payment.
 *
 * The server stays the authority throughout: the price comes from the hold, the
 * order from the payment attempt, and only the server's verification (or its
 * webhook) turns a payment into tickets. This function never decides that a
 * payment is genuine; it only sequences the calls and reports what happened.
 */
export interface PaidCheckoutDeps {
  createHold(input: {
    eventId: string;
    lines: { tierId: string; quantity: number }[];
    idempotencyKey: string;
    promoCode?: string | null;
    attendee?: { name: string; email: string; phone?: string };
  }): Promise<CheckoutHoldResponse>;
  createAttempt(input: { holdId: string; idempotencyKey: string }): Promise<PaymentAttemptResponse>;
  openCheckout(args: OpenCheckoutArgs): Promise<RazorpayOutcome>;
  verify(input: {
    paymentId: string;
    holdId: string;
    paymentIntentId: string;
    signature: string;
    idempotencyKey: string;
  }): Promise<PaymentConfirmResponse>;
  /** Resolves true once the buyer has a ticket for the event, false if it never appears. */
  waitForTickets(eventId: string): Promise<boolean>;
}

export interface PaidCheckoutInput {
  readonly eventId: string;
  readonly eventTitle: string;
  readonly lines: readonly { tierId: string; quantity: number }[];
  /** The total the buyer was shown; a hold priced differently stops for re-confirmation. */
  readonly expectedTotalPaise: number;
  /** One per checkout attempt, so a double-click or retry replays rather than repeats. */
  readonly idempotencyKey: string;
  readonly promoCode?: string | null;
  readonly attendee?: { name: string; email: string; phone?: string };
  readonly prefill?: { name?: string; email?: string; contact?: string };
}

export type PaidCheckoutResult =
  | { readonly kind: 'confirmed'; readonly orderId: string }
  /** Paid, but the server has not confirmed yet; the webhook will finish the job. */
  | { readonly kind: 'processing'; readonly ticketsReady: boolean }
  | { readonly kind: 'price_changed'; readonly grandTotalPaise: number }
  /** The payment was captured but could not be honoured, and has been refunded in full. */
  | { readonly kind: 'refunded'; readonly message: string }
  | { readonly kind: 'cancelled'; readonly reason?: string }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'error'; readonly message: string };

/** Reads `status` / `code` off whatever was thrown (an API client error, usually). */
function errorFacts(error: unknown): { status?: number; code?: string } {
  if (typeof error !== 'object' || error === null) return {};
  const facts: { status?: number; code?: string } = {};
  if ('status' in error && typeof error.status === 'number') facts.status = error.status;
  if ('code' in error && typeof error.code === 'string') facts.code = error.code;
  return facts;
}

export async function runPaidCheckout(
  deps: PaidCheckoutDeps,
  input: PaidCheckoutInput,
): Promise<PaidCheckoutResult> {
  let hold: CheckoutHoldResponse;
  let attempt: PaymentAttemptResponse;
  try {
    hold = await deps.createHold({
      eventId: input.eventId,
      lines: input.lines.map((line) => ({ ...line })),
      idempotencyKey: `${input.idempotencyKey}-hold`,
      ...(input.promoCode ? { promoCode: input.promoCode } : {}),
      ...(input.attendee ? { attendee: input.attendee } : {}),
    });
    if (hold.pricing.grandTotalPaise !== input.expectedTotalPaise) {
      return { kind: 'price_changed', grandTotalPaise: hold.pricing.grandTotalPaise };
    }
    attempt = await deps.createAttempt({
      holdId: hold.holdId,
      idempotencyKey: `${input.idempotencyKey}-attempt`,
    });
  } catch (error) {
    return failureBeforePayment(error);
  }

  // Without a publishable key there is nothing to open: never guess one.
  if (attempt.keyId === undefined) return { kind: 'unavailable' };

  let outcome: RazorpayOutcome;
  try {
    outcome = await deps.openCheckout({
      keyId: attempt.keyId,
      orderId: attempt.paymentIntentId,
      amountPaise: attempt.amountPaise,
      title: 'C1RCLE',
      description: input.eventTitle,
      ...(input.prefill ? { prefill: input.prefill } : {}),
    });
  } catch {
    return { kind: 'error', message: 'The payment window could not be opened. Please try again.' };
  }

  if (outcome.kind === 'dismissed') {
    return outcome.lastFailure === undefined
      ? { kind: 'cancelled' }
      : { kind: 'cancelled', reason: outcome.lastFailure };
  }

  // The buyer has paid. From here a failure must never read as "payment failed".
  try {
    const confirmed = await deps.verify({
      paymentId: outcome.paymentId,
      holdId: hold.holdId,
      paymentIntentId: outcome.orderId,
      signature: outcome.signature,
      idempotencyKey: `${input.idempotencyKey}-verify`,
    });
    return { kind: 'confirmed', orderId: confirmed.order.id };
  } catch (error) {
    // The server may have answered "your payment arrived too late, the seats are
    // gone, and it has been refunded". That is a final outcome, not something to
    // wait out, so it must not be reported as "processing".
    const refund = refundOutcome(error);
    if (refund) return refund;
    // Any other failure of the redirect confirmation: the money moved and
    // Razorpay's webhook confirms the same payment independently. Wait for it.
    return { kind: 'processing', ticketsReady: await deps.waitForTickets(input.eventId) };
  }
}

/**
 * A 409 from verification whose message says the payment was refunded. Both are
 * required: a 409 alone can also be an ordinary conflict, and a message alone
 * could come from anywhere.
 */
function refundOutcome(error: unknown): PaidCheckoutResult | null {
  if (typeof error !== 'object' || error === null) return null;
  const { status } = errorFacts(error);
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  if (status === 409 && /refund/i.test(message)) return { kind: 'refunded', message };
  return null;
}

function failureBeforePayment(error: unknown): PaidCheckoutResult {
  const { status, code } = errorFacts(error);
  if (status === 503) return { kind: 'unavailable' };
  if (status === 409 || code === 'conflict') {
    return {
      kind: 'error',
      message: 'Those tickets are no longer available. Go back and choose again.',
    };
  }
  return { kind: 'error', message: 'We could not start your payment. Please try again.' };
}
