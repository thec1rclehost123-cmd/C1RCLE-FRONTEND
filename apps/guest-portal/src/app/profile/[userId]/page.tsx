import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { createApiClient, isApiClientError } from '@c1rcle/api-client';
import { opaqueIdSchema } from '@c1rcle/contracts';
import { socialGuestProfileSchema } from '@c1rcle/contracts/guest-social';

import { SocialProfileView } from '@/features/social/SocialProfileView';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ userId: string }>;
}
export const dynamic = 'force-dynamic';
export const revalidate = 0;
/** Never publish a person's name/photo in link previews or search metadata. */
export function generateMetadata(): Metadata {
  return buildPrivateMetadata('Guest profile', 'Guest social profile on C1RCLE.');
}
export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  if (!opaqueIdSchema.safeParse(userId).success) notFound();
  const session = await requireGuestSession(`/profile/${encodeURIComponent(userId)}`);
  let profile;
  try {
    profile = await createApiClient().get({
      path: `/api/v2/social/profiles/${encodeURIComponent(userId)}`,
      schema: socialGuestProfileSchema,
      headers: { cookie: (await cookies()).toString() },
    });
  } catch (error) {
    if (isApiClientError(error) && error.status === 404) notFound();
    return (
      <section className="mx-auto max-w-xl px-5 pb-24 pt-36 text-white">
        <h1 className="text-2xl font-semibold">Profile unavailable</h1>
        <p className="mt-4 text-white/60">
          Social profiles require a verified Guest account and completed onboarding. If you already
          have access, try refreshing.
        </p>
      </section>
    );
  }
  return <SocialProfileView profile={profile} isSelf={session.user.id === userId} />;
}
