import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ExploreEventCard } from '@/features/explore/components/ExploreEventCard';

import type { ExploreEvent } from '@/features/explore/types/explore.types';
import type { HostPublicDto, VenuePublicDetailDto } from '@c1rcle/contracts';

export function AuthoritativeVenueView({
  venue,
  events,
  view = 'events',
}: {
  readonly venue: VenuePublicDetailDto;
  readonly events: readonly ExploreEvent[];
  readonly view?: 'events' | 'about';
}) {
  const address = [venue.address.city ?? venue.city, venue.address.state, venue.address.country]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(', ');
  const backdropImage =
    venue.photoUrl ?? events.find((event) => event.image !== '/c1rcle-logo.webp')?.image ?? null;

  return (
    <article className="relative z-10 min-h-screen overflow-hidden bg-[#070807] px-5 pb-24 pt-28 text-white sm:px-8 lg:px-12">
      {backdropImage ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[880px] overflow-hidden opacity-40 [mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_100%)]"
        >
          <Image
            src={backdropImage}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="scale-125 object-cover blur-[72px] saturate-150"
          />
        </div>
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[880px] bg-gradient-to-b from-black/20 via-black/55 to-[#070807]"
      />
      <div className="relative mx-auto max-w-[1440px]">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Venues', href: '/hosts' },
            { label: venue.name, href: `/venue/${venue.slug}` },
          ]}
        />
      </div>
      <header
        className={`relative isolate mx-auto mt-5 flex max-w-[1440px] flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between ${
          venue.photoUrl
            ? 'min-h-[300px] justify-end pb-7 pt-16 sm:min-h-[420px] sm:pb-10'
            : 'justify-between pb-5 pt-4 sm:pb-7'
        }`}
      >
        {venue.photoUrl ? (
          <Image
            src={venue.photoUrl}
            alt={`${venue.name} venue`}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 1440px"
            className="absolute inset-0 z-0 object-cover opacity-75 [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]"
            priority
          />
        ) : null}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[#070807]/90 via-[#070807]/45 to-transparent"
        />
        <div className="relative z-10 max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff6842]">
            {address.length > 0 ? address : (venue.city ?? 'Venue')}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-[3.8rem]">
            {venue.name}
          </h1>
          {events[0] ? (
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">
              {events.length} upcoming {events.length === 1 ? 'event' : 'events'} at this venue
            </p>
          ) : null}
        </div>
        <nav aria-label={`${venue.name} sections`} className="relative z-10 sm:mb-1">
          <div className="inline-flex rounded-full border border-white/15 bg-black/40 p-1 shadow-[0_12px_36px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <Link
              href={`/venue/${encodeURIComponent(venue.slug)}`}
              aria-current={view === 'events' ? 'page' : undefined}
              className={`min-h-10 rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${view === 'events' ? 'bg-white text-black' : 'text-white/75 hover:text-white'}`}
            >
              Events
            </Link>
            <Link
              href={`/venue/${encodeURIComponent(venue.slug)}?view=about`}
              aria-current={view === 'about' ? 'page' : undefined}
              className={`min-h-10 rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${view === 'about' ? 'bg-white text-black' : 'text-white/75 hover:text-white'}`}
            >
              About
            </Link>
          </div>
        </nav>
      </header>

      {view === 'events' ? (
        <section
          aria-labelledby="venue-events-heading"
          className="relative mx-auto mt-2 max-w-[1440px] sm:mt-4"
        >
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2
                id="venue-events-heading"
                className="font-heading text-lg font-semibold tracking-[-0.02em] text-white/90 sm:text-xl"
              >
                Upcoming events
              </h2>
            </div>
            <p className="text-xs text-white/45" aria-live="polite">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </p>
          </div>
          {events.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {events.map((event) => (
                <ExploreEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-8 text-sm text-white/55">
              No upcoming events for this venue are in the public discovery feed right now.
            </p>
          )}
        </section>
      ) : (
        <section
          aria-labelledby="venue-about-heading"
          className="relative mx-auto mt-4 grid max-w-[1440px] gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff6842]">
              The venue
            </p>
            <h2
              id="venue-about-heading"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              About {venue.name}
            </h2>
            {venue.description.trim() ? (
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-white/70 sm:text-base">
                {venue.description}
              </p>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/50">
                A venue description has not been provided.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff6842]">
              Details
            </p>
            {address ? <p className="mt-4 text-sm leading-6 text-white/75">{address}</p> : null}
            {venue.capacity !== null ? (
              <p className="mt-3 text-sm text-white/60">
                Capacity · {venue.capacity.toLocaleString()}
              </p>
            ) : null}
            {venue.facilities.length ? (
              <ul aria-label="Venue facilities" className="mt-5 flex flex-wrap gap-2">
                {venue.facilities.map((facility) => (
                  <li
                    key={facility}
                    className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-white/65"
                  >
                    {facility}
                  </li>
                ))}
              </ul>
            ) : null}
            {!address && venue.capacity === null && venue.facilities.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">
                No additional public venue details are available.
              </p>
            ) : null}
          </div>
        </section>
      )}
    </article>
  );
}

export function AuthoritativeHostView({ host }: { readonly host: HostPublicDto }) {
  return (
    <article className="relative z-10 mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32 text-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hosts', href: '/hosts' },
          { label: host.name, href: `/host/${host.slug}` },
        ]}
      />
      <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
        {host.name}
      </h1>
    </article>
  );
}
