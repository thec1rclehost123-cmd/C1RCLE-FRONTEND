'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  BackIcon,
  CalendarIcon,
  CheckIcon,
  ForwardIcon,
  LocationIcon,
  SearchIcon,
  TimeIcon,
} from '@c1rcle/icons';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TextField,
} from '@c1rcle/ui';

import { createComposerDraft } from '@/components/events/event-composer-model';
import { EventComposer } from '@/components/events/EventComposer';
import { initialCreateEventDraft } from '@/components/venue/create-event-model';

import { hostAvailability, hostPartners } from './host-studio-model';
import styles from './HostEventBrief.module.css';

import type { EventComposerDraft } from '@/components/events/event-composer-model';

type Stage = 'venue' | 'time' | 'compose';
type Fit = 'waiting' | 'fits' | 'partial' | 'unavailable';

const authoritativeSlots = [
  { id: 'slot-jul-24', date: '2026-07-24', start: '21:00', end: '03:00' },
  { id: 'slot-jul-25', date: '2026-07-25', start: '20:00', end: '02:00' },
  { id: 'slot-aug-01', date: '2026-08-01', start: '21:00', end: '03:00' },
] as const;
const activeVenues = hostPartners.filter(
  (partner) => partner.kind === 'venue' && partner.status === 'Active',
);
const minutes = (value: string) => {
  const [hour = 0, minute = 0] = value.split(':').map(Number);
  return hour * 60 + minute;
};
const overnightEnd = (start: number, end: number) => (end <= start ? end + 1440 : end);
const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${value}T12:00:00`))
    : '';
const submitUnavailable = (): Promise<void> =>
  Promise.reject(new Error('Host request adapter unavailable.'));

export function HostCreateEventScreen() {
  const [stage, setStage] = useState<Stage>('venue');
  const [venueId, setVenueId] = useState<string>(hostAvailability.venueId);
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [draft, setDraft] = useState<EventComposerDraft>(() =>
    createComposerDraft({ ...initialCreateEventDraft, name: '', description: '' }),
  );
  const venue = activeVenues.find((item) => item.id === venueId) ?? null;
  const slots = venueId === hostAvailability.venueId ? authoritativeSlots : [];
  const selectedSlot = slots.find((slot) => slot.date === date);
  const fit: Fit = (() => {
    if (!date || !start || !end) return 'waiting';
    if (!selectedSlot) return 'unavailable';
    const availableStart = minutes(selectedSlot.start);
    const availableEnd = overnightEnd(availableStart, minutes(selectedSlot.end));
    const requestedStart = minutes(start);
    const requestedEnd = overnightEnd(requestedStart, minutes(end));
    return requestedStart >= availableStart && requestedEnd <= availableEnd ? 'fits' : 'partial';
  })();

  const enterComposer = () => {
    if (!venue || fit !== 'fits') return;
    const capacity = Number(/(\d+) capacity/.exec(venue.detail)?.[1] ?? 400);
    setDraft((current) => ({
      ...current,
      venueId: venue.id,
      venueName: venue.name,
      venueAddress: venue.city,
      venueCapacity: capacity,
      date,
      dateLabel: dateLabel(date),
      startTime: start,
      endTime: end,
      guestCutoff: `${date}T18:00`,
    }));
    setStage('compose');
  };

  if (stage === 'compose' && venue) {
    return (
      <EventComposer
        actor="host"
        eyebrow="Host Studio / Event Request"
        title="Create the event brief"
        draft={draft}
        onChange={setDraft}
        canEdit
        canFinalize
        finalLabel="Submit request"
        onFinalize={submitUnavailable}
        context={{
          venue: venue.name,
          date: dateLabel(date),
          start,
          end,
          onChange: () => {
            setStage('time');
          },
        }}
      />
    );
  }

  return (
    <section className={styles['page']}>
      <header className={styles['pageHeader']}>
        <div>
          <span>Host Studio / Event Request</span>
          <h1>Start an event request</h1>
          <p>
            Choose a partner venue and confirm an exact available window before building the event.
          </p>
        </div>
        <div className={styles['steps']}>
          <span data-active={stage === 'venue' || undefined}>
            <b>1</b> Venue
          </span>
          <i />
          <span data-active={stage === 'time' || undefined}>
            <b>2</b> Date & time
          </span>
          <i />
          <span>
            <b>3</b> Event details
          </span>
        </div>
      </header>

      {stage === 'venue' ? (
        <div className={styles['selectionLayout']}>
          <Card className={styles['selectionCard']}>
            <CardHeader className={styles['cardHeader']}>
              <div className={styles['icon']}>
                <LocationIcon size={18} aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Choose an active venue</CardTitle>
                <CardDescription>
                  Only current venue partnerships can receive requests.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className={styles['cardContent']}>
              <div className={styles['search']}>
                <SearchIcon size={16} aria-hidden="true" />
                <TextField
                  label="Search venues"
                  labelHidden
                  placeholder="Search active venues"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                  }}
                />
              </div>
              <div className={styles['venueList']}>
                {activeVenues
                  .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
                  .map((item) => {
                    const selected = item.id === venueId;
                    const connected = item.id === hostAvailability.venueId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-selected={selected || undefined}
                        onClick={() => {
                          setVenueId(item.id);
                        }}
                      >
                        <div className={styles['venueAvatar']}>
                          <LocationIcon size={18} aria-hidden="true" />
                        </div>
                        <div>
                          <strong>{item.name}</strong>
                          <span>
                            {item.city} · {item.detail}
                          </span>
                          <small data-connected={connected || undefined}>
                            {connected ? 'Availability connected' : 'Availability unavailable'}
                          </small>
                        </div>
                        {selected ? (
                          <CheckIcon size={17} aria-hidden="true" />
                        ) : (
                          <ForwardIcon size={17} aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
          <Card className={styles['summaryCard']}>
            <CardHeader>
              <CardTitle>Your request starts here</CardTitle>
              <CardDescription>
                The venue and timing stay attached while you complete the event details.
              </CardDescription>
            </CardHeader>
            <CardContent className={styles['summaryContent']}>
              <div>
                <span>Selected venue</span>
                <strong>{venue?.name ?? 'None'}</strong>
                <small>{venue?.detail ?? 'Choose an active partner'}</small>
              </div>
              <Button
                fullWidth
                disabled={!venue}
                onClick={() => {
                  setStage('time');
                }}
              >
                Open availability <ForwardIcon size={15} aria-hidden="true" />
              </Button>
              <Link href="/host/events">
                <BackIcon size={14} aria-hidden="true" /> Cancel request
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className={styles['selectionLayout']}>
          <Card className={styles['selectionCard']}>
            <CardHeader className={styles['cardHeader']}>
              <div className={styles['icon']}>
                <CalendarIcon size={18} aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Choose the date and time</CardTitle>
                <CardDescription>
                  Enter the exact range you want within the venue’s connected availability.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStage('venue');
                }}
              >
                Change venue
              </Button>
            </CardHeader>
            <CardContent className={styles['cardContent']}>
              <label className={styles['nativeField']}>
                <span>Requested date</span>
                <input
                  aria-label="Requested date"
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                  }}
                />
              </label>
              <div className={styles['dateOptions']}>
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    aria-label={hostAvailability.slots.find((item) => item.id === slot.id)?.label}
                    data-selected={date === slot.date || undefined}
                    onClick={() => {
                      setDate(slot.date);
                      setStart('');
                      setEnd('');
                    }}
                  >
                    <strong>{dateLabel(slot.date).replace(/,? 2026/, '')}</strong>
                    <span>
                      {slot.start} – {slot.end}
                    </span>
                  </button>
                ))}
              </div>
              {!slots.length ? (
                <p className={styles['empty']}>
                  No authoritative availability is connected for this venue.
                </p>
              ) : null}
              <div className={styles['timeInputs']}>
                <label className={styles['nativeField']}>
                  <span>Start time</span>
                  <input
                    aria-label="Start time"
                    type="time"
                    value={start}
                    onChange={(event) => {
                      setStart(event.target.value);
                    }}
                  />
                </label>
                <label className={styles['nativeField']}>
                  <span>End time</span>
                  <input
                    aria-label="End time"
                    type="time"
                    value={end}
                    onChange={(event) => {
                      setEnd(event.target.value);
                    }}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
          <Card className={styles['summaryCard']}>
            <CardHeader>
              <CardTitle>Availability check</CardTitle>
              <CardDescription>{venue?.name}</CardDescription>
            </CardHeader>
            <CardContent className={styles['summaryContent']}>
              <div className={styles['availability']} data-fit={fit}>
                <TimeIcon size={18} aria-hidden="true" />
                <div>
                  <strong>
                    {fit === 'fits'
                      ? 'Good to go'
                      : fit === 'partial'
                        ? 'Partially available'
                        : fit === 'unavailable'
                          ? 'Unavailable'
                          : 'Choose a range'}
                  </strong>
                  <small>
                    {fit === 'fits'
                      ? 'The full range fits the venue window.'
                      : fit === 'partial'
                        ? 'Adjust the range inside venue availability.'
                        : fit === 'unavailable'
                          ? 'No connected availability exists on this date.'
                          : 'Overnight ranges are supported.'}
                  </small>
                </div>
              </div>
              <div>
                <span>Venue window</span>
                <strong>
                  {selectedSlot ? `${selectedSlot.start} – ${selectedSlot.end}` : 'Not selected'}
                </strong>
                <small>Your request: {start && end ? `${start} – ${end}` : '—'}</small>
              </div>
              <Button fullWidth disabled={fit !== 'fits'} onClick={enterComposer}>
                Build event brief <ForwardIcon size={15} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setStage('venue');
                }}
              >
                <BackIcon size={14} aria-hidden="true" /> Back
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
