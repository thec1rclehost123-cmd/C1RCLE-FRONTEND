'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  BackIcon,
  CalendarIcon,
  CheckIcon,
  DisconnectIcon,
  IncidentIcon,
  InviteIcon,
  NoteIcon,
  ScanIcon,
  SearchIcon,
  TimeIcon,
  WarningIcon,
} from '@c1rcle/icons';

import { EventPoster } from '@/components/partner-v3/events/EventPoster';
import { EventStatusBadge } from '@/components/partner-v3/events/EventStatusBadge';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './door.module.css';

import type { DoorEventData, DoorGuestFilter, DoorModeData } from '@/data/partner-data-source';

const guestFilters: readonly { readonly value: DoorGuestFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'online', label: 'Online' },
  { value: 'walk-in', label: 'Walk-ins' },
  { value: 'checked-in', label: 'Checked In' },
];

const avatarStyles = [
  styles['avatar0'],
  styles['avatar1'],
  styles['avatar2'],
  styles['avatar3'],
] as const;

export function PartnerDoorModeScreen({ data }: { readonly data: DoorModeData }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedEvent = searchParams.get('event');
  const search = searchParams.get('search') ?? '';
  const filter = parseFilter(searchParams.get('filter'));
  const event = requestedEvent
    ? data.events.find((candidate) => candidate.event.id === requestedEvent)
    : data.events[0];

  const updateQuery = (changes: Readonly<Record<string, string | undefined>>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <PageContainer>
      <div
        className={[styles['doorPage'], data.accent === 'lavender' ? styles['doorHost'] : '']
          .filter(Boolean)
          .join(' ')}
        data-role={data.role}
      >
        <DoorHeader
          data={data}
          event={event}
          onEventChange={(eventId) => {
            updateQuery({ event: eventId });
          }}
          onBack={() => {
            router.push(`/partner/${data.role}/overview`);
          }}
        />
        {event ? (
          <DoorWorkspace
            data={event}
            filter={filter}
            search={search}
            onSearchChange={(value) => {
              updateQuery({ search: value || undefined });
            }}
            onFilterChange={(value) => {
              updateQuery({ filter: value === 'all' ? undefined : value });
            }}
          />
        ) : (
          <NoActiveEvent
            onReset={() => {
              updateQuery({ event: undefined, search: undefined, filter: undefined });
            }}
          />
        )}
      </div>
    </PageContainer>
  );
}

function DoorHeader({
  data,
  event,
  onEventChange,
  onBack,
}: {
  readonly data: DoorModeData;
  readonly event: DoorEventData | undefined;
  readonly onEventChange: (eventId: string) => void;
  readonly onBack: () => void;
}) {
  return (
    <header className={styles['doorHeader']}>
      <div className={styles['doorHeaderIdentity']}>
        <button
          className={styles['backButton']}
          aria-label="Back to overview"
          type="button"
          onClick={onBack}
        >
          <BackIcon size={18} aria-hidden="true" />
        </button>
        {event ? (
          <EventPoster
            className={styles['doorHeaderPoster']}
            artwork={event.event.artwork}
            sizes="44px"
          />
        ) : null}
        <div>
          <div className={styles['doorTitle']}>
            <span className={styles['liveDot']} /> <h1>Door Mode</h1>
          </div>
          {event ? (
            <div className={styles['doorSubtitle']}>
              <span>
                {event.event.name} · {event.event.venue}
              </span>
              <span className={styles['doorMeta']}>
                <span>
                  <CalendarIcon size={13} aria-hidden="true" />
                  {event.event.dateLabel}
                </span>
                <span>
                  <TimeIcon size={13} aria-hidden="true" />
                  {event.event.timeLabel}
                </span>
              </span>
              <EventStatusBadge status={event.event.status} />
            </div>
          ) : (
            <p className={styles['doorSubtitle']}>Choose an event to continue.</p>
          )}
        </div>
      </div>
      <div className={styles['doorHeaderActions']}>
        {data.events.length > 1 ? (
          <label className={styles['eventSelect']}>
            <span>Active event</span>
            <select
              aria-label="Active event"
              value={event?.event.id ?? ''}
              onChange={(input) => {
                onEventChange(input.target.value);
              }}
            >
              <option value="">Choose event</option>
              {data.events.map((item) => (
                <option key={item.event.id} value={item.event.id}>
                  {item.event.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          className={styles['headerButton']}
          disabled
          title="Scanning is unavailable in fixture mode"
          type="button"
        >
          <ScanIcon size={15} aria-hidden="true" />
          Quick scan
        </button>
        <button
          className={styles['headerButton']}
          disabled
          title="Issue logging is unavailable in fixture mode"
          type="button"
        >
          <WarningIcon size={15} aria-hidden="true" />
          Issues <span className={styles['issueCount']}>{data.issueCount}</span>
        </button>
        <button
          className={styles['disconnectButton']}
          disabled
          title="Door connection changes are unavailable in fixture mode"
          type="button"
        >
          <DisconnectIcon size={15} aria-hidden="true" />
          Disconnect
        </button>
      </div>
    </header>
  );
}

function DoorWorkspace({
  data,
  filter,
  search,
  onSearchChange,
  onFilterChange,
}: {
  readonly data: DoorEventData;
  readonly filter: DoorGuestFilter;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly onFilterChange: (value: DoorGuestFilter) => void;
}) {
  return (
    <div className={styles['doorGrid']}>
      <div className={styles['doorColumn']}>
        <HeadcountCard data={data} />
        <CheckInList
          data={data}
          filter={filter}
          search={search}
          onSearchChange={onSearchChange}
          onFilterChange={onFilterChange}
        />
      </div>
      <div className={styles['doorColumn']}>
        <WalkInCard />
        <ActivityCard activity={data.activity} />
      </div>
    </div>
  );
}

function HeadcountCard({ data }: { readonly data: DoorEventData }) {
  const percent = Math.round((data.insideNow / data.capacity) * 100);
  return (
    <section className={styles['headcountCard']} aria-labelledby="headcount-title">
      <div className={styles['headcountGlow']} aria-hidden="true" />
      <div className={styles['headcountContent']}>
        <div className={styles['sectionEyebrow']}>
          <span id="headcount-title">How full we are</span>
          <span className={styles['liveBadge']}>
            <i />
            Live
          </span>
        </div>
        <div className={styles['headcountValue']}>
          <strong>{data.insideNow}</strong>
          <span>of {data.capacity} inside</span>
        </div>
        <div className={styles['capacityTrack']}>
          <span className={capacityFillClass(percent)} />
        </div>
        <p>
          {percent}% full · {data.expectedCount} guests still expected · {data.walkInCount} walk-ins
          tonight
        </p>
      </div>
    </section>
  );
}

function CheckInList({
  data,
  filter,
  search,
  onSearchChange,
  onFilterChange,
}: {
  readonly data: DoorEventData;
  readonly filter: DoorGuestFilter;
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly onFilterChange: (value: DoorGuestFilter) => void;
}) {
  const guests = useMemo(
    () =>
      data.guests.filter((guest) => {
        const query = search.trim().toLocaleLowerCase();
        const matchesSearch =
          !query || `${guest.name} ${guest.tier}`.toLocaleLowerCase().includes(query);
        const matchesFilter =
          filter === 'all' ||
          (filter === 'online' && guest.origin === 'Online') ||
          (filter === 'walk-in' && guest.origin === 'Walk-in') ||
          (filter === 'checked-in' && guest.arrival === 'Checked in');
        return matchesSearch && matchesFilter;
      }),
    [data.guests, filter, search],
  );

  return (
    <section className={styles['listCard']} aria-labelledby="check-in-title">
      <h2 id="check-in-title">Check-in list</h2>
      <label className={styles['doorSearch']}>
        <SearchIcon size={16} aria-hidden="true" />
        <span className={styles['srOnly']}>Search guests</span>
        <input
          key={search}
          type="search"
          defaultValue={search}
          onChange={(input) => {
            onSearchChange(input.target.value);
          }}
          placeholder="Search name or scan ticket to check in"
        />
      </label>
      <nav className={styles['guestFilters']} aria-label="Door guest filters">
        {guestFilters.map((item) => (
          <button
            key={item.value}
            aria-pressed={filter === item.value}
            type="button"
            onClick={() => {
              onFilterChange(item.value);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className={styles['guestList']}>
        {guests.length ? (
          guests.map((guest, index) => (
            <div className={styles['guestRow']} key={guest.id}>
              <span
                className={[styles['guestAvatar'], avatarStyles[index % avatarStyles.length]].join(
                  ' ',
                )}
              >
                {guest.initials}
              </span>
              <span className={styles['guestIdentity']}>
                <strong>{guest.name}</strong>
                <small>{guest.tier}</small>
              </span>
              <button
                className={
                  guest.arrival === 'Checked in'
                    ? styles['checkedInButton']
                    : styles['checkInButton']
                }
                disabled
                title="Check-in is unavailable in fixture mode"
                type="button"
              >
                {guest.arrival === 'Checked in' ? (
                  <>
                    <CheckIcon size={13} aria-hidden="true" />
                    Checked in
                  </>
                ) : (
                  'Check in'
                )}
              </button>
            </div>
          ))
        ) : (
          <p className={styles['emptyCopy']}>No guests match these filters.</p>
        )}
      </div>
    </section>
  );
}

function WalkInCard() {
  const [payment, setPayment] = useState('Cash');
  return (
    <section className={styles['formCard']} aria-labelledby="walk-in-title">
      <div className={styles['cardTitle']}>
        <span className={styles['titleIcon']}>
          <InviteIcon size={17} aria-hidden="true" />
        </span>
        <h2 id="walk-in-title">Add a walk-in</h2>
      </div>
      <div className={styles['walkInFields']}>
        <input aria-label="Guest name" placeholder="Guest name" />
        <input aria-label="Phone number" placeholder="Phone number" />
        <div className={styles['paymentOptions']} aria-label="Payment type">
          {['Cash', 'Card', 'UPI'].map((option) => (
            <button
              key={option}
              aria-pressed={payment === option}
              type="button"
              onClick={() => {
                setPayment(option);
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <input
          aria-label="Amount collected"
          inputMode="decimal"
          placeholder="Amount collected (₹)"
        />
        <button
          className={styles['walkInSubmit']}
          disabled
          title="Walk-in creation is unavailable in fixture mode"
          type="button"
        >
          <CheckIcon size={16} aria-hidden="true" />
          Check in walk-in
        </button>
        <p className={styles['unavailableNote']}>
          Walk-in creation is read-only until the door mutation contract is connected.
        </p>
      </div>
    </section>
  );
}

function ActivityCard({ activity }: { readonly activity: DoorEventData['activity'] }) {
  return (
    <section className={styles['activityCard']} aria-labelledby="activity-title">
      <h2 id="activity-title">Tonight&apos;s log</h2>
      <div className={styles['activityActions']}>
        <button disabled title="Incident logging is unavailable in fixture mode" type="button">
          <IncidentIcon size={15} aria-hidden="true" />
          Incident
        </button>
        <button disabled title="Note logging is unavailable in fixture mode" type="button">
          <NoteIcon size={15} aria-hidden="true" />
          Note
        </button>
      </div>
      <div className={styles['activityList']}>
        {activity.length ? (
          activity.map((item) => (
            <div className={styles['activityRow']} key={item.id}>
              <span
                className={item.kind === 'incident' ? styles['incidentIcon'] : styles['noteIcon']}
              >
                {item.kind === 'incident' ? (
                  <IncidentIcon size={14} aria-hidden="true" />
                ) : (
                  <NoteIcon size={14} aria-hidden="true" />
                )}
              </span>
              <span>
                <strong>{item.text}</strong>
                <small>{item.time}</small>
              </span>
            </div>
          ))
        ) : (
          <p className={styles['emptyCopy']}>No activity recorded tonight.</p>
        )}
      </div>
    </section>
  );
}

function NoActiveEvent({ onReset }: { readonly onReset: () => void }) {
  return (
    <section className={styles['noEvent']}>
      <span className={styles['noEventMark']}>!</span>
      <h2>No active event selected</h2>
      <p>Choose an event from the selector to open its read-only Door Mode workspace.</p>
      <button type="button" onClick={onReset}>
        Show available events
      </button>
    </section>
  );
}

function parseFilter(value: string | null): DoorGuestFilter {
  return guestFilters.some((item) => item.value === value) ? (value as DoorGuestFilter) : 'all';
}

function capacityFillClass(percent: number) {
  if (percent >= 100) return styles['capacityFill100'];
  if (percent >= 75) return styles['capacityFill75'];
  if (percent >= 50) return styles['capacityFill50'];
  if (percent >= 25) return styles['capacityFill25'];
  return styles['capacityFill0'];
}
