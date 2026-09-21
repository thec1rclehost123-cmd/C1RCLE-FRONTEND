import Link from 'next/link';
import { useState } from 'react';

import { EmptyDateIcon, LocationIcon, LockedIcon, TimeIcon } from '@c1rcle/icons';

import styles from './calendar.module.css';
import { TimeSlotSelector } from './TimeSlotSelector';

import type { AvailabilitySlot, CalendarBlock, CalendarDay, CalendarEvent } from '@/data/partner-data-source';

export function CalendarDayDetails({
  day,
  blocks = [],
  accent,
  mode,
  eventHref,
  selectedSlotId,
  onSlotSelect,
  onUnblock,
  createHref,
}: {
  readonly day: CalendarDay;
  /** Every block covering this day — a day holds many non-overlapping blocks. */
  readonly blocks?: readonly CalendarBlock[] | undefined;
  readonly accent: 'orange' | 'lavender';
  readonly mode: 'venue' | 'host';
  readonly eventHref?: ((event: CalendarEvent) => string | undefined) | undefined;
  readonly selectedSlotId?: string | undefined;
  readonly onSlotSelect?: ((slot: AvailabilitySlot) => void) | undefined;
  /** When provided, each block card gets an active Unblock action for its own id. */
  readonly onUnblock?: ((blockId: string) => Promise<void>) | undefined;
  readonly createHref?: string | undefined;
}) {
  const isBlocked = day.state === 'blocked' || blocks.length > 0;
  const showList = day.events.length > 0 || isBlocked;
  const host = mode === 'host';
  return (
    <aside
      className={[styles['dayDetails'], accent === 'lavender' ? styles['dayDetailsLavender'] : ''].filter(Boolean).join(' ')}
      aria-labelledby="selected-day-title"
    >
      <div className={styles['selectedDayHeading']}>
        <span>{formatWeekday(day.date)}</span>
        <h2 id="selected-day-title">{formatDate(day.date)}</h2>
      </div>
      {showList ? (
        <div className={styles['eventDetailsList']}>
          {day.events.map((event) => <EventDetail event={event} href={eventHref?.(event)} key={event.id} />)}
          {blocks.map((item) => (
            <BlockEventCard
              block={item}
              date={day.date}
              onUnblock={onUnblock ? () => onUnblock(item.id) : undefined}
              key={item.id}
            />
          ))}
          {isBlocked && blocks.length === 0 ? <BlockEventCard date={day.date} /> : null}
        </div>
      ) : null}
      {!showList ? (
        host ? (
          <AvailableDetail day={day} selectedSlotId={selectedSlotId} onSlotSelect={onSlotSelect} createHref={createHref} />
        ) : (
          <OpenDetail createHref={createHref} />
        )
      ) : null}
    </aside>
  );
}

function EventDetail({ event, href }: { readonly event: CalendarEvent; readonly href?: string | undefined }) {
  const stateClass = {
    confirmed: styles['eventStateConfirmed'],
    pending: styles['eventStatePending'],
    blocked: styles['eventStateBlocked'],
  }[event.status];
  const content = (
    <>
      <span className={[styles['eventState'], stateClass].join(' ')}>{event.status}</span>
      <strong>{event.name}</strong>
      <span className={styles['eventDetailMeta']}><TimeIcon size={13} aria-hidden="true" />{event.time}</span>
      <span className={styles['eventDetailMeta']}><LocationIcon size={13} aria-hidden="true" />{event.venue}</span>
    </>
  );
  return href
    ? <Link className={styles['eventDetailCard']} href={href}>{content}</Link>
    : <article className={styles['eventDetailCard']}>{content}</article>;
}

/**
 * A blocked hold rendered like an event card in the day's details list —
 * status badge, reason, and time — with the Unblock action attached, so a
 * database-saved block is as visible (and removable) as any event.
 */
function BlockEventCard({
  block,
  date,
  onUnblock,
}: {
  readonly block?: CalendarBlock | undefined;
  readonly date: string;
  readonly onUnblock?: (() => Promise<void>) | undefined;
}) {
  const canUnblock = typeof onUnblock === 'function';
  const [unblocking, setUnblocking] = useState(false);
  const [unblockError, setUnblockError] = useState<string | null>(null);

  const disabled = !canUnblock || unblocking;

  // Overnight blocks run past midnight — surface the span so "11 PM – 2 AM"
  // never reads as a same-morning window.
  const endDate = block?.endDate ?? block?.date ?? date;
  const spanDays = block && endDate > block.date
    ? Math.round(
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${block.date}T00:00:00Z`)) / 86_400_000,
    )
    : 0;
  const overnight = spanDays > 0;

  async function handleUnblock() {
    if (!onUnblock || unblocking) return;
    setUnblocking(true);
    setUnblockError(null);
    try {
      await onUnblock();
    } catch (error: unknown) {
      setUnblockError(error instanceof Error ? error.message : 'Could not unblock this date. Please try again.');
    } finally {
      setUnblocking(false);
    }
  }

  return (
    <article className={styles['eventDetailCard']} aria-label={`Blocked on ${date}`}>
      <span className={[styles['eventState'], styles['eventStateBlocked']].join(' ')}>blocked</span>
      <strong>{block?.reason ?? 'Blocked'}</strong>
      <span className={styles['eventDetailMeta']}>
        <TimeIcon size={13} aria-hidden="true" />
        {block
          ? `${formatTime(block.from)} – ${formatTime(block.to)}${overnight ? ` (+${String(spanDays)} day${spanDays === 1 ? '' : 's'})` : ''}`
          : 'This date is unavailable.'}
      </span>
      <span className={styles['eventDetailMeta']}>
        <LockedIcon size={13} aria-hidden="true" />
        {block && overnight ? `${formatDate(block.date)} → ${formatDate(endDate)}` : formatDate(date)}
      </span>
      <button
        type="button"
        className={disabled ? styles['unblockActionDisabled'] : styles['unblockAction']}
        onClick={canUnblock ? () => { void handleUnblock(); } : undefined}
        disabled={disabled}
        aria-disabled={disabled}
        aria-busy={unblocking}
        title={
          unblocking
            ? 'Removing the block…'
            : canUnblock
              ? 'Remove the block for this date'
              : 'Unblocking is unavailable right now'
        }
      >
        {unblocking ? 'Unblocking…' : 'Unblock date'}
      </button>
      {unblockError ? (
        <p className={styles['blockError']} role="alert">{unblockError}</p>
      ) : null}
    </article>
  );
}

function OpenDetail({ createHref }: { readonly createHref?: string | undefined }) {
  return (
    <div className={styles['dayEmpty']}>
      <span className={styles['emptyIcon']}><EmptyDateIcon size={22} aria-hidden="true" /></span>
      <strong>Nothing booked</strong>
      <p>This date is open. Create an event to fill the slot.</p>
      {createHref ? <Link className={styles['emptyAction']} href={createHref}>Create event</Link> : null}
    </div>
  );
}

function AvailableDetail({
  day,
  selectedSlotId,
  onSlotSelect,
  createHref,
}: {
  readonly day: CalendarDay;
  readonly selectedSlotId?: string | undefined;
  readonly onSlotSelect?: ((slot: AvailabilitySlot) => void) | undefined;
  readonly createHref?: string | undefined;
}) {
  return (
    <div className={styles['hostAvailable']}>
      <span className={styles['emptyIcon']}><EmptyDateIcon size={22} aria-hidden="true" /></span>
      <strong>Open for requests</strong>
      <p>This date is available at the selected venue.</p>
      {onSlotSelect ? <TimeSlotSelector slots={day.slots} selectedSlotId={selectedSlotId} onSelect={onSlotSelect} /> : null}
      {selectedSlotId && createHref ? <Link className={styles['emptyAction']} href={createHref}>Continue to Create Event</Link> : null}
    </div>
  );
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`));

const formatWeekday = (value: string) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`));

const formatTime = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  const period = (hours ?? 0) >= 12 ? 'PM' : 'AM';
  const hour = (hours ?? 0) % 12 || 12;
  return `${String(hour)}:${String(minutes ?? 0).padStart(2, '0')} ${period}`;
};
