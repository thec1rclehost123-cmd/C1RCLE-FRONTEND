import Link from 'next/link';

import { getEventAccentClasses, getGuestToneClass } from '../eventDetailPalette';

import { EventPosterPanel } from './EventPosterPanel';
import { EventTicketSelectorClient } from './EventTicketSelectorClient';

import type {
  EventAccentTone,
  EventDetailFixture,
  EventLifecycle,
} from '../types/event-detail.types';

const fullDateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'full',
  timeZone: 'Asia/Kolkata',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
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
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue}, ${event.address}`,
  )}`;

  if (lifecycle) {
    return (
      <main className="relative z-10 flex min-h-[75vh] items-center justify-center overflow-hidden px-6 pb-24 pt-32 text-center text-white">
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
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen overflow-hidden pb-36 pt-24 text-white sm:pt-28">
      <EventBackdrop accentTone={event.accentTone} />

      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div
          className={`flex flex-wrap items-center justify-between gap-4 border-y py-3 ${accent.border}`}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/45">
            UI preview · fixture data · {event.city}
          </p>
          <div
            className="flex items-center gap-2"
            aria-label="Event actions unavailable in preview"
          >
            {['Save', 'Share', 'Follow'].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                aria-label={`${label} unavailable in UI preview`}
                className="size-9 cursor-not-allowed rounded-full border border-white/10 bg-white/[0.04] text-[8px] font-black uppercase text-white/30"
                title={`${label} integration is not connected`}
              >
                {label.slice(0, 1)}
              </button>
            ))}
          </div>
        </div>

        <section
          className={`mt-3 rounded-[1.75rem] border px-5 py-7 backdrop-blur-xl sm:px-8 sm:py-9 ${accent.borderStrong} ${accent.panel}`}
        >
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/45">
                {event.category} · {event.city}
              </p>
              <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                {event.title}
              </h1>
              <p className="mt-3 text-sm font-semibold text-white/60">Hosted by {event.host}</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div
                className="flex -space-x-2"
                aria-label={`${String(event.interestedCount)} interested`}
              >
                {event.guests.map((guest) => (
                  <span
                    key={guest.id}
                    title={guest.name}
                    className={`flex size-9 items-center justify-center rounded-full border-2 border-black text-[9px] font-black text-black ${getGuestToneClass(guest.tone)}`}
                  >
                    {guest.initials}
                  </span>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{event.interestedCount} interested</p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Fixture community preview
                </p>
              </div>
              <button
                type="button"
                disabled
                title="RSVP integration is not connected"
                className="min-h-11 cursor-not-allowed rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-75"
              >
                RSVP unavailable
              </button>
            </div>
          </div>
        </section>

        <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="order-2 space-y-3 lg:order-1">
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

            <EventPanel accentTone={event.accentTone} label="Guestlist" title="Who's going">
              <div className="space-y-2.5">
                {event.guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex min-h-14 items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex size-8 items-center justify-center rounded-full text-[9px] font-black text-black ${getGuestToneClass(guest.tone)}`}
                      >
                        {guest.initials}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">{guest.name}</span>
                        <span className="block text-[9px] uppercase tracking-[0.16em] text-white/30">
                          Fixture profile
                        </span>
                      </span>
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/30">
                      Preview
                    </span>
                  </div>
                ))}
              </div>
            </EventPanel>

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

          <aside className="order-1 space-y-3 lg:order-2">
            <EventPosterPanel event={event} />
            <EventTicketSelectorClient
              accentTone={event.accentTone}
              eventId={event.slug}
              tiers={event.ticketTiers}
            />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-24 z-40 px-4 md:bottom-4">
        <div
          className={`mx-auto flex max-w-3xl flex-col gap-3 rounded-[1.4rem] border bg-black/90 p-3 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:pl-6 ${accent.borderStrong} ${accent.stickyShadow}`}
        >
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/35">
              Get on the list
            </p>
            <p className="mt-1 text-xs font-semibold text-white/70">
              {fullDateFormatter.format(new Date(event.startsAt))} ·{' '}
              {timeFormatter.format(new Date(event.startsAt))}
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Checkout integration is not connected"
            className="min-h-11 cursor-not-allowed rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-75"
          >
            Checkout unavailable · UI preview
          </button>
        </div>
      </div>
    </main>
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
      className={`rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl sm:p-6 ${accent.border} ${accent.panelShadow}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/40">{label}</p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
