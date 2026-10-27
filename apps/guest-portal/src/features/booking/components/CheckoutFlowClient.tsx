'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { useSession } from '@c1rcle/auth';
import { rsvpResponseSchema } from '@c1rcle/contracts';

import { getEventAccentClasses } from '@/features/event-detail/eventDetailPalette';
import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import {
  clearPaymentRecovery,
  fetchQuote,
  paidCheckoutDeps,
  pollPaymentRecovery,
} from '../payment/checkout-api';
import { runPaidCheckout } from '../payment/paid-checkout';

import type { BookingEventFixture } from '../types/booking.types';
import type { CheckoutQuoteResponse } from '@c1rcle/contracts';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

type CheckoutStep = 1 | 2;
type PayState = 'idle' | 'paying' | 'processing';
type QuoteState = 'idle' | 'loading' | 'ready' | 'error';

export function CheckoutFlowClient({
  event,
  initialTierId,
}: {
  event: BookingEventFixture;
  initialTierId?: string | undefined;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSession();
  const requestedTier = initialTierId ?? searchParams.get('tier') ?? undefined;
  const initialTier = event.ticketTiers.some((tier) => tier.id === requestedTier)
    ? requestedTier
    : event.ticketTiers[0]?.id;
  const [step, setStep] = useState<CheckoutStep>(1);
  const [expandedTierId, setExpandedTierId] = useState<string | undefined>(initialTier);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    if (!initialTier) return {};
    // Never pre-select more than the live availability captured at render.
    const max = event.ticketTiers.find((tier) => tier.id === initialTier)?.maximumQuantity ?? 0;
    return max > 0 ? { [initialTier]: 1 } : {};
  });
  // The server's price for ONE selection. It is keyed by that selection, so a
  // result for different tickets can never be shown or paid against.
  const [quoteResult, setQuoteResult] = useState<{
    key: string;
    quote: CheckoutQuoteResponse | null;
  } | null>(null);
  const [requoteCount, setRequoteCount] = useState(0);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [payState, setPayState] = useState<PayState>(() =>
    event.purchasable && event.ticketTiers.some((tier) => tier.price.amountPaise > 0)
      ? 'processing'
      : 'idle',
  );
  const [payMessage, setPayMessage] = useState<string | null>(null);
  // One key per checkout attempt: a double-click or a retry replays the same
  // hold and payment order instead of reserving and charging twice. A new
  // selection (or a re-quote) is a new attempt, so it gets a new key.
  const attemptKey = useRef<{ forQuote: string; value: string } | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'posting'>('idle');
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [alreadyOnList, setAlreadyOnList] = useState(false);
  const accent = getEventAccentClasses(event.accentTone);

  const selectedTickets = useMemo(
    () =>
      event.ticketTiers
        .map((tier) => ({ ...tier, quantity: quantities[tier.id] ?? 0 }))
        .filter((tier) => tier.quantity > 0),
    [event.ticketTiers, quantities],
  );
  const subtotalPaise = selectedTickets.reduce(
    (total, tier) => total + tier.price.amountPaise * tier.quantity,
    0,
  );
  const totalTickets = selectedTickets.reduce((total, tier) => total + tier.quantity, 0);
  // A ₹0 total is fulfilled as RSVP without the payment provider. Paid
  // selections proceed only when the authoritative event mapping allows it.
  const isFreeBooking = selectedTickets.length > 0 && subtotalPaise === 0;
  // The server fulfills exactly one RSVP ticket per account per event.
  const canConfirmRsvp = isFreeBooking && totalTickets === 1 && rsvpStatus === 'idle';

  const canPay = event.purchasable === true && !isFreeBooking;
  const lines = useMemo(
    () => selectedTickets.map((ticket) => ({ tierId: ticket.id, quantity: ticket.quantity })),
    [selectedTickets],
  );
  const lineSignature = lines.map((line) => `${line.tierId}:${String(line.quantity)}`).join(',');

  const wantsQuote = step === 2 && canPay && lines.length > 0;
  const quoteKey = `${event.eventId}|${lineSignature}|${appliedPromo ?? ''}|${String(requoteCount)}`;
  const currentQuote = quoteResult?.key === quoteKey ? quoteResult : null;
  const quote = wantsQuote ? (currentQuote?.quote ?? null) : null;
  const quoteState: QuoteState = !wantsQuote
    ? 'idle'
    : currentQuote === null
      ? 'loading'
      : currentQuote.quote === null
        ? 'error'
        : 'ready';

  // The hold id is retained only in an httpOnly, short-lived BFF cookie. On a
  // reload, check the owner-scoped backend status before enabling another pay
  // action, then poll for a bounded period without creating a hold or attempt.
  useEffect(() => {
    if (!event.purchasable || !event.ticketTiers.some((tier) => tier.price.amountPaise > 0)) return;
    let cancelled = false;
    void pollPaymentRecovery(event.eventId, (status) => {
      if (cancelled) return;
      setPayState('processing');
      setPayMessage(
        status.status === 'pending'
          ? 'Your existing checkout is still pending. No new payment has been started.'
          : 'Your payment is still processing. We are waiting for server confirmation.',
      );
    }).then(async (status) => {
      if (cancelled) return;
      if (!status) {
        setPayState('idle');
        setPayMessage(null);
        return;
      }
      if (status.status === 'fulfilled') {
        await clearPaymentRecovery().catch(() => undefined);
        router.push(
          status.orderId ? `/confirmation/${encodeURIComponent(status.orderId)}` : '/tickets',
        );
        return;
      }
      if (status.status === 'pending' || status.status === 'processing') {
        setPayMessage('Your payment is still processing. You can safely refresh and check again.');
        return;
      }
      await clearPaymentRecovery().catch(() => undefined);
      setPayState('idle');
      const messages = {
        cancelled: 'The previous checkout was cancelled. You can start again.',
        expired: 'The previous ticket hold expired. Review availability before trying again.',
        failed: 'The previous payment did not complete. You can try again.',
        refunded: 'The previous payment was refunded. No tickets were issued.',
        requires_support:
          'We could not reconcile the previous payment automatically. Contact support before trying again.',
      } as const;
      setPayMessage(messages[status.status]);
    });
    return () => {
      cancelled = true;
    };
  }, [event.eventId, event.purchasable, event.ticketTiers, router]);

  // At the payment step every money value comes from the backend quote. While
  // it is loading, show no locally recomputed fee or payable-total estimate.
  const authoritativeFeesPaise = quote
    ? quote.platformFeePaise + quote.paymentFeePaise
    : isFreeBooking
      ? 0
      : null;
  const gstPaise = quote?.gstPaise ?? 0;
  const discountPaise = quote?.discountPaise ?? 0;
  // Price the selection on the server when the buyer reaches the payment step.
  useEffect(() => {
    if (!wantsQuote) return;
    let cancelled = false;
    fetchQuote({
      eventId: event.eventId,
      lines,
      ...(appliedPromo ? { promoCode: appliedPromo } : {}),
    })
      .then((result) => {
        if (!cancelled) setQuoteResult({ key: quoteKey, quote: result });
      })
      .catch(() => {
        if (!cancelled) setQuoteResult({ key: quoteKey, quote: null });
      });
    return () => {
      cancelled = true;
    };
  }, [wantsQuote, quoteKey, event.eventId, lines, appliedPromo]);

  async function pay() {
    if (!quote || payState !== 'idle') return;
    if (attemptKey.current?.forQuote !== quoteKey) {
      attemptKey.current = { forQuote: quoteKey, value: crypto.randomUUID() };
    }
    setPayState('paying');
    setPayMessage(null);
    const prefill = user ? { name: user.displayName, email: user.email } : undefined;
    const result = await runPaidCheckout(paidCheckoutDeps, {
      eventId: event.eventId,
      eventTitle: event.title,
      lines,
      expectedTotalPaise: quote.grandTotalPaise,
      idempotencyKey: attemptKey.current.value,
      ...(prefill ? { prefill, attendee: prefill } : {}),
      promoCode: appliedPromo,
    });

    switch (result.kind) {
      case 'confirmed':
        await clearPaymentRecovery().catch(() => undefined);
        router.push(`/confirmation/${encodeURIComponent(result.orderId)}`);
        return;
      case 'processing':
        setPayState('processing');
        if (result.ticketsReady) router.push('/tickets');
        return;
      case 'price_changed':
        setPayMessage(
          `The price changed to ${moneyFormatter.format(result.grandTotalPaise / 100)}. Review the total and pay again.`,
        );
        // A new key forces a fresh quote, and the fresh quote a fresh attempt.
        setRequoteCount((count) => count + 1);
        break;
      case 'refunded':
        // Final: the money is already on its way back, so nothing is pending and
        // there is nothing to retry against this hold.
        setPayMessage(result.message);
        await clearPaymentRecovery().catch(() => undefined);
        break;
      case 'cancelled':
        setPayMessage(
          result.reason
            ? `Payment did not go through: ${result.reason}`
            : 'Payment cancelled. Your tickets are held for a few minutes if you want to try again.',
        );
        break;
      case 'unavailable':
        setPayMessage('Online payments are not available right now. Please try again later.');
        break;
      case 'error':
        setPayMessage(result.message);
        break;
    }
    setPayState('idle');
  }

  async function confirmRsvp() {
    const ticket = selectedTickets[0];
    if (!ticket || totalTickets !== 1 || rsvpStatus !== 'idle') return;
    setRsvpStatus('posting');
    setRsvpError(null);
    try {
      const result = await bffClient.post({
        path: '/api/rsvp',
        body: { eventId: event.eventId, tierId: ticket.id },
        headers: csrfHeaders(),
        schema: rsvpResponseSchema,
      });
      router.push(`/confirmation/${encodeURIComponent(result.order.id)}`);
    } catch (error) {
      if (isApiClientError(error) && error.code === 'conflict') {
        setAlreadyOnList(true);
      } else if (!isApiClientError(error) || error.code !== 'unauthorized') {
        // Unauthorized is handled by the client's login redirect — every
        // other failure surfaces inline.
        setRsvpError('RSVP failed — please try again.');
      }
      setRsvpStatus('idle');
    }
  }

  function changeQuantity(tierId: string, change: number, maximum: number) {
    setQuantities((current) => ({
      ...current,
      [tierId]: Math.max(0, Math.min(maximum, (current[tierId] ?? 0) + change)),
    }));
  }

  return (
    <div className="mx-auto max-w-[1020px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <Link
          href={`/event/${encodeURIComponent(event.id)}`}
          className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-white/60 transition-colors hover:text-white motion-reduce:transition-none"
        >
          <span aria-hidden="true">←</span> Back to event
        </Link>
      </div>

      <div
        className={`grid overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0b0a0d]/95 shadow-[0_28px_100px_rgba(0,0,0,0.6)] backdrop-blur-md lg:grid-cols-[minmax(240px,0.78fr)_minmax(0,1.22fr)] ${accent.panelShadow}`}
      >
        <aside
          aria-label="Event information"
          className="border-b border-white/10 px-5 py-6 sm:px-8 sm:py-8 lg:border-b-0 lg:border-r lg:border-white/10"
        >
          <h1 className="mb-5 line-clamp-3 text-lg font-extrabold uppercase leading-tight tracking-[-0.03em] text-white sm:text-xl lg:border-t lg:border-white/15 lg:pt-5 lg:text-2xl">
            {event.title}
          </h1>
          <div className="flex items-start gap-4 lg:block">
            <div className="relative aspect-[0.72/1] w-[100px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black sm:w-[138px] lg:mx-auto lg:mt-7 lg:w-full lg:max-w-[230px]">
              <Image
                src={event.image}
                alt={`${event.title} event poster`}
                fill
                unoptimized
                sizes="(max-width: 640px) 96px, 250px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            </div>
            <div className="min-w-0 flex-1 lg:mt-7 lg:text-center">
              <p className="mt-2 text-xs font-semibold leading-5 text-white/70 sm:text-sm">
                {dateFormatter.format(new Date(event.startsAt))}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-white/50 sm:text-sm">
                {event.venue} · {event.city}
              </p>
              {event.doorNote && (
                <p className="mt-3 hidden border-t border-white/10 pt-3 text-[10px] leading-5 text-white/40 lg:block">
                  {event.doorNote}
                </p>
              )}
            </div>
          </div>
        </aside>

        <section aria-labelledby="checkout-heading" className="min-w-0 px-4 py-6 sm:px-7 sm:py-8">
          <div className="mb-5 border-b border-white/10 pb-4 sm:mb-6 sm:pb-5">
            <h2
              id="checkout-heading"
              className="text-xl font-extrabold uppercase leading-tight tracking-[-0.035em] text-white sm:text-2xl"
            >
              {step === 1 ? 'Select tickets' : isFreeBooking ? 'Confirm your RSVP' : 'Your order'}
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-white/45">
              {step === 1
                ? 'Choose your entry.'
                : isFreeBooking
                  ? 'No payment is needed.'
                  : 'Review the final price before payment.'}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-2.5">
              {event.ticketTiers.map((tier) => {
                const quantity = quantities[tier.id] ?? 0;
                const soldOut = tier.maximumQuantity <= 0;
                const expanded = expandedTierId === tier.id;
                return (
                  <article
                    key={tier.id}
                    className={`overflow-hidden rounded-lg border transition-colors ${quantity > 0 ? accent.border : 'border-white/10'} ${soldOut ? 'bg-white/[0.03]' : 'bg-white/[0.07]'}`}
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => {
                        setExpandedTierId(expanded ? undefined : tier.id);
                      }}
                      className="flex min-h-[64px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <span className="min-w-0">
                        <span
                          className={`block text-sm font-extrabold uppercase tracking-[-0.01em] ${soldOut ? 'text-white/45 line-through decoration-white/30' : 'text-white'}`}
                        >
                          {tier.name}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-white/55">
                          {moneyFormatter.format(tier.price.amountPaise / 100)}
                          {tier.description ? (
                            <span className="font-normal text-white/35"> · {tier.description}</span>
                          ) : null}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {soldOut ? (
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold text-white/55">
                            Sold out
                          </span>
                        ) : quantity > 0 ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[9px] font-bold text-white ${accent.selected}`}
                          >
                            {quantity} selected
                          </span>
                        ) : null}
                        <span
                          aria-hidden="true"
                          className={`text-white/45 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        >
                          ⌄
                        </span>
                      </span>
                    </button>
                    {expanded && (
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3.5 py-3 sm:px-4">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                          {soldOut
                            ? 'This ticket tier is sold out'
                            : `Up to ${String(tier.maximumQuantity)} available`}
                        </span>
                        {!soldOut && (
                          <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-black/45 p-1">
                            <button
                              type="button"
                              aria-label={`Decrease ${tier.name} count`}
                              disabled={quantity === 0}
                              onClick={() => {
                                changeQuantity(tier.id, -1, tier.maximumQuantity);
                              }}
                              className="flex size-9 items-center justify-center rounded-full text-base font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-25"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-black text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${tier.name} count`}
                              disabled={quantity >= tier.maximumQuantity}
                              onClick={() => {
                                changeQuantity(tier.id, 1, tier.maximumQuantity);
                              }}
                              className="flex size-9 items-center justify-center rounded-full text-base font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-25"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
              {event.ticketTiers.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white/55">
                  Tickets are not available for this event right now.
                </p>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-xs text-white/50">
                  {totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'} ·{' '}
                  {moneyFormatter.format(subtotalPaise / 100)}
                </span>
                <button
                  type="button"
                  disabled={selectedTickets.length === 0}
                  onClick={() => {
                    setStep(2);
                  }}
                  className={`min-h-11 rounded-full px-5 text-[10px] font-black uppercase tracking-[0.14em] transition-all sm:px-6 sm:text-xs ${selectedTickets.length > 0 ? 'bg-white text-black hover:bg-white/90' : 'cursor-not-allowed bg-white/10 text-white/30'}`}
                >
                  Review order →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 sm:p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
                  Your order
                </p>
                <div className="mt-3 space-y-3">
                  {selectedTickets.map((ticket) => {
                    const quotedLine = quote?.lines.find((line) => line.tierId === ticket.id);
                    const lineDisplay =
                      wantsQuote && !quotedLine
                        ? '—'
                        : moneyFormatter.format(
                            (quotedLine?.subtotalPaise ??
                              ticket.price.amountPaise * ticket.quantity) / 100,
                          );
                    return (
                      <div
                        key={ticket.id}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <span className="min-w-0 text-white/75">
                          {ticket.quantity}× {ticket.name}
                        </span>
                        <span className="shrink-0 font-bold text-white">
                          <AnimatedValue value={lineDisplay} />
                        </span>
                      </div>
                    );
                  })}
                </div>
                <dl className="mt-4 space-y-2.5 border-t border-white/10 pt-3 text-xs">
                  <div className="flex justify-between gap-4 text-white/50">
                    <dt>Subtotal</dt>
                    <dd>
                      <AnimatedValue
                        value={
                          wantsQuote && !quote
                            ? '—'
                            : moneyFormatter.format((quote?.subtotalPaise ?? subtotalPaise) / 100)
                        }
                      />
                    </dd>
                  </div>
                  {discountPaise > 0 && (
                    <div className="flex justify-between gap-4 text-white/50">
                      <dt>Discount</dt>
                      <dd>
                        <AnimatedValue value={`−${moneyFormatter.format(discountPaise / 100)}`} />
                      </dd>
                    </div>
                  )}
                  <details className="group text-white/50">
                    <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 marker:hidden">
                      <span>Fees and taxes</span>
                      <span>
                        <AnimatedValue
                          value={
                            authoritativeFeesPaise === null
                              ? '—'
                              : moneyFormatter.format((authoritativeFeesPaise + gstPaise) / 100)
                          }
                        />{' '}
                        <span
                          aria-hidden="true"
                          className="ml-1 text-white/35 group-open:inline-block group-open:rotate-180"
                        >
                          ⌄
                        </span>
                      </span>
                    </summary>
                    <div className="space-y-2 border-t border-white/10 py-2 text-[11px]">
                      <div className="flex justify-between gap-4">
                        <dt>Platform and payment fees</dt>
                        <dd>
                          <AnimatedValue
                            value={
                              authoritativeFeesPaise === null
                                ? '—'
                                : moneyFormatter.format(authoritativeFeesPaise / 100)
                            }
                          />
                        </dd>
                      </div>
                      {gstPaise > 0 && (
                        <div className="flex justify-between gap-4">
                          <dt>GST on fees</dt>
                          <dd>
                            <AnimatedValue value={moneyFormatter.format(gstPaise / 100)} />
                          </dd>
                        </div>
                      )}
                    </div>
                  </details>
                  <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-3">
                    <dt className="font-black uppercase tracking-[0.14em] text-white/70">
                      Total due
                    </dt>
                    <dd className="text-xl font-black text-white sm:text-2xl">
                      <AnimatedValue
                        value={
                          quote
                            ? moneyFormatter.format(quote.grandTotalPaise / 100)
                            : isFreeBooking
                              ? moneyFormatter.format(0)
                              : '—'
                        }
                      />
                    </dd>
                  </div>
                </dl>
              </div>

              {isFreeBooking ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
                      Free RSVP · no payment needed
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/55">
                      Confirming reserves one ticket on your account. You must be logged in.
                    </p>
                  </div>
                  {totalTickets !== 1 && (
                    <p className="text-xs leading-5 text-amber-200/80">
                      RSVP admits one guest. Go back and select a single ticket.
                    </p>
                  )}
                  {rsvpError !== null && (
                    <p role="alert" className="text-xs text-red-300">
                      {rsvpError}
                    </p>
                  )}
                  {alreadyOnList && (
                    <p className="text-xs text-white/60">
                      You&apos;re already on the list —{' '}
                      <Link href="/tickets" className="underline hover:text-white">
                        view My Tickets
                      </Link>
                      .
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                      }}
                      className="min-h-10 text-left text-xs font-black uppercase tracking-[0.16em] text-white/50 hover:text-white"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={!canConfirmRsvp}
                      onClick={() => {
                        void confirmRsvp();
                      }}
                      className={`min-h-11 w-full rounded-full px-6 text-[10px] font-black uppercase tracking-[0.15em] text-black transition-all sm:w-auto sm:text-xs ${canConfirmRsvp ? 'bg-white hover:bg-white/90' : 'cursor-not-allowed bg-white/30'}`}
                    >
                      {rsvpStatus === 'posting' ? 'Reserving…' : 'Confirm RSVP'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {canPay ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 sm:p-4">
                      <label className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/55">
                        Promo code
                        <span className="mt-2 flex gap-2">
                          <input
                            value={promoInput}
                            onChange={(inputEvent) => {
                              setPromoInput(inputEvent.target.value);
                            }}
                            placeholder="Enter code"
                            className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/15 bg-black/35 px-3 text-sm text-white outline-none focus:border-white/40"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo(promoInput.trim() || null);
                              setRequoteCount((count) => count + 1);
                            }}
                            className="min-h-11 rounded-lg border border-white/20 px-4 text-[9px] font-black uppercase tracking-[0.13em] text-white"
                          >
                            Apply
                          </button>
                        </span>
                      </label>
                      {quote?.appliedPromoCode ? (
                        <p className="mt-3 text-xs text-emerald-300">
                          Promo {quote.appliedPromoCode} applied.
                        </p>
                      ) : appliedPromo && quoteState === 'ready' ? (
                        <p className="mt-3 text-xs text-amber-300">
                          That promo could not be applied to this order.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
                        Tickets unavailable
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/55">
                        This event is not open for online purchase right now.
                      </p>
                    </div>
                  )}
                  {canPay && (
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3.5 sm:p-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-8 items-center justify-center rounded-full border border-white/10 text-sm text-white/70"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="size-4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <rect x="5" y="10" width="14" height="11" rx="2" />
                            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">Secure payment</p>
                          <p className="mt-0.5 text-[10px] leading-4 text-white/45">
                            Payment opens in Razorpay&apos;s secure checkout.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {quoteState === 'loading' && (
                    <p role="status" className="text-xs text-white/50">
                      Calculating your total…
                    </p>
                  )}
                  {quoteState === 'error' && (
                    <p role="alert" className="text-xs leading-5 text-red-300">
                      {appliedPromo
                        ? 'This promo could not be applied, so we could not calculate your total. Clear the code and select Apply to retry without it.'
                        : 'We could not price your order. Check you are signed in, then go back and try again.'}
                    </p>
                  )}
                  {payMessage !== null && (
                    <p role="alert" className="text-xs leading-5 text-red-300">
                      {payMessage}
                    </p>
                  )}
                  {payState === 'processing' && (
                    <p role="status" className="text-xs leading-5 text-white/70">
                      Checkout in progress. We are checking server confirmation and issued tickets
                      should appear in{' '}
                      <Link href="/tickets" className="underline hover:text-white">
                        My Tickets
                      </Link>{' '}
                      within a few minutes. If they do not, contact support and quote your payment
                      confirmation from Razorpay.
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      disabled={payState !== 'idle'}
                      onClick={() => {
                        setStep(1);
                      }}
                      className="min-h-10 text-left text-xs font-black uppercase tracking-[0.16em] text-white/50 hover:text-white disabled:opacity-30"
                    >
                      ← Edit tickets
                    </button>
                    {canPay ? (
                      <button
                        type="button"
                        disabled={quoteState !== 'ready' || payState !== 'idle'}
                        onClick={() => {
                          void pay();
                        }}
                        className={`min-h-11 w-full rounded-full px-6 text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-xl sm:w-auto sm:text-xs ${quoteState === 'ready' && payState === 'idle' ? 'bg-white text-black hover:bg-white/90' : 'cursor-not-allowed bg-white/30 text-black/50'}`}
                      >
                        {payState === 'paying'
                          ? 'Opening payment…'
                          : quote
                            ? `Pay ${moneyFormatter.format(quote.grandTotalPaise / 100)}`
                            : 'Pay securely'}
                      </button>
                    ) : (
                      <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-6 text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
                        Checkout unavailable
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AnimatedValue({ value }: { value: string }) {
  return (
    <span key={value} className="checkout-number-roll inline-block">
      {value}
    </span>
  );
}
