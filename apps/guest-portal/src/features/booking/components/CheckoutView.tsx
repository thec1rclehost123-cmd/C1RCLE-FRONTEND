import Image from 'next/image';
import { Suspense } from 'react';

import { CheckoutFlowClient } from './CheckoutFlowClient';

import type { BookingEventFixture } from '../types/booking.types';

export function CheckoutView({
  event,
  initialTierId,
  eventSlug = event.eventId,
  onClose,
}: {
  event: BookingEventFixture;
  initialTierId?: string | undefined;
  eventSlug?: string;
  onClose?: (() => void) | undefined;
}) {
  return (
    <div
      className={`relative isolate ${onClose ? 'h-full min-h-0 bg-transparent' : 'min-h-dvh bg-[#050505]'} overflow-hidden text-white`}
    >
      {onClose ? null : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#08070a]"
        >
          <Image
            src={event.image}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="scale-110 object-cover opacity-20 blur-[38px]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.92),rgba(0,0,0,.60)_55%,rgba(0,0,0,.9)),linear-gradient(0deg,#050505,transparent_45%,#050505)]" />
        </div>
      )}

      <div
        className={`relative z-10 mx-auto h-full w-full ${onClose ? 'max-w-none' : 'max-w-[1360px]'}`}
      >
        <Suspense fallback={<CheckoutFlowSkeleton />}>
          <CheckoutFlowClient event={event} initialTierId={initialTierId} eventSlug={eventSlug} />
        </Suspense>
      </div>
      {onClose ? (
        <button
          type="button"
          aria-label="Close checkout"
          onClick={onClose}
          className="absolute right-3 top-3 z-50 inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-xl text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5 sm:top-5"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function CheckoutFlowSkeleton() {
  return (
    <div className="mx-auto max-w-[1020px] animate-pulse">
      <div className="mb-4 h-10 w-36 rounded-full bg-white/[0.04]" />
      <div className="grid overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0b0a0d]/95 lg:grid-cols-[minmax(240px,0.78fr)_minmax(0,1.22fr)]">
        <div className="min-h-[180px] border-b border-white/10 bg-white/[0.03] lg:min-h-[520px] lg:border-b-0 lg:border-r" />
        <div className="min-h-[360px] bg-white/[0.02]" />
      </div>
    </div>
  );
}
