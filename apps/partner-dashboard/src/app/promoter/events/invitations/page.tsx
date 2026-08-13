import {
  acceptedEvents,
  discoverableEvents,
  pendingInvitations,
} from '@/components/promoter/promoter-studio-model';
import {
  EventCard,
  PromoterPageHeader,
  PromoterTabs,
} from '@/components/promoter/PromoterStudioUi';

export default function InvitationsPage() {
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Event network"
        title="Events"
        description="Review invitations before they expire. Nothing becomes linked until an invitation is accepted."
      />
      <PromoterTabs
        active="invitations"
        items={[
          {
            label: 'Linked',
            value: 'linked',
            href: '/promoter/events',
            count: acceptedEvents.length,
          },
          {
            label: 'Invitations',
            value: 'invitations',
            href: '/promoter/events/invitations',
            count: pendingInvitations.length,
          },
          {
            label: 'Discover',
            value: 'discover',
            href: '/promoter/events/discover',
            count: discoverableEvents.length,
          },
        ]}
      />
      <section className="pr-event-grid">
        {pendingInvitations.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            href={`/promoter/events/invitations/${event.inviteId ?? event.id}`}
          />
        ))}
      </section>
    </div>
  );
}
