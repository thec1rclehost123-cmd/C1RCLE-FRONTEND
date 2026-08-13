import { notFound } from 'next/navigation';

import { acceptedEvents, linkForEvent } from '@/components/promoter/promoter-studio-model';
import { CopyLinkButton } from '@/components/promoter/PromoterStudioActions';
import {
  CanonicalLinkPanel,
  EmptyState,
  EventHero,
  PromoterButton,
} from '@/components/promoter/PromoterStudioUi';

export default async function EventLinkPage({
  params,
}: {
  readonly params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = acceptedEvents.find((item) => item.id === eventId);
  if (!event) notFound();
  const link = linkForEvent(event.id);
  return (
    <div className="pr-page pr-event-scope">
      <EventHero event={event} active="links" />
      {link ? (
        <>
          <CanonicalLinkPanel link={link} />
          <div className="pr-inline-actions">
            <CopyLinkButton value={`https://${link.url}`} />
            <PromoterButton href={`/promoter/links/${link.id}`}>View performance</PromoterButton>
          </div>
        </>
      ) : (
        <EmptyState
          title="No event link yet"
          description="Create the one permanent promoter link for this accepted event. The same URL is used everywhere."
          action={
            <PromoterButton href={`/promoter/links/create?event=${event.id}`} tone="primary">
              Create link
            </PromoterButton>
          }
        />
      )}
    </div>
  );
}
