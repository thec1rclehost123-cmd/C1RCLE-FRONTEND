import Link from 'next/link';

import { EventArtworkBackdrop } from '@/components/layout/EventArtworkBackdrop';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ExploreEventCard } from '@/features/explore/components/ExploreEventCard';

import { getEventAccentClasses, getGuestToneClass } from '../eventDetailPalette';

import { EventPosterPanel } from './EventPosterPanel';
import { EventTicketSelectorClient } from './EventTicketSelectorClient';
import { GuestlistPreviewClient } from './GuestlistPreviewClient';
import { PrivateTierUnlockClient } from './PrivateTierUnlockClient';
import { StickyEventCheckoutCta } from './StickyEventCheckoutCta';

import type {
  EventAccentTone,
  EventDetailFixture,
  EventLifecycle,
} from '../types/event-detail.types';
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
  recommendations = [],
  referralCode,
  accessGrantId,
}: {
  event: EventDetailFixture;
  recommendations?: readonly ExploreEvent[];
  referralCode?: string;
  accessGrantId?: string;
}) {
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
      ? 'Get free tickets'
      : startingPricePaise === null
        ? null
        : `Buy tickets from ${moneyFormatter.format(startingPricePaise / 100)}`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue}, ${event.address}`,
  )}`;
  const checkoutQuery = referralCode ? `?ref=${encodeURIComponent(referralCode)}` : '';

  if (lifecycle) {
    return (
      <div className="relative z-10 flex min-h-[75vh] items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center text-white">
        <EventArtworkBackdrop image={event.image} />
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
    <div className="relative z-10 min-h-screen overflow-x-clip bg-[#070707] pb-36 pt-24 text-white sm:pt-28">
      <EventArtworkBackdrop image={event.image} />

      <div className="relative z-10 mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Explore', href: '/explore' },
            { label: event.title, href: `/event/${event.slug}` },
          ]}
        />
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px]">
          <aside
            id="event-ticket-selector"
            className="order-2 min-w-0 space-y-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
          >
            <EventPosterPanel event={event} />
            <EventTicketSelectorClient
              accentTone={event.accentTone}
              eventId={event.slug}
              tiers={event.ticketTiers}
              initialVisibleCount={3}
              headerNote={event.ticketNote ?? 'Ticket options'}
              {...(accessGrantId ? { accessGrantId } : {})}
              {...(referralCode ? { referralCode } : {})}
            />
            <PrivateTierUnlockClient
              eventId={event.slug}
              accentTone={event.accentTone}
              {...(referralCode ? { referralCode } : {})}
            />
          </aside>

          <section className="order-1 min-w-0 px-1 py-8 sm:py-12 lg:col-start-1 lg:row-start-1 lg:py-20">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/45">
              {event.category} · {event.city}
            </p>
            <h1 className="mt-4 max-w-[17ch] text-[clamp(2.15rem,5vw,3.5rem)] font-black uppercase leading-[0.95] tracking-[-0.045em]">
              {event.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs font-semibold text-white/55">
              {event.venueId ? (
                <Link
                  href={`/venue/${encodeURIComponent(event.venueId)}`}
                  className="transition-colors hover:text-white"
                >
                  {event.venue} · {event.city}
                </Link>
              ) : (
                <span>
                  {event.venue} · {event.city}
                </span>
              )}
              <span>{eventDateFormatter.format(new Date(event.startsAt))}</span>
            </div>

            {event.hostId ? (
              <Link
                href={`/host/${encodeURIComponent(event.hostId)}`}
                aria-label={`View host ${event.host}`}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs text-white/55 transition-colors hover:border-white/20 hover:text-white"
              >
                <span>Hosted by</span>
                <span className="font-bold text-white">{event.host}</span>
              </Link>
            ) : (
              <p className="mt-4 text-xs text-white/45">{event.host}</p>
            )}

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {event.guests.length > 0 ? (
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex shrink-0 -space-x-2"
                    aria-label={`${String(event.interestedCount)} interested`}
                  >
                    {event.guests.slice(0, 5).map((guest) => (
                      <Link
                        key={guest.id}
                        href={`/profile/${encodeURIComponent(guest.id)}`}
                        aria-label={`View ${guest.name} profile`}
                        title={guest.name}
                        className={`flex size-9 items-center justify-center rounded-full border-2 border-black text-[9px] font-black text-black ${getGuestToneClass(guest.tone)}`}
                      >
                        {guest.initials}
                      </Link>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {event.interestedCount} interested
                    </p>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                      Guestlist preview
                    </p>
                  </div>
                </div>
              ) : (
                <span />
              )}
              {hasAvailableTiers ? (
                <Link
                  href={`/checkout/${event.slug}${checkoutQuery}`}
                  className="flex min-h-11 items-center justify-center rounded-full bg-white px-6 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none"
                >
                  Get tickets
                </Link>
              ) : (
                <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                  {event.ticketTiers.length === 0 ? 'Tickets unavailable' : 'Sold out'}
                </span>
              )}
            </div>
          </section>

          <div className="order-3 min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
            <EventPanel accentTone={event.accentTone} label="About the event" title={event.summary}>
              <div className="space-y-3 text-sm leading-7 text-white/55">
                {event.description.length > 0 ? (
                  event.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                ) : (
                  <p>Additional event details have not been provided.</p>
                )}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
                  Door policy
                </p>
                <p className="mt-2 text-sm leading-6 text-white/55">{event.doorNote}</p>
              </div>
            </EventPanel>

            {event.guests.length > 0 && (
              <GuestlistPreviewClient
                accentTone={event.accentTone}
                guests={event.guests}
                interestedCount={event.interestedCount}
              />
            )}

            <EventPanel accentTone={event.accentTone} label="Location" title={event.venue}>
              <p className="text-sm text-white/50">{event.address}</p>
              {event.venueId ? (
                <div className="relative mt-5 h-52 overflow-hidden rounded-2xl border border-white/10 bg-[#d9d0bf]">
                  <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(35deg,transparent_46%,#8c8170_47%,#8c8170_51%,transparent_52%),linear-gradient(120deg,transparent_44%,#b5aa98_45%,#b5aa98_49%,transparent_50%)] [background-size:110px_90px,150px_120px]" />
                  <div
                    className={`absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-lg text-white shadow-xl ${accent.solid}`}
                  >
                    <span aria-hidden="true">●</span>
                  </div>
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl bg-black/80 px-4 py-3 backdrop-blur-md">
                    <span className="text-xs font-bold text-white">{event.venue}</span>
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-[9px] font-black uppercase tracking-[0.18em] ${accent.text}`}
                    >
                      Open maps
                    </a>
                  </div>
                </div>
              ) : null}
            </EventPanel>
          </div>
        </div>
      </div>

      {recommendations.length > 0 ? (
        <section
          aria-labelledby="related-events-heading"
          className="relative z-10 mx-auto mt-16 max-w-[1380px] px-4 sm:px-6 lg:px-8"
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.26em] text-white/45">
                Keep exploring
              </p>
              <h2
                id="related-events-heading"
                className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl"
              >
                More events like this
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-xs font-bold text-white/65 underline-offset-4 hover:text-white hover:underline"
            >
              All events →
            </Link>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5">
            {recommendations.map((related) => (
              <div
                key={related.id}
                className="w-[min(68vw,220px)] shrink-0 snap-start sm:w-[min(25vw,250px)]"
              >
                <ExploreEventCard event={related} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {stickyCtaLabel === null ? null : (
        <StickyEventCheckoutCta
          href={`/checkout/${event.slug}${checkoutQuery}`}
          label={stickyCtaLabel}
          className={`${accent.solid} ${accent.stickyShadow}`}
        />
      )}
    </div>
  );
}

function EventPanel({
  label,
  title,
  children,
}: {
  accentTone: EventAccentTone;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/12 py-7 sm:py-8">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/40">{label}</p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
