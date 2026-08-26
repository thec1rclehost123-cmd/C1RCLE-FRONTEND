'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { EmptyState } from '@/components/partner-v3/States';

export default function EventNotFound() {
  const pathname = usePathname();
  const studio = pathname.split('/')[2] === 'host' ? 'host' : 'venue';
  const eventsHref = studio === 'host' ? '/partner/host/events' : '/partner/venue/events';
  return (
    <EmptyState
      title="Event unavailable"
      description={`This event does not exist in the current ${studio === 'host' ? 'Host' : 'Venue'} workspace fixture. Return to Events to choose an available event.`}
      action={<Link href={eventsHref}>Back to Events</Link>}
    />
  );
}
