import { Suspense } from 'react';

import { getEventAccentClasses } from '@/features/event-detail/eventDetailPalette';

import { CheckoutFlowClient } from './CheckoutFlowClient';

import type { BookingEventFixture } from '../types/booking.types';

export function CheckoutView({
  event,
  initialTierId,
}: {
  event: BookingEventFixture;
  initialTierId?: string | undefined;
}) {
  const accent = getEventAccentClasses(event.accentTone);

  return (
    <div className="relative z-10 min-h-screen overflow-hidden pb-32 pt-24 text-white sm:pt-28">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#080808]">
        <div className={`absolute inset-0 ${accent.backdrop}`} />
        <div className="absolute inset-x-0 bottom-0 h-[32rem] bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<CheckoutFlowSkeleton />}>
          <CheckoutFlowClient event={event} initialTierId={initialTierId} />
        </Suspense>
      </div>
    </div>
  );
}

function CheckoutFlowSkeleton() {
  return (
    <div className="grid animate-pulse gap-3 lg:grid-cols-[minmax(0,1fr)_390px] motion-reduce:animate-none">
      <div className="min-h-[620px] rounded-[1.75rem] border border-white/10 bg-white/[0.035]" />
      <div className="min-h-[520px] rounded-[1.75rem] border border-white/10 bg-white/[0.035]" />
    </div>
  );
}
