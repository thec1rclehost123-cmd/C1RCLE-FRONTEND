'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { getEventAccentClasses } from '@/features/event-detail/eventDetailPalette';

import type { BookingEventFixture } from '../types/booking.types';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

type CheckoutStep = 1 | 2 | 3;
type PaymentPreview = 'card' | 'upi' | 'bank';

export function CheckoutFlowClient({
  event,
  initialTierId,
}: {
  event: BookingEventFixture;
  initialTierId?: string | undefined;
}) {
  const searchParams = useSearchParams();
  const requestedTier = initialTierId ?? searchParams.get('tier') ?? undefined;
  const initialTier = event.ticketTiers.some((tier) => tier.id === requestedTier)
    ? requestedTier
    : event.ticketTiers[0]?.id;
  const [step, setStep] = useState<CheckoutStep>(1);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    initialTier ? { [initialTier]: 1 } : {},
  );
  const [attendee, setAttendee] = useState({ name: '', email: '', phone: '' });
  const [paymentPreview, setPaymentPreview] = useState<PaymentPreview | null>(null);
  const accent = getEventAccentClasses(event.accentTone);

  const selectedTickets = useMemo(
    () =>
      event.ticketTiers
        .map((tier) => ({ ...tier, quantity: quantities[tier.id] ?? 0 }))
        .filter((tier) => tier.quantity > 0),
    [event.ticketTiers, quantities],
  );
  const subtotalPaise = selectedTickets.reduce(
    (total, tier) => total + tier.price.amountPaise * tier.quantity,
    0,
  );
  const previewFeesPaise = Math.round(subtotalPaise * 0.05);
  const previewTotalPaise = subtotalPaise + previewFeesPaise;

  function changeQuantity(tierId: string, change: number, maximum: number) {
    setQuantities((current) => ({
      ...current,
      [tierId]: Math.max(0, Math.min(maximum, (current[tierId] ?? 0) + change)),
    }));
  }

  return (
    <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section
        aria-labelledby="checkout-heading"
        className={`rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl sm:p-7 ${accent.borderStrong} ${accent.panelShadow}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className={`text-[9px] font-black uppercase tracking-[0.28em] ${accent.text}`}>
              Booking preview · Step {String(step).padStart(2, '0')}
            </p>
            <h1
              id="checkout-heading"
              className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl"
            >
              {step === 1 && 'Select tickets'}
              {step === 2 && 'Your details'}
              {step === 3 && 'Review only'}
            </h1>
          </div>
          <ol aria-label="Checkout progress" className="flex items-center gap-2">
            {[1, 2, 3].map((item) => (
              <li
                key={item}
                aria-current={step === item ? 'step' : undefined}
                className={`flex size-9 items-center justify-center rounded-full border text-[10px] font-black ${
                  step === item ? `${accent.selected} text-white` : 'border-white/10 text-white/30'
                }`}
              >
                {item}
              </li>
            ))}
          </ol>
        </div>

        {step === 1 && (
          <div className="mt-8 space-y-3">
            {event.ticketTiers.map((tier) => {
              const quantity = quantities[tier.id] ?? 0;
              return (
                <article
                  key={tier.id}
                  className={`flex flex-col gap-5 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    quantity > 0 ? accent.selected : 'border-white/10 bg-white/[0.035]'
                  }`}
                >
                  <div>
                    <h2 className="text-lg font-black uppercase text-white">{tier.name}</h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/35">
                      {tier.description}
                    </p>
                    <p className="mt-3 text-sm font-black text-white">
                      {moneyFormatter.format(tier.price.amountPaise / 100)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <button
                      type="button"
                      disabled={quantity === 0}
                      aria-label={`Remove one ${tier.name}`}
                      onClick={() => {
                        changeQuantity(tier.id, -1, tier.maximumQuantity);
                      }}
                      className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg font-bold disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      −
                    </button>
                    <output
                      aria-label={`${tier.name} quantity`}
                      className="w-8 text-center text-base font-black"
                    >
                      {quantity}
                    </output>
                    <button
                      type="button"
                      disabled={quantity >= tier.maximumQuantity}
                      aria-label={`Add one ${tier.name}`}
                      onClick={() => {
                        changeQuantity(tier.id, 1, tier.maximumQuantity);
                      }}
                      className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg font-bold disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      +
                    </button>
                  </div>
                </article>
              );
            })}

            <button
              type="button"
              disabled={selectedTickets.length === 0}
              onClick={() => {
                setStep(2);
              }}
              className="mt-4 min-h-12 w-full rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-black disabled:cursor-not-allowed disabled:opacity-30"
            >
              Continue · {moneyFormatter.format(subtotalPaise / 100)}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-5">
            <PreviewField
              label="Full name"
              type="text"
              value={attendee.name}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, name: value }));
              }}
            />
            <PreviewField
              label="Email address"
              type="email"
              value={attendee.email}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, email: value }));
              }}
            />
            <PreviewField
              label="Phone number · optional"
              type="tel"
              value={attendee.phone}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, phone: value }));
              }}
            />
            <div className="flex flex-col gap-3 pt-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                }}
                className="min-h-12 rounded-full border border-white/10 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/55"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!attendee.name.trim() || !attendee.email.includes('@')}
                onClick={() => {
                  setStep(3);
                }}
                className="min-h-12 flex-1 rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-black disabled:cursor-not-allowed disabled:opacity-30"
              >
                Review payment UI
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-amber-200">
                Presentation only
              </p>
              <p className="mt-2 text-sm leading-6 text-white/55">
                These controls do not initiate payment, reserve inventory, or create an order.
              </p>
            </div>

            <fieldset className="mt-6 grid gap-3 sm:grid-cols-3">
              <legend className="sr-only">Payment method preview</legend>
              {(
                [
                  ['card', 'Card'],
                  ['upi', 'UPI'],
                  ['bank', 'Bank'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={paymentPreview === id}
                  onClick={() => {
                    setPaymentPreview(id);
                  }}
                  className={`min-h-20 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] ${
                    paymentPreview === id ? accent.selected : 'border-white/10 bg-white/[0.035]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </fieldset>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                }}
                className="min-h-12 rounded-full border border-white/10 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/55"
              >
                Back
              </button>
              {paymentPreview ? (
                <Link
                  href={`/confirmation/preview-${event.id}`}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-white px-6 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black"
                >
                  Open confirmation UI preview
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="min-h-12 flex-1 cursor-not-allowed rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-30"
                >
                  Select a payment preview
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <aside
        aria-label="Booking summary"
        className={`overflow-hidden rounded-[1.75rem] border bg-black/70 backdrop-blur-xl ${accent.borderStrong} ${accent.posterShadow}`}
      >
        <div className="relative aspect-[16/9]">
          <Image
            src={event.image}
            alt={`${event.title} poster`}
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 390px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute inset-x-5 bottom-5">
            <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${accent.text}`}>
              Booking summary
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase text-white">{event.title}</h2>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold text-white/60">
            {dateFormatter.format(new Date(event.startsAt))}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {event.venue} · {event.city}
          </p>

          <div className="mt-5 space-y-3 border-y border-white/10 py-5">
            {selectedTickets.length > 0 ? (
              selectedTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-white/55">
                    {ticket.name} × {ticket.quantity}
                  </span>
                  <span className="font-bold text-white">
                    {moneyFormatter.format((ticket.price.amountPaise * ticket.quantity) / 100)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs uppercase tracking-[0.18em] text-white/25">
                No preview tickets
              </p>
            )}
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-white/45">
              <dt>Subtotal</dt>
              <dd>{moneyFormatter.format(subtotalPaise / 100)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-white/45">
              <dt>Illustrative fees · not authoritative</dt>
              <dd>{moneyFormatter.format(previewFeesPaise / 100)}</dd>
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
              <dt className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
                Preview total
              </dt>
              <dd className="text-3xl font-black text-white">
                {moneyFormatter.format(previewTotalPaise / 100)}
              </dd>
            </div>
          </dl>

          <p className="mt-5 rounded-xl bg-white/[0.04] p-3 text-[10px] leading-5 text-white/35">
            {event.doorNote}
          </p>
        </div>
      </aside>
    </div>
  );
}

function PreviewField({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: 'email' | 'tel' | 'text';
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="mt-2 min-h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/30 motion-reduce:transition-none"
      />
    </label>
  );
}
