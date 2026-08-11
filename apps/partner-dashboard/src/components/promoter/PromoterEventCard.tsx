import Link from 'next/link';

import { StatusBadge } from '@/components/partner-shell/DashboardUi';
import { formatInr } from '@/lib/partner/contracts';

import type { PromoterEvent } from '@/lib/partner/contracts';

const statusTone = (status: PromoterEvent['status']): 'positive' | 'accent' | 'warning' | 'neutral' => {
  if (status === 'active') return 'positive';
  if (status === 'invited') return 'accent';
  if (status === 'requested') return 'warning';
  return 'neutral';
};

const visualTone = (id: string): string => {
  if (id.includes('bassline')) return 'violet';
  if (id.includes('sunset')) return 'amber';
  if (id.includes('warehouse')) return 'teal';
  if (id.includes('terrace')) return 'pink';
  if (id.includes('midnight')) return 'slate';
  return 'orange';
};

export function PromoterEventCard({ event, discovery = false, onOpen }: { readonly event: PromoterEvent; readonly discovery?: boolean; readonly onOpen?: (event: PromoterEvent) => void }) {
  return (
    <article className="promoter-event-card">
      <div className={`promoter-event-art promoter-tone promoter-tone--${visualTone(event.id)}`}>
        <StatusBadge tone={statusTone(event.status)}>{discovery ? 'Open opportunity' : event.status}</StatusBadge>
        <span>{event.category}</span>
        <strong>{event.name}</strong>
      </div>
      <div className="promoter-event-body">
        <div className="promoter-event-meta"><span>{event.date} · {event.time}</span><strong>{event.venue}</strong><small>{event.host} · {event.city}</small></div>
        <div className="promoter-event-terms"><span>Promoter terms</span><strong>{event.commissionLabel}</strong></div>
        {!discovery ? <div className="promoter-event-stats"><div><strong>{event.clicks.toLocaleString('en-IN')}</strong><span>Clicks</span></div><div><strong>{event.tickets}</strong><span>Tickets</span></div><div><strong>{event.conversion}%</strong><span>Conversion</span></div><div><strong>{formatInr(event.earningsPaise)}</strong><span>Your earnings</span></div></div> : null}
        <footer>{onOpen ? <button type="button" onClick={() => { onOpen(event); }}>{discovery ? 'View opportunity' : 'View performance'}<span aria-hidden="true">→</span></button> : <Link href={`/promoter/events/${event.id}`}>{discovery ? 'View opportunity' : 'View performance'}<span aria-hidden="true">→</span></Link>}</footer>
      </div>
    </article>
  );
}
