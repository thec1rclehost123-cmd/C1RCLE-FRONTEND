'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { rsvpResponseSchema } from '@c1rcle/contracts';

import { getEventAccentClasses } from '@/features/event-detail/eventDetailPalette';
import { bffClient } from '@/lib/bff/bff-client';

import { fetchQuote, paidCheckoutDeps } from '../payment/checkout-api';
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

type CheckoutStep = 1 | 2 | 3;
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
  const requestedTier = initialTierId ?? searchParams.get('tier') ?? undefined;
  const initialTier = event.ticketTiers.some((tier) => tier.id === requestedTier)
    ? requestedTier
    : event.ticketTiers[0]?.id;
  const [step, setStep] = useState<CheckoutStep>(1);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    if (!initialTier) return {};
    // Never pre-select more than the live availability captured at render.
    const max = event.ticketTiers.find((tier) => tier.id === initialTier)?.maximumQuantity ?? 0;
    return max > 0 ? { [initialTier]: 1 } : {};
  });
  const [attendee, setAttendee] = useState({ name: '', email: '', phone: '' });
  // The server's price for ONE selection. It is keyed by that selection, so a
  // result for different tickets can never be shown or paid against.
  const [quoteResult, setQuoteResult] = useState<{
    key: string;
    quote: CheckoutQuoteResponse | null;
  } | null>(null);
  const [requoteCount, setRequoteCount] = useState(0);
  const [payState, setPayState] = useState<PayState>('idle');
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
  // A ₹0 total means every selected tier is free — the only booking this
  // client fulfills for real (direct RSVP, no payment provider). Anything
  // priced stays on the preview confirmation path.
  const isFreeBooking = selectedTickets.length > 0 && subtotalPaise === 0;
  // The server fulfills exactly one RSVP ticket per account per event.
  const canConfirmRsvp = isFreeBooking && totalTickets === 1 && rsvpStatus === 'idle';

  const canPay = event.purchasable === true && !isFreeBooking;
  const lines = useMemo(
    () => selectedTickets.map((ticket) => ({ tierId: ticket.id, quantity: ticket.quantity })),
    [selectedTickets],
  );
  const lineSignature = lines.map((line) => `${line.tierId}:${String(line.quantity)}`).join(',');

  const wantsQuote = step === 3 && canPay && lines.length > 0;
  const quoteKey = `${event.eventId}|${lineSignature}|${String(requoteCount)}`;
  const currentQuote = quoteResult?.key === quoteKey ? quoteResult : null;
  const quote = wantsQuote ? (currentQuote?.quote ?? null) : null;
  const quoteState: QuoteState = !wantsQuote
    ? 'idle'
    : currentQuote === null
      ? 'loading'
      : currentQuote.quote === null
        ? 'error'
        : 'ready';

  // Until the server has priced the selection, the summary shows an estimate.
  // Once a quote arrives its numbers (fees and GST included) replace it.
  const estimatedFeesPaise = Math.round(subtotalPaise * 0.05);
  const previewFeesPaise = quote
    ? quote.platformFeePaise + quote.paymentFeePaise
    : estimatedFeesPaise;
  const gstPaise = quote?.gstPaise ?? 0;
  const discountPaise = quote?.discountPaise ?? 0;
  const previewTotalPaise = quote ? quote.grandTotalPaise : subtotalPaise + estimatedFeesPaise;
  // Price the selection on the server when the buyer reaches the payment step.
  useEffect(() => {
    if (!wantsQuote) return;
    let cancelled = false;
    fetchQuote({ eventId: event.eventId, lines })
      .then((result) => {
        if (!cancelled) setQuoteResult({ key: quoteKey, quote: result });
      })
      .catch(() => {
        if (!cancelled) setQuoteResult({ key: quoteKey, quote: null });
      });
    return () => {
      cancelled = true;
    };
  }, [wantsQuote, quoteKey, event.eventId, lines]);

  async function pay() {
    if (!quote || payState !== 'idle') return;
    if (attemptKey.current?.forQuote !== quoteKey) {
      attemptKey.current = { forQuote: quoteKey, value: crypto.randomUUID() };
    }
    setPayState('paying');
    setPayMessage(null);
    const prefill = {
      ...(attendee.name ? { name: attendee.name } : {}),
      ...(attendee.email ? { email: attendee.email } : {}),
      ...(attendee.phone ? { contact: attendee.phone } : {}),
    };
    const result = await runPaidCheckout(paidCheckoutDeps, {
      eventId: event.eventId,
      eventTitle: event.title,
      lines,
      expectedTotalPaise: quote.grandTotalPaise,
      idempotencyKey: attemptKey.current.value,
      prefill,
    });

    switch (result.kind) {
      case 'confirmed':
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

  function csrfHeader(): Record<string, string> {
    if (typeof document === 'undefined') return {};
    const match = /(?:^|;\s*)(?:[a-zA-Z0-9_-]+\.)?c1rcle\.csrf=([^;]+)/.exec(document.cookie);
    return match?.[1] ? { 'x-csrf-token': decodeURIComponent(match[1]) } : {};
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
        headers: csrfHeader(),
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
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section
        aria-labelledby="checkout-heading"
        className={`rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl sm:p-7 ${accent.borderStrong} ${accent.panelShadow}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className={`text-[9px] font-black uppercase tracking-[0.28em] ${accent.text}`}>
              Step {String(step).padStart(2, '0')} of 03
            </p>
            <h1
              id="checkout-heading"
              className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl"
            >
              {step === 1 && 'Select tickets'}
              {step === 2 && 'Your details'}
              {step === 3 && 'Payment options'}
            </h1>
          </div>
          <ol aria-label="Checkout progress" className="flex items-center gap-2">
            {[1, 2, 3].map((item) => (
              <li
                key={item}
                aria-current={step === item ? 'step' : undefined}
                className={`flex size-9 items-center justify-center rounded-full border text-[10px] font-black ${
                  step === item ? `${accent.selected} text-white` : 'border-white/10 text-white/30'
                }`}
              >
                {item}
              </li>
            ))}
          </ol>
        </div>

        {step === 1 && (
          <div className="mt-8 space-y-3">
            {event.ticketTiers.map((tier) => {
              const quantity = quantities[tier.id] ?? 0;
              return (
                <article
                  key={tier.id}
                  className={`flex flex-col gap-5 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    quantity > 0 ? accent.selected : 'border-white/10 bg-white/[0.035]'
                  }`}
                >
                  <div>
                    <h2 className="text-lg font-black uppercase text-white">{tier.name}</h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/35">
                      {tier.description}
                    </p>
                    <p className="mt-3 text-sm font-black text-white">
                      {moneyFormatter.format(tier.price.amountPaise / 100)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 sm:hidden">
                      Quantity
                    </span>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-1">
                      <button
                        type="button"
                        aria-label={`Decrease ${tier.name} count`}
                        disabled={quantity === 0}
                        onClick={() => {
                          changeQuantity(tier.id, -1, tier.maximumQuantity);
                        }}
                        className="flex size-8 items-center justify-center rounded-full text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-20"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-black text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${tier.name} count`}
                        disabled={quantity >= tier.maximumQuantity}
                        onClick={() => {
                          changeQuantity(tier.id, 1, tier.maximumQuantity);
                        }}
                        className="flex size-8 items-center justify-center rounded-full text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-20"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={selectedTickets.length === 0}
                onClick={() => {
                  setStep(2);
                }}
                className={`rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  selectedTickets.length > 0
                    ? `${accent.selected} text-white shadow-lg`
                    : 'cursor-not-allowed bg-white/10 text-white/30'
                }`}
              >
                Continue to details →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (attendee.name && attendee.email) {
                setStep(3);
              }
            }}
            className="mt-8 space-y-4"
          >
            <PreviewField
              label="Full Name"
              type="text"
              value={attendee.name}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, name: value }));
              }}
            />
            <PreviewField
              label="Email Address"
              type="email"
              value={attendee.email}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, email: value }));
              }}
            />
            <PreviewField
              label="Phone Number"
              type="tel"
              value={attendee.phone}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, phone: value }));
              }}
            />

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                }}
                className="text-xs font-black uppercase tracking-[0.2em] text-white/50 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={!attendee.name || !attendee.email}
                className={`rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  attendee.name && attendee.email
                    ? `${accent.selected} text-white shadow-lg`
                    : 'cursor-not-allowed bg-white/10 text-white/30'
                }`}
              >
                Proceed to payment →
              </button>
            </div>
          </form>
        )}

        {step === 3 && isFreeBooking && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-white">
                Free RSVP — no payment needed
              </p>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Confirming reserves one ticket on your account. You must be logged in.
              </p>
            </div>

            {totalTickets !== 1 && (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                RSVP admits one guest — select a single ticket to continue.
              </p>
            )}
            {rsvpError !== null && (
              <p
                role="alert"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400"
              >
                {rsvpError}
              </p>
            )}
            {alreadyOnList && (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                You&apos;re already on the list —{' '}
                <Link href="/tickets" className="underline hover:text-white">
                  view My Tickets
                </Link>
                .
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                }}
                className="text-xs font-black uppercase tracking-[0.2em] text-white/50 hover:text-white"
              >
                ← Back to details
              </button>
              <button
                type="button"
                disabled={!canConfirmRsvp}
                onClick={() => {
                  void confirmRsvp();
                }}
                className={`rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl ${
                  canConfirmRsvp ? accent.selected : 'cursor-not-allowed bg-white/10 text-white/30'
                }`}
              >
                {rsvpStatus === 'posting' ? 'Reserving…' : 'Confirm RSVP →'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && !isFreeBooking && (
          <div className="mt-8 space-y-6">
            {canPay ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white">
                  Secure payment by Razorpay
                </p>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  Pay by card, UPI or net banking in Razorpay&apos;s secure window. Your payment
                  details never reach C1RCLE.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white">
                  Preview only
                </p>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  This event is not open for online purchase yet.
                </p>
              </div>
            )}

            {quoteState === 'loading' && (
              <p
                role="status"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40"
              >
                Calculating your total…
              </p>
            )}
            {quoteState === 'error' && (
              <p
                role="alert"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400"
              >
                We could not price your order. Check you are signed in, then go back and try again.
              </p>
            )}
            {payMessage !== null && (
              <p
                role="alert"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400"
              >
                {payMessage}
              </p>
            )}
            {payState === 'processing' && (
              <p role="status" className="text-xs leading-5 text-white/70">
                Payment received. We are confirming your tickets and they should appear in{' '}
                <Link href="/tickets" className="underline hover:text-white">
                  My Tickets
                </Link>{' '}
                within a few minutes. If they do not, contact support and quote your payment
                confirmation from Razorpay.
              </p>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <button
                type="button"
                disabled={payState !== 'idle'}
                onClick={() => {
                  setStep(2);
                }}
                className="text-xs font-black uppercase tracking-[0.2em] text-white/50 hover:text-white disabled:opacity-30"
              >
                ← Back to details
              </button>
              {canPay ? (
                <button
                  type="button"
                  disabled={quoteState !== 'ready' || payState !== 'idle'}
                  onClick={() => {
                    void pay();
                  }}
                  className={`rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl ${
                    quoteState === 'ready' && payState === 'idle'
                      ? accent.selected
                      : 'cursor-not-allowed bg-white/10 text-white/30'
                  }`}
                >
                  {payState === 'paying'
                    ? 'Opening payment…'
                    : quote
                      ? `Pay ${moneyFormatter.format(quote.grandTotalPaise / 100)} →`
                      : 'Pay →'}
                </button>
              ) : (
                <Link
                  href={`/confirmation/preview-${event.id}`}
                  className={`rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl ${accent.selected}`}
                >
                  Complete Payment →
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/65 backdrop-blur-xl">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={event.image}
            alt={event.title}
            fill
            unoptimized
            sizes="(max-width: 1024px) 100vw, 390px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute inset-x-5 bottom-5">
            <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${accent.text}`}>
              Booking summary
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase text-white">{event.title}</h2>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold text-white/60">
            {dateFormatter.format(new Date(event.startsAt))}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {event.venue} · {event.city}
          </p>

          <div className="mt-5 space-y-3 border-y border-white/10 py-5">
            {selectedTickets.length > 0 ? (
              selectedTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-white/55">
                    {ticket.name} × {ticket.quantity}
                  </span>
                  <span className="font-bold text-white">
                    <AnimatedValue
                      value={moneyFormatter.format(
                        (ticket.price.amountPaise * ticket.quantity) / 100,
                      )}
                    />
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs uppercase tracking-[0.18em] text-white/25">
                No tickets selected
              </p>
            )}
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-white/45">
              <dt>Subtotal</dt>
              <dd>
                <AnimatedValue value={moneyFormatter.format(subtotalPaise / 100)} />
              </dd>
            </div>
            {discountPaise > 0 && (
              <div className="flex justify-between gap-4 text-white/45">
                <dt>Discount</dt>
                <dd>
                  <AnimatedValue value={`-${moneyFormatter.format(discountPaise / 100)}`} />
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4 text-white/45">
              <dt>{quote ? 'Fees' : 'Fees (estimate)'}</dt>
              <dd>
                <AnimatedValue value={moneyFormatter.format(previewFeesPaise / 100)} />
              </dd>
            </div>
            {gstPaise > 0 && (
              <div className="flex justify-between gap-4 text-white/45">
                <dt>GST on fees</dt>
                <dd>
                  <AnimatedValue value={moneyFormatter.format(gstPaise / 100)} />
                </dd>
              </div>
            )}
            <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
              <dt className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
                Total
              </dt>
              <dd className="text-3xl font-black text-white">
                <AnimatedValue value={moneyFormatter.format(previewTotalPaise / 100)} />
              </dd>
            </div>
          </dl>

          <p className="mt-5 rounded-xl bg-white/[0.04] p-3 text-[10px] leading-5 text-white/35">
            {event.doorNote}
          </p>
        </div>
      </aside>
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

function PreviewField({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: 'email' | 'tel' | 'text';
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/30 motion-reduce:transition-none"
      />
    </label>
  );
}
