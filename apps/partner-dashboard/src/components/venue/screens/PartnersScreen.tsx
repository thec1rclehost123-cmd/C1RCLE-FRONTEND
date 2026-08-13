'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  InviteIcon,
  LocationIcon,
  SearchIcon,
  SendIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { getDiscoverablePartners, getVenuePartners, venueStaff } from '../venue-partners-model';

import styles from './VenuePartners.module.css';

import type {
  DiscoverablePartner,
  VenuePartner,
  VenuePartnerKind,
  VenueStaffMember,
} from '../venue-partners-model';

export type PartnersTab = 'hosts' | 'promoters' | 'staff';
export type PartnersView = 'my' | 'find';

const TAB_LINKS: readonly {
  readonly id: PartnersTab;
  readonly label: string;
  readonly href: string;
}[] = [
  { id: 'hosts', label: 'Hosts', href: '/venue/partners?tab=hosts' },
  { id: 'promoters', label: 'Promoters', href: '/venue/partners?tab=promoters' },
  { id: 'staff', label: 'Staff', href: '/venue/partners?tab=staff' },
];

const partnerKind = (tab: PartnersTab): VenuePartnerKind =>
  tab === 'promoters' ? 'promoter' : 'host';

export function PartnersScreen({
  tab = 'hosts',
  view = 'my',
}: {
  readonly tab?: PartnersTab;
  readonly view?: PartnersView;
}) {
  const auth = useDashboardAuth();
  const kind = partnerKind(tab);
  const isStaff = tab === 'staff';
  const isFind = !isStaff && view === 'find';
  const canView =
    auth.grantedPermissions.length === 0 ||
    auth.grantedPermissions.includes('*') ||
    auth.hasPermission('VIEW_PARTNERS');

  if (!canView) {
    return (
      <section className={styles['unavailable']} role="alert">
        <h1>Partners unavailable</h1>
        <p>Your current venue access does not include partners.</p>
      </section>
    );
  }

  return (
    <section className={styles['page']}>
      <header className={styles['header']}>
        <div>
          <h1>{isFind ? 'Find partners' : isStaff ? 'Staff' : 'Partners'}</h1>
          <p>
            {isFind
              ? 'Meet trusted hosts and promoters.'
              : isStaff
                ? 'Manage access for your venue team.'
                : 'People who help run and promote your events.'}
          </p>
        </div>
        {tab === 'promoters' && view === 'my' && auth.canDo('canApprovePromoter') ? (
          <button
            type="button"
            className={styles['primaryAction']}
            disabled
            title="Promoter invitations require the partner mutation API."
          >
            <InviteIcon size={18} aria-hidden="true" /> Invite promoter unavailable
          </button>
        ) : null}
        {isStaff && auth.canDo('canManageStaff') ? (
          <button
            type="button"
            className={styles['primaryAction']}
            disabled
            title="Staff invitations require the team access mutation API."
          >
            <InviteIcon size={18} aria-hidden="true" /> Invite staff unavailable
          </button>
        ) : null}
      </header>

      <div className={styles['navRow']}>
        <nav className={styles['tabs']} aria-label="Partner groups">
          {TAB_LINKS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={tab === item.id ? styles['active'] : undefined}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {!isStaff ? (
          <nav className={styles['subnav']} aria-label="Partner views">
            <Link
              href={`/venue/partners?tab=${tab}`}
              className={view === 'my' ? styles['active'] : undefined}
            >
              My partners
            </Link>
            <Link
              href={`/venue/partners?tab=${tab}&view=find`}
              className={view === 'find' ? styles['active'] : undefined}
            >
              Find partners
            </Link>
          </nav>
        ) : null}
      </div>

      {isStaff ? (
        <StaffDirectory canManage={auth.canDo('canManageStaff')} />
      ) : isFind ? (
        <FindPartners kind={kind} />
      ) : (
        <MyPartners kind={kind} />
      )}
    </section>
  );
}

function MyPartners({ kind }: { readonly kind: VenuePartnerKind }) {
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
          placeholder={`Search ${kind === 'host' ? 'hosts' : 'promoters'}`}
        />
      </label>
      <div
        className={styles['partnerTable']}
        role="table"
        aria-label={`${kind === 'host' ? 'Host' : 'Promoter'} partners`}
      >
        <div className={styles['tableHead']} role="row">
          <span role="columnheader">{kind === 'host' ? 'Host' : 'Promoter'}</span>
          <span role="columnheader">{kind === 'host' ? 'Last event' : 'Recent event'}</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Action</span>
        </div>
        {filtered.map((item) => (
          <div className={styles['partnerRow']} role="row" key={item.id}>
            <div role="cell" className={styles['identity']}>
              <Avatar initials={item.initials} tone={item.tone} />
              <span>
                <strong>{item.name}</strong>
                <small>{kind === 'host' ? 'Host' : item.city}</small>
              </span>
            </div>
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
                Contact
              </button>
            </span>
          </div>
        ))}
      </div>
      <PartnerDrawer
        key={selected?.id ?? 'closed-partner'}
        partner={selected}
        triggerRef={triggerRef}
        onClose={() => {
          setSelected(null);
        }}
      />
    </>
  );
}

function FindPartners({ kind }: { readonly kind: VenuePartnerKind }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All cities');
  const [selected, setSelected] = useState<DiscoverablePartner | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const partners = getDiscoverablePartners(kind);
  const cities = ['All cities', ...new Set(partners.map((item) => item.city))];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    return partners.filter((item) => {
      const matchesQuery =
        !normalized || `${item.name} ${item.city}`.toLocaleLowerCase('en-IN').includes(normalized);
      return matchesQuery && (city === 'All cities' || item.city === city);
    });
  }, [city, partners, query]);

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
            placeholder="Search by name or city"
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
      </div>
      <div className={styles['cardGrid']}>
        {filtered.map((item) => (
          <article key={item.id} className={styles['partnerCard']}>
            <div className={styles['portrait']} data-tone={item.tone}>
              <span>{item.initials}</span>
              {item.verified ? (
                <em>
                  <CheckIcon size={13} aria-hidden="true" /> Verified
                </em>
              ) : null}
            </div>
            <h2>{item.name}</h2>
            <p>
              {kind === 'host' ? 'Host' : 'Promoter'} · {item.city}
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
      <PartnerDrawer
        key={selected?.id ?? 'closed-discoverable-partner'}
        partner={selected}
        triggerRef={triggerRef}
        onClose={() => {
          setSelected(null);
        }}
      />
    </>
  );
}

function StaffDirectory({ canManage }: { readonly canManage: boolean }) {
  const [selected, setSelected] = useState<VenueStaffMember | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <div className={styles['staffTable']} role="table" aria-label="Venue staff">
        <div className={styles['staffHead']} role="row">
          <span role="columnheader">Person</span>
          <span role="columnheader">Role</span>
          <span role="columnheader">Access</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Action</span>
        </div>
        {venueStaff.map((item) => (
          <div className={styles['staffRow']} role="row" key={item.id}>
            <div role="cell" className={styles['identity']}>
              <Avatar initials={item.initials} tone="blue" />
              <span>
                <strong>{item.name}</strong>
                <small>Contact details hidden</small>
              </span>
            </div>
            <span role="cell">{item.role}</span>
            <span role="cell">{item.access}</span>
            <span
              role="cell"
              className={item.status === 'Active' ? styles['statusDot'] : styles['pending']}
            >
              {item.status}
            </span>
            <span role="cell">
              {canManage ? (
                <button
                  type="button"
                  className={styles['secondaryAction']}
                  onClick={(event) => {
                    triggerRef.current = event.currentTarget;
                    setSelected(item);
                  }}
                >
                  Manage
                </button>
              ) : (
                <span className={styles['muted']}>Unavailable</span>
              )}
            </span>
          </div>
        ))}
      </div>
      <StaffDrawer
        member={selected}
        triggerRef={triggerRef}
        onClose={() => {
          setSelected(null);
        }}
      />
    </>
  );
}

function useDrawer(
  open: boolean,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  onClose: () => void,
) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        window.setTimeout(() => triggerRef.current?.focus(), 0);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const drawer = drawerRef.current;
    drawer?.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      drawer?.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open, triggerRef]);
  const closeAndRestore = () => {
    onClose();
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };
  return { drawerRef, closeRef, closeAndRestore };
}

function PartnerDrawer({
  partner,
  triggerRef,
  onClose,
}: {
  readonly partner: VenuePartner | null;
  readonly triggerRef: React.RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
}) {
  const [showEvents, setShowEvents] = useState(false);
  const { drawerRef, closeRef, closeAndRestore } = useDrawer(Boolean(partner), triggerRef, onClose);
  if (!partner) return null;
  const historyId = `${partner.id}-event-history`;
  const eventVerb = partner.kind === 'host' ? 'hosted' : 'promoted';
  return (
    <div className={styles['overlay']}>
      <button
        type="button"
        className={styles['dismiss']}
        aria-label="Close partner details"
        onClick={closeAndRestore}
      />
      <aside
        ref={drawerRef}
        className={styles['drawer']}
        role="dialog"
        aria-modal="true"
        aria-label={`${partner.name} partner details`}
      >
        <button
          ref={closeRef}
          type="button"
          className={styles['close']}
          aria-label="Close partner details"
          onClick={closeAndRestore}
        >
          <CloseIcon size={20} aria-hidden="true" />
        </button>
        <div className={styles['drawerPortrait']} data-tone={partner.tone}>
          {partner.initials}
        </div>
        <h2>{partner.name}</h2>
        <p>
          {partner.kind === 'host' ? 'Host' : 'Promoter'} · {partner.city}
        </p>
        <dl>
          <div>
            <dt>Contact</dt>
            <dd>Details hidden for privacy</dd>
          </div>
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
              <h3 id={`${partner.id}-credibility`}>Credibility</h3>
              <p>Profile performance snapshot.</p>
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
          </div>
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
        </section>
        <footer>
          <button type="button" disabled title="Partner messaging is not connected yet.">
            <SendIcon size={18} aria-hidden="true" /> Message unavailable
          </button>
          {partner.kind === 'host' ? (
            <button type="button" disabled title="Date requests require the partner mutation API.">
              <CalendarIcon size={18} aria-hidden="true" /> Request a date unavailable
            </button>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}

function StaffDrawer({
  member,
  triggerRef,
  onClose,
}: {
  readonly member: VenueStaffMember | null;
  readonly triggerRef: React.RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
}) {
  const { drawerRef, closeRef, closeAndRestore } = useDrawer(Boolean(member), triggerRef, onClose);
  if (!member) return null;
  return (
    <div className={styles['overlay']}>
      <button
        type="button"
        className={styles['dismiss']}
        aria-label="Close staff access"
        onClick={closeAndRestore}
      />
      <aside
        ref={drawerRef}
        className={styles['drawer']}
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name} staff access`}
      >
        <button
          ref={closeRef}
          type="button"
          className={styles['close']}
          aria-label="Close staff access"
          onClick={closeAndRestore}
        >
          <CloseIcon size={20} aria-hidden="true" />
        </button>
        <Avatar initials={member.initials} tone="blue" large />
        <h2>{member.name}</h2>
        <p>{member.role} · Contact details hidden</p>
        <section className={styles['permissions']}>
          <h3>Permissions</h3>
          {member.permissions.map((permission) => (
            <div key={permission}>
              <span>{permission}</span>
              <CheckIcon size={18} aria-label="Enabled" />
            </div>
          ))}
        </section>
        <button
          type="button"
          className={styles['dangerAction']}
          disabled
          title="Permission changes require the team access mutation API."
        >
          Access changes unavailable
        </button>
      </aside>
    </div>
  );
}

function Avatar({
  initials,
  tone,
  large = false,
}: {
  readonly initials: string;
  readonly tone: VenuePartner['tone'];
  readonly large?: boolean;
}) {
  return (
    <span
      className={[styles['avatar'], large ? styles['avatarLarge'] : null].filter(Boolean).join(' ')}
      data-tone={tone}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
