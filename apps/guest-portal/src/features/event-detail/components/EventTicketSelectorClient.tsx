'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

import { useTicketAccessGrantId } from '@/lib/access/use-ticket-access-grant-id';
import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import { getEventAccentClasses } from '../eventDetailPalette';

import type { EventAccentTone, EventDetailTicketTier } from '../types/event-detail.types';

const waitlistEntrySchema = z.object({
  id: z.string(),
  status: z.enum(['waiting', 'offered', 'accepted', 'expired', 'cancelled']),
});

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
}: {
  accentTone: EventAccentTone;
  eventId: string;
  initialVisibleCount?: number;
  tiers: readonly EventDetailTicketTier[];
  headerNote?: string;
  referralCode?: string;
  accessGrantId?: string;
}) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [eligibilityAttested, setEligibilityAttested] = useState(false);
  const [waitlistState, setWaitlistState] = useState<{
    tierId: string;
    message: string;
    error: boolean;
  } | null>(null);
  const [joiningTierId, setJoiningTierId] = useState<string | null>(null);
  const grantFromUrl = useTicketAccessGrantId();
  const effectiveGrantId = accessGrantId ?? grantFromUrl;
  const accent = getEventAccentClasses(accentTone);
  const hasHiddenTiers = tiers.length > initialVisibleCount;
  const visibleTiers = expanded ? tiers : tiers.slice(0, initialVisibleCount);

  return (
    <section
      aria-labelledby="ticket-options-heading"
      className={`rounded-[1.75rem] border bg-black/65 p-5 backdrop-blur-xl ${accent.border} ${accent.eventGlow}`}
    >
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
                    {tier.availabilityLabel}
                  </span>
                </span>
              </button>
              {soldOut ? (
                <div className="-mt-1 rounded-b-2xl border border-t-0 border-white/10 bg-white/[0.025] px-4 pb-3 pt-1">
                  <button
                    type="button"
                    disabled={joiningTierId !== null}
                    onClick={() => {
                      setJoiningTierId(tier.id);
                      setWaitlistState(null);
                      void bffClient
                        .post({
                          path: '/api/waitlist',
                          body: {
                            eventId,
                            tierId: tier.id,
                            eligibilityAttested,
                            ...(effectiveGrantId ? { accessGrantId: effectiveGrantId } : {}),
                          },
                          headers: csrfHeaders(),
                          schema: waitlistEntrySchema,
                        })
                        .then(() => {
                          setWaitlistState({
                            tierId: tier.id,
                            message:
                              'You are on the waitlist. We will show any offer in your Tickets area.',
                            error: false,
                          });
                        })
                        .catch(() => {
                          setWaitlistState({
                            tierId: tier.id,
                            message:
                              'Could not join. Sign in with a verified account and try again; eligibility and access are checked by the event service.',
                            error: true,
                          });
                        })
                        .finally(() => {
                          setJoiningTierId(null);
                        });
                    }}
                    className={`min-h-10 rounded-full border px-4 text-[9px] font-black uppercase tracking-[0.16em] disabled:opacity-50 ${accent.border} ${accent.text}`}
                  >
                    {joiningTierId === tier.id ? 'Joining…' : 'Join waitlist'}
                  </button>
                  {waitlistState?.tierId === tier.id ? (
                    <p
                      role={waitlistState.error ? 'alert' : 'status'}
                      className="mt-2 text-xs text-white/60"
                    >
                      {waitlistState.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {tiers.some((tier) => tier.availableQuantity === 0) ? (
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-white/55">
          <input
            type="checkbox"
            checked={eligibilityAttested}
            onChange={(event) => {
              setEligibilityAttested(event.currentTarget.checked);
            }}
            className="mt-1 size-4 accent-orange-500"
          />
          <span>I confirm I meet the ticket eligibility requirements for the tier I join.</span>
        </label>
      ) : null}

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
