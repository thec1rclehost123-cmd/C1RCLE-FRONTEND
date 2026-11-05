import { trustedSavedEventDestination } from '@/features/saved-events/return-intent';
import { SavedEventReturn } from '@/features/saved-events/SavedEventReturn';
import { requireGuestSession } from '@/lib/auth/require-session';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';
export const metadata = buildPrivateMetadata('Return to event', 'Continue to your event.');
export default async function SavedEventReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string | string[] }>;
}) {
  const destination = trustedSavedEventDestination((await searchParams).event);
  await requireGuestSession(`/profile/saved/return?event=${encodeURIComponent(destination)}`);
  return <SavedEventReturn destination={destination} />;
}
