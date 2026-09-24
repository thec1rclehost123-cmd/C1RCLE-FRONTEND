import { CalendarIcon, LocationIcon, TimeIcon, TicketIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { EventPoster } from '@/components/partner-v3/events/EventPoster';

import styles from './slot-requests.module.css';
import { SlotRequestStatusBadge } from './SlotRequestStatusBadge';

import type { SlotRequest, SlotRequestActionKind } from '@/data/partner-data-source';

export function SlotRequestCard({ request, busy, actionError, onOpen, onAction }: { readonly request: SlotRequest; readonly busy: boolean; readonly actionError: string | null; readonly onOpen: () => void; readonly onAction: (id: string, kind: SlotRequestActionKind) => void }) {
  const isIncoming = request.direction === 'incoming';
  const canDecide = isIncoming && request.status === 'pending';
  const canCancel = !isIncoming && request.status === 'approved';
  return (
    <article className={styles['requestCard']}>
      <button type="button" className={styles['requestCardMain']} onClick={onOpen}>
        <div className={styles['requestArtwork']}><EventPoster artwork={{ type: 'gradient', value: request.id.includes('retro') ? 'mystery' : request.id.includes('sunday') ? 'sunset' : 'eclipse' }} sizes="(max-width: 700px) 100vw, 420px" /><span className={styles['artworkShade']} /><span className={styles['cardStatus']}><SlotRequestStatusBadge status={request.status} /></span></div>
        <div className={styles['requestCardBody']}>
          <div className={styles['requestCardIdentity']}><span className={styles['partnerAvatar']} aria-hidden="true">{request.partnerInitials}</span><div><strong>{request.event.name}</strong><span>{isIncoming ? `Requested by ${request.partnerName}` : `Sent to ${request.partnerName}`}</span></div></div>
          <div className={styles['requestMeta']}><span><CalendarIcon size={14} aria-hidden="true" />{request.event.date}</span><span><TimeIcon size={14} aria-hidden="true" />{request.event.time}</span></div>
          <div className={styles['requestMeta']}><span><LocationIcon size={14} aria-hidden="true" />{request.event.venue}</span>{request.event.ticketTier ? <span><TicketIcon size={14} aria-hidden="true" />{request.event.ticketTier}</span> : null}</div>
          {request.event.note ? <p className={styles['requestNote']}>{request.event.note}</p> : null}
        </div>
      </button>
      {(canDecide || canCancel) ? <div className={styles['requestCardActions']}>
        {canDecide ? <><Button type="button" variant="secondary" disabled={busy} onClick={() => { onAction(request.id, 'reject'); }}>Decline</Button><Button type="button" variant="primary" disabled={busy} onClick={() => { onAction(request.id, 'accept'); }}>Accept</Button></> : null}
        {canCancel ? <Button type="button" variant="secondary" disabled={busy} onClick={() => { onAction(request.id, 'cancel'); }}>Cancel request</Button> : null}
      </div> : null}
      {actionError ? <p className={styles['actionError']} role="alert">{actionError}</p> : null}
    </article>
  );
}