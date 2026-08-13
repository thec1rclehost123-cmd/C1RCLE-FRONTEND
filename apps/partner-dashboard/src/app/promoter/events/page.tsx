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

export default function PromoterEventsPage() {
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Event network"
        title="Events"
        description="Accepted event partnerships, pending invitations and opportunities in one place."
      />
      <PromoterTabs
        active="linked"
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
        {acceptedEvents.map((event) => (
          <EventCard key={event.id} event={event} href={`/promoter/events/${event.id}`} />
        ))}
      </section>
    </div>
  );
}
