'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { LockedIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';

import { BlockDateDialog } from './BlockDateDialog';
import styles from './calendar.module.css';
import { CalendarDayDetails } from './CalendarDayDetails';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';

import type { VenueCalendarData } from '@/data/partner-data-source';
import type { CreateVenueBlockInput } from '@/lib/calendar/venue-calendar-repository';

export function VenueCalendarScreen({ data, initialMonth, initialDate, initialDialog, onBlockDate }: { readonly data: VenueCalendarData; readonly initialMonth?: string; readonly initialDate?: string; readonly initialDialog?: boolean; readonly onBlockDate?: (input: CreateVenueBlockInput) => Promise<void> }) {
  const router = useRouter();
  const pathname = usePathname();
  const month = data.months.find((item) => item.key === initialMonth) ?? data.months[0];
  const selectedDate = month?.days.some((day) => day.date === initialDate) ? initialDate ?? '' : defaultDateForMonth(month, data.dataStatus);
  if (!month) return null;
  const selectedDay = month.days.find((day) => day.date === selectedDate) ?? month.days[0];
  if (!selectedDay) return null;
  const block = data.blocks.find((item) => item.date === selectedDay.date);
  const update = (values: { readonly month?: string; readonly date?: string; readonly dialog?: boolean }) => { const params = new URLSearchParams(); const nextMonth = values.month ?? month.key; const nextDate = values.date ?? selectedDay.date; params.set('month', nextMonth); params.set('date', nextDate); if (values.dialog) params.set('dialog', 'block'); router.replace(`${pathname}?${params.toString()}`, { scroll: false }); };
  const moveMonth = (direction: -1 | 1) => { const index = data.months.findIndex((item) => item.key === month.key); const next = data.months[index + direction]; const nextDate = defaultDateForMonth(next, data.dataStatus); if (next && nextDate) update({ month: next.key, date: nextDate }); };
  return <div className={[styles['page'], styles['venueTheme']].join(' ')}><div className={styles['topRow']}><Link href="/partner/venue/overview">← Back to Overview</Link><nav aria-label="Calendar links"><Link href="/partner/venue/events">Events</Link><Link href="/partner/venue/slot-requests">Slot Requests</Link></nav></div><CalendarHeader title="All events this month" description="Your venue schedule, availability, and operational blocks." monthLabel={month.label.toUpperCase()} onPrevious={() => { moveMonth(-1); }} onNext={() => { moveMonth(1); }} action={<Button type="button" variant="secondary" onClick={() => { update({ dialog: true }); }}><LockedIcon size={14} aria-hidden="true" />Block date</Button>} /><div className={styles['calendarLayout']}><section className={styles['calendarPanel']} aria-label="Venue booking calendar"><CalendarGrid month={month} selectedDate={selectedDay.date} onPick={(day) => { update({ date: day.date }); }} /><div className={styles['legend']}><Legend color="confirmed" label="Confirmed" /><Legend color="pending" label="Pending" /><Legend color="blocked" label="Blocked" /></div></section><CalendarDayDetails day={selectedDay} block={block} accent="orange" mode="venue" eventHref={(event) => event.href} createHref={`/partner/venue/events/create?date=${selectedDay.date}`} /></div>{initialDialog ? <BlockDateDialog date={selectedDay.date} dateLabel={month.label} onClose={() => { update({ dialog: false }); }} {...(onBlockDate ? { onSubmit: onBlockDate } : {})} /> : null}</div>;
}

function Legend({ color, label }: { readonly color: 'confirmed' | 'pending' | 'blocked' | 'available'; readonly label: string }) { const legendClass = { confirmed: styles['legendConfirmed'], pending: styles['legendPending'], blocked: styles['legendBlocked'], available: styles['legendAvailable'] }[color]; return <span><i className={legendClass} />{label}</span>; }

function defaultDateForMonth(month: VenueCalendarData['months'][number] | undefined, dataStatus: VenueCalendarData['dataStatus']): string {
  if (!month) return '';
  if (dataStatus === 'fixture') return month.days.find((day) => day.day === 16)?.date ?? month.days[0]?.date ?? '';
  const today = new Date().toISOString().slice(0, 10);
  return month.days.find((day) => day.date === today)?.date
    ?? month.days.find((day) => day.state !== 'unavailable')?.date
    ?? month.days[0]?.date
    ?? '';
}
