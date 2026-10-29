'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { isApiClientError } from '@c1rcle/api-client';
import { useSession } from '@c1rcle/auth';
import {
  checkoutQuoteResponseSchema,
  publicTicketAddonListResponseSchema,
  publicTicketTierListResponseSchema,
  rsvpResponseSchema,
} from '@c1rcle/contracts';

import { usePromoterReferralContext } from '@/features/event-detail/components/PromoterClickTracker';
import { getEventAccentClasses } from '@/features/event-detail/eventDetailPalette';
import { useTicketAccessGrantId } from '@/lib/access/use-ticket-access-grant-id';
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
import type { CheckoutHoldResponse, CheckoutQuoteResponse } from '@c1rcle/contracts';

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

const acceptedWaitlistOfferSchema = z.object({
  entry: z.object({ eventId: z.string(), tierId: z.string() }),
  holdId: z.string(),
  expiresAt: z.iso.datetime(),
  pricing: checkoutQuoteResponseSchema,
});

export function CheckoutFlowClient(props: {
  event: BookingEventFixture;
  initialTierId?: string | undefined;
  eventSlug?: string;
}) {
  const accessGrantId = useTicketAccessGrantId();
  return (
    <CheckoutFlowClientState
      key={accessGrantId ?? 'public'}
      {...props}
      {...(accessGrantId ? { accessGrantId } : {})}
    />
  );
}

function CheckoutFlowClientState({
  event,
  initialTierId,
  eventSlug = event.eventId,
  accessGrantId,
}: {
  event: BookingEventFixture;
  initialTierId?: string | undefined;
  eventSlug?: string;
  accessGrantId?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSession();
  const requestedTier = initialTierId ?? searchParams.get('tier') ?? undefined;
  const upgradeFromEntitlementId = searchParams.get('upgradeFromEntitlementId') ?? undefined;
  const [unlockedTiers, setUnlockedTiers] = useState<BookingEventFixture['ticketTiers']>([]);
  const ticketTiers = useMemo(
    () => [...event.ticketTiers, ...unlockedTiers],
    [event.ticketTiers, unlockedTiers],
  );
  const [ticketAddons, setTicketAddons] = useState<BookingEventFixture['ticketAddons']>(
    event.ticketAddons ?? [],
  );
  const queryReferralCode = searchParams.get('ref');
  const storedReferralCode = usePromoterReferralContext(eventSlug);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const requestedReferralCode = upgradeFromEntitlementId
    ? null
    : (queryReferralCode ?? storedReferralCode);
  const referralCode = requestedReferralCode;
  const initialTier = ticketTiers.some((tier) => tier.id === requestedTier)
    ? requestedTier
    : accessGrantId && requestedTier
      ? undefined
      : ticketTiers[0]?.id;
  const [step, setStep] = useState<CheckoutStep>(1);
  const [expandedTierId, setExpandedTierId] = useState<string | undefined>(initialTier);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    if (!initialTier) return {};
    // Never pre-select more than the live availability captured at render.
    const max = ticketTiers.find((tier) => tier.id === initialTier)?.maximumQuantity ?? 0;
    return max > 0 ? { [initialTier]: 1 } : {};
  });
  const [addonQuantities, setAddonQuantities] = useState<Record<string, Record<string, number>>>(
    {},
  );
  // The server's price for ONE selection. It is keyed by that selection, so a
  // result for different tickets can never be shown or paid against.
  const [quoteResult, setQuoteResult] = useState<{
    key: string;
    quote: CheckoutQuoteResponse | null;
  } | null>(null);
  const [reservedWaitlistOffer, setReservedWaitlistOffer] = useState<{
    eventId: string;
    tierId: string;
    holdId: string;
    expiresAt: string;
    pricing: CheckoutQuoteResponse;
  } | null>(null);
  const [requoteCount, setRequoteCount] = useState(0);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [payState, setPayState] = useState<PayState>(() =>
    event.purchasable && event.ticketTiers.some((tier) => tier.price.amountPaise > 0)
      ? 'processing'
      : 'idle',
  );
  // One key per checkout attempt: a double-click or a retry replays the same
  // hold and payment order instead of reserving and charging twice. A new
  // selection (or a re-quote) is a new attempt, so it gets a new key.
  const attemptKey = useRef<{ forQuote: string; value: string } | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'posting'>('idle');
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [eligibilityAttestedFor, setEligibilityAttestedFor] = useState<string | null>(null);
  const [alreadyOnList, setAlreadyOnList] = useState(false);
  const accent = getEventAccentClasses(event.accentTone);

  useEffect(() => {
    if (searchParams.get('waitlist') !== '1') return;
    const entryId = sessionStorage.getItem('c1rcle.waitlist.accepted-entry-id');
    if (!entryId) {
      void Promise.resolve().then(() => {
        setPayMessage(
          'This waitlist reservation is unavailable. Return to Tickets and refresh your waitlist.',
        );
      });
      return;
    }
    let cancelled = false;
    void bffClient
      .get({
        path: `/api/waitlist/${encodeURIComponent(entryId)}`,
        schema: acceptedWaitlistOfferSchema,
        retries: 0,
      })
      .then((offer) => {
        if (cancelled) return;
        if (offer.entry.eventId !== event.eventId || Date.parse(offer.expiresAt) <= Date.now()) {
          sessionStorage.removeItem('c1rcle.waitlist.accepted-entry-id');
          setPayMessage(
            'This waitlist reservation expired. Return to Tickets to check for another offer.',
          );
          return;
        }
        setReservedWaitlistOffer({
          eventId: offer.entry.eventId,
          tierId: offer.entry.tierId,
          holdId: offer.holdId,
          expiresAt: offer.expiresAt,
          pricing: offer.pricing,
        });
        setExpandedTierId(offer.entry.tierId);
        setQuantities({ [offer.entry.tierId]: 1 });
        setStep(2);
      })
      .catch(() => {
        if (!cancelled)
          setPayMessage(
            'This waitlist reservation could not be loaded. Return to Tickets and refresh your waitlist.',
          );
      });
    return () => {
      cancelled = true;
    };
  }, [event.eventId, searchParams]);

  useEffect(() => {
    if (!accessGrantId) return;
    let cancelled = false;
    void bffClient
      .get({
        path: `/api/public/events/${encodeURIComponent(event.eventId)}/tiers`,
        headers: { 'x-ticket-access-grant-id': accessGrantId },
        schema: publicTicketTierListResponseSchema,
      })
      .then((response) => {
        if (cancelled) return;
        const mapped = response.items.map((tier) => ({
          id: tier.id,
          name: tier.name,
          description: tier.description,
          price: { amountPaise: tier.priceInPaise, currency: 'INR' as const },
          ...(tier.coverAmountPaise === undefined
            ? {}
            : { coverAmountPaise: tier.coverAmountPaise }),
          maximumQuantity: Math.min(10, tier.availableQuantity),
          ...(tier.guestCount === undefined ? {} : { guestCount: tier.guestCount }),
          ...(tier.admissionMode === undefined ? {} : { admissionMode: tier.admissionMode }),
          ...(tier.audienceType === undefined ? {} : { audienceType: tier.audienceType }),
          ...(tier.minAge === undefined ? {} : { minAge: tier.minAge }),
          ...(tier.maxAge === undefined ? {} : { maxAge: tier.maxAge }),
        }));
        setUnlockedTiers(mapped);
        if (requestedTier && mapped.some((tier) => tier.id === requestedTier)) {
          const selected = mapped.find((tier) => tier.id === requestedTier);
          if (selected && selected.maximumQuantity > 0) {
            setExpandedTierId(requestedTier);
            setQuantities({ [requestedTier]: 1 });
          }
        }
      })
      .catch(() => {
        if (!cancelled)
          setPayMessage(
            'This private ticket access has expired or been revoked. Return to the event and unlock it again.',
          );
      });
    return () => {
      cancelled = true;
    };
  }, [accessGrantId, event.eventId, requestedTier]);

  useEffect(() => {
    if (!accessGrantId) return;
    let cancelled = false;
    void bffClient
      .get({
        path: `/api/public/events/${encodeURIComponent(event.eventId)}/ticket-addons`,
        headers: { 'x-ticket-access-grant-id': accessGrantId },
        schema: publicTicketAddonListResponseSchema,
      })
      .then((response) => {
        if (!cancelled)
          setTicketAddons(
            response.items.map((addon) => ({
              id: addon.id,
              name: addon.name,
              description: addon.description,
              kind: addon.kind,
              priceInPaise: addon.priceInPaise,
              availableQuantity: addon.availableQuantity,
              maxPerEntitlement: addon.maxPerEntitlement,
            })),
          );
      })
      .catch(() => {
        if (!cancelled) setTicketAddons([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessGrantId, event.eventId]);

  const selectedTickets = useMemo(
    () =>
      ticketTiers
        .map((tier) => ({ ...tier, quantity: quantities[tier.id] ?? 0 }))
        .filter((tier) => tier.quantity > 0),
    [ticketTiers, quantities],
  );
  const subtotalPaise = selectedTickets.reduce(
    (total, tier) =>
      total +
      (tier.price.amountPaise +
        (tier.coverAmountPaise ?? 0) *
          (tier.admissionMode === 'per_person' ? (tier.guestCount ?? 1) : 1)) *
        tier.quantity +
      (ticketAddons ?? []).reduce((sum, addon) => {
        const selected = addonQuantities[tier.id]?.[addon.id] ?? 0;
        const entitlementCount =
          tier.quantity * (tier.admissionMode === 'per_person' ? (tier.guestCount ?? 1) : 1);
        return sum + addon.priceInPaise * selected * entitlementCount;
      }, 0),
    0,
  );
  const totalTickets = selectedTickets.reduce((total, tier) => total + tier.quantity, 0);
  const soleSelectedTicket = selectedTickets.length === 1 ? selectedTickets[0] : undefined;
  const usesReservedOffer =
    reservedWaitlistOffer?.eventId === event.eventId &&
    soleSelectedTicket?.id === reservedWaitlistOffer.tierId &&
    soleSelectedTicket.quantity === 1;
  // A ₹0 total is fulfilled as RSVP without the payment provider. Paid
  // selections proceed only when the authoritative event mapping allows it.
  const isFreeBooking =
    selectedTickets.length > 0 && subtotalPaise === 0 && !upgradeFromEntitlementId;
  // The server fulfills exactly one RSVP ticket per account per event.
  const canConfirmRsvp = isFreeBooking && totalTickets === 1 && rsvpStatus === 'idle';
  const restrictedTickets = selectedTickets.filter(
    (ticket) =>
      (ticket.audienceType !== undefined &&
        ticket.audienceType !== 'GENERAL' &&
        ticket.audienceType !== 'GROUP') ||
      ticket.minAge != null ||
      ticket.maxAge != null,
  );
  const eligibilityRequired = restrictedTickets.length > 0;
  const eligibilitySignature = restrictedTickets
    .map(
      (ticket) =>
        `${ticket.id}:${String(ticket.quantity)}:${ticket.audienceType ?? 'GENERAL'}:${String(ticket.minAge ?? '')}:${String(ticket.maxAge ?? '')}`,
    )
    .join('|');
  const eligibilityAttested = eligibilityAttestedFor === eligibilitySignature;
  const eligibilityReady = usesReservedOffer || !eligibilityRequired || eligibilityAttested;

  const canPay = (event.purchasable === true || unlockedTiers.length > 0) && !isFreeBooking;
  const lines = useMemo(
    () =>
      selectedTickets.map((ticket) => ({
        tierId: ticket.id,
        quantity: ticket.quantity,
        ...(accessGrantId ? { accessGrantId } : {}),
        ...(eligibilityRequired && eligibilityAttested ? { eligibilityAttested: true } : {}),
        ...((ticketAddons ?? []).some((addon) => (addonQuantities[ticket.id]?.[addon.id] ?? 0) > 0)
          ? {
              ticketAddons: (ticketAddons ?? [])
                .map((addon) => ({
                  addonId: addon.id,
                  quantityPerEntitlement: addonQuantities[ticket.id]?.[addon.id] ?? 0,
                }))
                .filter((addon) => addon.quantityPerEntitlement > 0),
            }
          : {}),
      })),
    [
      selectedTickets,
      accessGrantId,
      eligibilityRequired,
      eligibilityAttested,
      ticketAddons,
      addonQuantities,
    ],
  );
  const lineSignature = lines
    .map(
      (line) =>
        `${line.tierId}:${String(line.quantity)}:${accessGrantId ?? ''}:${(line.ticketAddons ?? []).map((addon) => `${addon.addonId}=${String(addon.quantityPerEntitlement)}`).join('|')}`,
    )
    .join(',');

  const wantsQuote = step === 2 && canPay && lines.length > 0;
  const quoteKey = `${event.eventId}|${lineSignature}|${upgradeFromEntitlementId ?? ''}|${appliedPromo ?? ''}|${referralCode ?? ''}|${String(requoteCount)}`;
  const currentQuote = quoteResult?.key === quoteKey ? quoteResult : null;
  const quote = wantsQuote
    ? usesReservedOffer
      ? reservedWaitlistOffer.pricing
      : (currentQuote?.quote ?? null)
    : null;
  const quoteState: QuoteState = !wantsQuote
    ? 'idle'
    : usesReservedOffer
      ? 'ready'
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
    if (!wantsQuote || usesReservedOffer) return;
    let cancelled = false;
    fetchQuote({
      eventId: event.eventId,
      lines,
      ...(upgradeFromEntitlementId ? { upgradeFromEntitlementId } : {}),
      ...(appliedPromo ? { promoCode: appliedPromo } : {}),
      ...(referralCode ? { referralCode } : {}),
    })
      .then((result) => {
        if (!cancelled) {
          setQuoteResult({ key: quoteKey, quote: result });
        }
      })
      .catch(() => {
        if (!cancelled) setQuoteResult({ key: quoteKey, quote: null });
      });
    return () => {
      cancelled = true;
    };
  }, [
    wantsQuote,
    usesReservedOffer,
    quoteKey,
    event.eventId,
    lines,
    appliedPromo,
    referralCode,
    upgradeFromEntitlementId,
  ]);

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
      ...(referralCode ? { referralCode } : {}),
      ...(upgradeFromEntitlementId ? { upgradeFromEntitlementId } : {}),
      ...(usesReservedOffer
        ? {
            reservedHold: {
              holdId: reservedWaitlistOffer.holdId,
              expiresAt: reservedWaitlistOffer.expiresAt,
              status: 'active',
              convertedOrderId: null,
              pricing: reservedWaitlistOffer.pricing,
            } satisfies CheckoutHoldResponse,
          }
        : {}),
    });

    switch (result.kind) {
      case 'confirmed':
        sessionStorage.removeItem('c1rcle.waitlist.accepted-entry-id');
        await clearPaymentRecovery().catch(() => undefined);
        router.push(`/confirmation/${encodeURIComponent(result.orderId)}`);
        return;
      case 'processing':
        sessionStorage.removeItem('c1rcle.waitlist.accepted-entry-id');
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
        sessionStorage.removeItem('c1rcle.waitlist.accepted-entry-id');
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
        body: {
          eventId: event.eventId,
          tierId: ticket.id,
          ...(eligibilityRequired && eligibilityAttested ? { eligibilityAttested: true } : {}),
          ...(accessGrantId ? { accessGrantId } : {}),
          ...(referralCode ? { referralCode } : {}),
        },
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
    setQuantities((current) => {
      const quantity = Math.max(
        0,
        Math.min(upgradeFromEntitlementId ? 1 : maximum, (current[tierId] ?? 0) + change),
      );
      return upgradeFromEntitlementId
        ? { ...(quantity > 0 ? { [tierId]: quantity } : {}) }
        : { ...current, [tierId]: quantity };
    });
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

      {upgradeFromEntitlementId ? (
        <div className="mb-4 rounded-xl border border-[#FF6842]/25 bg-[#FF6842]/[0.07] px-4 py-3 text-xs leading-5 text-white/70">
          Choose one higher ticket tier. We’ll show the server-calculated upgrade price before
          payment. Your current ticket stays valid unless payment succeeds.
        </div>
      ) : null}

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
              {ticketTiers.map((tier) => {
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
                          {(tier.coverAmountPaise ?? 0) > 0 ? (
                            <span className="font-normal text-white/40">
                              {' '}
                              + {moneyFormatter.format((tier.coverAmountPaise ?? 0) / 100)} cover
                              per attendee
                            </span>
                          ) : null}
                          {tier.description ? (
                            <span className="font-normal text-white/35"> · {tier.description}</span>
                          ) : null}
                        </span>
                        {tier.admissionMode === 'per_person' && (tier.guestCount ?? 1) > 1 ? (
                          <span className="mt-1 block text-[10px] font-medium leading-4 text-white/50">
                            Group of {String(tier.guestCount)} · each attendee gets a separate pass
                          </span>
                        ) : null}
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
                      <div className="space-y-3 border-t border-white/10 px-3.5 py-3 sm:px-4">
                        <div className="flex items-center justify-between gap-3">
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
                        {(ticketAddons ?? []).length > 0 &&
                          !soldOut &&
                          tier.price.amountPaise > 0 && (
                            <fieldset className="space-y-2 border-t border-white/10 pt-3">
                              <legend className="px-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                                Optional extras per ticket
                              </legend>
                              {(ticketAddons ?? []).map((addon) => {
                                const selected = addonQuantities[tier.id]?.[addon.id] ?? 0;
                                const unavailable = addon.availableQuantity <= 0;
                                return (
                                  <div
                                    key={addon.id}
                                    className="flex items-center justify-between gap-3 rounded-md bg-black/25 px-2.5 py-2"
                                  >
                                    <span className="min-w-0">
                                      <span className="block text-xs font-bold text-white/80">
                                        {addon.name}
                                      </span>
                                      <span className="block text-[10px] text-white/40">
                                        {moneyFormatter.format(addon.priceInPaise / 100)} each
                                        {addon.description ? ` · ${addon.description}` : ''}
                                      </span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-2">
                                      {unavailable ? (
                                        <span className="text-[9px] font-bold uppercase text-white/35">
                                          Sold out
                                        </span>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            aria-label={`Decrease ${addon.name} for ${tier.name}`}
                                            disabled={selected === 0}
                                            onClick={() => {
                                              setAddonQuantities((current) => ({
                                                ...current,
                                                [tier.id]: {
                                                  ...current[tier.id],
                                                  [addon.id]: selected - 1,
                                                },
                                              }));
                                            }}
                                            className="flex size-8 items-center justify-center rounded-full border border-white/10 text-sm text-white disabled:opacity-25"
                                          >
                                            −
                                          </button>
                                          <span className="w-4 text-center text-xs font-bold text-white">
                                            {selected}
                                          </span>
                                          <button
                                            type="button"
                                            aria-label={`Increase ${addon.name} for ${tier.name}`}
                                            disabled={selected >= addon.maxPerEntitlement}
                                            onClick={() => {
                                              setAddonQuantities((current) => ({
                                                ...current,
                                                [tier.id]: {
                                                  ...current[tier.id],
                                                  [addon.id]: selected + 1,
                                                },
                                              }));
                                            }}
                                            className="flex size-8 items-center justify-center rounded-full border border-white/10 text-sm text-white disabled:opacity-25"
                                          >
                                            +
                                          </button>
                                        </>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </fieldset>
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
                              (ticket.price.amountPaise +
                                (ticket.coverAmountPaise ?? 0) *
                                  (ticket.admissionMode === 'per_person'
                                    ? (ticket.guestCount ?? 1)
                                    : 1)) *
                                ticket.quantity) / 100,
                          );
                    return (
                      <div
                        key={ticket.id}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <span className="min-w-0 text-white/75">
                          {ticket.quantity}× {ticket.name}
                          {quotedLine?.admissionSubtotalPaise !== undefined ? (
                            <span className="mt-1 block text-[11px] text-white/40">
                              Admission{' '}
                              {moneyFormatter.format(quotedLine.admissionSubtotalPaise / 100)}
                              {(quotedLine.coverSubtotalPaise ?? 0) > 0
                                ? ` · Cover ${moneyFormatter.format((quotedLine.coverSubtotalPaise ?? 0) / 100)}`
                                : ''}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 font-bold text-white">
                          <AnimatedValue value={lineDisplay} />
                        </span>
                      </div>
                    );
                  })}
                </div>
                {eligibilityRequired && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-xs leading-5 text-white/70">
                    <p className="mb-2">Eligibility for selected tickets:</p>
                    <ul className="mb-3 list-inside list-disc text-white/55">
                      {restrictedTickets.map((ticket) => (
                        <li key={ticket.id}>
                          {ticket.name}:{' '}
                          {ticket.audienceType &&
                          ticket.audienceType !== 'GENERAL' &&
                          ticket.audienceType !== 'GROUP'
                            ? `${ticket.audienceType.toLowerCase()} attendees`
                            : 'eligible attendees'}
                          {ticket.minAge != null || ticket.maxAge != null
                            ? `, ages ${String(ticket.minAge ?? 'any')}–${String(ticket.maxAge ?? 'any')}`
                            : ''}
                        </li>
                      ))}
                    </ul>
                    <label className="flex min-h-11 cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={eligibilityAttested}
                        onChange={(changeEvent) => {
                          setEligibilityAttestedFor(
                            changeEvent.currentTarget.checked ? eligibilitySignature : null,
                          );
                        }}
                        className="mt-1 size-4 accent-white"
                      />
                      <span>I confirm that all attendees meet the eligibility shown above.</span>
                    </label>
                  </div>
                )}
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
                      disabled={!canConfirmRsvp || !eligibilityReady}
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
                  {canPay && !upgradeFromEntitlementId ? (
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
                  ) : upgradeFromEntitlementId && canPay ? null : (
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
                        disabled={
                          quoteState !== 'ready' || payState !== 'idle' || !eligibilityReady
                        }
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
