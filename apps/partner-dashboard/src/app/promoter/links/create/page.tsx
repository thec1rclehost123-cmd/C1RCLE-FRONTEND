import { redirect } from 'next/navigation';

import { eligibleLinkEvents, linkForEvent } from '@/components/promoter/promoter-studio-model';
import { UnavailableAction } from '@/components/promoter/PromoterStudioActions';
import {
  EmptyState,
  PromoterButton,
  PromoterPageHeader,
} from '@/components/promoter/PromoterStudioUi';

export default async function CreateLinkPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ event?: string }>;
}) {
  const selectedId = (await searchParams).event;
  const existing = selectedId ? linkForEvent(selectedId) : undefined;
  if (existing) redirect(`/promoter/links/${existing.id}`);
  const eligible = eligibleLinkEvents();
  const selected = eligible.find((event) => event.id === selectedId) ?? eligible[0];
  return (
    <div className="pr-page pr-narrow-page">
      <PromoterPageHeader
        eyebrow="Permanent attribution"
        title="Create Link"
        description="Choose one accepted event without a link. THE C1RCLE creates one permanent URL for that event."
      />
      <PromoterButton href="/promoter/links" tone="quiet">
        ← Back to links
      </PromoterButton>
      {selected ? (
        <section className="pr-create-link pr-glass-panel">
          <span className="pr-eyebrow">Step 1 of 1</span>
          <h2>Choose an event</h2>
          <div className="pr-event-choice">
            <strong>{selected.name}</strong>
            <span>
              {selected.date} · {selected.venue}
            </span>
            <small>{selected.commission} · terms are read-only</small>
          </div>
          <p>No channel, campaign label, custom code or attribution window is required.</p>
          <UnavailableAction
            label="Create permanent link"
            title="Link creation unavailable"
            description="The canonical-link write adapter is not connected. No link has been created and this event remains eligible."
          />
        </section>
      ) : (
        <EmptyState
          title="Every accepted event already has a link"
          description="There are no eligible events right now. Existing events keep their one permanent link."
          action={<PromoterButton href="/promoter/links">View links</PromoterButton>}
        />
      )}
    </div>
  );
}
