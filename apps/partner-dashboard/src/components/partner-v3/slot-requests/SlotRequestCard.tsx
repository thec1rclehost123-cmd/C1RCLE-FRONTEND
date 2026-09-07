import { CalendarIcon, LocationIcon, TimeIcon, TicketIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { EventPoster } from '@/components/partner-v3/events/EventPoster';

import styles from './slot-requests.module.css';
import { SlotRequestStatusBadge } from './SlotRequestStatusBadge';

import type { SlotRequest } from '@/data/partner-data-source';

export function SlotRequestCard({ request, onOpen }: { readonly request: SlotRequest; readonly onOpen: () => void }) {
  const isIncoming = request.direction === 'incoming';
  return (
    <article className={styles['requestCard']}>
      <button type="button" className={styles['requestCardMain']} onClick={onOpen}>
        <div className={styles['requestArtwork']}><EventPoster artwork={{ type: 'gradient', value: request.id.includes('retro') ? 'mystery' : request.id.includes('sunday') ? 'sunset' : 'eclipse' }} sizes="(max-width: 700px) 100vw, 420px" /><span className={styles['artworkShade']} /><span className={styles['cardStatus']}><SlotRequestStatusBadge status={request.status} /></span></div>
        <div className={styles['requestCardBody']}>
          <div className={styles['requestCardIdentity']}><span className={styles['partnerAvatar']} aria-hidden="true">{request.partnerInitials}</span><div><strong>{request.event.name}</strong><span>{isIncoming ? `Requested by ${request.partnerName}` : `Sent to ${request.partnerName}`}</span></div></div>
          <div className={styles['requestMeta']}><span><CalendarIcon size={14} aria-hidden="true" />{request.event.date}</span><span><TimeIcon size={14} aria-hidden="true" />{request.event.time}</span></div>
          <div className={styles['requestMeta']}><span><LocationIcon size={14} aria-hidden="true" />{request.event.venue}</span><span><TicketIcon size={14} aria-hidden="true" />{request.event.ticketTier}</span></div>
          <p className={styles['requestNote']}>{request.event.note}</p>
        </div>
      </button>
      {request.status === 'pending' ? <div className={styles['requestCardActions']}>
        {isIncoming ? <><Button type="button" variant="secondary" disabled title="Request decisions require the slot-request API">Decline</Button><Button type="button" variant="primary" disabled title="Request decisions require the slot-request API">Accept</Button></> : <Button type="button" variant="secondary" disabled title="Request cancellation requires the slot-request API">Cancel request</Button>}
      </div> : null}
    </article>
  );
}
