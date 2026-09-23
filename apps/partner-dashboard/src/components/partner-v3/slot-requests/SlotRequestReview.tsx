import { CalendarIcon, CloseIcon, LocationIcon, MobileAppIcon, TimeIcon, TicketIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { EventPoster } from '@/components/partner-v3/events/EventPoster';

import styles from './slot-requests.module.css';
import { SlotRequestStatusBadge } from './SlotRequestStatusBadge';

import type { SlotRequest, SlotRequestActionKind } from '@/data/partner-data-source';

type ReviewPanel = 'details' | 'preview';
type PreviewMode = 'guest' | 'mobile';

export function SlotRequestReview({ request, panel, previewMode, onPanelChange, onPreviewModeChange, onClose, busy, actionError, onAction }: { readonly request: SlotRequest; readonly panel: ReviewPanel; readonly previewMode: PreviewMode; readonly onPanelChange: (panel: ReviewPanel) => void; readonly onPreviewModeChange: (mode: PreviewMode) => void; readonly onClose: () => void; readonly busy: boolean; readonly actionError: string | null; readonly onAction: (id: string, kind: SlotRequestActionKind) => void }) {
  const isIncoming = request.direction === 'incoming';
  const canDecide = isIncoming && request.status === 'pending';
  const canCancel = !isIncoming && request.status === 'approved';
  return (
    <div className={styles['reviewRoot']} role="presentation">
      <button type="button" className={styles['reviewScrim']} aria-label="Close slot request review" onClick={onClose} />
      <section className={styles['reviewDialog']} role="dialog" aria-modal="true" aria-labelledby="slot-request-title">
        <header className={styles['reviewHeader']}>
          <div className={styles['reviewArtwork']}><EventPoster artwork={{ type: 'gradient', value: request.id.includes('retro') ? 'mystery' : request.id.includes('sunday') ? 'sunset' : 'eclipse' }} sizes="88px" /></div>
          <div className={styles['reviewIdentity']}><SlotRequestStatusBadge status={request.status} /><h2 id="slot-request-title">{request.event.name}</h2><p>{isIncoming ? `Requested by ${request.partnerName}` : `Sent to ${request.partnerName}`}</p></div>
          <button type="button" className={styles['reviewClose']} aria-label="Close review" onClick={onClose}><CloseIcon size={19} aria-hidden="true" /></button>
        </header>
        <nav className={styles['reviewTabs']} aria-label="Slot request review views">
          <button type="button" aria-pressed={panel === 'details'} onClick={() => { onPanelChange('details'); }}>Details</button>
          <button type="button" aria-pressed={panel === 'preview'} onClick={() => { onPanelChange('preview'); }}>Live preview</button>
        </nav>
        <div className={styles['reviewContent']}>
          {panel === 'details' ? <Details request={request} /> : <LivePreview request={request} previewMode={previewMode} onPreviewModeChange={onPreviewModeChange} />}
        </div>
        <footer className={styles['reviewFooter']}>
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          {canDecide ? <><Button type="button" variant="secondary" disabled={busy} onClick={() => { onAction(request.id, 'reject'); }}>Decline</Button><Button type="button" variant="primary" disabled={busy} onClick={() => { onAction(request.id, 'accept'); }}>Accept</Button></> : null}
          {canCancel ? <Button type="button" variant="secondary" disabled={busy} onClick={() => { onAction(request.id, 'cancel'); }}>Cancel request</Button> : null}
        </footer>
        {actionError ? <p className={styles['actionError']} role="alert">{actionError}</p> : null}
      </section>
    </div>
  );
}

function Details({ request }: { readonly request: SlotRequest }) {
  const event = request.event;
  const hasArtistsAndPromoters = (event.artists?.length ?? 0) > 0 || (event.promoters?.length ?? 0) > 0;
  const hasTiers = (event.tiers?.length ?? 0) > 0;
  const hasPricing = (event.pricing?.length ?? 0) > 0 || Boolean(event.tables ?? event.codes);
  return <div className={styles['detailStack']}>
    {event.note ? <section className={styles['noteBox']}><span>Note from requester</span><p>{event.note}</p></section> : null}
    <section className={styles['detailSection']}><h3>Event details</h3><div className={styles['detailFacts']}><span><CalendarIcon size={15} aria-hidden="true" />{event.date}</span><span><TimeIcon size={15} aria-hidden="true" />{event.time}</span><span><LocationIcon size={15} aria-hidden="true" />{event.venue}</span>{event.ticketTier ? <span><TicketIcon size={15} aria-hidden="true" />{event.ticketTier}</span> : null}</div><p>{event.description}</p></section>
    {hasArtistsAndPromoters ? <section className={styles['detailSection']}><h3>Artists &amp; promoters</h3><div className={styles['tagList']}>{(event.artists ?? []).map((artist) => <span key={artist}>{artist}</span>)}{(event.promoters ?? []).map((promoter) => <span key={promoter}>{promoter}</span>)}</div></section> : null}
    {hasTiers ? <section className={styles['detailSection']}><h3>Ticket tiers</h3><div className={styles['tierList']}>{(event.tiers ?? []).map((tier) => <div key={tier.name}><span><strong>{tier.name}</strong><small>{tier.quantity} tickets</small></span><strong>{tier.price}</strong></div>)}</div></section> : null}
    {hasPricing ? <section className={styles['detailSection']}><h3>Dynamic pricing</h3><div className={styles['tagList']}>{(event.pricing ?? []).map((price) => <span key={price}>{price}</span>)}</div>{(event.tables || event.codes) ? <div className={styles['detailSupplement']}>{event.tables ? <span>Tables <strong>{event.tables}</strong></span> : null}{event.codes ? <span>Codes <strong>{event.codes}</strong></span> : null}</div> : null}</section> : null}
  </div>;
}

function LivePreview({ request, previewMode, onPreviewModeChange }: { readonly request: SlotRequest; readonly previewMode: PreviewMode; readonly onPreviewModeChange: (mode: PreviewMode) => void }) {
  return <div className={styles['previewStack']}><p className={styles['previewIntro']}>See exactly what this event will look like once accepted.</p><div className={styles['previewPicker']}><button type="button" aria-pressed={previewMode === 'guest'} onClick={() => { onPreviewModeChange('guest'); }}><span className={styles['previewIcon']}>◎</span>Guest portal</button><button type="button" aria-pressed={previewMode === 'mobile'} onClick={() => { onPreviewModeChange('mobile'); }}><MobileAppIcon size={17} aria-hidden="true" />Mobile app</button></div><div className={[styles['previewFrame'], previewMode === 'mobile' ? styles['previewFrameMobile'] : ''].filter(Boolean).join(' ')}><div className={styles['previewBar']}><span>‹</span><strong>{previewMode === 'guest' ? 'Guest portal' : 'Mobile app'}</strong><span>⋯</span></div><EventPoster className={styles['previewPoster']} artwork={{ type: 'gradient', value: request.id.includes('retro') ? 'mystery' : request.id.includes('sunday') ? 'sunset' : 'eclipse' }} sizes="400px" /><div className={styles['previewCopy']}><span>{request.event.date} · {request.event.time}</span><h3>{request.event.name}</h3><p>{request.event.venue}</p><div className={styles['previewTicket']}>{request.status === 'approved' ? 'Confirmed slot' : 'Requested'}<strong>Notify me</strong></div></div></div></div>;
}