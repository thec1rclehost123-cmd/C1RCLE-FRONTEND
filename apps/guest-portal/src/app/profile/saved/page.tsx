import { cookies } from 'next/headers';
import Link from 'next/link';

import { createApiClient } from '@c1rcle/api-client';
import { savedEventPageSchema } from '@c1rcle/contracts/saved-events';

import { SavedEventsView } from '@/features/saved-events/SavedEventsView';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = buildPrivateMetadata('Saved events', 'Your private saved events.');
export default async function SavedEventsPage() {
  const session = await requireGuestSession('/profile/saved');
  let page;
  try {
    page = await createApiClient().get({
      path: '/api/v2/saved-events',
      schema: savedEventPageSchema,
      headers: { cookie: (await cookies()).toString() },
    });
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-28 pt-36 text-white">
        <h1 className="text-3xl font-bold">Saved events</h1>
        <p className="mt-5 text-sm text-white/60">
          Your saved events could not be loaded. Refresh to try again.
        </p>
        <Link href="/explore" className="mt-5 inline-flex min-h-11 items-center text-sm underline">
          Explore events
        </Link>
      </main>
    );
  }
  return <SavedEventsView key={session.user.id} initial={page} />;
}
