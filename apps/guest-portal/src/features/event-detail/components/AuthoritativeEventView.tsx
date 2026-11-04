import Link from 'next/link';

import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { absoluteClientUrl } from '@/lib/seo/client-site';
import { JsonLd } from '@/lib/seo/json-ld';

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
  const entryRules = event.entryRules;
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
    url: absoluteClientUrl(`/event/${encodeURIComponent(event.slug)}`),
    ...(venue === null
      ? {}
      : {
          location: {
            '@type': 'Place',
            name: venue.name,
            url: absoluteClientUrl(`/venue/${encodeURIComponent(venue.slug)}`),
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
      {entryRules && (
        <section aria-labelledby="event-entry-heading" className="mt-12 max-w-3xl">
          <h2 id="event-entry-heading" className="text-3xl font-black uppercase tracking-tight">
            Entry information
          </h2>
          <dl className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2">
            {entryRules.doorsOpenAt ? (
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-white/45">
                  Doors open (UTC)
                </dt>
                <dd className="mt-1 text-sm text-white/75">
                  {formatEntryTime(entryRules.doorsOpenAt)}
                </dd>
              </div>
            ) : null}
            {entryRules.lastEntryAt ? (
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-white/45">
                  Last entry (UTC)
                </dt>
                <dd className="mt-1 text-sm text-white/75">
                  {formatEntryTime(entryRules.lastEntryAt)}
                </dd>
              </div>
            ) : null}
            {entryRules.reentryAllowed !== null ? (
              <EntryFact
                label="Re-entry"
                value={entryRules.reentryAllowed ? 'Allowed' : 'Not allowed'}
              />
            ) : null}
            {entryRules.minimumAge !== null ? (
              <EntryFact label="Minimum age" value={`${String(entryRules.minimumAge)}+`} />
            ) : null}
            {entryRules.idRequired !== null ? (
              <EntryFact
                label="Photo ID"
                value={entryRules.idRequired ? 'Required' : 'Not required'}
              />
            ) : null}
            {entryRules.accessibilityNotes ? (
              <EntryFact label="Accessibility" value={entryRules.accessibilityNotes} />
            ) : null}
            {entryRules.dressCode ? (
              <EntryFact label="Dress code" value={entryRules.dressCode} />
            ) : null}
            {entryRules.alcoholPolicy ? (
              <EntryFact label="Alcohol policy" value={entryRules.alcoholPolicy} />
            ) : null}
            {entryRules.prohibitedItems.length ? (
              <div>
                <dt className="text-xs font-bold uppercase tracking-widest text-white/45">
                  Prohibited items
                </dt>
                <dd className="mt-1 text-sm text-white/75">
                  {entryRules.prohibitedItems.join(', ')}
                </dd>
              </div>
            ) : null}
            {entryRules.supportDetails ? (
              <EntryFact label="Guest support" value={entryRules.supportDetails} />
            ) : null}
          </dl>
        </section>
      )}
    </article>
  );
}

function EntryFact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-widest text-white/45">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm text-white/75">{value}</dd>
    </div>
  );
}

function formatEntryTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}
