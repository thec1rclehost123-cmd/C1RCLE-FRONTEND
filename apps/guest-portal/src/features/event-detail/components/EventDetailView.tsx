import Link from 'next/link';

import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

import { getEventAccentClasses, getGuestToneClass } from '../eventDetailPalette';

import { EventPosterPanel } from './EventPosterPanel';
import { EventTicketSelectorClient } from './EventTicketSelectorClient';
import { GuestlistPreviewClient } from './GuestlistPreviewClient';

import type {
  EventAccentTone,
  EventDetailFixture,
  EventLifecycle,
} from '../types/event-detail.types';

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

export function EventDetailView({ event }: { event: EventDetailFixture }) {
  const lifecycle = lifecycleCopy[event.lifecycle];
  const accent = getEventAccentClasses(event.accentTone);
  const startingPricePaise = Math.min(
    ...event.ticketTiers.map((tier) => tier.price?.amountPaise ?? 0),
  );
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue}, ${event.address}`,
  )}`;

  if (lifecycle) {
    return (
      <div className="relative z-10 flex min-h-[75vh] items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center text-white">
        <EventBackdrop accentTone={event.accentTone} />
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
    <div className="relative z-10 min-h-screen overflow-x-clip pb-36 pt-24 text-white sm:pt-28">
      <EventBackdrop accentTone={event.accentTone} />

      <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Explore', href: '/explore' },
            { label: event.title, href: `/event/${event.slug}` },
          ]}
        />
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 lg:grid-cols-[410px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]">
          <aside className="order-1 min-w-0 space-y-3 lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
            <EventPosterPanel event={event} />
            <EventTicketSelectorClient
              accentTone={event.accentTone}
              eventId={event.slug}
              tiers={event.ticketTiers}
              initialVisibleCount={3}
            />
          </aside>

          <section
            className={`order-2 min-w-0 rounded-[1.75rem] border px-5 py-7 backdrop-blur-xl sm:px-7 sm:py-8 lg:col-start-2 lg:row-start-1 ${accent.borderStrong} ${accent.eventHero}`}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/45">
              {event.category} · {event.city}
            </p>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl lg:text-6xl">
              {event.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-xs font-semibold text-white/55">
              <Link
                href={`/venue/${encodeURIComponent(event.venueId)}`}
                className="transition-colors hover:text-white"
              >
                {event.venue} · {event.city}
              </Link>
              <span>{eventDateFormatter.format(new Date(event.startsAt))}</span>
            </div>

            <Link
              href={`/host/${encodeURIComponent(event.hostId)}`}
              aria-label={`View host ${event.host}`}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs text-white/55 transition-colors hover:border-white/20 hover:text-white"
            >
              <span>Hosted by</span>
              <span className="font-bold text-white">{event.host}</span>
              <span
                aria-label="Verified host"
                className="flex size-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-black text-white"
              >
                ✓
              </span>
            </Link>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  <p className="text-sm font-bold text-white">{event.interestedCount} interested</p>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                    Guestlist preview
                  </p>
                </div>
              </div>
              <Link
                href={`/checkout/${event.slug}`}
                className="flex min-h-11 items-center justify-center rounded-full bg-white px-6 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black transition-transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none"
              >
                Get tickets
              </Link>
            </div>
          </section>

          <div className="order-3 min-w-0 space-y-3 lg:col-start-2 lg:row-start-2">
            <EventPanel accentTone={event.accentTone} label="About the event" title={event.summary}>
              <div className="space-y-3 text-sm leading-7 text-white/55">
                {event.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
                  Door policy
                </p>
                <p className="mt-2 text-sm leading-6 text-white/55">{event.doorNote}</p>
              </div>
            </EventPanel>

            <GuestlistPreviewClient
              accentTone={event.accentTone}
              guests={event.guests}
              interestedCount={event.interestedCount}
            />

            <EventPanel accentTone={event.accentTone} label="Location" title={event.venue}>
              <p className="text-sm text-white/50">{event.address}</p>
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
            </EventPanel>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 px-4">
        <Link
          href={`/checkout/${event.slug}`}
          className={`mx-auto flex min-h-14 max-w-xl items-center justify-center rounded-full px-7 py-3 text-center text-sm font-black text-white transition-transform hover:scale-[1.015] active:scale-[0.985] motion-reduce:transition-none ${accent.solid} ${accent.stickyShadow}`}
        >
          Buy tickets from {moneyFormatter.format(startingPricePaise / 100)}
        </Link>
      </div>
    </div>
  );
}

function EventBackdrop({ accentTone }: { accentTone: EventAccentTone }) {
  const accent = getEventAccentClasses(accentTone);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[#080808]">
      <div className={`absolute inset-0 ${accent.backdrop}`} />
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}

function EventPanel({
  accentTone,
  label,
  title,
  children,
}: {
  accentTone: EventAccentTone;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  const accent = getEventAccentClasses(accentTone);

  return (
    <section
      className={`rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl sm:p-6 ${accent.border} ${accent.eventGlow}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/40">{label}</p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
