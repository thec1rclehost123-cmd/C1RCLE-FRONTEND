'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { CheckIcon, LocationIcon } from '@c1rcle/icons';

import {
  PartnerDrawerShell,
  PartnerModeNavigation,
  PartnerSearchField,
  PartnerTable,
  PartnerTableHeader,
} from '@/components/partner-shell/PartnerDirectoryUi';

import styles from '../venue/screens/VenuePartners.module.css';

import { hostEvents, hostPartners, hostSlotRequests } from './host-studio-model';

import type { HostPartnerRecord } from './host-studio-model';

const s = (name: string) => styles[name] ?? name;

type HostPartnerTab = 'venues' | 'promoters';
type HostPartnerView = 'my' | 'find' | 'requests';

export function HostPartnersScreen({
  initialTab = 'venues',
  initialView = 'my',
}: {
  readonly initialTab?: string;
  readonly initialView?: string;
}) {
  const [tab, setTab] = useState<HostPartnerTab>(
    initialTab === 'promoters' ? 'promoters' : 'venues',
  );
  const [view, setView] = useState<HostPartnerView>(
    initialView === 'find' ? 'find' : initialView === 'requests' ? 'requests' : 'my',
  );

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All cities');
  const [subTab, setSubTab] = useState<'incoming' | 'sent'>('sent');
  const [selected, setSelected] = useState<HostPartnerRecord | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const kind = tab === 'promoters' ? 'promoter' : 'venue';

  const myPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = hostPartners.filter(p => p.kind === kind && p.status !== 'Discover');
    if (!q) return base;
    return base.filter(p => `${p.name} ${p.city}`.toLowerCase().includes(q));
  }, [kind, query]);

  const findPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = hostPartners.filter(p => p.kind === kind && p.status === 'Discover');
    return base.filter(p => {
      if (q && !`${p.name} ${p.city}`.toLowerCase().includes(q)) return false;
      if (city !== 'All cities' && p.city !== city) return false;
      return true;
    });
  }, [kind, query, city]);

  const cities = ['All cities', ...new Set(hostPartners.map(p => p.city))];
  const selectedLastEvent = selected
    ? hostEvents
        .filter(event => event.venue === selected.name && event.status === 'Completed')
        .at(-1)
    : null;

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
              ? 'Meet verified venues and promoters.'
              : view === 'requests'
                ? 'Review incoming and sent partnership requests.'
                : 'Venues and promoters connected to your hosted events.'}
          </p>
        </div>
      </header>

      {/* ── Navigation Row ── */}
      <PartnerModeNavigation
        styles={styles}
        categories={[
          { label: 'Venues', value: 'venues' },
          { label: 'Promoters', value: 'promoters' },
        ]}
        activeCategory={tab}
        onCategoryChange={(value) => {
          setTab(value as HostPartnerTab);
        }}
        views={[
          { label: 'My partners', value: 'my' },
          { label: 'Find partners', value: 'find' },
          { label: 'Requests', value: 'requests' },
        ]}
        activeView={view}
        onViewChange={(value) => {
          setView(value as HostPartnerView);
        }}
        showCategories={view !== 'requests'}
      />

      {/* ── Content View ── */}
      {view === 'my' ? (
        <>
          <PartnerSearchField
            styles={styles}
            label={`Search ${kind === 'venue' ? 'venues' : 'promoters'}`}
            placeholder={`Search ${kind === 'venue' ? 'venues' : 'promoters'}`}
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
              ariaLabel={`${kind === 'venue' ? 'Venue' : 'Promoter'} partners`}
            >
              <PartnerTableHeader
                styles={styles}
                columns={[
                  kind === 'venue' ? 'Venue' : 'Promoter',
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
                    <span className={s('avatar')} data-tone="amber">
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.detail}</small>
                    </span>
                  </div>
                  <span role="cell" className={s('eventCell')}>
                    <strong>{p.city}</strong>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>{p.eventsTogether} events</strong>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    {(() => {
                      const lastEvent = hostEvents
                        .filter(event => event.venue === p.name && event.status === 'Completed')
                        .at(-1);
                      return lastEvent ? (
                        <>
                          <strong>{lastEvent.name}</strong>
                          <small>{lastEvent.date}</small>
                        </>
                      ) : (
                        <strong>—</strong>
                      );
                    })()}
                  </span>
                  <span role="cell" className={p.status === 'Active' ? s('positive') : s('pending')}>
                    {p.status}
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
                <div className={s('portrait')} data-tone="amber">
                  <span>{p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                  {p.verified ? (
                    <em>
                      <CheckIcon size={13} aria-hidden="true" /> Verified
                    </em>
                  ) : null}
                </div>
                <h2>{p.name}</h2>
                <p>{p.kind === 'venue' ? 'Venue' : 'Promoter'} · {p.city}</p>
                <small>{p.detail}</small>
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
              className={subTab === 'sent' ? s('primaryAction') : s('secondaryAction')}
              onClick={() => {
                setSubTab('sent');
              }}
            >
              Sent {hostSlotRequests.length}
            </button>
            <button
              type="button"
              className={subTab === 'incoming' ? s('primaryAction') : s('secondaryAction')}
              onClick={() => {
                setSubTab('incoming');
              }}
            >
              Incoming 1
            </button>
          </div>

          <PartnerTable styles={styles} variant="requestTable" ariaLabel="Requests table">
            <PartnerTableHeader
              styles={styles}
              columns={['Partner', 'Type', 'Request', 'Date', 'Status', 'Action']}
            />
            {subTab === 'sent' ? (
              hostSlotRequests.map(r => (
                <div key={r.id} className={s('partnerRow')} role="row">
                  <div role="cell" className={s('identity')}>
                    <span>
                      <strong>{r.venue}</strong>
                      <small>Venue</small>
                    </span>
                  </div>
                  <span role="cell" className={s('eventCell')}>
                    <strong>Venue</strong>
                    <small>Partner type</small>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>{r.eventName}</strong>
                    <small>Slot request</small>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>{r.date}</strong>
                    <small>Updated {r.updatedAt}</small>
                  </span>
                  <span role="cell" className={r.status === 'Accepted' ? s('positive') : s('pending')}>
                    {r.status}
                  </span>
                  <span role="cell">
                    <Link href={`/host/events/requests/${r.id}`} className={s('secondaryAction')}>
                      View
                    </Link>
                  </span>
                </div>
              ))
            ) : (
              <div className={s('partnerRow')} role="row">
                <div role="cell" className={s('identity')}>
                  <span>
                    <strong>Monsoon Sessions Invite</strong>
                    <small>Sat, 16 Aug · 8:00 PM</small>
                  </span>
                </div>
                <span role="cell" className={s('eventCell')}>
                  <strong>Harbour Room</strong>
                  <small>Venue</small>
                </span>
                <span role="cell" className={s('eventCell')}>
                  <strong>Monsoon Sessions Invite</strong>
                  <small>Event invitation</small>
                </span>
                <span role="cell" className={s('eventCell')}>
                  <strong>Sat, 16 Aug 2026</strong>
                  <small>Incoming</small>
                </span>
                <span role="cell" className={s('pending')}>
                  Pending review
                </span>
                <span role="cell">
                  <Link href="/host/events/invitations" className={s('secondaryAction')}>
                    Review
                  </Link>
                </span>
              </div>
            )}
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
            ? `${selected.kind === 'venue' ? 'Venue' : 'Promoter'} · ${selected.city}${selected.verified ? ' · Verified' : ''}`
            : ''
        }
        initials={selected ? selected.name.split(' ').map(w => w[0]).join('').slice(0, 2) : ''}
        tone="amber"
      >
        {selected ? (
          <>
            <dl>
              <div>
                <dt>Relationship</dt>
                <dd>{selected.status}</dd>
              </div>
              <div>
                <dt>Details</dt>
                <dd>{selected.detail}</dd>
              </div>
              <div>
                <dt>Events together</dt>
                <dd>{selected.eventsTogether} events</dd>
              </div>
              <div>
                <dt>Latest shared event</dt>
                <dd>
                  {selectedLastEvent?.name ?? '—'}
                  {selectedLastEvent ? <small>{selectedLastEvent.date}</small> : null}
                </dd>
              </div>
            </dl>
            <footer>
              <Link
                href={`/host/partners/${selected.kind === 'venue' ? 'venues' : 'promoters'}/${selected.id}`}
                className={s('primaryAction')}
              >
                View full profile
              </Link>
            </footer>
          </>
        ) : null}
      </PartnerDrawerShell>
    </div>
  );
}
