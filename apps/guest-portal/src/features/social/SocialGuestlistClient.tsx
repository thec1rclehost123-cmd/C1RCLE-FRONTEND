'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { socialMutationReceiptSchema, socialGuestlistSchema } from '@c1rcle/contracts/guest-social';
import { Button } from '@c1rcle/ui';

import { csrfHeaders } from '@/lib/bff/csrf';

import { socialClient } from './social-client';

import type { SocialGuestlist } from '@c1rcle/contracts/guest-social';

export function SocialGuestlistClient({ initial }: { initial: SocialGuestlist }) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function hide() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await socialClient.put({
        path: `/api/social/events/${encodeURIComponent(data.event.id)}/visibility`,
        body: { hidden: !data.hiddenForMe },
        schema: socialMutationReceiptSchema,
        headers: csrfHeaders(),
      });
      setData(
        await socialClient.get({
          path: `/api/social/events/${encodeURIComponent(data.event.id)}/guestlist`,
          schema: socialGuestlistSchema,
        }),
      );
    } catch {
      setError('Your event visibility could not be updated. Try again.');
    } finally {
      setBusy(false);
    }
  }
  async function more() {
    if (!data.nextCursor || busy) return;
    setBusy(true);
    setError('');
    try {
      const page = await socialClient.get({
        path: `/api/social/events/${encodeURIComponent(data.event.id)}/guestlist?cursor=${encodeURIComponent(data.nextCursor)}`,
        schema: socialGuestlistSchema,
      });
      setData({
        ...page,
        items: [
          ...new Map([...data.items, ...page.items].map((guest) => [guest.id, guest])).values(),
        ],
      });
    } catch {
      setError('The next Guests could not be loaded. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-28 text-white sm:pt-36">
      <Link
        href={`/event/${encodeURIComponent(data.event.slug)}`}
        className="inline-flex min-h-11 items-center text-sm text-white/60"
      >
        ← {data.event.title}
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Who’s going</h1>
      <p className="mt-3 text-sm text-white/60">
        {data.visibleCount} {data.visibleCount === 1 ? 'Guest shares' : 'Guests share'} their
        identity here. This is a social guestlist, not the full admission list.
      </p>
      <div className="mt-6 space-y-3 border-y border-white/10 py-5">
        <Button variant="secondary" disabled={busy} onClick={() => void hide()}>
          {data.hiddenForMe ? 'Unhide me for this event' : 'Hide me for this event'}
        </Button>
        <p className="text-sm text-white/55">
          Hiding removes this event from your social profile and guestlists. Your ticket and
          admission stay unchanged.
        </p>
        <Link
          href="/profile?view=settings&section=social"
          className="inline-flex min-h-10 items-center text-sm underline"
        >
          Manage overall visibility
        </Link>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}
      {data.items.length === 0 ? (
        <p className="py-8 text-white/60">No Guests are sharing their identity here yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {data.items.map((guest) => (
            <li key={guest.id}>
              <Link
                href={`/profile/${encodeURIComponent(guest.id)}`}
                className="flex min-h-24 items-center gap-4 py-4"
              >
                <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 font-semibold">
                  {guest.avatarUrl ? (
                    <Image
                      src={guest.avatarUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    guest.displayName[0]
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block break-words font-semibold">{guest.displayName}</span>
                  <span className="mt-1 block text-sm text-white/50">
                    {guest.interests.join(' · ')}
                  </span>
                </span>
                <span aria-hidden="true" className="ml-auto">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data.nextCursor && (
        <Button variant="secondary" disabled={busy} onClick={() => void more()}>
          More Guests
        </Button>
      )}
    </div>
  );
}
