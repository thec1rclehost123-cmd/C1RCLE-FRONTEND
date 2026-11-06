import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import { opaqueIdSchema } from '@c1rcle/contracts';
import { socialGuestlistSchema } from '@c1rcle/contracts/guest-social';

import { SocialGuestlistClient } from '@/features/social/SocialGuestlistClient';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = buildPrivateMetadata(
  'Event guestlist',
  'Guest social visibility on C1RCLE.',
);
export default async function SocialGuestlistPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  if (!opaqueIdSchema.safeParse(eventId).success) notFound();
  await requireGuestSession(`/profile/events/${encodeURIComponent(eventId)}/guestlist`);
  let data;
  try {
    data = await createApiClient().get({
      path: `/api/v2/social/events/${encodeURIComponent(eventId)}/guestlist`,
      schema: socialGuestlistSchema,
      headers: { cookie: (await cookies()).toString() },
    });
  } catch (error) {
    const disabled = isApiClientError(error) && error.status === 404;
    return (
      <section className="mx-auto max-w-xl px-5 pb-24 pt-36 text-white">
        <h1 className="text-2xl font-semibold">Guestlist unavailable</h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          {disabled
            ? 'This event is not sharing a social guestlist.'
            : 'Verify your Guest account and complete onboarding to view social guestlists. If you already have access, try refreshing.'}
        </p>
        <Link href="/explore" className="mt-5 inline-flex min-h-11 items-center underline">
          Explore events
        </Link>
      </section>
    );
  }
  return <SocialGuestlistClient initial={data} />;
}
