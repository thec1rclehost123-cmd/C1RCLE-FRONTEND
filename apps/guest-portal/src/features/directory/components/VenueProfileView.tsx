import Image from 'next/image';
import Link from 'next/link';

import { DirectoryEventCard } from './DirectoryEventCard';

import type { VenueDirectoryProfile } from '../types/directory.types';

export function VenueProfileView({ venue }: { venue: VenueDirectoryProfile }) {
  const hostCount = venue.events.length > 0 ? 1 : 0;
  const categories = new Set(venue.events.map((event) => event.category)).size;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venue.name}, ${venue.address}`,
  )}`;

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip px-4 pb-24 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_70%_0%,rgba(122,70,175,0.18),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-[1380px]">
        <Link
          href="/hosts#venues"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/55 transition-colors hover:border-white/20 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          All venues
        </Link>

        <header className="relative mt-5 min-h-[34rem] overflow-hidden rounded-[2rem] border border-[#9A62C7]/30 bg-[#0A0A0A] p-6 shadow-[0_30px_110px_rgba(122,70,175,0.15)] sm:p-9 lg:p-12">
          <Image
            src={venue.coverImage}
            alt=""
            fill
            preload
            sizes="(max-width: 1380px) 100vw, 1380px"
            className="object-cover opacity-[0.38]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.97)_5%,rgba(0,0,0,0.76)_54%,rgba(0,0,0,0.32))]" />

          <div className="relative flex min-h-[29rem] max-w-5xl flex-col justify-end">
            <span className="w-fit rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-white/65">
              Venue · {venue.city}
            </span>
            <div className="mt-7 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
              <div className="flex size-28 shrink-0 items-center justify-center rounded-[2rem] border border-white/20 bg-[#7D4AB0] text-3xl font-black tracking-[-0.06em] shadow-2xl sm:size-36 sm:text-4xl">
                {venue.initials}
              </div>
              <div>
                <h1 className="text-5xl font-black uppercase leading-[0.84] tracking-[-0.07em] sm:text-7xl lg:text-8xl">
                  {venue.name}
                </h1>
                <p className="mt-4 text-sm font-semibold text-white/55">{venue.address}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#B889DF]">
              About the venue
            </p>
            <h2 className="mt-4 max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.045em] sm:text-5xl">
              {venue.summary}
            </h2>
            <div className="mt-7 flex flex-wrap gap-2">
              {venue.knownFor.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/55"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#D4C9B8] p-4 text-black">
            <div className="relative flex min-h-52 flex-col justify-between overflow-hidden rounded-[1.25rem] border border-black/10 bg-[#DED5C7] p-5">
              <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(35deg,transparent_46%,#8c8170_47%,#8c8170_51%,transparent_52%),linear-gradient(120deg,transparent_44%,#b5aa98_45%,#b5aa98_49%,transparent_50%)] [background-size:110px_90px,150px_120px]" />
              <span className="relative text-[9px] font-black uppercase tracking-[0.2em] text-black/45">
                Location
              </span>
              <div className="relative flex items-end justify-between gap-4 rounded-2xl bg-black/85 p-4 text-white">
                <div>
                  <p className="text-sm font-black">{venue.name}</p>
                  <p className="mt-1 text-xs text-white/50">{venue.address}</p>
                </div>
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-[#C89AEA]"
                >
                  Maps ↗
                </a>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Events', value: venue.events.length },
                { label: 'Hosts', value: hostCount },
                { label: 'Formats', value: categories },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-black/90 p-3 text-center text-white">
                  <dt className="text-[7px] font-black uppercase tracking-[0.14em] text-white/35">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-xl font-black">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="venue-events-heading" className="mt-16">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#B889DF]">
            Happening here
          </p>
          <h2
            id="venue-events-heading"
            className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] sm:text-6xl"
          >
            Upcoming events
          </h2>

          {venue.events.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {venue.events.map((event) => (
                <DirectoryEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/35">
                No announced events yet.
              </p>
              <Link
                href="/explore"
                className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-6 text-[9px] font-black uppercase tracking-[0.2em] text-black"
              >
                Explore events
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
