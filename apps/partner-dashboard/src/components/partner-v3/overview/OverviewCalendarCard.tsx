'use client';

import Link from 'next/link';

import { ExpandIcon } from '@c1rcle/icons';

import { ErrorState } from '@/components/partner-v3/States';
import { useHostAvailability } from '@/lib/calendar/use-host-availability';
import { useVenueCalendar } from '@/lib/calendar/use-venue-calendar';
import { currentMonthKey } from '@/lib/calendar/venue-calendar-repository';

import styles from './overview.module.css';

import type { CalendarMonth, HostAvailabilityData, OverviewData } from '@/data/partner-data-source';

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const classNames = (...names: readonly (string | undefined | false)[]) =>
  names.filter(Boolean).join(' ');

export function OverviewCalendarCard({
  fallback,
  href,
  studio,
  organizationId,
}: {
  readonly fallback: OverviewData['calendar'];
  readonly href: string;
  readonly studio?: 'venue' | 'host';
  readonly organizationId?: string | null;
}) {
  const venueLive = studio === 'venue' && Boolean(organizationId);
  const hostLive = studio === 'host' && Boolean(organizationId);
  const venueState = useVenueCalendar({
    organizationId: organizationId ?? null,
    anchorMonth: currentMonthKey(),
    monthsAfter: 0,
    enabled: venueLive,
  });
  const hostState = useHostAvailability({
    organizationId: organizationId ?? null,
    anchorMonth: currentMonthKey(),
    monthsAfter: 0,
    enabled: hostLive,
  });
  const live = venueLive || hostLive;
  const error = venueLive ? venueState.error : hostState.error;
  const retry = venueLive ? venueState.retry : hostState.retry;

  const venueMonth = venueState.data?.calendar?.months[0];
  const hostCalendar = hostState.data
    ? fromHostAvailability(hostState.data, currentMonthKey())
    : null;
  const calendar = venueMonth ? fromLiveMonth(venueMonth) : (hostCalendar ?? fallback);

  return (
    <section
      className={classNames(styles['card'], styles['calendarCard'])}
      aria-labelledby="calendar-title"
    >
      <div className={styles['calendarHeader']}>
        <h2 id="calendar-title">{calendar.monthLabel}</h2>
        <Link href={href}>
          <span>See all events</span>
          <i>
            <ExpandIcon size={14} aria-hidden="true" />
          </i>
        </Link>
      </div>
      {live && error ? (
        <ErrorState title="Schedule unavailable" description={error} onRetry={retry} />
      ) : null}
      {!live || !error ? (
        <>
          <div className={styles['calendarWeekdays']} aria-hidden="true">
            {weekdays.map((day, index) => (
              <span key={`${day}-${String(index)}`}>{day}</span>
            ))}
          </div>
          <div className={styles['calendarGrid']}>
            {Array.from({ length: calendar.firstDayOffset }, (_, index) => (
              <span key={`empty-${String(index)}`} aria-hidden="true" />
            ))}
            {calendar.days.map((day) => {
              const eventLabel = day.eventCount
                ? `${String(day.eventCount)} ${day.eventCount > 1 ? 'events' : 'event'}`
                : '';
              const blockedLabel = day.isBlocked ? 'blocked' : '';
              const ariaLabel = [
                calendar.monthLabel,
                String(day.day),
                eventLabel,
                blockedLabel,
                day.isToday ? 'today' : '',
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <span
                  key={day.day}
                  className={classNames(
                    day.eventCount ? styles['eventDay'] : false,
                    day.isBlocked ? styles['blockedDay'] : false,
                    day.isToday ? styles['today'] : false,
                  )}
                  aria-label={ariaLabel}
                >
                  {day.day}
                </span>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}

function fromHostAvailability(
  availability: HostAvailabilityData,
  monthKey: string,
): OverviewData['calendar'] | null {
  const months = availability.venues.flatMap((item) =>
    item.months.filter((month) => month.key === monthKey),
  );
  const first = months[0];
  if (!first) return null;
  const today = new Date().toISOString().slice(0, 10);
  return {
    monthLabel: first.label,
    firstDayOffset: first.firstDayOffset,
    days: first.days.map((day) => {
      const eventCount = months.reduce(
        (count, month) =>
          count + (month.days.find((item) => item.date === day.date)?.events.length ?? 0),
        0,
      );
      return {
        day: day.day,
        ...(eventCount > 0 ? { eventCount } : {}),
        ...(day.date === today ? { isToday: true } : {}),
      };
    }),
  };
}

function fromLiveMonth(month: CalendarMonth): OverviewData['calendar'] {
  const today = new Date().toISOString().slice(0, 10);
  return {
    monthLabel: month.label,
    firstDayOffset: month.firstDayOffset,
    days: month.days.map((day) => ({
      day: day.day,
      ...(day.events.length > 0 || day.state === 'confirmed' || day.state === 'pending'
        ? { eventCount: Math.max(1, day.events.length) }
        : {}),
      ...(day.state === 'blocked' ? { isBlocked: true } : {}),
      ...(day.date === today ? { isToday: true } : {}),
    })),
  };
}
