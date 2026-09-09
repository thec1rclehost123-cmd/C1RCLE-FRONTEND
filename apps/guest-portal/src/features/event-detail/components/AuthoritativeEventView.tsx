import Link from 'next/link';

import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/lib/seo/json-ld';
import { absoluteUrl } from '@/lib/seo/site';

import type { EventPublicDetailDto, EventVenuePublicDto } from '@c1rcle/contracts';

function venueAddressJsonLd(venue: EventVenuePublicDto): Record<string, unknown> | null {
  const address = {
    ...(venue.address.street === undefined ? {} : { streetAddress: venue.address.street }),
    ...(venue.address.city === undefined ? {} : { addressLocality: venue.address.city }),
    ...(venue.address.state === undefined ? {} : { addressRegion: venue.address.state }),
    ...(venue.address.zip === undefined ? {} : { postalCode: venue.address.zip }),
    ...(venue.address.country === undefined ? {} : { addressCountry: venue.address.country }),
  };
  return Object.keys(address).length === 0 ? null : { '@type': 'PostalAddress', ...address };
}

function venueGeoJsonLd(venue: EventVenuePublicDto): Record<string, unknown> | null {
  return venue.address.lat === undefined || venue.address.lng === undefined
    ? null
    : {
        '@type': 'GeoCoordinates',
        latitude: venue.address.lat,
        longitude: venue.address.lng,
      };
}

export function AuthoritativeEventView({ detail }: { readonly detail: EventPublicDetailDto }) {
  const { venue, organizer } = detail;
  const event = detail;
  const address = venue === null ? null : venueAddressJsonLd(venue);
  const geo = venue === null ? null : venueGeoJsonLd(venue);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.summary,
    image: event.imageUrl === null ? undefined : [event.imageUrl],
    startDate: event.startAt,
    endDate: event.endAt ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: absoluteUrl(`/event/${encodeURIComponent(event.slug)}`),
    ...(venue === null
      ? {}
      : {
          location: {
            '@type': 'Place',
            name: venue.name,
            url: absoluteUrl(`/venue/${encodeURIComponent(venue.slug)}`),
            ...(venue.photoUrl === null ? {} : { image: venue.photoUrl }),
            ...(address === null ? {} : { address }),
            ...(geo === null ? {} : { geo }),
          },
        }),
  };

  return (
    <article className="relative z-10 mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-32 text-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Explore', href: '/explore' },
          { label: event.title, href: `/event/${event.slug}` },
        ]}
      />
      <JsonLd data={jsonLd} />
      <header className="max-w-4xl">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF6842]">
          {new Intl.DateTimeFormat('en-IN', { dateStyle: 'full', timeStyle: 'short' }).format(
            new Date(event.startAt),
          )}
        </p>
        <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
          {event.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">{event.summary}</p>
        {(venue !== null || organizer !== null) && (
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
            {venue !== null && (
              <p>
                Venue:{' '}
                <Link className="font-bold text-white" href={`/venue/${venue.slug}`}>
                  {venue.name}
                </Link>
              </p>
            )}
            {organizer !== null && (
              <p>
                Host:{' '}
                <Link className="font-bold text-white" href={`/host/${organizer.slug}`}>
                  {organizer.name}
                </Link>
              </p>
            )}
          </div>
        )}
      </header>
      {event.imageUrl !== null && (
        // The public contract does not yet provide image dimensions or an allow-listed host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt={`${event.title} event poster`}
          loading="eager"
          className="mt-10 aspect-[16/9] w-full rounded-[2rem] object-cover"
        />
      )}
      {event.description.trim().length > 0 && (
        <section aria-labelledby="event-about-heading" className="mt-12 max-w-3xl">
          <h2 id="event-about-heading" className="text-3xl font-black uppercase tracking-tight">
            About this event
          </h2>
          <p className="mt-5 whitespace-pre-line leading-8 text-white/60">{event.description}</p>
        </section>
      )}
    </article>
  );
}
