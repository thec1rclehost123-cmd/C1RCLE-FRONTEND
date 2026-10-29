import Image from 'next/image';
import { Suspense } from 'react';

import { CheckoutFlowClient } from './CheckoutFlowClient';

import type { BookingEventFixture } from '../types/booking.types';

export function CheckoutView({
  event,
  initialTierId,
  eventSlug = event.eventId,
}: {
  event: BookingEventFixture;
  initialTierId?: string | undefined;
  eventSlug?: string;
}) {
  return (
    <div className="relative z-10 min-h-screen overflow-hidden pb-20 pt-20 text-white sm:flex sm:items-center sm:py-24">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#08070a]">
        <Image
          src={event.image}
          alt=""
          fill
          unoptimized
          sizes="100vw"
          className="scale-110 object-cover opacity-25 blur-[45px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.92),rgba(0,0,0,.60)_55%,rgba(0,0,0,.9)),linear-gradient(0deg,#050505,transparent_45%,#050505)]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1120px] px-3 sm:px-6">
        <Suspense fallback={<CheckoutFlowSkeleton />}>
          <CheckoutFlowClient event={event} initialTierId={initialTierId} eventSlug={eventSlug} />
        </Suspense>
      </div>
    </div>
  );
}

function CheckoutFlowSkeleton() {
  return (
    <div className="grid animate-pulse overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0b0a0d]/95 lg:grid-cols-[minmax(240px,0.78fr)_minmax(0,1.22fr)] motion-reduce:animate-none">
      <div className="min-h-[180px] border-b border-white/10 bg-white/[0.03] lg:min-h-[520px] lg:border-b-0 lg:border-r" />
      <div className="min-h-[360px] bg-white/[0.02]" />
    </div>
  );
}
