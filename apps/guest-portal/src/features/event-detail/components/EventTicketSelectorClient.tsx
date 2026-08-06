'use client';

import { useState } from 'react';

import { getEventAccentClasses } from '../eventDetailPalette';

import type { EventAccentTone, EventDetailTicketTier } from '../types/event-detail.types';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function EventTicketSelectorClient({
  accentTone,
  tiers,
}: {
  accentTone: EventAccentTone;
  tiers: readonly EventDetailTicketTier[];
}) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const accent = getEventAccentClasses(accentTone);

  return (
    <section
      aria-labelledby="ticket-options-heading"
      className={`rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl ${accent.border} ${accent.panelShadow}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/40">Admission</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h2 id="ticket-options-heading" className="text-2xl font-black uppercase tracking-tight">
          Get on the list
        </h2>
        <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${accent.text}`}>
          Fixture preview
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {tiers.map((tier) => {
          const selected = selectedTier === tier.id;
          const price = tier.price ? moneyFormatter.format(tier.price.amountPaise / 100) : 'Free';

          return (
            <button
              key={tier.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setSelectedTier(tier.id);
              }}
              className={`flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors motion-reduce:transition-none ${
                selected
                  ? accent.selected
                  : 'border-white/10 bg-white/[0.045] hover:bg-white/[0.08]'
              }`}
            >
              <span>
                <span className="block text-sm font-bold text-white">{tier.name}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-white/35">
                  {tier.description}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-black text-white">{price}</span>
                <span className="mt-1 block text-[9px] uppercase tracking-[0.14em] text-white/30">
                  {tier.availabilityLabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled
        title="Checkout integration is not connected"
        className="mt-5 min-h-11 w-full cursor-not-allowed rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/40"
      >
        {selectedTier ? 'Selection saved locally · checkout unavailable' : 'Select a preview tier'}
      </button>
    </section>
  );
}
