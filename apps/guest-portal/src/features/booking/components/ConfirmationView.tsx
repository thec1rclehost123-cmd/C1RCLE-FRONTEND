import Image from 'next/image';
import Link from 'next/link';

import { getEventAccentClasses } from '@/features/event-detail/eventDetailPalette';

import type { BookingConfirmationFixture, BookingEventFixture } from '../types/booking.types';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

export function ConfirmationView({
  confirmation,
  event,
}: {
  confirmation: BookingConfirmationFixture;
  event: BookingEventFixture;
}) {
  const accent = getEventAccentClasses(event.accentTone);

  return (
    <main className="relative z-10 min-h-screen overflow-hidden pb-28 pt-20 text-white sm:pt-24 lg:pb-8 lg:pt-20">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#080808]">
        <div className={`absolute inset-0 ${accent.backdrop}`} />
        <div className="absolute inset-x-0 bottom-0 h-[34rem] bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl py-7 text-center lg:py-3">
          <div
            aria-hidden="true"
            className={`mx-auto flex size-14 items-center justify-center rounded-full border text-2xl font-black lg:size-12 lg:text-xl ${accent.borderStrong} ${accent.panel}`}
          >
            ✓
          </div>
          <p
            className={`mt-4 text-[9px] font-black uppercase tracking-[0.28em] lg:mt-2 ${accent.text}`}
          >
            UI preview · fixture data · no ticket issued
          </p>
          <h1 className="mt-3 text-5xl font-black uppercase leading-[0.86] tracking-[-0.06em] sm:text-6xl lg:text-6xl">
            You&apos;re on the list.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-xs leading-5 text-white/45 lg:mt-2">
            This demonstrates the post-payment experience only. It does not prove payment, reserve
            inventory, or grant entry.
          </p>
        </header>

        <section
          aria-labelledby="digital-pass-heading"
          className={`grid overflow-hidden rounded-[2rem] border bg-black/70 backdrop-blur-xl md:grid-cols-[0.78fr_1.22fr] ${accent.borderStrong} ${accent.posterShadow}`}
        >
          <div className="relative min-h-64 md:min-h-[360px] lg:min-h-[340px]">
            <Image
              src={event.image}
              alt={`${event.title} poster`}
              fill
              preload
              sizes="(max-width: 768px) 100vw, 390px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
            <div className="absolute inset-x-5 bottom-5">
              <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${accent.text}`}>
                Fixture pass preview
              </p>
              <h2 id="digital-pass-heading" className="mt-2 text-3xl font-black uppercase">
                {event.title}
              </h2>
              <p className="mt-2 text-xs text-white/50">
                {event.venue} · {event.city}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
                  Attendee
                </p>
                <p className="mt-2 text-lg font-black uppercase text-white">
                  {confirmation.attendeeName}
                </p>
              </div>
              <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-200">
                Preview only
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_132px] md:items-center">
              <dl className="grid grid-cols-2 gap-x-5 gap-y-5 py-5">
                <PassDetail
                  label="Date & time"
                  value={dateFormatter.format(new Date(event.startsAt))}
                />
                <PassDetail label="Tier" value={confirmation.tierName} />
                <PassDetail label="Quantity" value={String(confirmation.quantity)} />
                <PassDetail
                  label="Fixture total"
                  value={moneyFormatter.format(confirmation.total.amountPaise / 100)}
                />
                <PassDetail label="Reference" value={confirmation.referenceLabel} />
                <PassDetail label="Status" value="Not issued" />
              </dl>

              <div className="rounded-[1.25rem] border border-dashed border-white/15 bg-white/[0.035] p-3 text-center">
                <div className="mx-auto grid size-20 grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-white p-3 opacity-65">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
                    <span
                      key={cell}
                      className={
                        cell % 2 === 0
                          ? 'rounded-sm bg-black'
                          : 'rounded-full border-2 border-black bg-white'
                      }
                    />
                  ))}
                </div>
                <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-white/55">
                  Not a QR code
                </p>
                <p className="mt-1 text-[7px] uppercase tracking-[0.1em] text-white/25">
                  Non-scannable
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Link
            href="/tickets"
            className="flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black"
          >
            Open ticket previews
          </Link>
          <Link
            href={`/event/${event.id}`}
            className="flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60"
          >
            Event details
          </Link>
          <Link
            href="/explore"
            className="flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60"
          >
            Explore more
          </Link>
        </div>
      </div>
    </main>
  );
}

function PassDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">{label}</dt>
      <dd className="mt-2 text-xs font-bold leading-5 text-white/75">{value}</dd>
    </div>
  );
}
