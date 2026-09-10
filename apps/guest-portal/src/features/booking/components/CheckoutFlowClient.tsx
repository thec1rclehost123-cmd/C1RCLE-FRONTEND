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
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section
        aria-labelledby="checkout-heading"
        className={`rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl sm:p-7 ${accent.borderStrong} ${accent.panelShadow}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className={`text-[9px] font-black uppercase tracking-[0.28em] ${accent.text}`}>
              Step {String(step).padStart(2, '0')} of 03
            </p>
            <h1
              id="checkout-heading"
              className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl"
            >
              {step === 1 && 'Select tickets'}
              {step === 2 && 'Your details'}
              {step === 3 && 'Payment options'}
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

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 sm:hidden">
                      Quantity
                    </span>
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-1">
                      <button
                        type="button"
                        aria-label={`Decrease ${tier.name} count`}
                        disabled={quantity === 0}
                        onClick={() => {
                          changeQuantity(tier.id, -1, tier.maximumQuantity);
                        }}
                        className="flex size-8 items-center justify-center rounded-full text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-20"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-black text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${tier.name} count`}
                        disabled={quantity >= tier.maximumQuantity}
                        onClick={() => {
                          changeQuantity(tier.id, 1, tier.maximumQuantity);
                        }}
                        className="flex size-8 items-center justify-center rounded-full text-sm font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-20"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={selectedTickets.length === 0}
                onClick={() => {
                  setStep(2);
                }}
                className={`rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  selectedTickets.length > 0
                    ? `${accent.selected} text-white shadow-lg`
                    : 'cursor-not-allowed bg-white/10 text-white/30'
                }`}
              >
                Continue to details →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (attendee.name && attendee.email) {
                setStep(3);
              }
            }}
            className="mt-8 space-y-4"
          >
            <PreviewField
              label="Full Name"
              type="text"
              value={attendee.name}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, name: value }));
              }}
            />
            <PreviewField
              label="Email Address"
              type="email"
              value={attendee.email}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, email: value }));
              }}
            />
            <PreviewField
              label="Phone Number"
              type="tel"
              value={attendee.phone}
              onChange={(value) => {
                setAttendee((current) => ({ ...current, phone: value }));
              }}
            />

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                }}
                className="text-xs font-black uppercase tracking-[0.2em] text-white/50 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={!attendee.name || !attendee.email}
                className={`rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  attendee.name && attendee.email
                    ? `${accent.selected} text-white shadow-lg`
                    : 'cursor-not-allowed bg-white/10 text-white/30'
                }`}
              >
                Proceed to payment →
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  { id: 'card', label: 'Credit/Debit Card' },
                  { id: 'upi', label: 'UPI / Instant' },
                  { id: 'bank', label: 'Net Banking' },
                ] as const
              ).map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    setPaymentPreview(method.id);
                  }}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    paymentPreview === method.id
                      ? `${accent.selected} border-white/40 text-white`
                      : 'border-white/10 bg-white/[0.035] text-white/60 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em]">{method.label}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                }}
                className="text-xs font-black uppercase tracking-[0.2em] text-white/50 hover:text-white"
              >
                ← Back to details
              </button>
              <Link
                href={`/confirmation/preview-${event.id}`}
                className={`rounded-full px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl ${accent.selected}`}
              >
                Complete Payment →
              </Link>
            </div>
          </div>
        )}
      </section>

      <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/65 backdrop-blur-xl">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={event.image}
            alt={event.title}
            fill
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
                    <AnimatedValue
                      value={moneyFormatter.format(
                        (ticket.price.amountPaise * ticket.quantity) / 100,
                      )}
                    />
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs uppercase tracking-[0.18em] text-white/25">
                No tickets selected
              </p>
            )}
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-white/45">
              <dt>Subtotal</dt>
              <dd>
                <AnimatedValue value={moneyFormatter.format(subtotalPaise / 100)} />
              </dd>
            </div>
            <div className="flex justify-between gap-4 text-white/45">
              <dt>Fees</dt>
              <dd>
                <AnimatedValue value={moneyFormatter.format(previewFeesPaise / 100)} />
              </dd>
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-4">
              <dt className="text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
                Total
              </dt>
              <dd className="text-3xl font-black text-white">
                <AnimatedValue value={moneyFormatter.format(previewTotalPaise / 100)} />
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

function AnimatedValue({ value }: { value: string }) {
  return (
    <span key={value} className="checkout-number-roll inline-block">
      {value}
    </span>
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
