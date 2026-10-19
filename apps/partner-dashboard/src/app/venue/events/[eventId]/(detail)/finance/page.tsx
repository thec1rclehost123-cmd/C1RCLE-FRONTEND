import { redirect } from 'next/navigation';

export default async function VenueEventFinancePage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/partner/venue/finance?view=orders&search=${encodeURIComponent(eventId)}`);
}
