'use client';

import { useMemo, useState } from 'react';

import { ConfirmationDialog, DashboardDrawer, DashboardToast } from '@/components/partner-shell/DashboardInteractiveUi';

import { PromoterEventCard } from './PromoterEventCard';

import type { PromoterEvent } from '@/lib/partner/contracts';

type RequestState = 'idle' | 'confirming' | 'submitting' | 'prepared';

export function PromoterDiscoveryExplorer({ events }: { readonly events: readonly PromoterEvent[] }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All cities');
  const [category, setCategory] = useState('All categories');
  const [commission, setCommission] = useState('All models');
  const [selected, setSelected] = useState<PromoterEvent | null>(null);
  const [requestState, setRequestState] = useState<RequestState>('idle');

  const filtered = useMemo(() => events.filter((event) => {
    const haystack = `${event.name} ${event.venue} ${event.host} ${event.category}`.toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    if (city !== 'All cities' && event.city !== city) return false;
    if (category !== 'All categories' && !event.category.toLowerCase().includes(category.toLowerCase())) return false;
    if (commission === 'Per ticket' && !event.commissionLabel.includes('/ ticket')) return false;
    if (commission === 'Percentage' && !event.commissionLabel.includes('%')) return false;
    return true;
  }), [category, city, commission, events, query]);

  const confirmRequest = () => {
    setRequestState('submitting');
    window.setTimeout(() => { setRequestState('prepared'); }, 550);
  };

  return <>
    <section className="promoter-discovery-filters" aria-label="Filter promoter opportunities">
      <label><span>Search</span><input value={query} onChange={(event) => { setQuery(event.target.value); }} placeholder="Event, venue or host" /></label>
      <label><span>City</span><select value={city} onChange={(event) => { setCity(event.target.value); }}><option>All cities</option><option>Mumbai</option><option>Pune</option></select></label>
      <label><span>Category</span><select value={category} onChange={(event) => { setCategory(event.target.value); }}><option>All categories</option><option>Techno</option><option>Indie</option><option>Culture</option></select></label>
      <label><span>Commission</span><select value={commission} onChange={(event) => { setCommission(event.target.value); }}><option>All models</option><option>Per ticket</option><option>Percentage</option></select></label>
      <small>{filtered.length} open {filtered.length === 1 ? 'opportunity' : 'opportunities'}</small>
    </section>
    {filtered.length ? <section className="promoter-event-grid">{filtered.map((event) => <PromoterEventCard key={event.id} event={event} discovery onOpen={setSelected} />)}</section> : <section className="pd-empty-state"><span>No matches</span><h2>Try a wider search.</h2><p>Clear a city, category or commission filter to see more verified opportunities.</p><div><button type="button" className="pd-button pd-button--primary" onClick={() => { setQuery(''); setCity('All cities'); setCategory('All categories'); setCommission('All models'); }}>Clear filters</button></div></section>}
    <DashboardDrawer open={selected !== null} title={selected?.name ?? 'Event opportunity'} description={selected ? `${selected.date} · ${selected.time} · ${selected.city}` : undefined} onClose={() => { setSelected(null); setRequestState('idle'); }}>
      {selected ? <div className="promoter-opportunity-detail"><div className="promoter-opportunity-identity"><span>Venue</span><strong>{selected.venue}</strong><small>Verified partner</small></div><div className="promoter-opportunity-identity"><span>Host</span><strong>{selected.host}</strong><small>{selected.category}</small></div><section><span>Expected audience</span><strong>250–400 guests</strong><p>Audience estimates become authoritative when the event opportunity API is connected.</p></section><section><span>Promoter terms</span><strong>{selected.commissionLabel}</strong><p>Attribution window and refund rules must be confirmed by the backend event agreement.</p></section><section><span>Application deadline</span><strong>3 days remaining</strong><p>Requesting access never creates or edits the event.</p></section><button type="button" className="pd-button pd-button--primary" onClick={() => { setRequestState('confirming'); }}>Request partnership</button></div> : null}
    </DashboardDrawer>
    <ConfirmationDialog open={requestState === 'confirming' || requestState === 'submitting'} title={`Request access to ${selected?.name ?? 'this event'}?`} description="This frontend will prepare the request state only. The backend integration must submit the authoritative partnership request and prevent duplicates." confirmLabel="Prepare request" busy={requestState === 'submitting'} onConfirm={confirmRequest} onCancel={() => { setRequestState('idle'); }} />
    <DashboardToast message={requestState === 'prepared' ? 'Request preview prepared. Nothing was sent to a live partner.' : null} />
  </>;
}
