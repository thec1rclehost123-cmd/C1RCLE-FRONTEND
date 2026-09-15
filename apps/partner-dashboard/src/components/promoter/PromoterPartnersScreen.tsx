'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CheckIcon, LocationIcon } from '@c1rcle/icons';

import {
  PartnerDrawerShell,
  PartnerModeNavigation,
  PartnerSearchField,
  PartnerTable,
  PartnerTableHeader,
} from '@/components/partner-shell/PartnerDirectoryUi';

import styles from '../venue/screens/VenuePartners.module.css';

import {
  fetchPromoterVenuePartners,
  fetchPromoterHostPartners,
  fetchPromoterVenueRequests,
  fetchPromoterHostRequests,
  type PromoterPartner,
  type PromoterRequest,
} from './promoter-partners-api';

const s = (name: string) => styles[name] ?? name;

type PromoterTab = 'venues' | 'hosts';
type PromoterView = 'my' | 'find' | 'requests';

export function PromoterPartnersScreen({
  initialTab = 'venues',
  initialView = 'my',
}: {
  readonly initialTab?: string;
  readonly initialView?: string;
}) {
  const [tab, setTab] = useState<PromoterTab>(
    initialTab === 'hosts' ? 'hosts' : 'venues',
  );
  const [view, setView] = useState<PromoterView>(
    initialView === 'find' ? 'find' : initialView === 'requests' ? 'requests' : 'my',
  );

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All cities');
  const [subTab, setSubTab] = useState<'incoming' | 'sent'>('incoming');
  const [selected, setSelected] = useState<PromoterPartner | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [venuePartners, setVenuePartners] = useState<PromoterPartner[]>([]);
  const [hostPartners, setHostPartners] = useState<PromoterPartner[]>([]);
  const [venueRequests, setVenueRequests] = useState<PromoterRequest[]>([]);
  const [hostRequests, setHostRequests] = useState<PromoterRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [venues, hosts, venueReqs, hostReqs] = await Promise.all([
          fetchPromoterVenuePartners(),
          fetchPromoterHostPartners(),
          fetchPromoterVenueRequests(),
          fetchPromoterHostRequests(),
        ]);
        if (mounted) {
          setVenuePartners(venues);
          setHostPartners(hosts);
          setVenueRequests(venueReqs);
          setHostRequests(hostReqs);
        }
      } catch (error) {
        console.error('Failed to load partner data:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const kind = tab === 'hosts' ? 'host' : 'venue';

  const myPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = kind === 'venue'
      ? venuePartners.filter(p => p.status === 'partnered')
      : hostPartners.filter(p => p.status === 'partnered');
    if (!q) return base;
    return base.filter(p => `${p.name} ${p.city} ${p.category}`.toLowerCase().includes(q));
  }, [kind, query, venuePartners, hostPartners]);

  const findPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = kind === 'venue'
      ? venuePartners.filter(p => p.status !== 'partnered')
      : hostPartners.filter(p => p.status !== 'partnered');
    return base.filter(p => {
      if (q && !`${p.name} ${p.city} ${p.category}`.toLowerCase().includes(q)) return false;
      if (city !== 'All cities' && p.city !== city) return false;
      return true;
    });
  }, [kind, query, city, venuePartners, hostPartners]);

  const cities = ['All cities', ...new Set([...venuePartners, ...hostPartners].map(p => p.city))];

  const selectedRequests = kind === 'venue' ? venueRequests : hostRequests;
  const incomingRequests = selectedRequests.filter(r => r.direction === 'incoming');
  const sentRequests = selectedRequests.filter(r => r.direction === 'sent');

  if (isLoading) {
    return (
      <div className={s('page')}>
        <div className={s('loading')}>Loading partners...</div>
      </div>
    );
  }

  return (
    <div className={s('page')}>
      {/* ── Header ── */}
      <header className={s('header')}>
        <div>
          <h1>
            {view === 'find' ? 'Find partners' : view === 'requests' ? 'Partnership requests' : 'Partners'}
          </h1>
          <p>
            {view === 'find'
              ? 'Meet verified venues and hosts looking for promoter partnerships.'
              : view === 'requests'
                ? 'Review incoming and sent promoter partnership requests.'
                : 'Venues and hosts connected to your promoter network.'}
          </p>
        </div>
      </header>

      {/* ── Navigation Row ── */}
      <PartnerModeNavigation
        styles={styles}
        categories={[
          { label: view === 'my' ? 'My venues' : 'Venues', value: 'venues' },
          { label: view === 'my' ? 'My hosts' : 'Hosts', value: 'hosts' },
        ]}
        activeCategory={tab}
        onCategoryChange={(value) => {
          setTab(value as PromoterTab);
        }}
        views={[
          { label: 'My partners', value: 'my' },
          { label: 'Find partners', value: 'find' },
          { label: 'Requests', value: 'requests' },
        ]}
        activeView={view}
        onViewChange={(value) => {
          setView(value as PromoterView);
        }}
        showCategories={view !== 'requests'}
      />

      {/* ── Content View ── */}
      {view === 'my' ? (
        <>
          <PartnerSearchField
            styles={styles}
            label={`Search ${kind === 'venue' ? 'venues' : 'hosts'}`}
            placeholder={`Search ${kind === 'venue' ? 'venues' : 'hosts'}`}
            value={query}
            onChange={setQuery}
          />

          {myPartners.length === 0 ? (
            <section className={s('unavailable')}>
              <h1>No partners found</h1>
              <p>Try searching for another name or discover new partners.</p>
            </section>
          ) : (
            <PartnerTable
              styles={styles}
              variant="relationshipTable"
              ariaLabel={`${kind === 'venue' ? 'Venue' : 'Host'} partners`}
            >
              <PartnerTableHeader
                styles={styles}
                columns={[
                  kind === 'venue' ? 'Venue' : 'Host',
                  'Location',
                  'Events together',
                  'Last event',
                  'Status',
                  'Action',
                ]}
              />
              {myPartners.map(p => (
                <div key={p.id} className={s('partnerRow')} role="row">
                  <div role="cell" className={s('identity')}>
                    <span className={s('avatar')} data-tone="violet">
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.category}</small>
                    </span>
                  </div>
                  <span role="cell" className={s('eventCell')}>
                    <strong>{p.city}</strong>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>{p.eventsTogether} events</strong>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>—</strong>
                  </span>
                  <span role="cell" className={s('positive')}>
                    Active
                  </span>
                  <span role="cell">
                    <button
                      type="button"
                      className={s('secondaryAction')}
                      onClick={e => {
                        triggerRef.current = e.currentTarget;
                        setSelected(p);
                      }}
                    >
                      View
                    </button>
                  </span>
                </div>
              ))}
            </PartnerTable>
          )}
        </>
      ) : view === 'find' ? (
        <>
          <div className={s('findControls')}>
            <PartnerSearchField
              styles={styles}
              label="Search by name or city"
              placeholder="Search by name or city"
              value={query}
              onChange={setQuery}
            />
            <label className={s('cityFilter')}>
              <LocationIcon size={18} aria-hidden="true" />
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                }}
              >
                {cities.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          {findPartners.length === 0 ? (
            <section className={s('unavailable')}>
              <h1>No partners found</h1>
              <p>Try another city or search for a different partner.</p>
            </section>
          ) : (
            <div className={s('cardGrid')}>
              {findPartners.map(p => (
                <article key={p.id} className={s('partnerCard')}>
                <div className={s('portrait')} data-tone="violet">
                  <span>{p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                  {p.verified ? (
                    <em>
                      <CheckIcon size={13} aria-hidden="true" /> Verified
                    </em>
                  ) : null}
                </div>
                <h2>{p.name}</h2>
                <p>{p.kind === 'venue' ? 'Venue' : 'Host'} · {p.city}</p>
                <small>{p.category}</small>
                <button
                  type="button"
                  onClick={e => {
                    triggerRef.current = e.currentTarget;
                    setSelected(p);
                  }}
                >
                  View profile
                </button>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Requests view */
        <>
          <div className={s('requestToggle')}>
            <button
              type="button"
              className={subTab === 'incoming' ? s('primaryAction') : s('secondaryAction')}
              onClick={() => {
                setSubTab('incoming');
              }}
            >
              Incoming {incomingRequests.length}
            </button>
            <button
              type="button"
              className={subTab === 'sent' ? s('primaryAction') : s('secondaryAction')}
              onClick={() => {
                setSubTab('sent');
              }}
            >
              Sent {sentRequests.length}
            </button>
          </div>

          <PartnerTable styles={styles} variant="requestTable" ariaLabel="Requests table">
            <PartnerTableHeader
              styles={styles}
              columns={['Partner', 'Type', 'Request', 'Date', 'Status', 'Action']}
            />
            {(subTab === 'incoming' ? incomingRequests : sentRequests).map(r => (
              <div key={r.id} className={s('partnerRow')} role="row">
                <div role="cell" className={s('identity')}>
                  <span className={s('avatar')} data-tone="violet">
                    {r.partnerName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                  <span>
                    <strong>{r.partnerName}</strong>
                    <small>{r.partnerCity}</small>
                  </span>
                </div>
                <span role="cell" className={s('eventCell')}>
                  <strong>{r.kind === 'venue' ? 'Venue' : 'Host'}</strong>
                  <small>{r.direction === 'incoming' ? 'Incoming' : 'Sent'}</small>
                </span>
                <span role="cell" className={s('eventCell')}>
                  <strong>{r.eventName}</strong>
                  <small>{r.commission}</small>
                </span>
                <span role="cell" className={s('eventCell')}>
                  <strong>{r.eventDate}</strong>
                  <small>{r.direction === 'incoming' ? 'Pending review' : 'Under review'}</small>
                </span>
                <span role="cell" className={r.status === 'accepted' ? s('positive') : s('pending')}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
                <span role="cell">
                  <Link href={`/promoter/events/${r.eventName.toLowerCase().replace(/\s+/g, '-')}`} className={s('secondaryAction')}>
                    View
                  </Link>
                </span>
              </div>
            ))}
          </PartnerTable>
        </>
      )}

      {/* ── Partner Drawer ── */}
      <PartnerDrawerShell
        styles={styles}
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null);
        }}
        ariaLabel="Partner profile"
        closeLabel="Close partner details"
        title={selected?.name ?? ''}
        subtitle={
          selected
            ? `${selected.kind === 'venue' ? 'Venue' : 'Host'} · ${selected.city}${selected.verified ? ' · Verified' : ''}`
            : ''
        }
        initials={selected ? selected.name.split(' ').map(w => w[0]).join('').slice(0, 2) : ''}
        tone="violet"
      >
        {selected ? (
          <dl>
            <div>
              <dt>Relationship</dt>
              <dd>{selected.status === 'partnered' ? 'Active partner' : 'Discoverable'}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{selected.category}</dd>
            </div>
            <div>
              <dt>Events together</dt>
              <dd>{selected.eventsTogether} events</dd>
            </div>
            <div>
              <dt>Latest shared event</dt>
              <dd>—</dd>
            </div>
          </dl>
        ) : null}
      </PartnerDrawerShell>
    </div>
  );
}