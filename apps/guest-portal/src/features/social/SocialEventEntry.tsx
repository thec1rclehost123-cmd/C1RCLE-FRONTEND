import Link from 'next/link';

import { createApiClient } from '@c1rcle/api-client';
import { socialEventPolicySchema } from '@c1rcle/contracts/guest-social';

/** Public event metadata only: never reads attendee identities or counts. */
export async function SocialEventEntry({ eventId }: { eventId: string }) {
  const policy = await createApiClient()
    .get({
      path: `/api/v2/public/events/${encodeURIComponent(eventId)}/social-policy`,
      schema: socialEventPolicySchema,
    })
    .catch(() => null);
  if (!policy?.enabled) return null;
  return (
    <section
      className="relative mx-auto max-w-5xl px-5 pb-16 text-white"
      aria-labelledby="social-event-heading"
    >
      <div className="border-t border-white/10 pt-7">
        <h2 id="social-event-heading" className="text-xl font-semibold">
          A night in good company
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
          See the Guests who choose to share that they’re going. Social identities are available
          only to verified Guests who completed onboarding.
        </p>
        <Link
          href={`/profile/events/${encodeURIComponent(eventId)}/guestlist`}
          className="mt-5 inline-flex min-h-12 items-center rounded-full bg-[#FF4400] px-6 text-sm font-semibold"
        >
          See who’s going
        </Link>
      </div>
    </section>
  );
}
