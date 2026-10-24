import Link from 'next/link';
import { useState } from 'react';

import { EmptyDateIcon, LocationIcon, LockedIcon, TimeIcon } from '@c1rcle/icons';

import styles from './calendar.module.css';
import { TimeSlotSelector } from './TimeSlotSelector';

import type {
  AvailabilitySlot,
  CalendarBlock,
  CalendarDay,
  CalendarEvent,
} from '@/data/partner-data-source';

export function CalendarDayDetails({
  day,
  block,
  accent,
  mode,
  eventHref,
  selectedSlotId,
  onSlotSelect,
  onRequestSlot,
  onUnblock,
  onPublishAvailability,
  createHref,
}: {
  readonly day: CalendarDay;
  readonly block?: CalendarBlock | undefined;
  readonly accent: 'orange' | 'lavender';
  readonly mode: 'venue' | 'host';
  readonly eventHref?: ((event: CalendarEvent) => string | undefined) | undefined;
  readonly selectedSlotId?: string | undefined;
  readonly onSlotSelect?: ((slot: AvailabilitySlot) => void) | undefined;
  readonly onRequestSlot?: (() => Promise<void>) | undefined;
  readonly onUnblock?: (() => Promise<void>) | undefined;
  readonly onPublishAvailability?: (() => void) | undefined;
  readonly createHref?: string | undefined;
}) {
  const isBlocked = day.state === 'blocked';
  const hasEvents = day.events.length > 0;
  const host = mode === 'host';
  return (
    <aside
      className={[styles['dayDetails'], accent === 'lavender' ? styles['dayDetailsLavender'] : '']
        .filter(Boolean)
        .join(' ')}
      aria-labelledby="selected-day-title"
    >
      <div className={styles['selectedDayHeading']}>
        <span>{formatWeekday(day.date)}</span>
        <h2 id="selected-day-title">{formatDate(day.date)}</h2>
      </div>
      {hasEvents ? (
        <div className={styles['eventDetailsList']}>
          {day.events.map((event) => (
            <EventDetail event={event} href={eventHref?.(event)} key={event.id} />
          ))}
        </div>
      ) : isBlocked ? (
        <BlockedDetail block={block} onUnblock={onUnblock} />
      ) : host ? (
        day.state === 'available' ? (
          <AvailableDetail
            day={day}
            selectedSlotId={selectedSlotId}
            onSlotSelect={onSlotSelect}
            onRequestSlot={onRequestSlot}
          />
        ) : (
          <UnavailableDetail />
        )
      ) : day.state === 'pending' ? (
        <ReservationDetail title="Host request pending" detail="A Host has requested this time. It is not available for another offer." />
      ) : day.state === 'confirmed' ? (
        <ReservationDetail title="Reserved" detail="This time is reserved. Review the linked event or slot request." />
      ) : (
        <OpenDetail
          createHref={createHref}
          canPublish={day.state === 'unavailable' && day.slots.length === 0}
          onPublishAvailability={onPublishAvailability}
        />
      )}
    </aside>
  );
}

function EventDetail({
  event,
  href,
}: {
  readonly event: CalendarEvent;
  readonly href?: string | undefined;
}) {
  const stateClass = {
    confirmed: styles['eventStateConfirmed'],
    pending: styles['eventStatePending'],
    blocked: styles['eventStateBlocked'],
  }[event.status];
  const content = (
    <>
      <span className={[styles['eventState'], stateClass].join(' ')}>{event.status}</span>
      <strong>{event.name}</strong>
      <span className={styles['eventDetailMeta']}>
        <TimeIcon size={13} aria-hidden="true" />
        {event.time}
      </span>
      <span className={styles['eventDetailMeta']}>
        <LocationIcon size={13} aria-hidden="true" />
        {event.venue}
      </span>
    </>
  );
  return href ? (
    <Link className={styles['eventDetailCard']} href={href}>
      {content}
    </Link>
  ) : (
    <article className={styles['eventDetailCard']}>{content}</article>
  );
}

function BlockedDetail({
  block,
  onUnblock,
}: {
  readonly block?: CalendarBlock | undefined;
  readonly onUnblock?: (() => Promise<void>) | undefined;
}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const unblock = async () => {
    if (!onUnblock || pending) return;
    setPending(true);
    setFailed(false);
    try {
      await onUnblock();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles['dayEmpty']}>
      <span className={styles['emptyIconBlocked']}>
        <LockedIcon size={22} aria-hidden="true" />
      </span>
      <strong>Blocked</strong>
      <p>
        {block
          ? `${block.reason} · ${formatTime(block.from)} – ${formatTime(block.to)}`
          : 'This date is unavailable.'}
      </p>
      <button type="button" disabled={!onUnblock || pending} onClick={() => void unblock()}>
        {pending ? 'Unblocking…' : 'Unblock date'}
      </button>
      {failed ? <p role="alert">Unable to unblock this date. Please try again.</p> : null}
    </div>
  );
}

function OpenDetail({
  createHref,
  canPublish,
  onPublishAvailability,
}: {
  readonly createHref?: string | undefined;
  readonly canPublish: boolean;
  readonly onPublishAvailability?: (() => void) | undefined;
}) {
  return (
    <div className={styles['dayEmpty']}>
      <span className={styles['emptyIcon']}>
        <EmptyDateIcon size={22} aria-hidden="true" />
      </span>
      <strong>Nothing booked</strong>
      <p>This date is open. Create an event to fill the slot.</p>
      {createHref ? (
        <Link className={styles['emptyAction']} href={createHref}>
          Create event
        </Link>
      ) : null}
      {canPublish && onPublishAvailability ? (
        <button className={styles['emptyAction']} type="button" onClick={onPublishAvailability}>
          Open this time for Host requests
        </button>
      ) : null}
    </div>
  );
}

function ReservationDetail({ title, detail }: { readonly title: string; readonly detail: string }) {
  return (
    <div className={styles['dayEmpty']}>
      <span className={styles['emptyIconBlocked']}><LockedIcon size={22} aria-hidden="true" /></span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function AvailableDetail({
  day,
  selectedSlotId,
  onSlotSelect,
  onRequestSlot,
}: {
  readonly day: CalendarDay;
  readonly selectedSlotId?: string | undefined;
  readonly onSlotSelect?: ((slot: AvailabilitySlot) => void) | undefined;
  readonly onRequestSlot?: (() => Promise<void>) | undefined;
}) {
  const [requestPending, setRequestPending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const submitRequest = async () => {
    if (!onRequestSlot || requestPending) return;
    setRequestPending(true);
    setRequestError(null);
    try {
      await onRequestSlot();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to request this slot.');
    } finally {
      setRequestPending(false);
    }
  };
  return (
    <div className={styles['hostAvailable']}>
      <span className={styles['emptyIcon']}>
        <EmptyDateIcon size={22} aria-hidden="true" />
      </span>
      <strong>Open for requests</strong>
      <p>This date is available at the selected venue.</p>
      {onSlotSelect ? (
        <TimeSlotSelector
          slots={day.slots}
          selectedSlotId={selectedSlotId}
          onSelect={onSlotSelect}
        />
      ) : null}
      {selectedSlotId && onRequestSlot ? (
        <button
          className={styles['emptyAction']}
          type="button"
          disabled={requestPending}
          onClick={() => void submitRequest()}
        >
          {requestPending ? 'Sending request…' : 'Request this slot'}
        </button>
      ) : null}
      {requestError ? <p role="alert">{requestError}</p> : null}
    </div>
  );
}

function UnavailableDetail() {
  return (
    <div className={styles['dayEmpty']}>
      <span className={styles['emptyIconBlocked']}>
        <LockedIcon size={22} aria-hidden="true" />
      </span>
      <strong>Unavailable</strong>
      <p>No open time slots are available for this date.</p>
    </div>
  );
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
const formatWeekday = (value: string) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`),
  );
const formatTime = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  const period = (hours ?? 0) >= 12 ? 'PM' : 'AM';
  const hour = (hours ?? 0) % 12 || 12;
  return `${String(hour)}:${String(minutes ?? 0).padStart(2, '0')} ${period}`;
};
