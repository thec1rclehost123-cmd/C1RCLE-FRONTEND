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
    lines: {
      tierId: string;
      quantity: number;
      accessGrantId?: string;
      eligibilityAttested?: boolean;
      ticketAddons?: { addonId: string; quantityPerEntitlement: number }[];
    }[];
    idempotencyKey: string;
    promoCode?: string | null;
    referralCode?: string | null;
    referralContextTokens?: readonly string[];
    upgradeFromEntitlementId?: string;
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
  /** Resolves true only when this hold is authoritatively fulfilled. */
  waitForTickets(eventId: string, holdId: string): Promise<boolean>;
}

export interface PaidCheckoutInput {
  readonly eventId: string;
  readonly eventTitle: string;
  readonly lines: readonly {
    tierId: string;
    quantity: number;
    accessGrantId?: string;
    eligibilityAttested?: boolean;
    ticketAddons?: { addonId: string; quantityPerEntitlement: number }[];
  }[];
  /** The total the buyer was shown; a hold priced differently stops for re-confirmation. */
  readonly expectedTotalPaise: number;
  /** Version of the server-owned policy shown with the quote, absent for legacy quotes. */
  readonly expectedFeePolicyVersion?: string;
  /** One per checkout attempt, so a double-click or retry replays rather than repeats. */
  readonly idempotencyKey: string;
  readonly promoCode?: string | null;
  readonly referralCode?: string | null;
  readonly referralContextTokens?: readonly string[];
  readonly upgradeFromEntitlementId?: string;
  readonly attendee?: { name: string; email: string; phone?: string };
  readonly prefill?: { name?: string; email?: string; contact?: string };
  /** A waitlist offer has already reserved inventory and must not create a second hold. */
  readonly reservedHold?: CheckoutHoldResponse;
}

export const PAYMENT_SUPPORT_MESSAGE =
  'We could not reconcile the existing checkout automatically. Contact support before trying again. No replacement payment has been started; keep this checkout available for support.';

export type PaidCheckoutResult =
  | { readonly kind: 'confirmed'; readonly orderId: string }
  /** Paid, but the server has not confirmed yet; the webhook will finish the job. */
  | { readonly kind: 'processing'; readonly ticketsReady: boolean; readonly orderId?: string }
  | {
      readonly kind: 'price_changed';
      readonly grandTotalPaise: number;
      readonly feePolicyChanged?: boolean;
    }
  /** Captured money has a durable refund request; provider settlement is still pending. */
  | { readonly kind: 'refund_pending'; readonly message: string; readonly orderId?: string }
  /** Authoritative server evidence confirms the completed refund. */
  | { readonly kind: 'refunded'; readonly message: string }
  | { readonly kind: 'cancelled'; readonly reason?: string }
  | { readonly kind: 'requires_support'; readonly message: string }
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
    hold =
      input.reservedHold ??
      (await deps.createHold({
        eventId: input.eventId,
        lines: input.lines.map((line) => ({ ...line })),
        idempotencyKey: `${input.idempotencyKey}-hold`,
        ...(input.promoCode ? { promoCode: input.promoCode } : {}),
        ...(input.referralCode ? { referralCode: input.referralCode } : {}),
        ...(input.referralContextTokens?.length
          ? { referralContextTokens: input.referralContextTokens }
          : {}),
        ...(input.upgradeFromEntitlementId
          ? { upgradeFromEntitlementId: input.upgradeFromEntitlementId }
          : {}),
        ...(input.attendee ? { attendee: input.attendee } : {}),
      }));
    if (hold.pricing.grandTotalPaise !== input.expectedTotalPaise) {
      return { kind: 'price_changed', grandTotalPaise: hold.pricing.grandTotalPaise };
    }
    if (hold.pricing.feePolicy?.version !== input.expectedFeePolicyVersion) {
      return {
        kind: 'price_changed',
        grandTotalPaise: hold.pricing.grandTotalPaise,
        feePolicyChanged: true,
      };
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
    if (confirmed.order.status === 'refund_requested')
      return {
        kind: 'refund_pending',
        orderId: confirmed.order.id,
        message:
          'Your payment was received. A refund request is pending. Review, required approvals and provider confirmation must complete before it is shown as refunded.',
      };
    if (confirmed.order.status === 'refunded')
      return {
        kind: 'refunded',
        message: 'The server confirmed your refund. No admission is available for this payment.',
      };
    if (confirmed.order.status !== 'paid' || confirmed.order.fulfillmentState === 'pending')
      return { kind: 'processing', ticketsReady: false, orderId: confirmed.order.id };
    return { kind: 'confirmed', orderId: confirmed.order.id };
  } catch (error) {
    // The server may have answered "your payment arrived too late, the seats are
    // gone, and it has been refunded". That is a final outcome, not something to
    // wait out, so it must not be reported as "processing".
    const refund = refundOutcome(error);
    if (refund) return refund;
    // Any other failure of the redirect confirmation: the money moved and
    // Razorpay's webhook confirms the same payment independently. Wait for it.
    return {
      kind: 'processing',
      ticketsReady: await deps.waitForTickets(input.eventId, hold.holdId),
    };
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
  if (status === 409 && /refund/i.test(message) && /pending|review|approval|queued/i.test(message))
    return { kind: 'refund_pending', message };
  if (status === 409 && /has been refunded in full/i.test(message))
    return { kind: 'refunded', message };
  return null;
}

function failureBeforePayment(error: unknown): PaidCheckoutResult {
  const { status, code } = errorFacts(error);
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : '';
  if (status !== undefined && status >= 400 && status < 500 && /\brequires_support\b/.test(message))
    return { kind: 'requires_support', message: PAYMENT_SUPPORT_MESSAGE };
  if (status === 503) return { kind: 'unavailable' };
  if (status === 409 || code === 'conflict') {
    return {
      kind: 'error',
      message: 'Those tickets are no longer available. Go back and choose again.',
    };
  }
  return { kind: 'error', message: 'We could not start your payment. Please try again.' };
}
