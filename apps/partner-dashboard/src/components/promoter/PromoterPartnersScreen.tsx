'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { CheckIcon, LocationIcon, SearchIcon } from '@c1rcle/icons';

import styles from '../venue/screens/VenuePartners.module.css';

import type { PromoterPartner } from '@/lib/partner/contracts';

const s = (name: string) => styles[name] ?? name;

type PromoterTab = 'venues' | 'hosts';
type PromoterView = 'my' | 'find' | 'requests';

export function PromoterPartnersScreen({
  partners,
  initialTab = 'venues',
  initialView = 'my',
}: {
  readonly partners: readonly PromoterPartner[];
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

  const kind = tab === 'hosts' ? 'host' : 'venue';

  const myPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = partners.filter(p => p.kind === kind && p.status === 'partnered');
    if (!q) return base;
    return base.filter(p => `${p.name} ${p.city} ${p.category}`.toLowerCase().includes(q));
  }, [kind, partners, query]);

  const findPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = partners.filter(p => p.kind === kind && p.status !== 'partnered');
    return base.filter(p => {
      if (q && !`${p.name} ${p.city} ${p.category}`.toLowerCase().includes(q)) return false;
      if (city !== 'All cities' && p.city !== city) return false;
      return true;
    });
  }, [kind, partners, query, city]);

  const cities = ['All cities', ...new Set(partners.map(p => p.city))];

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
      <div className={s('navRow')}>
        {view !== 'requests' ? (
          <nav className={s('tabs')} aria-label="Partner categories">
            <button
              type="button"
              className={tab === 'venues' ? s('active') : undefined}
              onClick={() => setTab('venues')}
            >
              {view === 'my' ? 'My venues' : 'Venues'}
            </button>
            <button
              type="button"
              className={tab === 'hosts' ? s('active') : undefined}
              onClick={() => setTab('hosts')}
            >
              {view === 'my' ? 'My hosts' : 'Hosts'}
            </button>
          </nav>
        ) : null}

        <nav className={s('subnav')} aria-label="Partner views">
          <button
            type="button"
            className={view === 'my' ? s('active') : undefined}
            onClick={() => setView('my')}
          >
            My partners
          </button>
          <button
            type="button"
            className={view === 'find' ? s('active') : undefined}
            onClick={() => setView('find')}
          >
            Find partners
          </button>
          <button
            type="button"
            className={view === 'requests' ? s('active') : undefined}
            onClick={() => setView('requests')}
          >
            Requests
          </button>
        </nav>
      </div>

      {/* ── Content View ── */}
      {view === 'my' ? (
        <>
          <label className={s('search')}>
            <span className={s('srOnly')}>Search {kind === 'venue' ? 'venues' : 'hosts'}</span>
            <SearchIcon size={19} aria-hidden="true" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${kind === 'venue' ? 'venues' : 'hosts'}`}
            />
          </label>

          {myPartners.length === 0 ? (
            <section className={s('unavailable')}>
              <h1>No partners found</h1>
              <p>Try searching for another name or discover new partners.</p>
            </section>
          ) : (
            <div className={`${s('partnerTable')} ${s('relationshipTable')}`} role="table" aria-label={`${kind === 'venue' ? 'Venue' : 'Host'} partners`}>
              <div className={s('tableHead')} role="row">
                <span role="columnheader">{kind === 'venue' ? 'Venue' : 'Host'}</span>
                <span role="columnheader">Location</span>
                <span role="columnheader">Events together</span>
                <span role="columnheader">Last event</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Action</span>
              </div>
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
            </div>
          )}
        </>
      ) : view === 'find' ? (
        <>
          <div className={s('findControls')}>
            <label className={s('search')}>
              <span className={s('srOnly')}>Search by name or city</span>
              <SearchIcon size={19} aria-hidden="true" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or city"
              />
            </label>
            <label className={s('cityFilter')}>
              <LocationIcon size={18} aria-hidden="true" />
              <select value={city} onChange={e => setCity(e.target.value)}>
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
              onClick={() => setSubTab('incoming')}
            >
              Incoming 1
            </button>
            <button
              type="button"
              className={subTab === 'sent' ? s('primaryAction') : s('secondaryAction')}
              onClick={() => setSubTab('sent')}
            >
              Sent 2
            </button>
          </div>

          <div className={`${s('partnerTable')} ${s('requestTable')}`} role="table" aria-label="Requests table">
            <div className={s('tableHead')} role="row">
              <span role="columnheader">Partner</span>
              <span role="columnheader">Type</span>
              <span role="columnheader">Request</span>
              <span role="columnheader">Date</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Action</span>
            </div>
            {subTab === 'incoming' ? (
              <div className={s('partnerRow')} role="row">
                <div role="cell" className={s('identity')}>
                  <span className={s('avatar')} data-tone="amber">
                    HS
                  </span>
                  <span>
                    <strong>High Spirits</strong>
                    <small>Sunset Sessions · Sun 30 Aug</small>
                  </span>
                </div>
                <span role="cell" className={s('eventCell')}>
                  <strong>Host</strong>
                  <small>Incoming</small>
                </span>
                <span role="cell" className={s('eventCell')}>
                  <strong>Sunset Sessions</strong>
                  <small>Promoter invitation</small>
                </span>
                <span role="cell" className={s('eventCell')}>
                  <strong>Sun, 30 Aug</strong>
                  <small>Pending review</small>
                </span>
                <span role="cell" className={s('pending')}>
                  Pending review
                </span>
                <span role="cell">
                  <Link href="/promoter/events/sunset-sessions" className={s('secondaryAction')}>
                    Review
                  </Link>
                </span>
              </div>
            ) : (
              <>
                <div className={s('partnerRow')} role="row">
                  <div role="cell" className={s('identity')}>
                    <span className={s('avatar')} data-tone="violet">
                      NW
                    </span>
                    <span>
                      <strong>Neon Warehouse</strong>
                      <small>Warehouse Ritual · Fri 4 Sep</small>
                    </span>
                  </div>
                <span role="cell" className={s('eventCell')}>
                    <strong>Venue</strong>
                    <small>Sent</small>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>Warehouse Ritual</strong>
                    <small>15% net sales</small>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>Fri, 4 Sep</strong>
                    <small>Under review</small>
                  </span>
                  <span role="cell" className={s('pending')}>
                    Under review
                  </span>
                  <span role="cell">
                    <Link href="/promoter/events/warehouse-ritual" className={s('secondaryAction')}>
                      View
                    </Link>
                  </span>
                </div>
                <div className={s('partnerRow')} role="row">
                  <div role="cell" className={s('identity')}>
                    <span className={s('avatar')} data-tone="violet">
                      TL
                    </span>
                    <span>
                      <strong>The Loft</strong>
                      <small>Terrace Theory · Sat 12 Sep</small>
                    </span>
                  </div>
                <span role="cell" className={s('eventCell')}>
                    <strong>Venue</strong>
                    <small>Sent</small>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>Terrace Theory</strong>
                    <small>₹220 / ticket</small>
                  </span>
                  <span role="cell" className={s('eventCell')}>
                    <strong>Sat, 12 Sep</strong>
                    <small>Under review</small>
                  </span>
                  <span role="cell" className={s('pending')}>
                    Under review
                  </span>
                  <span role="cell">
                    <Link href="/promoter/events/terrace-theory" className={s('secondaryAction')}>
                      View
                    </Link>
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Partner Drawer ── */}
      {selected ? (
        <div className={s('overlay')}>
          <button type="button" className={s('dismiss')} onClick={() => setSelected(null)} />
          <aside className={s('drawer')} role="dialog" aria-label="Partner profile">
            <button
              type="button"
              className={s('close')}
              aria-label="Close partner details"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
            <div className={s('drawerPortrait')} data-tone="violet">
              {selected.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <h2>{selected.name}</h2>
            <p>
              {selected.kind === 'venue' ? 'Venue' : 'Host'} · {selected.city}
              {selected.verified ? ' · Verified' : ''}
            </p>
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
          </aside>
        </div>
      ) : null}
    </div>
  );
}
