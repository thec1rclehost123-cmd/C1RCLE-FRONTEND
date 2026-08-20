'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  FilterIcon,
  LinkIcon,
  LocationIcon,
  PendingIcon,
  PhoneIcon,
  SearchIcon,
  SendIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { useOverlayFocus } from '../useOverlayFocus';
import {
  getDiscoverablePartners,
  getPartnershipRequests,
  getVenuePartners,
} from '../venue-partners-model';

import styles from './VenuePartners.module.css';

import type {
  DiscoverablePartner,
  PartnershipRequestDirection,
  VenuePartner,
  VenuePartnerKind,
  VenuePartnershipRequest,
} from '../venue-partners-model';

const classNames = (...values: readonly (string | undefined)[]): string =>
  values.filter((value): value is string => Boolean(value)).join(' ');

export type PartnersTab = 'discover' | 'requests' | 'connected';

const TAB_LINKS: readonly { readonly id: PartnersTab; readonly label: string }[] = [
  { id: 'connected', label: 'Connected' },
  { id: 'discover', label: 'Discover' },
  { id: 'requests', label: 'Requests' },
];

export function PartnersScreen({
  tab = 'connected',
  segment = 'host',
  requestView = 'received',
}: {
  readonly tab?: PartnersTab;
  readonly segment?: VenuePartnerKind;
  readonly requestView?: PartnershipRequestDirection;
}) {
  const auth = useDashboardAuth();
  const canView =
    auth.grantedPermissions.length === 0 ||
    auth.grantedPermissions.includes('*') ||
    auth.hasPermission('VIEW_PARTNERS');

  if (!canView) {
    return (
      <section className={styles['unavailable']} role="alert">
        <h1>Partnerships unavailable</h1>
        <p>Your current venue access does not include partnerships.</p>
      </section>
    );
  }

  const pendingReceived = getPartnershipRequests('received').filter(
    (item) => item.status === 'pending',
  ).length;

  return (
    <section className={styles['page']}>
      <header className={styles['header']}>
        <div>
          <h1>Partnerships</h1>
          <p>
            {tab === 'discover'
              ? 'Find hosts and promoters that fit your venue.'
              : tab === 'requests'
                ? 'Connection requests you have sent and received.'
                : 'Hosts and promoters connected to your venue.'}
          </p>
        </div>
      </header>

      <div className={styles['navRow']}>
        <nav className={styles['tabs']} aria-label="Partnership sections">
          {TAB_LINKS.map((item) => (
            <Link
              key={item.id}
              href={`/venue/partners?tab=${item.id}`}
              className={tab === item.id ? styles['active'] : undefined}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              {item.label}
              {item.id === 'requests' && pendingReceived > 0 ? <b>{pendingReceived}</b> : null}
            </Link>
          ))}
        </nav>

        {tab !== 'requests' ? (
          <nav className={styles['subnav']} aria-label="Partner type">
            <Link
              href={`/venue/partners?tab=${tab}&view=host`}
              className={segment === 'host' ? styles['active'] : undefined}
              aria-current={segment === 'host' ? 'page' : undefined}
            >
              Hosts
            </Link>
            <Link
              href={`/venue/partners?tab=${tab}&view=promoter`}
              className={segment === 'promoter' ? styles['active'] : undefined}
              aria-current={segment === 'promoter' ? 'page' : undefined}
            >
              Promoters
            </Link>
          </nav>
        ) : (
          <nav className={styles['subnav']} aria-label="Request direction">
            <Link
              href="/venue/partners?tab=requests&requestView=received"
              className={requestView === 'received' ? styles['active'] : undefined}
              aria-current={requestView === 'received' ? 'page' : undefined}
            >
              Received
            </Link>
            <Link
              href="/venue/partners?tab=requests&requestView=sent"
              className={requestView === 'sent' ? styles['active'] : undefined}
              aria-current={requestView === 'sent' ? 'page' : undefined}
            >
              Sent
            </Link>
          </nav>
        )}
      </div>

      {tab === 'discover' ? (
        <DiscoverPartners kind={segment} />
      ) : tab === 'requests' ? (
        <PartnershipRequests direction={requestView} />
      ) : (
        <ConnectedPartners kind={segment} />
      )}
    </section>
  );
}

// ── Discover ────────────────────────────────────────────────────────────

interface DiscoverFilterState {
  city: string;
  eventType: string;
  genre: string;
  experience: string;
  eventsTracked: string;
  performance: string;
  secondaryMetric: string;
  verifiedOnly: boolean;
  activeOnly: boolean;
}

const DEFAULT_FILTERS: DiscoverFilterState = {
  city: 'All cities',
  eventType: 'All types',
  genre: 'All genres',
  experience: 'Any experience',
  eventsTracked: 'Any',
  performance: 'Any',
  secondaryMetric: 'Any',
  verifiedOnly: false,
  activeOnly: false,
};

const EXPERIENCE_BUCKETS = ['Any experience', '0–2 years', '3–4 years', '5+ years'] as const;
const COUNT_BUCKETS = ['Any', 'Under 10', '10–20', '20+'] as const;

const matchesExperience = (years: number, bucket: string): boolean => {
  if (bucket === '0–2 years') return years <= 2;
  if (bucket === '3–4 years') return years >= 3 && years <= 4;
  if (bucket === '5+ years') return years >= 5;
  return true;
};

const matchesCount = (value: number, bucket: string): boolean => {
  if (bucket === 'Under 10') return value < 10;
  if (bucket === '10–20') return value >= 10 && value <= 20;
  if (bucket === '20+') return value > 20;
  return true;
};

function DiscoverPartners({ kind }: { readonly kind: VenuePartnerKind }) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<DiscoverablePartner | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const partners = getDiscoverablePartners(kind);
  const isHost = kind === 'host';

  const cities = ['All cities', ...new Set(partners.map((item) => item.city))];
  const eventTypes = isHost
    ? ['All types', ...new Set(partners.map((item) => item.eventType).filter(Boolean) as string[])]
    : [];
  const genres = ['All genres', ...new Set(partners.map((item) => item.genre))];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    return partners.filter((item) => {
      if (normalized && !`${item.name} ${item.city}`.toLocaleLowerCase('en-IN').includes(normalized))
        return false;
      if (filters.city !== 'All cities' && item.city !== filters.city) return false;
      if (isHost && filters.eventType !== 'All types' && item.eventType !== filters.eventType)
        return false;
      if (filters.genre !== 'All genres' && item.genre !== filters.genre) return false;
      if (!matchesExperience(item.experienceYears, filters.experience)) return false;
      if (!matchesCount(item.credibility.trackedEvents, filters.eventsTracked)) return false;
      if (filters.verifiedOnly && !item.verified) return false;
      if (filters.activeOnly && !item.activeAccepting) return false;
      if (isHost) {
        const avgTickets = item.avgTicketsSold ?? 0;
        if (filters.performance === 'Under 250' && avgTickets >= 250) return false;
        if (filters.performance === '250–300' && (avgTickets < 250 || avgTickets > 300))
          return false;
        if (filters.performance === '300+' && avgTickets <= 300) return false;
        const capacity = item.capacity ?? 0;
        if (filters.secondaryMetric === 'Under 300' && capacity >= 300) return false;
        if (filters.secondaryMetric === '300–330' && (capacity < 300 || capacity > 330))
          return false;
        if (filters.secondaryMetric === '330+' && capacity <= 330) return false;
      } else {
        const reach = item.audienceReach ?? 0;
        if (filters.performance === 'Under 25k' && reach >= 25_000) return false;
        if (filters.performance === '25k–40k' && (reach < 25_000 || reach > 40_000)) return false;
        if (filters.performance === '40k+' && reach <= 40_000) return false;
        const conversion = item.conversionRate ?? 0;
        if (filters.secondaryMetric === 'Under 7%' && conversion >= 7) return false;
        if (filters.secondaryMetric === '7–8%' && (conversion < 7 || conversion > 8)) return false;
        if (filters.secondaryMetric === '8%+' && conversion <= 8) return false;
      }
      return true;
    });
  }, [filters, isHost, partners, query]);

  const activeFilterCount =
    (filters.city !== DEFAULT_FILTERS.city ? 1 : 0) +
    (filters.eventType !== DEFAULT_FILTERS.eventType ? 1 : 0) +
    (filters.genre !== DEFAULT_FILTERS.genre ? 1 : 0) +
    (filters.experience !== DEFAULT_FILTERS.experience ? 1 : 0) +
    (filters.eventsTracked !== DEFAULT_FILTERS.eventsTracked ? 1 : 0) +
    (filters.performance !== DEFAULT_FILTERS.performance ? 1 : 0) +
    (filters.secondaryMetric !== DEFAULT_FILTERS.secondaryMetric ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.activeOnly ? 1 : 0);

  return (
    <>
      <div className={styles['findControls']}>
        <label className={styles['search']}>
          <span className={styles['srOnly']}>Search by name or city</span>
          <SearchIcon size={19} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={`Search ${isHost ? 'hosts' : 'promoters'} by name or city`}
          />
        </label>
        <label className={styles['cityFilter']}>
          <LocationIcon size={18} aria-hidden="true" />
          <span className={styles['srOnly']}>City</span>
          <select
            value={filters.city}
            onChange={(event) => {
              setFilters((current) => ({ ...current, city: event.target.value }));
            }}
          >
            {cities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles['filterToggle']}
          aria-expanded={filtersOpen}
          aria-controls="discover-filter-panel"
          onClick={() => {
            setFiltersOpen((current) => !current);
          }}
        >
          <FilterIcon size={18} aria-hidden="true" />
          Filters
          {activeFilterCount > 0 ? <b>{activeFilterCount}</b> : null}
        </button>
      </div>

      {filtersOpen ? (
        <div id="discover-filter-panel" className={styles['filterPanel']}>
          {isHost ? (
            <label>
              <span>Event type</span>
              <select
                value={filters.eventType}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, eventType: event.target.value }));
                }}
              >
                {eventTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            <span>{isHost ? 'Music genre' : 'Event genres'}</span>
            <select
              value={filters.genre}
              onChange={(event) => {
                setFilters((current) => ({ ...current, genre: event.target.value }));
              }}
            >
              {genres.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Experience</span>
            <select
              value={filters.experience}
              onChange={(event) => {
                setFilters((current) => ({ ...current, experience: event.target.value }));
              }}
            >
              {EXPERIENCE_BUCKETS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{isHost ? 'Events hosted' : 'Events promoted'}</span>
            <select
              value={filters.eventsTracked}
              onChange={(event) => {
                setFilters((current) => ({ ...current, eventsTracked: event.target.value }));
              }}
            >
              {COUNT_BUCKETS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{isHost ? 'Average tickets sold' : 'Audience / reach'}</span>
            <select
              value={filters.performance}
              onChange={(event) => {
                setFilters((current) => ({ ...current, performance: event.target.value }));
              }}
            >
              {(isHost
                ? ['Any', 'Under 250', '250–300', '300+']
                : ['Any', 'Under 25k', '25k–40k', '40k+']
              ).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{isHost ? 'Capacity range' : 'Conversion performance'}</span>
            <select
              value={filters.secondaryMetric}
              onChange={(event) => {
                setFilters((current) => ({ ...current, secondaryMetric: event.target.value }));
              }}
            >
              {(isHost
                ? ['Any', 'Under 300', '300–330', '330+']
                : ['Any', 'Under 7%', '7–8%', '8%+']
              ).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className={styles['filterCheckbox']}>
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(event) => {
                setFilters((current) => ({ ...current, verifiedOnly: event.target.checked }));
              }}
            />
            <span>Verified status only</span>
          </label>
          <label className={styles['filterCheckbox']}>
            <input
              type="checkbox"
              checked={filters.activeOnly}
              onChange={(event) => {
                setFilters((current) => ({ ...current, activeOnly: event.target.checked }));
              }}
            />
            <span>{isHost ? 'Active / accepting only' : 'Active / available only'}</span>
          </label>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              className={styles['clearFilters']}
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {filtered.length ? (
        <div className={styles['cardGrid']}>
          {filtered.map((item) => (
            <article key={item.id} className={styles['partnerCard']}>
              <div className={styles['portrait']} data-tone={item.tone}>
                <span>{item.initials}</span>
                {item.verified ? (
                  <em>
                    <CheckIcon size={12} aria-hidden="true" />
                    <span className={styles['srOnly']}>Verified</span>
                  </em>
                ) : null}
              </div>
              <h2>{item.name}</h2>
              <p>
                {isHost ? 'Host' : 'Promoter'} · {item.city}
              </p>
              <small>{item.genre}</small>
              <button
                type="button"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setSelected(item);
                }}
              >
                View profile
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles['muted']}>No {isHost ? 'hosts' : 'promoters'} match these filters.</p>
      )}

      <PartnerProfileDrawer
        key={selected?.id ?? 'closed-discover'}
        partner={selected}
        mode="discover"
        triggerRef={triggerRef}
        onClose={() => {
          setSelected(null);
        }}
      />
    </>
  );
}

// ── Requests ────────────────────────────────────────────────────────────

function PartnershipRequests({ direction }: { readonly direction: PartnershipRequestDirection }) {
  const [selected, setSelected] = useState<VenuePartnershipRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'decline' | 'cancel' | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const requests = getPartnershipRequests(direction);

  return (
    <>
      {requests.length ? (
        <div className={classNames(styles['partnerTable'], styles['requestTable'])} role="table">
          <div className={styles['tableHead']} role="row">
            <span role="columnheader">Partner</span>
            <span role="columnheader">Type</span>
            <span role="columnheader">{direction === 'received' ? 'Message' : 'Note'}</span>
            <span role="columnheader">Requested</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Action</span>
          </div>
          {requests.map((item) => (
            <div className={styles['partnerRow']} role="row" key={item.id}>
              <div role="cell" className={styles['identity']}>
                <Avatar initials={item.partnerInitials} tone={item.tone} />
                <span>
                  <strong>{item.partnerName}</strong>
                  <small>{item.partnerCity}</small>
                </span>
              </div>
              <span role="cell">{item.kind === 'host' ? 'Host' : 'Promoter'}</span>
              <span role="cell" className={styles['muted']}>
                {item.note ?? '—'}
              </span>
              <span role="cell" className={styles['muted']}>
                {item.requestedAt}
              </span>
              <span
                role="cell"
                className={
                  item.status === 'accepted'
                    ? styles['positive']
                    : item.status === 'pending'
                      ? styles['pending']
                      : styles['muted']
                }
              >
                {item.status === 'pending' ? <PendingIcon size={13} aria-hidden="true" /> : null}
                {item.status[0]?.toUpperCase()}
                {item.status.slice(1)}
              </span>
              <span role="cell">
                {item.status === 'pending' ? (
                  <button
                    type="button"
                    className={styles['secondaryAction']}
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      setSelected(item);
                    }}
                  >
                    Review
                  </button>
                ) : (
                  <span className={styles['muted']}>—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles['muted']}>
          No {direction === 'received' ? 'requests received yet' : 'requests sent yet'}.
        </p>
      )}

      <RequestReviewDrawer
        request={selected}
        triggerRef={triggerRef}
        onAction={(action) => {
          setConfirmAction(action);
        }}
        onClose={() => {
          setSelected(null);
        }}
      />
      <RequestConfirmDialog
        request={selected}
        action={confirmAction}
        onClose={() => {
          setConfirmAction(null);
        }}
      />
    </>
  );
}

function RequestReviewDrawer({
  request,
  triggerRef,
  onAction,
  onClose,
}: {
  readonly request: VenuePartnershipRequest | null;
  readonly triggerRef: React.RefObject<HTMLButtonElement | null>;
  readonly onAction: (action: 'accept' | 'decline' | 'cancel') => void;
  readonly onClose: () => void;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  useOverlayFocus({
    containerRef: drawerRef,
    open: Boolean(request),
    onClose,
    restoreFocusRef: triggerRef,
    lockScroll: true,
  });
  if (!request) return null;
  return (
    <div className={styles['overlay']}>
      <button
        type="button"
        className={styles['dismiss']}
        aria-label="Close request details"
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        className={styles['drawer']}
        role="dialog"
        aria-modal="true"
        aria-label={`Request from ${request.partnerName}`}
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles['close']}
          aria-label="Close request details"
          onClick={onClose}
        >
          <CloseIcon size={20} aria-hidden="true" />
        </button>
        <div className={styles['drawerPortrait']} data-tone={request.tone}>
          {request.partnerInitials}
        </div>
        <h2>{request.partnerName}</h2>
        <p>
          {request.kind === 'host' ? 'Host' : 'Promoter'} · {request.partnerCity}
        </p>
        <dl>
          <div>
            <dt>Requested</dt>
            <dd>{request.requestedAt}</dd>
          </div>
          <div>
            <dt>Message</dt>
            <dd>{request.note ?? 'No message included.'}</dd>
          </div>
        </dl>
        {request.direction === 'received' ? (
          <footer>
            <button
              type="button"
              onClick={() => {
                onAction('decline');
              }}
            >
              <CloseIcon size={18} aria-hidden="true" /> Decline
            </button>
            <button
              type="button"
              className={styles['primary']}
              onClick={() => {
                onAction('accept');
              }}
            >
              <CheckIcon size={18} aria-hidden="true" /> Accept
            </button>
          </footer>
        ) : (
          <footer>
            <button
              type="button"
              className={styles['dangerAction']}
              onClick={() => {
                onAction('cancel');
              }}
            >
              Cancel request
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}

function RequestConfirmDialog({
  request,
  action,
  onClose,
}: {
  readonly request: VenuePartnershipRequest | null;
  readonly action: 'accept' | 'decline' | 'cancel' | null;
  readonly onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlayFocus({ containerRef: ref, open: Boolean(action), onClose, lockScroll: true });
  if (!request || !action) return null;
  const copy =
    action === 'accept'
      ? { title: 'Accept this request?', body: `${request.partnerName} will be added to Connected.` }
      : action === 'decline'
        ? { title: 'Decline this request?', body: 'They will be notified this request was declined.' }
        : { title: 'Cancel this request?', body: 'Your pending request will be withdrawn.' };
  return (
    <div className={styles['modalBackdrop']}>
      <div
        ref={ref}
        className={styles['modal']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-confirm-title"
        tabIndex={-1}
      >
        <button type="button" className={styles['close']} aria-label="Close" onClick={onClose}>
          <CloseIcon size={20} aria-hidden="true" />
        </button>
        <h2 id="request-confirm-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <p className={styles['unsupported']}>
          This action requires the partnership mutation API, which is not connected yet.
        </p>
        <footer>
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button type="button" className={styles['primary']} disabled title="Requires the partnership mutation API.">
            Confirm
          </button>
        </footer>
      </div>
    </div>
  );
}

// ── Connected ───────────────────────────────────────────────────────────

function ConnectedPartners({ kind }: { readonly kind: VenuePartnerKind }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<VenuePartner | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const partners = getVenuePartners(kind);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    return normalized
      ? partners.filter((item) => item.name.toLocaleLowerCase('en-IN').includes(normalized))
      : partners;
  }, [partners, query]);

  return (
    <>
      <label className={styles['search']}>
        <span className={styles['srOnly']}>Search {kind === 'host' ? 'hosts' : 'promoters'}</span>
        <SearchIcon size={19} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={`Search connected ${kind === 'host' ? 'hosts' : 'promoters'}`}
        />
      </label>
      <div
        className={classNames(styles['partnerTable'], styles['relationshipTable'])}
        role="table"
        aria-label={`Connected ${kind === 'host' ? 'hosts' : 'promoters'}`}
      >
        <div className={styles['tableHead']} role="row">
          <span role="columnheader">{kind === 'host' ? 'Host' : 'Promoter'}</span>
          <span role="columnheader">City</span>
          <span role="columnheader">{kind === 'host' ? 'Events hosted' : 'Events promoted'}</span>
          <span role="columnheader">Last event</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Action</span>
        </div>
        {filtered.map((item) => (
          <div className={styles['partnerRow']} role="row" key={item.id}>
            <div role="cell" className={styles['identity']}>
              <Avatar initials={item.initials} tone={item.tone} />
              <span>
                <strong>{item.name}</strong>
                {item.verified ? <small>Verified</small> : null}
              </span>
            </div>
            <span role="cell" className={styles['muted']}>
              {item.city}
            </span>
            <span role="cell">{item.credibility.trackedEvents}</span>
            <span role="cell" className={styles['eventCell']}>
              <strong>{item.recentEvent}</strong>
              <small>{item.recentEventDate}</small>
            </span>
            <span
              role="cell"
              className={item.status === 'Active' ? styles['positive'] : styles['pending']}
            >
              {item.status}
            </span>
            <span role="cell">
              <button
                type="button"
                className={styles['secondaryAction']}
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setSelected(item);
                }}
              >
                View profile
              </button>
            </span>
          </div>
        ))}
      </div>
      <PartnerProfileDrawer
        key={selected?.id ?? 'closed-connected'}
        partner={selected}
        mode="connected"
        triggerRef={triggerRef}
        onClose={() => {
          setSelected(null);
        }}
      />
    </>
  );
}

// ── Shared profile drawer (Discover + Connected) ───────────────────────

function PartnerProfileDrawer({
  partner,
  mode,
  triggerRef,
  onClose,
}: {
  readonly partner: VenuePartner | null;
  readonly mode: 'discover' | 'connected';
  readonly triggerRef: React.RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
}) {
  const [showEvents, setShowEvents] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  useOverlayFocus({
    containerRef: drawerRef,
    open: Boolean(partner),
    onClose,
    restoreFocusRef: triggerRef,
    lockScroll: true,
  });
  if (!partner) return null;
  const isHost = partner.kind === 'host';
  const historyId = `${partner.id}-event-history`;
  const eventVerb = isHost ? 'hosted' : 'promoted';

  return (
    <div className={styles['overlay']}>
      <button
        type="button"
        className={styles['dismiss']}
        aria-label="Close partner details"
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        className={styles['drawer']}
        role="dialog"
        aria-modal="true"
        aria-label={`${partner.name} partner details`}
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles['close']}
          aria-label="Close partner details"
          onClick={onClose}
        >
          <CloseIcon size={20} aria-hidden="true" />
        </button>
        <div className={styles['drawerPortrait']} data-tone={partner.tone}>
          {partner.initials}
        </div>
        <h2>{partner.name}</h2>
        <p>
          {isHost ? 'Host' : 'Promoter'} · {partner.city}
        </p>
        <dl>
          <div>
            <dt>Verified</dt>
            <dd>{partner.verified ? 'Verified partner' : 'Not yet verified'}</dd>
          </div>
          <div>
            <dt>
              <PhoneIcon size={18} aria-hidden="true" /> Phone
            </dt>
            <dd>{partner.phone ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Instagram</dt>
            <dd>{partner.instagram ?? 'Unavailable'}</dd>
          </div>
          {isHost ? (
            <div>
              <dt>Venues worked with</dt>
              <dd>{partner.venuesWorkedWith ?? '—'}</dd>
            </div>
          ) : (
            <div>
              <dt>Audience / reach</dt>
              <dd>{partner.audienceReach ? partner.audienceReach.toLocaleString('en-IN') : 'Unavailable'}</dd>
            </div>
          )}
          <div>
            <dt>
              <CalendarIcon size={18} aria-hidden="true" /> Recent event
            </dt>
            <dd>
              {partner.recentEvent}
              <small>{partner.recentEventDate}</small>
            </dd>
          </div>
        </dl>

        <section className={styles['credibility']} aria-labelledby={`${partner.id}-credibility`}>
          <div className={styles['sectionHeading']}>
            <div>
              <h3 id={`${partner.id}-credibility`}>Performance</h3>
              <p>What this {isHost ? 'host' : 'promoter'} brings to a booking.</p>
            </div>
            {partner.verified ? (
              <span className={styles['verifiedBadge']}>
                <CheckIcon size={13} aria-hidden="true" /> Verified
              </span>
            ) : null}
          </div>
          <div className={styles['statsGrid']}>
            <div>
              <strong>{partner.credibility.trackedEvents}</strong>
              <span>Events {eventVerb}</span>
            </div>
            <div>
              <strong>
                {isHost
                  ? (partner.avgTicketsSold ?? '—')
                  : partner.credibility.performanceValue.toLocaleString('en-IN')}
              </strong>
              <span>{isHost ? 'Average tickets sold' : 'Tickets sold'}</span>
            </div>
            <div>
              <strong>
                {isHost
                  ? (partner.avgAttendance ?? '—')
                  : partner.conversionRate !== null
                    ? `${partner.conversionRate.toString()}%`
                    : '—'}
              </strong>
              <span>{isHost ? 'Average attendance' : 'Average conversion'}</span>
            </div>
          </div>
          {isHost && 'genre' in partner ? (
            <p className={styles['muted']}>Genres: {(partner as DiscoverablePartner).genre}</p>
          ) : null}
          <button
            type="button"
            className={styles['historyToggle']}
            aria-expanded={showEvents}
            aria-controls={historyId}
            onClick={() => {
              setShowEvents((current) => !current);
            }}
          >
            <span>
              <CalendarIcon size={18} aria-hidden="true" /> See {eventVerb} events
            </span>
            <span aria-hidden="true">{showEvents ? '−' : '+'}</span>
          </button>
          {showEvents ? (
            <div id={historyId} className={styles['eventHistory']}>
              {partner.eventHistory.map((event) => (
                <article key={event.id}>
                  <div>
                    <strong>{event.name}</strong>
                    <span>{event.date}</span>
                  </div>
                  <small>{event.outcome}</small>
                </article>
              ))}
            </div>
          ) : null}
          {isHost && partner.upcomingEvents && partner.upcomingEvents.length > 0 ? (
            <div className={styles['upcomingList']}>
              <h4>Upcoming events</h4>
              {partner.upcomingEvents.map((event) => (
                <div key={event.id}>
                  <span>{event.name}</span>
                  <small>{event.date}</small>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <footer>
          {mode === 'discover' ? (
            <button
              type="button"
              className={styles['primary']}
              disabled
              title="Sending connection requests requires the partnership mutation API."
            >
              <SendIcon size={18} aria-hidden="true" /> Connect
            </button>
          ) : (
            <>
              <button type="button" disabled title="Partner messaging is not connected yet.">
                <SendIcon size={18} aria-hidden="true" /> Message unavailable
              </button>
              <button
                type="button"
                disabled
                title="Requesting an event date requires the partner mutation API."
              >
                <CalendarIcon size={18} aria-hidden="true" /> Request event date
              </button>
              <button
                type="button"
                disabled
                title="Assigning to an event requires the partner mutation API."
              >
                <LinkIcon size={18} aria-hidden="true" /> Assign to event
              </button>
              <button
                type="button"
                className={styles['dangerAction']}
                disabled
                title="Removing a connection requires the partner mutation API."
              >
                <DeleteIcon size={18} aria-hidden="true" /> Remove connection
              </button>
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}

function Avatar({
  initials,
  tone,
}: {
  readonly initials: string;
  readonly tone: VenuePartner['tone'];
}) {
  return (
    <span className={styles['avatar']} data-tone={tone} aria-hidden="true">
      {initials}
    </span>
  );
}

