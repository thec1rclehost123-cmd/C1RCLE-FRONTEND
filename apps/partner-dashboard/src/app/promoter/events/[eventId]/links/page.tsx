import { notFound } from 'next/navigation';

import { eventDetailById } from '@/components/promoter/promoter-event-detail-model';
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
  const model = eventDetailById(eventId);
  if (!model) notFound();
  const { event, link } = model;
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
