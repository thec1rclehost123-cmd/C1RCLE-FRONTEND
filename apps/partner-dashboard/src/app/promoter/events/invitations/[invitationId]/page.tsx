import { notFound } from 'next/navigation';

import { invitationById } from '@/components/promoter/promoter-studio-model';
import { UnavailableAction } from '@/components/promoter/PromoterStudioActions';
import {
  EventAtmosphere,
  PromoterButton,
  ReadOnlyTerms,
  StatusBadge,
} from '@/components/promoter/PromoterStudioUi';

export default async function InvitationReviewPage({
  params,
}: {
  readonly params: Promise<{ invitationId: string }>;
}) {
  const event = invitationById((await params).invitationId);
  if (!event) notFound();
  return (
    <div className="pr-page pr-event-scope">
      <EventAtmosphere event={event} />
      <PromoterButton href="/promoter/events/invitations" tone="quiet">
        ← Back to invitations
      </PromoterButton>
      <section className="pr-review-card pr-glass-panel">
        <div>
          <StatusBadge state="pending" />
          <span className="pr-eyebrow">Invitation from {event.venue}</span>
          <h1>{event.name}</h1>
          <p>
            {event.date} · {event.time} · {event.city}
          </p>
        </div>
        <p>{event.note}</p>
        <div className="pr-review-actions">
          <UnavailableAction
            label="Accept invitation"
            title="Acceptance unavailable"
            description="The invitation write adapter is not connected, so this invitation remains pending and no event link has been created."
          />
          <UnavailableAction label="Decline" tone="secondary" title="Decline unavailable" />
        </div>
      </section>
      <ReadOnlyTerms event={event} />
    </div>
  );
}
