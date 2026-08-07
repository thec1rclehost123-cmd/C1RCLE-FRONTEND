import Image from 'next/image';
import Link from 'next/link';

import type { HostDirectoryProfile, VenueDirectoryProfile } from '../types/directory.types';

export function DirectoryLanding({
  hosts,
  venues,
}: {
  hosts: readonly HostDirectoryProfile[];
  venues: readonly VenueDirectoryProfile[];
}) {
  return (
    <div className="relative z-10 min-h-screen overflow-x-clip px-4 pb-24 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(circle_at_68%_0%,rgba(255,68,0,0.16),transparent_58%)]" />
      </div>

      <div className="mx-auto max-w-[1380px]">
        <header className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-[#FF6B4A]">
              People · Places · Culture
            </p>
            <h1 className="mt-5 max-w-5xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.07em] sm:text-8xl lg:text-[7.5rem]">
              The names behind the night.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-7 text-white/48 lg:pb-2">
            Meet the collectives shaping the calendar and the rooms giving every gathering its
            atmosphere.
          </p>
        </header>

        <section aria-labelledby="directory-hosts-heading" className="mt-14">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
                Curators
              </p>
              <h2
                id="directory-hosts-heading"
                className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] sm:text-6xl"
              >
                Hosts
              </h2>
            </div>
            <p className="hidden text-[9px] font-black uppercase tracking-[0.22em] text-white/30 sm:block">
              {hosts.length} profiles
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {hosts.map((host, index) => (
              <Link
                key={host.id}
                href={`/host/${host.id}`}
                className={`group relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0A0A] p-6 transition-colors hover:border-[#FF6B4A]/40 sm:p-8 ${
                  index === 0 ? 'lg:col-span-2' : ''
                }`}
              >
                <Image
                  src={host.coverImage}
                  alt=""
                  fill
                  sizes={
                    index === 0
                      ? '(max-width: 1024px) 100vw, 66vw'
                      : '(max-width: 1024px) 100vw, 33vw'
                  }
                  className="object-cover opacity-35 transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transition-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white/65">
                      {host.role}
                    </span>
                    {host.verified && (
                      <span
                        aria-label="Verified host"
                        className="flex size-8 items-center justify-center rounded-full bg-[#FF4D21] text-sm font-black text-white"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white/45">
                      {host.neighborhood}, {host.city}
                    </p>
                    <h3 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-5xl">
                      {host.name}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">{host.tagline}</p>
                    <span className="mt-6 inline-flex text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6B4A]">
                      View host →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section
          id="venues"
          aria-labelledby="directory-venues-heading"
          className="mt-20 scroll-mt-28"
        >
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
                The circuit
              </p>
              <h2
                id="directory-venues-heading"
                className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] sm:text-6xl"
              >
                Venues
              </h2>
            </div>
            <p className="hidden text-[9px] font-black uppercase tracking-[0.22em] text-white/30 sm:block">
              {venues.length} rooms
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {venues.map((venue) => (
              <Link
                key={venue.id}
                href={`/venue/${venue.id}`}
                className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0A0A0A] transition-colors hover:border-white/25"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={venue.coverImage}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-white">
                    {venue.city}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-3xl font-black uppercase tracking-[-0.05em]">{venue.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/45">{venue.summary}</p>
                  <span className="mt-5 inline-flex text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6B4A]">
                    View venue →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
