'use client';

import Link from 'next/link';
import { useState } from 'react';

import { createTicketAddonSchema, ticketAddonDtoSchema } from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { apiClient } from '@/lib/api/client';
import { describeApiError } from '@/lib/api/describe-error';

import type { TicketAddonDto } from '@c1rcle/contracts';
import type { SyntheticEvent } from 'react';

export function ConnectedEventAddonsScreen({
  studio,
  eventId,
  eventTitle,
  organizationId,
  initialAddons,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly organizationId: string;
  readonly initialAddons: readonly TicketAddonDto[];
}) {
  const [addons, setAddons] = useState(initialAddons);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<'parking' | 'cloakroom' | 'merchandise'>('parking');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [maxPerEntitlement, setMaxPerEntitlement] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createAddon(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = createTicketAddonSchema.parse({
        name,
        description,
        kind,
        priceInPaise: Math.round(Number(price) * 100),
        quantity: Number(quantity),
        maxPerEntitlement: Number(maxPerEntitlement),
      });
      const created = await apiClient.post({
        path: `/api/v2/events/${encodeURIComponent(eventId)}/ticket-addons`,
        body,
        schema: ticketAddonDtoSchema,
        headers: {
          'x-organization-id': organizationId,
          'idempotency-key': crypto.randomUUID(),
        },
      });
      setAddons((current) => [created, ...current]);
      setName('');
      setDescription('');
      setPrice('');
      setQuantity('');
      setMaxPerEntitlement('1');
    } catch (cause) {
      setError(
        describeApiError(cause, 'The extra could not be created. Check the values and retry.'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(eventId)}`}
          className="text-sm text-stone-400"
        >
          ← {eventTitle}
        </Link>
        <h1 className="mt-5 text-3xl font-bold">Ticket extras</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
          Create optional parking, cloakroom, or merchandise products. Extras are priced and stock
          checked during checkout, then attached to each admission ticket.
        </p>

        <section className="mt-7 rounded-2xl border border-white/15 bg-neutral-950 p-5">
          <h2 className="text-lg font-semibold">Add an extra</h2>
          <form
            onSubmit={(event) => void createAddon(event)}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <label className="grid gap-2 text-sm">
              Name
              <input
                required
                maxLength={120}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Type
              <select
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as typeof kind);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              >
                <option value="parking">Parking</option>
                <option value="cloakroom">Cloakroom</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Description
              <input
                maxLength={1000}
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Price (₹)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Stock units
              <input
                required
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Maximum per admission ticket
              <input
                required
                type="number"
                min="1"
                max="10"
                step="1"
                value={maxPerEntitlement}
                onChange={(event) => {
                  setMaxPerEntitlement(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            {error ? (
              <p role="alert" className="text-sm text-rose-300 sm:col-span-2">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-full bg-white px-5 text-sm font-bold text-black disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
            >
              {busy ? 'Creating…' : 'Create extra'}
            </button>
          </form>
        </section>

        <section className="mt-7 rounded-2xl border border-white/15 bg-neutral-950 p-5">
          <h2 className="text-lg font-semibold">Current catalog</h2>
          {addons.length ? (
            <ul className="mt-4 divide-y divide-white/10">
              {addons.map((addon) => (
                <li
                  key={addon.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold">{addon.name}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      {addon.kind} · ₹{(addon.priceInPaise / 100).toFixed(2)} · stock{' '}
                      {addon.quantity}
                    </p>
                    {addon.description ? (
                      <p className="mt-1 text-xs text-stone-500">{addon.description}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-stone-300">
                    {addon.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stone-400">No ticket extras have been added yet.</p>
          )}
        </section>
      </main>
    </PageContainer>
  );
}
