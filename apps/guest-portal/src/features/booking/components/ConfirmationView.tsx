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
    <div className="relative z-10 min-h-screen overflow-hidden pb-28 pt-20 text-white sm:pt-24 lg:pb-8 lg:pt-20">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#080808]">
        <div className={`absolute inset-0 ${accent.backdrop}`} />
        <div className="absolute inset-x-0 bottom-0 h-[34rem] bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        <p className="mx-auto mt-3 max-w-3xl rounded-full border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-center text-[9px] font-black uppercase tracking-[0.24em] text-amber-200 sm:text-[10px]">
          UI preview · Fixture data · No order created
        </p>

        <header className="mx-auto max-w-3xl py-7 text-center lg:py-3">
          <div
            aria-hidden="true"
            className={`mx-auto flex size-14 items-center justify-center rounded-full border text-2xl font-black lg:size-12 lg:text-xl ${accent.borderStrong} ${accent.panel}`}
          >
            ✓
          </div>
          <h1 className="mt-3 text-5xl font-black uppercase leading-[0.86] tracking-[-0.06em] sm:text-6xl lg:text-6xl">
            Confirmation preview.
          </h1>
        </header>

        <section
          aria-labelledby="digital-pass-heading"
          className={`grid overflow-hidden rounded-[2rem] border bg-black/70 backdrop-blur-xl md:grid-cols-[0.78fr_1.22fr] ${accent.borderStrong} ${accent.posterShadow}`}
        >
          <div className="relative flex flex-col items-center justify-center p-6 text-center md:p-8">
            <div className="relative aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <Image
                src={event.image}
                alt={event.title}
                fill
                priority
                className="object-cover"
              />
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
              {event.category}
            </p>
          </div>

          <div className="flex flex-col justify-between border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-8">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                  Confirmation #{confirmation.id}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
                  Preview only
                </span>
              </div>

              <h2 id="digital-pass-heading" className="mt-4 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                {event.title}
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Date & Time
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {dateFormatter.format(new Date(event.startsAt))}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Venue
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">{event.venue}</p>
                  <p className="text-xs text-white/60">{event.address}, {event.city}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Ticket Tier
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {confirmation.tierName} × {confirmation.quantity}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Illustrative total
                </span>
                <span className="text-xl font-black text-white">
                  {moneyFormatter.format(confirmation.total.amountPaise / 100)}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tickets"
                  className="flex-1 rounded-full bg-white px-6 py-3 text-center text-xs font-black uppercase tracking-widest text-black hover:bg-white/90 transition-all"
                >
                  View ticket UI preview
                </Link>
                <Link
                  href="/explore"
                  className="flex-1 rounded-full border border-white/20 px-6 py-3 text-center text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                >
                  Explore More Events
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
