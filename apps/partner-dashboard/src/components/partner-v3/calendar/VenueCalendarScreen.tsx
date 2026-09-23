'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { LockedIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { blockVenueDate, getVenueCalendarSlots, unblockVenueDate } from '@/lib/api/calendar-api';
import { listOrgEvents } from '@/lib/api/events-api';
import { fetchOwnVenues } from '@/lib/api/partner-discover';
import { getActiveOrgId } from '@/lib/org/active-org';

import { BlockDateDialog } from './BlockDateDialog';
import styles from './calendar.module.css';
import { CalendarDayDetails } from './CalendarDayDetails';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';

import type { CalendarBlock, CalendarDay, CalendarDayState, CalendarEvent, CalendarEventStatus, CalendarMonth } from '@/data/partner-data-source';
import type { BlockVenueDateInput, VenueSlotDto } from '@/lib/api/calendar-api';
import type { EventDto } from '@/lib/api/events-api';

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonthKey(key: string, delta: -1 | 1): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1 + delta, 1)).toISOString().slice(0, 7);
}

function monthLabelFor(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1)));
}

/**
 * Builds a real month grid for any YYYY-MM key — no fixture months. Days
 * start empty (`available`); live slots and events fill them in after fetch.
 */
function buildMonthGrid(key: string): CalendarMonth {
  const [year, month] = key.split('-').map(Number);
  const annual = year ?? 1970;
  const monthly = month ?? 1;
  const daysInMonth = new Date(Date.UTC(annual, monthly, 0)).getUTCDate();
  const firstDayOffset = new Date(Date.UTC(annual, monthly - 1, 1)).getUTCDay();
  const days: CalendarDay[] = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      date: `${key}-${String(day).padStart(2, '0')}`,
      day,
      state: 'available',
      events: [],
      slots: [],
    };
  });
  return { key, label: monthLabelFor(key), firstDayOffset, daysInMonth, days };
}

/**
 * Backend event statuses have no 1:1 calendar equivalent. Live, bookable
 * states map to calendar badges; draft/archived/cancelled events are never
 * shown as calendar entries.
 */
function toCalendarStatus(status: EventDto['status']): CalendarEventStatus | null {
  switch (status) {
    case 'published':
    case 'started':
    case 'ended':
      return 'confirmed';
    case 'review':
    case 'scheduled':
    case 'sales_paused':
      return 'pending';
    case 'draft':
    case 'archived':
    case 'cancelled':
      return null;
  }
}

function formatHour(hhmm: string): string {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const period = (hours ?? 0) >= 12 ? 'PM' : 'AM';
  const hour = (hours ?? 0) % 12 || 12;
  return `${String(hour)}:${String(minutes ?? 0).padStart(2, '0')} ${period}`;
}

function toCalendarEvent(event: EventDto, venueName: string): CalendarEvent | null {
  const status = toCalendarStatus(event.status);
  if (!status) return null;
  return {
    id: event.id,
    date: event.startAt.slice(0, 10),
    name: event.title,
    time: event.endAt
      ? `${formatHour(event.startAt.slice(11, 16))} – ${formatHour(event.endAt.slice(11, 16))}`
      : formatHour(event.startAt.slice(11, 16)),
    status,
    venue: venueName,
    href: `/partner/venue/events/${event.id}`,
  };
}

function toCalendarBlock(slot: VenueSlotDto): CalendarBlock {
  return {
    id: slot.id,
    date: slot.startTime.slice(0, 10),
    endDate: slot.endTime.slice(0, 10),
    reason: slot.label,
    from: slot.startTime.slice(11, 16),
    to: slot.endTime.slice(11, 16),
  };
}

/** Inclusive end date of a block (single-day blocks end on `date`). */
function blockEndDate(block: CalendarBlock): string {
  return block.endDate ?? block.date;
}

/** True when the block's window touches `date` (overnight blocks cover two days). */
function blockCoversDate(block: CalendarBlock, date: string): boolean {
  return block.date <= date && date <= blockEndDate(block);
}

/** Full ISO range of a block for timeline comparisons. */
function blockRange(block: CalendarBlock): readonly [string, string] {
  return [`${block.date}T${block.from}:00.000Z`, `${blockEndDate(block)}T${block.to}:00.000Z`];
}

export function VenueCalendarScreen({
  initialMonth,
  initialDate,
  initialDialog,
}: {
  readonly initialMonth?: string;
  readonly initialDate?: string;
  readonly initialDialog?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Live data only — nothing on this screen comes from fixtures. An invalid
  // or missing month falls back to the current real month, never to a demo.
  const monthKey = MONTH_KEY_PATTERN.test(initialMonth ?? '') ? (initialMonth ?? '') : currentMonthKey();

  /** The org's first own venue — the calendar's source of truth. */
  const [venueId, setVenueId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<readonly CalendarBlock[]>([]);
  const [events, setEvents] = useState<readonly CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // No active org means no backend to read from. Initialised lazily (same
  // value on server and first client render, so no hydration mismatch) and
  // never synced — an org switch does a full-page reload.
  const [orgMissing] = useState(() => getActiveOrgId() === null);
  const [venueMissing, setVenueMissing] = useState(false);

  // ── Load venue, blocked slots, and events — all from the backend ──────────
  useEffect(() => {
    if (orgMissing) return;
    const [annual, monthly] = monthKey.split('-').map(Number);
    const lastDay = new Date(Date.UTC(annual ?? 1970, monthly ?? 1, 0)).getUTCDate();
    const from = `${monthKey}-01T00:00:00.000Z`;
    const to = `${monthKey}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;
    let cancelled = false;
    fetchOwnVenues()
      .then((venues) => {
        if (cancelled) return;
        const venue = venues[0];
        if (!venue) {
          setVenueId(null);
          setVenueMissing(true);
          setBlocks([]);
          setEvents([]);
          setLoaded(true);
          return;
        }
        setVenueId(venue.id);
        setVenueMissing(false);
        return Promise.allSettled([
          getVenueCalendarSlots(venue.id, from, to),
          listOrgEvents({ limit: 100 }),
        ]).then(([slotsResult, eventsResult]) => {
          if (cancelled) return;
          if (slotsResult.status === 'fulfilled') {
            setBlocks(
              slotsResult.value.filter((slot) => slot.status === 'blocked').map(toCalendarBlock),
            );
          }
          if (eventsResult.status === 'fulfilled') {
            const live: CalendarEvent[] = [];
            for (const event of eventsResult.value) {
              if (event.venueId !== venue.id || !event.startAt.startsWith(monthKey)) continue;
              const entry = toCalendarEvent(event, venue.name);
              if (entry) live.push(entry);
            }
            setEvents(live);
          }
          const failed =
            slotsResult.status === 'rejected' || eventsResult.status === 'rejected';
          setLoadError(
            failed ? 'Could not load the calendar from the server. Please try again.' : null,
          );
          setLoaded(true);
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('Could not load the calendar from the server. Please try again.');
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [monthKey, orgMissing]);

  // ── Mutations always round-trip through the backend ───────────────────────
  const handleBlock = useCallback(
    async (input: BlockVenueDateInput) => {
      if (!venueId) throw new Error('No venue selected — cannot block a date.');
      // Instant timeline feedback before the POST: the backend enforces the
      // same single-track rule and would 400 an overlap.
      const clash = blocks.find((item) => {
        const [start, end] = blockRange(item);
        return start < input.endTime && input.startTime < end;
      });
      if (clash) {
        const [clashStart, clashEnd] = blockRange(clash);
        throw new Error(
          `This time overlaps the existing block "${clash.reason}" (${formatHour(clashStart.slice(11, 16))} – ${formatHour(clashEnd.slice(11, 16))}).`,
        );
      }
      const created = await blockVenueDate(venueId, input);
      const next = toCalendarBlock(created);
      // A day holds as many non-overlapping blocks as it needs — dedupe by
      // id only, never by date.
      setBlocks((prev) => [...prev.filter((item) => item.id !== next.id), next]);
      router.refresh();
    },
    [venueId, blocks, router],
  );

  const month = useMemo(() => {
    const grid = buildMonthGrid(monthKey);
    const eventsByDate = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = eventsByDate.get(event.date) ?? [];
      list.push(event);
      eventsByDate.set(event.date, list);
    }
    return {
      ...grid,
      days: grid.days.map((day) => {
        const dayEvents = eventsByDate.get(day.date) ?? [];
        const state: CalendarDayState = blocks.some((item) => blockCoversDate(item, day.date))
          ? 'blocked'
          : dayEvents.some((event) => event.status === 'pending')
            ? 'pending'
            : dayEvents.length > 0
              ? 'confirmed'
              : 'available';
        return { ...day, state, events: dayEvents };
      }),
    };
  }, [monthKey, blocks, events]);

  const selectedDate = month.days.some((day) => day.date === initialDate)
    ? (initialDate ?? '')
    : month.days.some((day) => day.date === new Date().toISOString().slice(0, 10))
      ? new Date().toISOString().slice(0, 10)
      : month.days.find((day) => day.day === 16)?.date ?? month.days[0]?.date ?? '';
  const selectedDay = month.days.find((day) => day.date === selectedDate) ?? month.days[0];
  const dayBlocks = selectedDay ? blocks.filter((item) => blockCoversDate(item, selectedDay.date)) : [];

  const handleUnblock = useCallback(async (blockId: string) => {
    const current = blocks.find((item) => item.id === blockId);
    if (!current || !venueId) return;
    try {
      await unblockVenueDate(venueId, current.id);
    } catch (error: unknown) {
      // Already gone server-side (removed elsewhere) — still clear it locally.
      const isMissing =
        (isApiClientError(error) && (error.status === 404 || error.code === 'not_found')) ||
        (error instanceof Error && /not found/i.test(error.message));
      if (!isMissing) throw error;
    }
    setBlocks((prev) => prev.filter((item) => item.id !== current.id));
    router.refresh();
  }, [venueId, blocks, router]);
  // ─────────────────────────────────────────────────────────────────────────

  if (!selectedDay) return null;

  const update = (values: { readonly month?: string; readonly date?: string; readonly dialog?: boolean }) => {
    const params = new URLSearchParams();
    const nextMonth = values.month ?? month.key;
    const nextDate = values.date ?? selectedDay.date;
    params.set('month', nextMonth);
    params.set('date', nextDate);
    if (values.dialog) params.set('dialog', 'block');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const moveMonth = (direction: -1 | 1) => {
    const nextKey = shiftMonthKey(month.key, direction);
    const nextGrid = buildMonthGrid(nextKey);
    const nextDate = nextGrid.days.find((day) => day.day === 16)?.date ?? nextGrid.days[0]?.date;
    if (nextDate) update({ month: nextKey, date: nextDate });
  };

  return (
    <div className={[styles['page'], styles['venueTheme']].join(' ')}>
      <div className={styles['topRow']}>
        <Link href="/partner/venue/overview">← Back to Overview</Link>
        <nav aria-label="Calendar links">
          <Link href="/partner/venue/events">Events</Link>
          <Link href="/partner/venue/slot-requests">Slot Requests</Link>
        </nav>
      </div>
      <CalendarHeader
        title="All events this month"
        description="Your venue schedule, availability, and operational blocks."
        monthLabel={month.label.toUpperCase()}
        onPrevious={() => { moveMonth(-1); }}
        onNext={() => { moveMonth(1); }}
        action={
          <Button type="button" variant="secondary" onClick={() => { update({ dialog: true }); }}>
            <LockedIcon size={14} aria-hidden="true" />Block date
          </Button>
        }
      />
      <div className={styles['calendarLayout']}>
        <section className={styles['calendarPanel']} aria-label="Venue booking calendar">
          <CalendarGrid
            month={month}
            selectedDate={selectedDay.date}
            onPick={(day) => { update({ date: day.date }); }}
          />
          <div className={styles['legend']}>
            <Legend color="confirmed" label="Confirmed" />
            <Legend color="pending" label="Pending" />
            <Legend color="blocked" label="Blocked" />
          </div>
          {!loaded && !orgMissing ? (
            <p className={styles['unavailableNote']} role="status">Loading your calendar…</p>
          ) : null}
          {orgMissing ? (
            <p className={styles['unavailableNote']} role="status">
              Select an organization to load your calendar.
            </p>
          ) : null}
          {venueMissing && !orgMissing ? (
            <p className={styles['unavailableNote']} role="status">
              No venue found for this organization yet.
            </p>
          ) : null}
          {loadError ? (
            <p className={styles['blockError']} role="alert">{loadError}</p>
          ) : null}
        </section>
        <CalendarDayDetails
          day={selectedDay}
          blocks={dayBlocks}
          accent="orange"
          mode="venue"
          eventHref={(event) => event.href}
          createHref={`/partner/venue/events/create?date=${selectedDay.date}`}
          {...(dayBlocks.length > 0 && venueId ? { onUnblock: handleUnblock } : {})}
        />
      </div>
      {initialDialog ? (
        <BlockDateDialog
          key={selectedDay.date}
          day={selectedDay.day}
          dateLabel={month.label}
          monthKey={month.key}
          selectedDate={selectedDay.date}
          onClose={() => { update({ dialog: false }); }}
          {...(venueId ? { onBlock: handleBlock } : {})}
        />
      ) : null}
    </div>
  );
}

function Legend({ color, label }: { readonly color: 'confirmed' | 'pending' | 'blocked' | 'available'; readonly label: string }) {
  const legendClass = {
    confirmed: styles['legendConfirmed'],
    pending: styles['legendPending'],
    blocked: styles['legendBlocked'],
    available: styles['legendAvailable'],
  }[color];
  return <span><i className={legendClass} />{label}</span>;
}
