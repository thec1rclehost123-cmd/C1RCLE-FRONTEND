'use client';

import { useRef, useState } from 'react';

import { eventEndAtFromDraft, eventStartAtFromDraft } from '@/lib/events/event-time';

import styles from './event-editor.module.css';

import type { AvailabilitySlot } from '@/data/partner-data-source';

const MINUTE = 60_000;
const HOURS = 48;
const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const label = (minutes: number) => {
  const hour = Math.floor(minutes / 60) % 24;
  return `${String(hour % 12 || 12)}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}${minutes >= 1440 ? ' · next day' : ''}`;
};

export function EventTimeTimeline({
  date,
  slots,
  time,
  endTime,
  selectedSlotId,
  onSelect,
}: {
  readonly date: string;
  readonly slots: readonly AvailabilitySlot[];
  readonly time: string;
  readonly endTime: string;
  readonly selectedSlotId?: string;
  readonly onSelect: (slot: AvailabilitySlot, start: string, end: string) => void;
}) {
  const midnight = Date.parse(`${date}T00:00:00+05:30`);
  const ranges = slots.flatMap((slot) =>
    slot.startTime && slot.endTime
      ? [
          {
            slot,
            start: (Date.parse(slot.startTime) - midnight) / MINUTE,
            end: (Date.parse(slot.endTime) - midnight) / MINUTE,
          },
        ]
      : [],
  );
  const startIso = eventStartAtFromDraft({ date, time });
  const endIso = eventEndAtFromDraft({ date, time, endTime });
  const start = startIso ? (Date.parse(startIso) - midnight) / MINUTE : 18 * 60;
  const end = endIso ? (Date.parse(endIso) - midnight) / MINUTE : start + 240;
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const [error, setError] = useState('');
  const anchor = useRef<number | null>(null);
  const commit = (from: number, to: number) => {
    const range = ranges.find((range) => from >= range.start && to <= range.end);
    if (from >= 1440 || to <= from || to - from > 1440 || !range) {
      setError('Choose up to 24 hours within an available interval. Red periods are unavailable.');
      return;
    }
    setError('');
    onSelect(range.slot, clock(from), clock(to));
  };
  const shown: [number, number] | null = drag ?? (selectedSlotId ? [start, end] : null);
  const position = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(HOURS * 60, Math.round(((event.clientX - rect.left) / rect.width) * HOURS * 4) * 15),
    );
  };
  return (
    <div className={styles['timePlanner']}>
      <div className={styles['timePlannerHeading']}>
        <h3>Choose your time</h3>
        <span>IST · drag to select</span>
      </div>
      <div className={styles['timelineScroll']}>
        <div className={styles['timelineCanvas']}>
          <div className={styles['timelineDates']}>
            {[0, 1].map((offset) => (
              <span key={offset}>
                {new Intl.DateTimeFormat('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'Asia/Kolkata',
                }).format(new Date(midnight + offset * 86400000))}
                {offset ? ' · next day' : ''}
              </span>
            ))}
          </div>
          <div className={styles['timelineTicks']}>
            {Array.from({ length: 17 }, (_, i) => (
              <span key={i}>
                {label(i * 180)
                  .replace(':00', '')
                  .replace(' · next day', '')}
              </span>
            ))}
          </div>
          <svg
            viewBox="0 0 2880 60"
            preserveAspectRatio="none"
            aria-label="Availability timeline"
            className={styles['timeTrack']}
            onPointerDown={(event) => {
              const at = position(event);
              anchor.current =
                selectedSlotId && Math.abs(at - start) <= 30
                  ? end
                  : selectedSlotId && Math.abs(at - end) <= 30
                    ? start
                    : at;
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag([Math.min(anchor.current, at), Math.max(anchor.current, at)]);
            }}
            onPointerMove={(event) => {
              if (anchor.current === null) return;
              const at = position(event);
              setDrag([Math.min(anchor.current, at), Math.max(anchor.current, at)]);
            }}
            onPointerUp={(event) => {
              if (anchor.current === null) return;
              const at = position(event);
              const from = Math.min(anchor.current, at);
              const to = Math.max(anchor.current, at);
              anchor.current = null;
              setDrag(null);
              commit(from, to === from ? from + 240 : to);
            }}
            onPointerCancel={() => {
              anchor.current = null;
              setDrag(null);
            }}
          >
            {ranges.map((range) => (
              <rect
                key={range.slot.id}
                className={styles['timeFree']}
                x={range.start}
                y={0}
                width={Math.max(0, Math.min(range.end, HOURS * 60) - range.start)}
                height={60}
              />
            ))}
            <line className={styles['midnightMarker']} x1={1440} x2={1440} y1={0} y2={60} />
            {shown ? (
              <g className={styles['timeSelection']}>
                <rect
                  x={shown[0]}
                  y={5}
                  width={Math.max(0, shown[1] - shown[0])}
                  height={50}
                  rx={6}
                />
                <line x1={shown[0] + 15} x2={shown[0] + 15} y1={20} y2={40} />
                <line x1={shown[1] - 15} x2={shown[1] - 15} y1={20} y2={40} />
              </g>
            ) : null}
          </svg>
        </div>
      </div>
      <div className={styles['timeLegend']}>
        <span>Available</span>
        <span>Unavailable</span>
        <span>Your event</span>
      </div>
      <div className={styles['timePlannerFields']}>
        <label>
          Start time
          <input
            type="time"
            aria-label="Event start time"
            value={selectedSlotId ? clock(start) : ''}
            onChange={(event) => {
              if (!event.target.value) return;
              const [h = 0, m = 0] = event.target.value.split(':').map(Number);
              const from = h * 60 + m;
              commit(from, from + Math.max(15, end - start));
            }}
          />
        </label>
        <label>
          Duration
          <select
            aria-label="Event duration"
            value={selectedSlotId ? String(end - start) : ''}
            onChange={(event) => {
              commit(start, start + Number(event.target.value));
            }}
          >
            <option value="" disabled>
              Select duration
            </option>
            {![60, 120, 180, 240, 300, 360, 480, 720, 1440].includes(end - start) &&
            selectedSlotId ? (
              <option value={end - start}>{(end - start) / 60} hours</option>
            ) : null}
            {[60, 120, 180, 240, 300, 360, 480, 720, 1440].map((value) => (
              <option value={value} key={value}>
                {value / 60} {value === 60 ? 'hour' : 'hours'}
              </option>
            ))}
          </select>
        </label>
        <label>
          End time (optional)
          <input
            type="time"
            aria-label="Event end time"
            value={selectedSlotId ? clock(end) : ''}
            onChange={(event) => {
              if (!event.target.value) {
                commit(start, start + 240);
                return;
              }
              const [h = 0, m = 0] = event.target.value.split(':').map(Number);
              let to = h * 60 + m;
              if (to <= start) to += 1440;
              commit(start, to);
            }}
          />
        </label>
      </div>
      <div className={styles['timelineKeyboard']}>
        <label>
          Adjust start
          <input
            aria-label="Adjust event start"
            type="range"
            min={0}
            max={1425}
            step={15}
            value={start}
            onChange={(event) => {
              const from = Number(event.target.value);
              commit(from, from + (end - start));
            }}
          />
        </label>
        <label>
          Adjust end
          <input
            aria-label="Adjust event end"
            type="range"
            min={start + 15}
            max={Math.min(start + 1440, 2880)}
            step={15}
            value={end}
            onChange={(event) => {
              commit(start, Number(event.target.value));
            }}
          />
        </label>
      </div>
      {error ? (
        <p className={styles['timeError']} role="alert">
          {error}
        </p>
      ) : null}
      {selectedSlotId ? (
        <p className={styles['timeConfirmation']} aria-live="polite">
          {new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            timeZone: 'Asia/Kolkata',
          }).format(new Date(midnight))}{' '}
          · {label(start)} → {label(end)} IST
        </p>
      ) : null}
    </div>
  );
}
