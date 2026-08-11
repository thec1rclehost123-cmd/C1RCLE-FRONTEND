'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { hostPartners } from './host-studio-model';
import { HostButton, HostHeader, HostPage, HostStatus } from './HostStudioUi';

export function HostPartnersScreen({ initialTab = 'venues' }: { readonly initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');
  const kind = tab === 'promoters' ? 'promoter' : 'venue';
  const filtered = useMemo(
    () =>
      hostPartners.filter(
        (partner) =>
          (tab === 'find' || partner.kind === kind) &&
          `${partner.name} ${partner.city}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [kind, query, tab],
  );
  return (
    <HostPage>
      <HostHeader
        title={tab === 'find' ? 'Find partners' : 'Partners'}
        description={
          tab === 'find'
            ? 'Meet verified venues and promoters.'
            : 'Venues and promoters connected to your Host identity.'
        }
        action={
          <HostButton primary href="/host/partners?tab=find">
            Find partners
          </HostButton>
        }
      />
      <div className="host-tabs" role="tablist">
        <button
          type="button"
          className={tab === 'venues' ? 'is-active' : undefined}
          onClick={() => {
            setTab('venues');
          }}
        >
          Venues
        </button>
        <button
          type="button"
          className={tab === 'promoters' ? 'is-active' : undefined}
          onClick={() => {
            setTab('promoters');
          }}
        >
          Promoters
        </button>
        <button
          type="button"
          className={tab === 'find' ? 'is-active' : undefined}
          onClick={() => {
            setTab('find');
          }}
        >
          Find partners
        </button>
      </div>
      <div className="host-toolbar">
        <label>
          <span className="sr-only">Search partners</span>
          <input
            type="search"
            placeholder="Search by name or city"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
        <select aria-label="City" defaultValue="Mumbai">
          <option>Mumbai</option>
          <option>Pune</option>
        </select>
      </div>
      <section className="host-partner-cards">
        {filtered.map((partner) => (
          <article key={partner.id}>
            <div className="host-partner-avatar" aria-hidden="true">
              {partner.name
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="host-partner-title">
                <h2>{partner.name}</h2>
                {partner.verified ? <HostStatus tone="success">Verified</HostStatus> : null}
              </div>
              <p>
                {partner.kind === 'venue' ? 'Venue' : 'Promoter'} · {partner.city}
              </p>
              <span>{partner.detail}</span>
            </div>
            <dl>
              <div>
                <dt>{partner.eventsTogether}</dt>
                <dd>Events together</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{partner.status}</dd>
              </div>
            </dl>
            <Link
              className="host-button"
              href={`/host/partners/${partner.kind === 'venue' ? 'venues' : 'promoters'}/${partner.id}`}
            >
              View profile
            </Link>
          </article>
        ))}
      </section>
    </HostPage>
  );
}
