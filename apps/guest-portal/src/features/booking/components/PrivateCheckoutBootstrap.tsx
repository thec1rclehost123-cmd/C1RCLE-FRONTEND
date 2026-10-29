'use client';

import { useEffect, useState } from 'react';

import { eventDtoSchema } from '@c1rcle/contracts';

import { useTicketAccessGrantId } from '@/lib/access/use-ticket-access-grant-id';
import { bffClient } from '@/lib/bff/bff-client';

import { toBookingEventFixture } from '../booking-mapping';

import { CheckoutView } from './CheckoutView';

import type { BookingEventFixture } from '../types/booking.types';

export function PrivateCheckoutBootstrap(props: { eventId: string; initialTierId?: string }) {
  const grantId = useTicketAccessGrantId();
  return (
    <PrivateCheckoutBootstrapState
      key={grantId ?? 'missing'}
      {...props}
      {...(grantId ? { grantId } : {})}
    />
  );
}

function PrivateCheckoutBootstrapState({
  eventId,
  initialTierId,
  grantId,
}: {
  eventId: string;
  initialTierId?: string;
  grantId?: string;
}) {
  const [event, setEvent] = useState<BookingEventFixture | null>(null);
  const [status, setStatus] = useState<'loading' | 'unavailable'>('loading');

  useEffect(() => {
    if (!grantId) return;
    void bffClient
      .get({
        path: `/api/public/events/${encodeURIComponent(eventId)}`,
        headers: { 'x-ticket-access-grant-id': grantId },
        schema: eventDtoSchema,
      })
      .then((detail) => {
        setEvent(toBookingEventFixture(detail, null, []));
      })
      .catch(() => {
        setStatus('unavailable');
      });
  }, [eventId, grantId]);

  if (event) {
    return <CheckoutView event={event} eventSlug={event.eventId} initialTierId={initialTierId} />;
  }

  return (
    <section className="relative z-10 mx-auto flex min-h-[75vh] max-w-2xl flex-col justify-center px-6 py-24 text-white">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6842]">
        Private checkout
      </p>
      <h1 className="mt-5 text-3xl font-black uppercase">
        {!grantId
          ? 'Private event access required'
          : status === 'loading'
            ? 'Checking access'
            : 'Private event access unavailable'}
      </h1>
      <p className="mt-4 text-sm leading-6 text-white/55">
        {grantId && status === 'loading'
          ? 'Confirming this account’s event grant before loading checkout.'
          : !grantId
            ? 'Open the private event link and enter its access code before continuing to checkout.'
            : 'This private checkout could not be confirmed. Return to the event link and try again.'}
      </p>
    </section>
  );
}
