import Image from 'next/image';
import Link from 'next/link';

import { DirectoryEventCard } from './DirectoryEventCard';

import type { HostDirectoryProfile } from '../types/directory.types';

export function HostProfileView({ host }: { host: HostDirectoryProfile }) {
  const cities = new Set(host.events.map((event) => event.city)).size;
  const venues = new Set(host.events.map((event) => event.venueId)).size;

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip px-4 pb-24 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_64%_0%,rgba(255,68,0,0.17),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-[1380px]">
        <Link
          href="/hosts"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/55 transition-colors hover:border-white/20 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          All hosts
        </Link>

        <header className="relative mt-5 min-h-[34rem] overflow-hidden rounded-[2rem] border border-[#FF5A2B]/25 bg-[#0A0A0A] p-6 shadow-[0_30px_110px_rgba(255,68,0,0.14)] sm:p-9 lg:p-12">
          <Image
            src={host.coverImage}
            alt=""
            fill
            preload
            sizes="(max-width: 1380px) 100vw, 1380px"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.97)_5%,rgba(0,0,0,0.74)_54%,rgba(0,0,0,0.35))]" />

          <div className="relative flex min-h-[29rem] max-w-4xl flex-col justify-end">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-white/65">
                {host.role}
              </span>
              {host.verified && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5A2B]/30 bg-[#FF4400]/12 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#FF7957]">
                  <span
                    aria-label="Verified host"
                    className="flex size-5 items-center justify-center rounded-full bg-[#FF4D21] text-[11px] text-white"
                  >
                    ✓
                  </span>
                  Verified
                </span>
              )}
            </div>

            <div className="mt-7 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
              <div className="flex size-28 shrink-0 items-center justify-center rounded-[2rem] border border-white/20 bg-[#FF4D21] text-3xl font-black tracking-[-0.06em] shadow-2xl sm:size-36 sm:text-4xl">
                {host.initials}
              </div>
              <div>
                <h1 className="text-5xl font-black uppercase leading-[0.84] tracking-[-0.07em] sm:text-7xl lg:text-8xl">
                  {host.name}
                </h1>
                <p className="mt-4 text-sm font-semibold text-white/55">
                  {host.neighborhood}, {host.city} · @{host.handle}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
              About the host
            </p>
            <h2 className="mt-4 max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.045em] sm:text-5xl">
              {host.tagline}
            </h2>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-white/50">{host.bio}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {host.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/55"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3 rounded-[1.75rem] border border-white/10 bg-black/55 p-4 sm:p-6">
            {[
              { label: 'Events', value: host.events.length },
              { label: 'Cities', value: cities },
              { label: 'Venues', value: venues },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex min-w-0 flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-center sm:p-4"
              >
                <dt className="truncate text-[7px] font-black uppercase tracking-[0.16em] text-white/35 sm:text-[8px]">
                  {stat.label}
                </dt>
                <dd className="mt-2 text-2xl font-black sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="host-events-heading" className="mt-16">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
            On the calendar
          </p>
          <h2
            id="host-events-heading"
            className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] sm:text-6xl"
          >
            Upcoming events
          </h2>

          {host.events.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {host.events.map((event) => (
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
