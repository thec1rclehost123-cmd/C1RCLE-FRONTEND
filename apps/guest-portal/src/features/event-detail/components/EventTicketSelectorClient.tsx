'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { getEventAccentClasses } from '../eventDetailPalette';

import type { EventAccentTone, EventDetailTicketTier } from '../types/event-detail.types';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function EventTicketSelectorClient({
  accentTone,
  eventId,
  initialVisibleCount = 3,
  tiers,
  headerNote = 'Ticket options',
  referralCode,
  accessGrantId,
  open,
  onClose,
  triggerRef,
}: {
  accentTone: EventAccentTone;
  eventId: string;
  initialVisibleCount?: number;
  tiers: readonly EventDetailTicketTier[];
  headerNote?: string;
  referralCode?: string;
  accessGrantId?: string;
  open?: boolean;
  onClose?: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const accent = getEventAccentClasses(accentTone);
  const hasHiddenTiers = tiers.length > initialVisibleCount;
  const visibleTiers = expanded ? tiers : tiers.slice(0, initialVisibleCount);

  useEffect(() => {
    if (open !== true) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      } else if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (open === true) wasOpen.current = true;
    else if (open === false && wasOpen.current) {
      wasOpen.current = false;
      triggerRef?.current?.focus();
    }
  }, [open, triggerRef]);

  if (open === false) return null;

  return (
    <section
      ref={dialogRef}
      role={open === true ? 'dialog' : undefined}
      aria-modal={open === true ? true : undefined}
      aria-labelledby="ticket-options-heading"
      tabIndex={open === true ? -1 : undefined}
      className={`${open === true ? 'fixed inset-x-0 bottom-0 z-[90] max-h-[88svh] overflow-y-auto rounded-t-[1.5rem] border bg-[#0d0d0d] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.5rem] sm:p-6' : 'rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl'} ${accent.border} ${accent.eventGlow}`}
    >
      {open === true ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            aria-label="Close ticket selection"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full border border-white/10 text-2xl text-white/70"
          >
            ×
          </button>
        </div>
      ) : null}
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/40">Admission</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h2 id="ticket-options-heading" className="text-2xl font-black uppercase tracking-tight">
          Get on the list
        </h2>
        <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${accent.text}`}>
          {headerNote}
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {tiers.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-5 text-sm text-white/55">
            Ticket options are not currently available.
          </p>
        ) : null}
        {visibleTiers.map((tier) => {
          const selected = selectedTier === tier.id;
          const soldOut = tier.availableQuantity === 0;
          const price = tier.price ? moneyFormatter.format(tier.price.amountPaise / 100) : 'Free';

          return (
            <div key={tier.id}>
              <button
                type="button"
                aria-pressed={selected}
                disabled={soldOut}
                onClick={() => {
                  if (!soldOut) setSelectedTier(tier.id);
                }}
                className={`flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors motion-reduce:transition-none ${
                  soldOut
                    ? 'cursor-not-allowed border-white/5 bg-white/[0.025] opacity-55'
                    : selected
                      ? accent.selected
                      : 'border-white/10 bg-white/[0.045] hover:bg-white/[0.08]'
                }`}
              >
                <span>
                  <span className="block text-sm font-bold text-white">{tier.name}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-white/35">
                    {tier.description}
                  </span>
                  {tier.admissionMode === 'per_person' && (tier.guestCount ?? 1) > 1 ? (
                    <span className="mt-1 block text-[10px] font-medium normal-case tracking-normal text-white/55">
                      Group of {String(tier.guestCount)} · separate pass for each attendee
                    </span>
                  ) : null}
                </span>
                <span className="text-right">
                  <span className="block text-sm font-black text-white">{price}</span>
                  <span className="mt-1 block text-[9px] uppercase tracking-[0.14em] text-white/30">
                    {soldOut ? 'Sold Out' : tier.availabilityLabel}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {hasHiddenTiers && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => {
            setExpanded((current) => !current);
          }}
          className={`mt-3 flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors motion-reduce:transition-none ${accent.border} ${accent.text} hover:bg-white/[0.07]`}
        >
          {expanded
            ? 'Show fewer tiers'
            : `View ${String(tiers.length - initialVisibleCount)} more`}
        </button>
      )}

      {selectedTier ? (
        <Link
          href={`/checkout/${eventId}?tier=${encodeURIComponent(selectedTier)}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ''}${accessGrantId ? `#accessGrantId=${encodeURIComponent(accessGrantId)}` : ''}`}
          className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-white px-5 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black"
        >
          Continue to checkout
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 min-h-11 w-full cursor-not-allowed rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/40"
        >
          {tiers.length === 0 ? 'Checkout unavailable' : 'Select a ticket tier'}
        </button>
      )}
    </section>
  );
}
