'use client';

import { useState } from 'react';

import {
  eventPublicDetailDtoSchema,
  publicTicketTierListResponseSchema,
  redeemTicketAccessCodeSchema,
  ticketAccessGrantDtoSchema,
} from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import { toEventDetailFixture } from '../event-detail-mapping';

import { EventDetailView } from './EventDetailView';
import { EventTicketSelectorClient } from './EventTicketSelectorClient';

import type {
  EventAccentTone,
  EventDetailFixture,
  EventDetailTicketTier,
} from '../types/event-detail.types';

export function PrivateTierUnlockClient({
  eventId,
  accentTone,
  referralCode,
}: {
  eventId: string;
  accentTone: EventAccentTone;
  referralCode?: string;
}) {
  const [code, setCode] = useState('');
  const [grantId, setGrantId] = useState<string | null>(null);
  const [tiers, setTiers] = useState<readonly EventDetailTicketTier[]>([]);
  const [privateEvent, setPrivateEvent] = useState<EventDetailFixture | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    setError(null);
    setTiers([]);
    setPrivateEvent(null);
    setGrantId(null);
    try {
      const input = redeemTicketAccessCodeSchema.parse({ code });
      const grant = await bffClient.post({
        path: '/api/ticket-access-codes/redeem',
        body: input,
        headers: csrfHeaders(),
        schema: ticketAccessGrantDtoSchema,
      });
      if (grant.scope === 'event') {
        const event = await bffClient.get({
          path: `/api/public/events/${encodeURIComponent(eventId)}`,
          headers: { 'x-ticket-access-grant-id': grant.id },
          schema: eventPublicDetailDtoSchema,
        });
        const unlocked = await bffClient.get({
          path: `/api/public/events/${encodeURIComponent(eventId)}/tiers`,
          headers: { 'x-ticket-access-grant-id': grant.id },
          schema: publicTicketTierListResponseSchema,
        });
        setPrivateEvent(toEventDetailFixture(event, unlocked.items));
        setGrantId(grant.id);
        setCode('');
        return;
      }
      const unlocked = await bffClient.get({
        path: `/api/public/events/${encodeURIComponent(eventId)}/tiers`,
        headers: { 'x-ticket-access-grant-id': grant.id },
        schema: publicTicketTierListResponseSchema,
      });
      const mapped = unlocked.items.map((tier) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        price:
          tier.priceInPaise === 0
            ? null
            : { amountPaise: tier.priceInPaise, currency: 'INR' as const },
        availabilityLabel:
          tier.availableQuantity === 0 ? 'Sold out' : `${String(tier.availableQuantity)} available`,
        availableQuantity: tier.availableQuantity,
        ...(tier.guestCount === undefined ? {} : { guestCount: tier.guestCount }),
        ...(tier.admissionMode === undefined ? {} : { admissionMode: tier.admissionMode }),
      }));
      setTiers(mapped);
      setGrantId(grant.id);
      setCode('');
      if (!mapped.length)
        setError('This code does not unlock a ticket currently available to book.');
    } catch {
      setError('We could not unlock tickets with that code. Check it and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/45 p-4">
      {privateEvent && grantId ? (
        <EventDetailView event={privateEvent} accessGrantId={grantId} />
      ) : (
        <>
          <label htmlFor="ticket-access-code" className="text-sm font-semibold text-white">
            Have an event or private ticket code?
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id="ticket-access-code"
              autoComplete="off"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
              }}
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-neutral-950 px-3 py-3 text-sm text-white"
              aria-describedby="ticket-access-help"
            />
            <button
              type="button"
              disabled={busy || code.trim().length < 20}
              onClick={() => void unlock()}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
            >
              {busy ? 'Checking…' : 'Unlock'}
            </button>
          </div>
          <p id="ticket-access-help" className="mt-2 text-xs text-white/45">
            A verified account is required. Each code has a limited number of redemptions.
          </p>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-rose-300">
              {error}
            </p>
          ) : null}
          {grantId && tiers.length ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/55">
                Unlocked ticket options
              </p>
              <EventTicketSelectorClient
                accentTone={accentTone}
                eventId={eventId}
                tiers={tiers}
                accessGrantId={grantId}
                initialVisibleCount={3}
                headerNote="Private access"
                {...(referralCode ? { referralCode } : {})}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
