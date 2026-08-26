'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import styles from './calendar.module.css';
import { CalendarDayDetails } from './CalendarDayDetails';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';
import { VenueSelector } from './VenueSelector';

import type { AvailabilitySlot, HostAvailabilityData } from '@/data/partner-data-source';

export function HostAvailabilityScreen({ data, initialMonth, initialDate, initialVenue, initialSlot }: { readonly data: HostAvailabilityData; readonly initialMonth?: string; readonly initialDate?: string; readonly initialVenue?: string; readonly initialSlot?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const selectedVenue = data.venues.find((item) => item.venue.id === initialVenue) ?? data.venues[0];
  if (!selectedVenue) return null;
  const month = selectedVenue.months.find((item) => item.key === initialMonth) ?? selectedVenue.months[0];
  if (!month) return null;
  const selectedDate = month.days.some((day) => day.date === initialDate) ? initialDate ?? '' : month.days.find((day) => day.day === 16)?.date ?? month.days[0]?.date ?? '';
  const selectedDay = month.days.find((day) => day.date === selectedDate) ?? month.days[0];
  if (!selectedDay) return null;
  const selectedSlot = selectedDay.slots.find((slot) => slot.id === initialSlot);
  const update = (values: { readonly venue?: string; readonly month?: string; readonly date?: string; readonly slot?: string }) => { const params = new URLSearchParams(); params.set('venue', values.venue ?? selectedVenue.venue.id); params.set('month', values.month ?? month.key); params.set('date', values.date ?? selectedDay.date); if (values.slot) params.set('slot', values.slot); router.replace(`${pathname}?${params.toString()}`, { scroll: false }); };
  const moveMonth = (direction: -1 | 1) => { const index = selectedVenue.months.findIndex((item) => item.key === month.key); const next = selectedVenue.months[index + direction]; const nextDate = next?.days.find((day) => day.day === 16)?.date ?? next?.days[0]?.date; if (next && nextDate) update({ month: next.key, date: nextDate }); };
  const createHref = selectedSlot ? `/partner/host/events/create?venue=${selectedVenue.venue.id}&date=${selectedDay.date}&slot=${selectedSlot.id}` : undefined;
  return <div className={[styles['page'], styles['hostTheme']].join(' ')}><div className={styles['topRow']}><Link href="/partner/host/overview">← Back to Overview</Link><nav aria-label="Availability links"><Link href="/partner/host/events">Events</Link><Link href="/partner/host/slot-requests">Slot Requests</Link></nav></div><header className={styles['availabilityIntro']}><span>Availability</span><h1>Find an open slot</h1><p>Choose a partnered venue, then select an available date and time for your event.</p></header><VenueSelector venues={data.venues.map((item) => item.venue)} selectedVenueId={selectedVenue.venue.id} onSelect={(venueId) => { const nextVenue = data.venues.find((item) => item.venue.id === venueId); const nextMonth = nextVenue?.months[0]; const nextDate = nextMonth?.days.find((day) => day.day === 16)?.date ?? nextMonth?.days[0]?.date; if (nextMonth && nextDate) update({ venue: venueId, month: nextMonth.key, date: nextDate }); }} /><div className={styles['calendarLayout']}><section className={styles['calendarPanel']} aria-label="Partnered venue availability"><CalendarHeader title="All events this month" description={`${selectedVenue.venue.name} · grey dates are already taken.`} monthLabel={month.label.toUpperCase()} onPrevious={() => { moveMonth(-1); }} onNext={() => { moveMonth(1); }} /><CalendarGrid month={month} selectedDate={selectedDay.date} onPick={(day) => { update({ date: day.date }); }} /><div className={styles['legend']}><Legend color="available" label="Available" /><Legend color="confirmed" label="Booked" /><Legend color="pending" label="Pending" /></div></section><CalendarDayDetails day={selectedDay} accent="lavender" mode="host" eventHref={(event) => event.href?.replace('/partner/venue/', '/partner/host/')} selectedSlotId={selectedSlot?.id} onSlotSelect={(slot: AvailabilitySlot) => { update({ slot: slot.id }); }} createHref={createHref} /></div></div>;
}

function Legend({ color, label }: { readonly color: 'confirmed' | 'pending' | 'available'; readonly label: string }) { const legendClass = { confirmed: styles['legendConfirmed'], pending: styles['legendPending'], available: styles['legendAvailable'] }[color]; return <span><i className={legendClass} />{label}</span>; }
