import { cookies } from 'next/headers';
import Link from 'next/link';

import { savedEventPageSchema } from '@c1rcle/contracts/saved-events';

import { SavedEventsView } from '@/features/saved-events/SavedEventsView';
import { requireGuestSession } from '@/lib/auth/require-session';
import { forwardToGateway } from '@/lib/bff/gateway-proxy';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = buildPrivateMetadata('Saved events', 'Your private saved events.');
export default async function SavedEventsPage() {
  const session = await requireGuestSession('/profile/saved');
  let page;
  try {
    const response = await forwardToGateway('/api/v2/saved-events', {
      method: 'GET',
      cookie: (await cookies()).toString(),
    });
    if (!response.ok) throw new Error(`Saved events request failed (${String(response.status)})`);
    page = savedEventPageSchema.parse(await response.json());
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-28 pt-36 text-white">
        <h1 className="text-3xl font-bold">Saved events</h1>
        <p className="mt-5 text-sm text-white/60">Your saved events could not be loaded.</p>
        <Link
          href="/profile/saved"
          className="mt-3 inline-flex min-h-11 items-center text-sm underline"
        >
          Try again
        </Link>
        <Link href="/explore" className="mt-5 inline-flex min-h-11 items-center text-sm underline">
          Explore events
        </Link>
      </main>
    );
  }
  return <SavedEventsView key={session.user.id} initial={page} />;
}
