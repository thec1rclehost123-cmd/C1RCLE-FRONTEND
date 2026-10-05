'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  LinkIcon,
  LocationIcon,
  PendingIcon,
  PhoneIcon,
  SearchIcon,
  SendIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { getActiveOrgId } from '@/lib/org/active-org';
import {
  discoverPartners,
  listPartnerships,
  resolvePartnership,
} from '@/lib/partner/api-partnerships-repository';
import {
  listPromoterConnections,
  resolvePromoterConnection,
} from '@/lib/partner/promoter-connection-repository';

import { useOverlayFocus } from '../useOverlayFocus';

import styles from './VenuePartners.module.css';
import { VenueSharePanel } from './VenueSharePanel';

import type {
  DiscoverablePartner,
  PartnershipRequestDirection,
  VenuePartner,
  VenuePartnerKind,
  VenuePartnershipRequest,
} from '../venue-partners-model';
import type { DiscoverPartnerDto, PartnershipDto, PromoterConnectionDto } from '@c1rcle/contracts';

const classNames = (...values: readonly (string | undefined)[]): string =>
  values.filter((value): value is string => Boolean(value)).join(' ');

export type PartnersTab = 'discover' | 'requests' | 'connected' | 'share';

const TAB_LINKS: readonly { readonly id: PartnersTab; readonly label: string }[] = [
  { id: 'connected', label: 'Connected' },
  { id: 'share', label: 'Venue share' },
  { id: 'discover', label: 'Discover' },
  { id: 'requests', label: 'Requests' },
];

// ── Live partnerships (venue ↔ hosts, venue ↔ promoters) ────────────────────
// Same shape as `VenueSharePanel`: the org id comes from the active-org cookie,
// every read/mutation is org-scoped server-side with `X-Organization-Id`, and
// each mutation sends one `Idempotency-Key` per user intent. There is no
// fixture fallback: without an active org the tab asks to select one, and with
// one it renders only what the backend returns (loading / error / empty).

type LivePartnerships =
  | { readonly mode: 'no-org' }
  | { readonly mode: 'loading'; readonly organizationId: string }
  | { readonly mode: 'error'; readonly organizationId: string; readonly reload: () => void }
  | {
      readonly mode: 'ready';
      readonly organizationId: string;
      readonly partnerships: readonly PartnershipDto[];
      readonly promoterConnections: readonly PromoterConnectionDto[];
      readonly reload: () => void;
    };

function useLivePartnerships(): LivePartnerships {
  const [state, setState] = useState<LivePartnerships>({ mode: 'no-org' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    // Same shape as `VenueSharePanel`: state updates happen inside the async
    // function's microtask continuation, never synchronously in the effect
    // body, which is what `react-hooks/set-state-in-effect` requires.
    // `cancelled` is read through a function because TS's control-flow
    // narrowing can't see the cleanup closure's later mutation.
    const lifecycle = { cancelled: false };
    const isCancelled = (): boolean => lifecycle.cancelled;
    void (async () => {
      const orgId = getActiveOrgId();
      if (orgId === null) {
        if (!isCancelled()) setState({ mode: 'no-org' });
        return;
      }
      if (!isCancelled()) setState({ mode: 'loading', organizationId: orgId });
      try {
        const [partnerships, promoterConnections] = await Promise.all([
          listPartnerships(orgId),
          listPromoterConnections({ organizationId: orgId }),
        ]);
        if (!isCancelled()) {
          setState({
            mode: 'ready',
            organizationId: orgId,
            partnerships,
            promoterConnections,
            reload: () => {
              setNonce((current) => current + 1);
            },
          });
        }
      } catch {
        if (!isCancelled()) {
          setState({
            mode: 'error',
            organizationId: orgId,
            reload: () => {
              setNonce((current) => current + 1);
            },
          });
        }
      }
    })();
    return () => {
      lifecycle.cancelled = true;
    };
  }, [nonce]);

  return state;
}

function shortOrgId(id: string): string {
  return id.length <= 10 ? id : `${id.slice(0, 8)}…`;
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function formatRequestedAt(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso;
  return new Date(time).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type LiveTarget =
  | { readonly graph: 'partnership'; readonly id: string }
  | { readonly graph: 'promoter-connection'; readonly id: string };

/**
 * The viewer here is always the venue side: venue-initiated rows are `sent`,
 * everything else is `received`. Display fields come only from the DTOs the
 * backend enriches (`hostName`, `targetName`, …) — anything the API does not
 * return renders as unavailable rather than invented.
 */
function toPartnershipRequest(item: PartnershipDto): {
  readonly row: VenuePartnershipRequest;
  readonly target: LiveTarget;
  readonly createdAt: string;
} {
  const direction: PartnershipRequestDirection = item.initiatedBy === 'venue' ? 'sent' : 'received';
  const name = item.hostName ?? shortOrgId(item.hostOrganizationId);
  const status: VenuePartnershipRequest['status'] =
    item.status === 'pending'
      ? 'pending'
      : item.status === 'active'
        ? 'accepted'
        : item.status === 'rejected'
          ? 'declined'
          : 'cancelled';
  return {
    target: { graph: 'partnership', id: item.id },
    createdAt: item.createdAt,
    row: {
      id: item.id,
      kind: 'host',
      direction,
      partnerName: name,
      partnerInitials: initialsOf(name),
      partnerCity: '—',
      tone: 'violet',
      verified: false,
      status,
      requestedAt: formatRequestedAt(item.createdAt),
      note: item.message,
    },
  };
}

function toPromoterRequest(item: PromoterConnectionDto): {
  readonly row: VenuePartnershipRequest;
  readonly target: LiveTarget;
  readonly createdAt: string;
} {
  const direction: PartnershipRequestDirection =
    item.initiatedBy === 'target' ? 'sent' : 'received';
  const name = item.promoterName ?? shortOrgId(item.promoterId);
  const status: VenuePartnershipRequest['status'] =
    item.status === 'pending'
      ? 'pending'
      : item.status === 'active'
        ? 'accepted'
        : item.status === 'rejected'
          ? 'declined'
          : 'cancelled';
  return {
    target: { graph: 'promoter-connection', id: item.id },
    createdAt: item.createdAt,
    row: {
      id: item.id,
      kind: 'promoter',
      direction,
      partnerName: name,
      partnerInitials: initialsOf(name),
      partnerCity: item.targetCity ?? '—',
      tone: 'rose',
      verified: false,
      status,
      requestedAt: formatRequestedAt(item.createdAt),
      note: item.message,
    },
  };
}

function toSparsePartner(
  id: string,
  kind: VenuePartnerKind,
  name: string,
  status: VenuePartner['status'],
): VenuePartner {
  return {
    id,
    kind,
    name,
    initials: initialsOf(name),
    city: '—',
    recentEvent: '—',
    recentEventDate: '—',
    status,
    phone: null,
    instagram: null,
    verified: false,
    tone: kind === 'host' ? 'violet' : 'rose',
    credibility: { trackedEvents: 0, performanceValue: 0, rebookRate: 0 },
    eventHistory: [],
    eventType: null,
    experienceYears: 0,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: null,
    conversionRate: null,
    activeAccepting: status === 'Active',
  };
}

function toDiscoverablePartner(item: DiscoverPartnerDto): DiscoverablePartner {
  return {
    ...toSparsePartner(
      item.id,
      item.kind === 'promoter' ? 'promoter' : 'host',
      item.name,
      'Invite pending',
    ),
    city: item.city ?? '—',
    verified: item.verified,
    genre: '—',
  };
}

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
  const live = useLivePartnerships();

  if (!canView) {
    return (
      <section className={styles['unavailable']} role="alert">
        <h1>Partnerships unavailable</h1>
        <p>Your current venue access does not include partnerships.</p>
      </section>
    );
  }

  const pendingReceived =
    live.mode === 'ready'
      ? live.partnerships.filter(
          (item) => item.status === 'pending' && item.initiatedBy !== 'venue',
        ).length +
        live.promoterConnections.filter(
          (item) => item.status === 'pending' && item.initiatedBy !== 'target',
        ).length
      : 0;

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
                : tab === 'share'
                  ? 'Agree the share of every ticket sale that belongs to your venue.'
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

        {tab !== 'requests' && tab !== 'share' ? (
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
        <DiscoverPartners kind={segment} live={live} />
      ) : tab === 'requests' ? (
        <PartnershipRequests direction={requestView} live={live} />
      ) : tab === 'share' ? (
        <VenueSharePanel />
      ) : (
        <ConnectedPartners kind={segment} live={live} />
      )}
    </section>
  );
}

// ── Discover ────────────────────────────────────────────────────────────
// Only what `GET discover-partners` returns is filterable: name/city search,
// city, and verified. Richer facets (genre, experience, volumes) need backend
// browse fields that do not exist yet, so they are omitted rather than faked.

type LiveDiscover =
  | { readonly mode: 'no-org' }
  | { readonly mode: 'loading' }
  | { readonly mode: 'error'; readonly reload: () => void }
  | { readonly mode: 'ready'; readonly items: readonly DiscoverablePartner[] };

function useLiveDiscover(organizationId: string | null, kind: VenuePartnerKind): LiveDiscover {
  const [state, setState] = useState<LiveDiscover>({ mode: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (organizationId === null) {
      return;
    }
    const lifecycle = { cancelled: false };
    const isCancelled = (): boolean => lifecycle.cancelled;
    void (async () => {
      if (!isCancelled())
        setState((current) => (current.mode === 'ready' ? current : { mode: 'loading' }));
      try {
        const rows = await discoverPartners(organizationId, {
          type: kind === 'host' ? 'host' : 'promoter',
          limit: 100,
        });
        if (!isCancelled()) {
          setState({
            mode: 'ready',
            items: rows
              .filter((item) =>
                kind === 'host' ? item.kind !== 'promoter' : item.kind === 'promoter',
              )
              .map(toDiscoverablePartner),
          });
        }
      } catch {
        if (!isCancelled()) {
          setState({
            mode: 'error',
            reload: () => {
              setNonce((current) => current + 1);
            },
          });
        }
      }
    })();
    return () => {
      lifecycle.cancelled = true;
    };
  }, [organizationId, kind, nonce]);

  if (organizationId === null) return { mode: 'no-org' };
  return state;
}

function DiscoverPartners({
  kind,
  live,
}: {
  readonly kind: VenuePartnerKind;
  readonly live: LivePartnerships;
}) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All cities');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selected, setSelected] = useState<DiscoverablePartner | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const organizationId = live.mode === 'no-org' ? null : live.organizationId;
  const discovered = useLiveDiscover(organizationId, kind);
  const isHost = kind === 'host';

  const partners = useMemo(
    () => (discovered.mode === 'ready' ? discovered.items : []),
    [discovered],
  );
  const cities = useMemo(
    () => ['All cities', ...new Set(partners.map((item) => item.city))],
    [partners],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    return partners.filter((item) => {
      if (
        normalized &&
        !`${item.name} ${item.city}`.toLocaleLowerCase('en-IN').includes(normalized)
      )
        return false;
      if (city !== 'All cities' && item.city !== city) return false;
      if (verifiedOnly && !item.verified) return false;
      return true;
    });
  }, [partners, query, city, verifiedOnly]);

  if (discovered.mode === 'no-org') {
    return <p className={styles['muted']}>Select an organization to discover new partners.</p>;
  }
  if (discovered.mode === 'loading') {
    return <p className={styles['muted']}>Loading partners…</p>;
  }
  if (discovered.mode === 'error') {
    return (
      <>
        <p className={styles['muted']}>Could not load partners. Try again in a moment.</p>
        <button type="button" className={styles['secondaryAction']} onClick={discovered.reload}>
          Retry
        </button>
      </>
    );
  }

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
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
            }}
          >
            {cities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className={styles['filterCheckbox']}>
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(event) => {
              setVerifiedOnly(event.target.checked);
            }}
          />
          <span>Verified status only</span>
        </label>
      </div>

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
      ) : partners.length === 0 ? (
        <p className={styles['muted']}>
          No {isHost ? 'hosts' : 'promoters'} to discover yet. New profiles appear here once they
          join.
        </p>
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

function PartnershipRequests({
  direction,
  live,
}: {
  readonly direction: PartnershipRequestDirection;
  readonly live: LivePartnerships;
}) {
  const [selected, setSelected] = useState<VenuePartnershipRequest | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<LiveTarget | null>(null);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'decline' | 'cancel' | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const rows = useMemo(
    () =>
      live.mode === 'ready'
        ? [
            ...live.partnerships.map(toPartnershipRequest),
            ...live.promoterConnections.map(toPromoterRequest),
          ]
            .filter(({ row }) => row.direction === direction)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
        : null,
    [live, direction],
  );

  const handleResolved = useCallback(() => {
    if (live.mode === 'ready') live.reload();
    setConfirmAction(null);
    setSelected(null);
    setSelectedTarget(null);
  }, [live]);

  if (live.mode === 'no-org') {
    return <p className={styles['muted']}>Select an organization to manage connection requests.</p>;
  }
  if (live.mode === 'loading') {
    return <p className={styles['muted']}>Loading requests…</p>;
  }
  if (live.mode === 'error') {
    return (
      <>
        <p className={styles['muted']}>Could not load requests. Try again in a moment.</p>
        <button type="button" className={styles['secondaryAction']} onClick={live.reload}>
          Retry
        </button>
      </>
    );
  }

  const requests = rows ? rows.map(({ row }) => row) : [];
  const liveContext =
    selected && selectedTarget
      ? {
          organizationId: live.organizationId,
          target: selectedTarget,
        }
      : null;

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
                      setSelectedTarget(
                        rows?.find(({ row }) => row.id === item.id)?.target ?? null,
                      );
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
          setSelectedTarget(null);
        }}
      />
      <RequestConfirmDialog
        request={selected}
        action={confirmAction}
        live={liveContext}
        onResolved={handleResolved}
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
  live,
  onResolved,
  onClose,
}: {
  readonly request: VenuePartnershipRequest | null;
  readonly action: 'accept' | 'decline' | 'cancel' | null;
  readonly live: { readonly organizationId: string; readonly target: LiveTarget } | null;
  readonly onResolved?: () => void;
  readonly onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useOverlayFocus({ containerRef: ref, open: Boolean(action), onClose, lockScroll: true });
  if (!request || !action) return null;
  const copy =
    action === 'accept'
      ? {
          title: 'Accept this request?',
          body: `${request.partnerName} will be added to Connected.`,
        }
      : action === 'decline'
        ? {
            title: 'Decline this request?',
            body: 'They will be notified this request was declined.',
          }
        : { title: 'Cancel this request?', body: 'Your pending request will be withdrawn.' };
  const liveEnabled = live !== null;
  const confirm = async (): Promise<void> => {
    if (live === null) return;
    setSaving(true);
    setError(null);
    try {
      if (live.target.graph === 'partnership') {
        const resolveAction =
          action === 'accept' ? 'approve' : action === 'decline' ? 'reject' : 'end';
        await resolvePartnership(live.organizationId, live.target.id, resolveAction, undefined);
      } else {
        // `revoke` is the promoter's alone, so a venue withdrawing its own sent
        // invite closes it via `block`, which is open to either side.
        const resolveAction =
          action === 'accept' ? 'approve' : action === 'decline' ? 'reject' : 'block';
        await resolvePromoterConnection(
          live.organizationId,
          live.target.id,
          resolveAction,
          undefined,
        );
      }
      onResolved?.();
    } catch {
      setError('Could not update the request. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };
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
        {liveEnabled ? (
          error ? (
            <p className={styles['unsupported']} role="alert">
              {error}
            </p>
          ) : null
        ) : (
          <p className={styles['unsupported']}>
            This action requires the partnership mutation API, which is not connected yet.
          </p>
        )}
        <footer>
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className={styles['primary']}
            disabled={!liveEnabled || saving}
            title={liveEnabled ? undefined : 'Requires the partnership mutation API.'}
            onClick={() => {
              void confirm();
            }}
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ── Connected ───────────────────────────────────────────────────────────

function ConnectedPartners({
  kind,
  live,
}: {
  readonly kind: VenuePartnerKind;
  readonly live: LivePartnerships;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<VenuePartner | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<LiveTarget | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const liveEntries = useMemo(
    () =>
      live.mode === 'ready'
        ? kind === 'host'
          ? live.partnerships
              .filter((item) => item.status === 'active' || item.status === 'pending')
              .map((item): { readonly partner: VenuePartner; readonly target: LiveTarget } => ({
                target: { graph: 'partnership', id: item.id },
                partner: toSparsePartner(
                  item.id,
                  'host',
                  item.hostName ?? shortOrgId(item.hostOrganizationId),
                  item.status === 'active' ? 'Active' : 'Invite pending',
                ),
              }))
          : live.promoterConnections
              .filter((item) => item.status === 'active' || item.status === 'pending')
              .map((item): { readonly partner: VenuePartner; readonly target: LiveTarget } => ({
                target: { graph: 'promoter-connection', id: item.id },
                partner: toSparsePartner(
                  item.id,
                  'promoter',
                  item.promoterName ?? shortOrgId(item.promoterId),
                  item.status === 'active' ? 'Active' : 'Invite pending',
                ),
              }))
        : null,
    [live, kind],
  );

  const handleRemoved = useCallback(() => {
    if (live.mode === 'ready') live.reload();
    setSelected(null);
    setSelectedTarget(null);
  }, [live]);

  const partners = useMemo(
    () => (liveEntries ? liveEntries.map(({ partner }) => partner) : []),
    [liveEntries],
  );
  const liveRemove =
    live.mode === 'ready' && selected && selectedTarget
      ? { organizationId: live.organizationId, target: selectedTarget }
      : null;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    return normalized
      ? partners.filter((item) => item.name.toLocaleLowerCase('en-IN').includes(normalized))
      : partners;
  }, [partners, query]);

  if (live.mode === 'no-org') {
    return <p className={styles['muted']}>Select an organization to see its connected partners.</p>;
  }
  if (live.mode === 'loading') {
    return <p className={styles['muted']}>Loading partners…</p>;
  }
  if (live.mode === 'error') {
    return (
      <>
        <p className={styles['muted']}>Could not load partners. Try again in a moment.</p>
        <button type="button" className={styles['secondaryAction']} onClick={live.reload}>
          Retry
        </button>
      </>
    );
  }

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
                  setSelectedTarget(
                    liveEntries?.find(({ partner }) => partner.id === item.id)?.target ?? null,
                  );
                }}
              >
                View profile
              </button>
            </span>
          </div>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className={styles['muted']}>
          No connected {kind === 'host' ? 'hosts' : 'promoters'} yet. Accepted requests appear here.
        </p>
      ) : null}
      <PartnerProfileDrawer
        key={selected?.id ?? 'closed-connected'}
        partner={selected}
        mode="connected"
        triggerRef={triggerRef}
        liveRemove={liveRemove}
        onRemoved={handleRemoved}
        onClose={() => {
          setSelected(null);
          setSelectedTarget(null);
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
  liveRemove,
  onRemoved,
  onClose,
}: {
  readonly partner: VenuePartner | null;
  readonly mode: 'discover' | 'connected';
  readonly triggerRef: React.RefObject<HTMLButtonElement | null>;
  readonly liveRemove?: { readonly organizationId: string; readonly target: LiveTarget } | null;
  readonly onRemoved?: () => void;
  readonly onClose: () => void;
}) {
  const [showEvents, setShowEvents] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
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
              <dd>
                {partner.audienceReach
                  ? partner.audienceReach.toLocaleString('en-IN')
                  : 'Unavailable'}
              </dd>
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
          {partner.eventHistory.length > 0 ? (
            <>
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
            </>
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
              title="Choose one of your venues to send a connection request."
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
                disabled={!liveRemove || removing}
                title={
                  liveRemove
                    ? undefined
                    : 'Removing a connection requires the partner mutation API.'
                }
                onClick={() => {
                  if (!liveRemove) return;
                  setRemoving(true);
                  setRemoveError(null);
                  void (async () => {
                    try {
                      if (liveRemove.target.graph === 'partnership') {
                        await resolvePartnership(
                          liveRemove.organizationId,
                          liveRemove.target.id,
                          'end',
                          undefined,
                        );
                      } else {
                        // `revoke` is the promoter's alone; a venue removes the
                        // connection via `block`, which is open to either side.
                        await resolvePromoterConnection(
                          liveRemove.organizationId,
                          liveRemove.target.id,
                          'block',
                          undefined,
                        );
                      }
                      onRemoved?.();
                    } catch {
                      setRemoveError(
                        'Could not remove the connection. Check your connection and try again.',
                      );
                    } finally {
                      setRemoving(false);
                    }
                  })();
                }}
              >
                <DeleteIcon size={18} aria-hidden="true" />{' '}
                {removing ? 'Removing…' : 'Remove connection'}
              </button>
              {removeError ? (
                <p className={styles['unsupported']} role="alert">
                  {removeError}
                </p>
              ) : null}
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
