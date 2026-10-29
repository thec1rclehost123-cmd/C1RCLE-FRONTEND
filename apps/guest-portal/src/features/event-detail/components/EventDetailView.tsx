'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CheckoutView } from '@/features/booking/components/CheckoutView';
import { ExploreEventCard } from '@/features/explore/components/ExploreEventCard';
import { useTicketAccessGrantId } from '@/lib/access/use-ticket-access-grant-id';

import { getEventAccentClasses } from '../eventDetailPalette';

import { EventPosterPanel } from './EventPosterPanel';
import { EventTicketSelectorClient } from './EventTicketSelectorClient';
import { GuestlistPreviewClient } from './GuestlistPreviewClient';
import { PrivateTierUnlockClient } from './PrivateTierUnlockClient';
import { StickyEventCheckoutCta } from './StickyEventCheckoutCta';

import type { EventDetailFixture, EventLifecycle } from '../types/event-detail.types';
import type { BookingEventFixture } from '@/features/booking/types/booking.types';
import type { ExploreEvent } from '@/features/explore/types/explore.types';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const eventDateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

const lifecycleCopy: Partial<Record<EventLifecycle, { title: string; detail: string }>> = {
  paused: {
    title: 'Ticket sales paused',
    detail: 'This event is visible, but booking is temporarily unavailable.',
  },
  cancelled: {
    title: 'Event cancelled',
    detail: 'The organizer has cancelled this event. No fixture action is available.',
  },
  completed: {
    title: 'Event completed',
    detail: 'This event has ended. Explore current experiences instead.',
  },
};

export function EventDetailView({
  event,
  checkoutEvent,
  recommendations = [],
  referralCode,
  accessGrantId,
}: {
  event: EventDetailFixture;
  checkoutEvent: BookingEventFixture;
  recommendations?: readonly ExploreEvent[];
  referralCode?: string;
  accessGrantId?: string;
}) {
  const grantFromUrl = useTicketAccessGrantId();
  const effectiveGrantId = accessGrantId ?? grantFromUrl;
  const lifecycle = lifecycleCopy[event.lifecycle];
  const accent = getEventAccentClasses(event.accentTone);
  const availableTiers = event.ticketTiers.filter(
    (tier) => tier.availableQuantity === undefined || tier.availableQuantity > 0,
  );
  const hasAvailableTiers = availableTiers.length > 0;
  const startingPricePaise = hasAvailableTiers
    ? Math.min(...availableTiers.map((tier) => tier.price?.amountPaise ?? 0))
    : null;
  const stickyCtaLabel =
    startingPricePaise === 0
      ? 'RSVP for free'
      : startingPricePaise === null
        ? null
        : `Get tickets · From ${moneyFormatter.format(startingPricePaise / 100)}`;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const ticketCtaRef = useRef<HTMLButtonElement>(null);
  const checkoutDialogRef = useRef<HTMLDialogElement>(null);
  const closeCheckout = useCallback(() => {
    setCheckoutOpen(false);
    window.requestAnimationFrame(() => ticketCtaRef.current?.focus());
  }, []);
  useEffect(() => {
    if (!checkoutOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    checkoutDialogRef.current?.focus();
    const handleCheckoutKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        closeCheckout();
        return;
      }
      if (keyboardEvent.key !== 'Tab' || !checkoutDialogRef.current) return;
      const focusable = checkoutDialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleCheckoutKeyDown);
    return () => {
      window.removeEventListener('keydown', handleCheckoutKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [checkoutOpen, closeCheckout]);
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue}, ${event.address}`,
  )}`;

  if (lifecycle) {
    return (
      <div className="relative z-10 flex min-h-[75vh] items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center text-white">
        <div
          className={`relative max-w-xl rounded-[2rem] border bg-black/70 p-10 backdrop-blur-xl ${accent.border} ${accent.posterShadow}`}
        >
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${accent.text}`}>
            {event.title}
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">{lifecycle.title}</h1>
          <p className="mt-4 text-sm leading-6 text-white/55">{lifecycle.detail}</p>
          <Link
            href="/explore"
            className="mt-8 inline-flex min-h-11 items-center rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black"
          >
            Explore events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip bg-[#050505] pb-44 pt-24 text-white sm:pb-40 sm:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050505]"
      >
        {event.image !== '/c1rcle-logo.webp' ? (
          <Image
            src={event.image}
            alt=""
            width={1200}
            height={1500}
            unoptimized
            className="absolute left-[38%] top-[4%] h-[85vh] w-[62vw] scale-125 object-cover opacity-[0.14] blur-[76px]"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_56%_30%,rgba(255,86,55,0.12),transparent_38%),radial-gradient(ellipse_at_75%_60%,rgba(113,49,29,0.13),transparent_46%),linear-gradient(90deg,#050505_0%,transparent_60%,#050505_100%)]" />
      </div>
      <div className="relative z-10 mx-auto max-w-[1360px] px-5 pb-14 sm:px-8 lg:px-12">
        <section className="relative grid items-start gap-7 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:gap-12 lg:gap-16">
          <div className="relative z-20 order-1 -mx-5 -mt-7 min-w-0 rounded-t-[1.5rem] bg-[#080808]/[0.98] px-5 pb-7 pt-7 shadow-[0_-20px_50px_rgba(0,0,0,0.34)] sm:-mx-8 sm:px-8 md:order-1 md:mx-0 md:mt-0 md:rounded-none md:bg-transparent md:px-0 md:pt-3 md:shadow-none">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff7658]">
              {event.category} <span className="px-1 text-white/30">/</span> {event.city}
            </p>
            <h1 className="mt-3 max-w-[18ch] break-words text-3xl font-black leading-[1.02] tracking-[-0.05em] sm:text-4xl lg:text-[clamp(2.75rem,4vw,4.5rem)]">
              {event.title}
            </h1>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 pr-2 pb-14 sm:flex sm:flex-wrap sm:gap-x-7 md:pb-0">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/45">
                  Date & time
                </p>
                <p className="mt-1 text-[13px] font-semibold sm:text-sm">
                  {eventDateFormatter.format(new Date(event.startsAt))}
                </p>
              </div>
            </div>
            <div className="mt-3 text-[13px] font-semibold text-white/75 sm:text-sm">
              {event.venueId ? (
                <Link
                  href={`/venue/${encodeURIComponent(event.venueId)}`}
                  className="hover:text-white"
                >
                  {event.venue} · {event.city}
                </Link>
              ) : (
                <span>
                  {event.venue} · {event.city}
                </span>
              )}
            </div>
            {event.hostId ? (
              <Link
                href={`/host/${encodeURIComponent(event.hostId)}`}
                aria-label={`View host ${event.host}`}
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3.5 py-1.5 text-[11px] text-white/55 transition-colors hover:border-white/20 hover:text-white"
              >
                <span>Hosted by</span>
                <span className="font-bold text-white">{event.host}</span>
              </Link>
            ) : null}

            <section className="mt-6 border-t border-white/10 py-5">
              <h2 className="text-lg font-bold sm:text-xl">About the event</h2>
              <div className="mt-3 space-y-2.5 text-[13px] leading-6 text-white/70 sm:text-sm sm:leading-7">
                <p>{event.summary}</p>
                {event.description.length ? (
                  event.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                ) : (
                  <p>Additional event details have not been provided.</p>
                )}
                <p className="text-white/45">{event.doorNote}</p>
              </div>
            </section>

            <section className="border-t border-white/10 py-5">
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/45">
                Location
              </p>
              <h2 className="mt-2 text-lg font-bold">{event.venue}</h2>
              <p className="mt-1 text-[13px] text-white/55">{event.address}</p>
              <a
                href={mapHref}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-[11px] font-bold text-white"
              >
                Open in Maps ↗
              </a>
              {event.venueId ? (
                <Link
                  href={`/venue/${encodeURIComponent(event.venueId)}`}
                  className="mt-4 flex min-h-16 items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <span className="min-w-0">
                    <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-white/45">
                      Venue profile
                    </span>
                    <span className="mt-1 block truncate text-sm font-semibold text-white">
                      {event.venue}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-sm text-[#ff7658]">
                    ↗
                  </span>
                </Link>
              ) : null}
            </section>

            {event.guests.length > 0 && (
              <GuestlistPreviewClient
                accentTone={event.accentTone}
                guests={event.guests}
                interestedCount={event.interestedCount}
              />
            )}
          </div>

          <div className="sticky top-20 z-0 order-0 mx-auto w-full max-w-[300px] self-start md:top-24 md:order-2 md:max-w-[320px] lg:max-w-[340px]">
            <EventPosterPanel event={event} />
            {effectiveGrantId && hasAvailableTiers ? (
              <div className="mt-4">
                <EventTicketSelectorClient
                  accentTone={event.accentTone}
                  eventId={event.slug}
                  tiers={event.ticketTiers}
                  headerNote={event.ticketNote ?? 'Ticket options'}
                  accessGrantId={effectiveGrantId}
                  {...(referralCode ? { referralCode } : {})}
                />
              </div>
            ) : event.ticketTiers.some((tier) => tier.availableQuantity === 0) ? (
              <details className="mt-4 rounded-2xl border border-white/10 bg-black/55 p-3">
                <summary className="cursor-pointer px-2 py-2 text-xs font-bold text-white/75">
                  Waitlist and additional ticket options
                </summary>
                <div className="mt-3">
                  <EventTicketSelectorClient
                    accentTone={event.accentTone}
                    eventId={event.slug}
                    tiers={event.ticketTiers}
                    headerNote={event.ticketNote ?? 'Ticket options'}
                    {...(referralCode ? { referralCode } : {})}
                    {...(effectiveGrantId ? { accessGrantId: effectiveGrantId } : {})}
                  />
                </div>
              </details>
            ) : null}
            <PrivateTierUnlockClient
              eventId={event.slug}
              accentTone={event.accentTone}
              {...(referralCode ? { referralCode } : {})}
            />
            <div className="mt-3 flex justify-center gap-2.5 md:hidden">
              <button
                type="button"
                aria-label="Save event"
                className="min-h-9 rounded-full border border-white/15 bg-black/50 px-4 text-[11px] font-semibold"
              >
                ♡ Save
              </button>
              <button
                type="button"
                aria-label="Share event"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                }}
                className="min-h-9 rounded-full border border-white/15 bg-black/50 px-4 text-[11px] font-semibold"
              >
                Share ↗
              </button>
            </div>
          </div>
        </section>
      </div>

      {recommendations.length > 0 ? (
        <section
          aria-labelledby="related-events-heading"
          className="relative z-10 mx-auto mt-2 max-w-6xl border-t border-white/10 px-5 py-8 pb-24 sm:px-6 sm:pb-20"
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/45">
                Keep exploring
              </p>
              <h2
                id="related-events-heading"
                className="mt-1.5 font-heading text-xl font-bold tracking-tight sm:text-2xl"
              >
                More events like this
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-[11px] font-bold text-white/65 underline-offset-4 hover:text-white hover:underline"
            >
              All events →
            </Link>
          </div>
          <div className="flex snap-x gap-3.5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
            {recommendations.map((related) => (
              <div
                key={related.id}
                className="w-[min(62vw,190px)] shrink-0 snap-start sm:w-[min(23vw,220px)]"
              >
                <ExploreEventCard event={related} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {stickyCtaLabel === null ? null : (
        <StickyEventCheckoutCta
          label={stickyCtaLabel}
          className={`${accent.solid} ${accent.stickyShadow}`}
          onClick={() => {
            setCheckoutOpen(true);
          }}
          ref={ticketCtaRef}
        />
      )}
      {checkoutOpen && typeof document !== 'undefined'
        ? createPortal(
            <dialog
              open
              ref={checkoutDialogRef}
              aria-modal="true"
              aria-label={`Checkout for ${event.title}`}
              tabIndex={-1}
              className="fixed inset-0 z-[100] m-0 flex h-dvh w-dvw max-h-dvh max-w-none items-center justify-center border-0 bg-transparent p-2 text-white sm:p-5"
            >
              <button
                type="button"
                tabIndex={-1}
                aria-label="Close checkout overlay"
                onClick={closeCheckout}
                className="absolute inset-0 z-0 cursor-default bg-black/45 backdrop-blur-[4px]"
              />
              <div className="relative z-10 h-[calc(100dvh-1rem)] w-full overflow-hidden rounded-[1.35rem] border border-white/15 bg-[linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.035)_38%,rgba(20,14,13,.88)_100%)] shadow-[0_30px_110px_rgba(0,0,0,.72),inset_0_1px_0_rgba(255,255,255,.2)] backdrop-blur-2xl sm:h-auto sm:max-h-[min(90dvh,760px)] sm:max-w-[1120px] sm:rounded-[1.6rem]">
                <div className="relative z-10 h-full overflow-hidden">
                  <CheckoutView
                    event={checkoutEvent}
                    eventSlug={event.slug}
                    onClose={closeCheckout}
                  />
                </div>
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </div>
  );
}
