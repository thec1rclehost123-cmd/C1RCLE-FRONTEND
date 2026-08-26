'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CloseIcon, RefreshIcon, SearchIcon, TicketIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './promoter-guests.module.css';

import type { PromoterGuestsData } from '@/data/partner-data-source';

type GuestStatus = 'all' | 'ticket';

export function PromoterGuestsScreen({
  data,
  initialSearch = '',
  initialStatus = 'all',
  initialEvent = 'all',
  initialDialog = false,
}: {
  readonly data: PromoterGuestsData;
  readonly initialSearch?: string;
  readonly initialStatus?: GuestStatus;
  readonly initialEvent?: string;
  readonly initialDialog?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<GuestStatus>(initialStatus);
  const [eventId, setEventId] = useState(initialEvent);
  const [dialogOpen, setDialogOpen] = useState(initialDialog);
  const [selectedEvent, setSelectedEvent] = useState(data.events[0]?.id ?? '');
  const [ticketId, setTicketId] = useState('');

  const updateUrl = (next: { search?: string; status?: GuestStatus; event?: string; dialog?: boolean }) => {
    const params = new URLSearchParams();
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? status;
    const nextEvent = next.event ?? eventId;
    const nextDialog = next.dialog ?? dialogOpen;
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextStatus !== 'all') params.set('status', nextStatus.toLowerCase());
    if (nextEvent !== 'all') params.set('event', nextEvent);
    if (nextDialog) params.set('dialog', 'add');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const visibleGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.guests.filter((guest) => {
      if (status !== 'all' && guest.status.toLowerCase() !== status) return false;
      if (eventId !== 'all' && !guest.event.toLowerCase().includes(eventId.toLowerCase())) return false;
      return !query || `${guest.name} ${guest.event} ${guest.status}`.toLowerCase().includes(query);
    });
  }, [data.guests, eventId, search, status]);

  const closeDialog = () => {
    setDialogOpen(false);
    updateUrl({ dialog: false });
  };

  return (
    <PageContainer>
      <div className={styles['page']}>
        <header className={styles['header']}>
          <div>
            <h1>Guest Stream</h1>
            <p>Guests attributed to your promoter links</p>
          </div>
          <div className={styles['headerActions']}>
            <Button className={styles['addButton']} variant="primary" onClick={() => { setDialogOpen(true); updateUrl({ dialog: true }); }}><TicketIcon size={15} aria-hidden="true" /> Add Guest</Button>
            <span className={styles['liveBadge']}><i aria-hidden="true" />Live</span>
            <Button className={styles['refreshButton']} variant="secondary" onClick={() => { router.refresh(); }}><RefreshIcon size={15} aria-hidden="true" /> Refresh</Button>
          </div>
        </header>

        <section className={styles['metrics']} aria-label="Guest stream metrics">
          <Metric label="Total Guests" value={String(data.totalGuests)} />
          <Metric label="Checked In" value={data.checkedIn} />
          <Metric label="Revenue Generated" value={data.revenue} />
          <Metric label="Your Commission" value={data.commission} accent />
        </section>

        <div className={styles['toolbar']}>
          <label className={styles['search']}>
            <span className={styles['srOnly']}>Search guests by name or promo code</span>
            <SearchIcon size={15} aria-hidden="true" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); updateUrl({ search: event.target.value }); }} placeholder="Search guests by name or promo code..." type="search" />
          </label>
          <select aria-label="Guest event" value={eventId} onChange={(event) => { setEventId(event.target.value); updateUrl({ event: event.target.value }); }}>
            <option value="all">All Events</option>
            {data.events.map((event) => <option key={event.id} value={event.name}>{event.name}</option>)}
          </select>
          <select aria-label="Guest status" value={status} onChange={(event) => { const next = event.target.value as GuestStatus; setStatus(next); updateUrl({ status: next }); }}>
            <option value="all">All Status</option>
            <option value="ticket">Ticket</option>
          </select>
        </div>

        <section className={styles['tableCard']} aria-label="Attributed guests">
          <div className={styles['tableScroll']}>
            <div className={styles['table']}>
              <div className={styles['tableHeader']}><span>Guest</span><span>Event</span><span>Amount</span><span>Commission</span><span>Status</span><span>When</span></div>
              {visibleGuests.map((guest) => <div className={styles['row']} key={guest.id}>
                <div className={styles['guest']}><span className={styles['avatar']}>{guest.initials}</span><span><strong>{guest.name}</strong><small>{guest.tickets}</small></span></div>
                <span className={styles['muted']}>{guest.event}</span>
                <strong>{guest.amount}</strong>
                <strong className={styles['commission']}>{guest.commission}</strong>
                <span className={styles['status']}>{guest.status}</span>
                <span className={styles['muted']}>{guest.when}</span>
              </div>)}
            </div>
          </div>
          {visibleGuests.length === 0 ? <div className={styles['empty']} role="status"><strong>No guests match these filters.</strong><span>Attributed guests will appear here once your links generate ticket activity.</span></div> : null}
        </section>

        <div className={styles['srOnly']} aria-live="polite">{visibleGuests.length} guests shown.</div>
        {dialogOpen ? <AddGuestDialog data={data} selectedEvent={selectedEvent} ticketId={ticketId} onEventChange={setSelectedEvent} onTicketChange={setTicketId} onClose={closeDialog} /> : null}
      </div>
    </PageContainer>
  );
}

function Metric({ label, value, accent = false }: { readonly label: string; readonly value: string; readonly accent?: boolean }) {
  return <article className={styles['metric']}><span>{label}</span><strong className={accent ? styles['metricAccent'] : undefined}>{value}</strong></article>;
}

function AddGuestDialog({ data, selectedEvent, ticketId, onEventChange, onTicketChange, onClose }: { readonly data: PromoterGuestsData; readonly selectedEvent: string; readonly ticketId: string; readonly onEventChange: (value: string) => void; readonly onTicketChange: (value: string) => void; readonly onClose: () => void }) {
  return <div className={styles['backdrop']} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={styles['dialog']} role="dialog" aria-modal="true" aria-labelledby="add-guest-title">
      <button className={styles['close']} type="button" onClick={onClose} aria-label="Close add guest dialog"><CloseIcon size={18} aria-hidden="true" /></button>
      <span className={styles['dialogEyebrow']}>Guest attribution</span>
      <h2 id="add-guest-title">Add Guest by Ticket ID</h2>
      <p>Look up a confirmed order to attribute it to you</p>
      <label>Event<select value={selectedEvent} onChange={(event) => { onEventChange(event.target.value); }}><option value="">Select an event...</option>{data.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>
      <label>Ticket / Order ID<input value={ticketId} onChange={(event) => { onTicketChange(event.target.value); }} placeholder="e.g. ORD-abc123xyz" /></label>
      <Button className={styles['lookup']} variant="primary" disabled title="Ticket lookup requires the attribution API.">Look Up Ticket</Button>
      <footer>Only unattributed confirmed tickets · 50 per event limit</footer>
    </section>
  </div>;
}
