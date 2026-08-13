import {
  acceptedEvents,
  discoverableEvents,
  pendingInvitations,
} from '@/components/promoter/promoter-studio-model';
import { SegmentedControl } from '@/components/promoter/PromoterStudioActions';
import {
  EventCard,
  PromoterPageHeader,
  PromoterTabs,
} from '@/components/promoter/PromoterStudioUi';

export default function DiscoverEventsPage() {
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Event network"
        title="Events"
        description="Find verified events currently accepting promoter requests."
      />
      <PromoterTabs
        active="discover"
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
      <div className="pr-filterbar">
        <label>
          <span>Search events</span>
          <input type="search" placeholder="Name, venue or city" />
        </label>
        <SegmentedControl label="City" options={['All cities', 'Mumbai', 'Bengaluru', 'Delhi']} />
      </div>
      <section className="pr-event-grid">
        {discoverableEvents.map((event) => (
          <EventCard key={event.id} event={event} href={`/promoter/events/discover/${event.id}`} />
        ))}
      </section>
    </div>
  );
}
