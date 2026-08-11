import Link from 'next/link';

import { StatusBadge } from '@/components/partner-shell/DashboardUi';

import type { PartnerEventSummary } from '@/lib/partner/contracts';

const statusTone = (status: PartnerEventSummary['status']): 'neutral' | 'positive' | 'accent' | 'warning' | 'danger' => {
  if (status === 'live' || status === 'on-sale') return 'positive';
  if (status === 'scheduled') return 'accent';
  if (status === 'draft') return 'warning';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
};

export function HostEventCard({ event }: { readonly event: PartnerEventSummary }) {
  const fill = event.capacity ? Math.min((event.ticketsSold / event.capacity) * 100, 100) : 0;
  const fillBucket = Math.min(Math.round(fill / 10) * 10, 100);
  return (
    <article className="host-event-card">
      <div className={`host-event-art host-event-art--${event.id}`}>
        <StatusBadge tone={statusTone(event.status)}>{event.status}</StatusBadge>
        <span>{event.category}</span>
        <strong>{event.name}</strong>
      </div>
      <div className="host-event-body">
        <div><span>{event.date} · {event.time}</span><strong>{event.venue}</strong><small>{event.city}</small></div>
        <div className="host-capacity"><div><span>Ticket movement</span><strong>{event.ticketsSold} / {event.capacity}</strong></div><i><span className={`host-fill-${String(fillBucket)}`} /></i></div>
        <footer><Link href={`/host/events/${event.id}`}>Open event <span aria-hidden="true">→</span></Link><Link href={`/host/events/${event.id}/analytics`}>Analytics</Link></footer>
      </div>
    </article>
  );
}
