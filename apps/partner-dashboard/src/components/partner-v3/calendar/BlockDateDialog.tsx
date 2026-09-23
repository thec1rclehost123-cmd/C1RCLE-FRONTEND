'use client';

import { useState } from 'react';

import { CloseIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';

import styles from './calendar.module.css';

import type { BlockVenueDateInput } from '@/lib/api/calendar-api';

const reasons = ['Private event', 'Maintenance', 'Other'] as const;
const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minutes = ['00', '15', '30', '45'];

/** Converts 12-hour picker values to a zero-padded 24-hour HH:MM string. */
function to24Hour(hour: string, minute: string, period: 'AM' | 'PM'): string {
  let h = Number.parseInt(hour, 10);
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

/**
 * Builds an ISO 8601 datetime from a month key (YYYY-MM), a day number,
 * and an HH:MM string. The month key is the canonical `CalendarMonth.key`
 * (e.g. "2026-07"), so the result is always a real calendar date prefix.
 */
function toIso(monthKey: string, day: string, hhmm: string): string {
  const paddedDay = String(Number.parseInt(day, 10) || 1).padStart(2, '0');
  const normalisedMonth = /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : '2026-07';
  return `${normalisedMonth}-${paddedDay}T${hhmm}:00.000Z`;
}

/** Shifts a month-key day by `delta` days, rolling across month boundaries. */
function addDays(monthKey: string, day: number, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year ?? 2026, (month ?? 1) - 1, day + delta)).toISOString().slice(0, 10);
}

export function BlockDateDialog({
  day,
  dateLabel,
  monthKey,
  selectedDate,
  onClose,
  onBlock,
}: {
  readonly day: number;
  readonly dateLabel: string;
  readonly monthKey: string;
  /** Full YYYY-MM-DD of the currently selected day — keeps the picker in sync. */
  readonly selectedDate?: string | undefined;
  readonly onClose: () => void;
  /** When provided, the "Block date" button is active and calls this on submit. */
  readonly onBlock?: ((input: BlockVenueDateInput) => Promise<void>) | undefined;
}) {
  const initialDay = selectedDate?.slice(8, 10).replace(/^0/, '') ?? String(day);
  const [blockDay, setBlockDay] = useState(initialDay);
  const [fromHour, setFromHour] = useState('7');
  const [fromMinute, setFromMinute] = useState('00');
  const [fromPeriod, setFromPeriod] = useState<'AM' | 'PM'>('PM');
  const [toHour, setToHour] = useState('11');
  const [toMinute, setToMinute] = useState('00');
  const [toPeriod, setToPeriod] = useState<'AM' | 'PM'>('PM');
  const [reason, setReason] = useState<(typeof reasons)[number]>('Private event');
  const [customReason, setCustomReason] = useState('');
  /** Overnight blocks run past midnight — the end time lands on the next day. */
  const [overnight, setOvernight] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = Boolean(onBlock) && !submitting;

  async function handleSubmit() {
    if (!onBlock) return;
    const dayNumber = Number.parseInt(blockDay, 10);
    if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 31) {
      setSubmitError('Enter a valid day of the month (1–31).');
      return;
    }
    const startHhmm = to24Hour(fromHour, fromMinute, fromPeriod);
    const endHhmm = to24Hour(toHour, toMinute, toPeriod);
    const startTime = toIso(monthKey, String(dayNumber), startHhmm);
    const endTime = overnight
      ? `${addDays(monthKey, dayNumber, 1)}T${endHhmm}:00.000Z`
      : toIso(monthKey, String(dayNumber), endHhmm);
    if (!overnight && endTime <= startTime) {
      setSubmitError('End time must be after start time, or switch on "Ends next day" for an overnight block.');
      return;
    }
    const label = reason === 'Other' && customReason.trim() ? customReason.trim() : reason;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onBlock({ label, startTime, endTime });
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles['dialogRoot']} role="presentation">
      <button type="button" className={styles['dialogScrim']} aria-label="Close block date dialog" onClick={onClose} />
      <section className={styles['blockDialog']} role="dialog" aria-modal="true" aria-labelledby="block-date-title">
        <header>
          <h2 id="block-date-title">Block a date</h2>
          <button type="button" aria-label="Close block date dialog" onClick={onClose}>
            <CloseIcon size={16} aria-hidden="true" />
          </button>
        </header>
        <div className={styles['blockForm']}>
          <label>
            Date <small>{dateLabel}</small>
            <input
              type="number"
              min="1"
              max="31"
              value={blockDay}
              onChange={(event) => { setBlockDay(event.target.value); }}
              placeholder="Day, e.g. 12"
            />
          </label>
          <TimeField
            label="From"
            hour={fromHour}
            minute={fromMinute}
            period={fromPeriod}
            onHourChange={setFromHour}
            onMinuteChange={setFromMinute}
            onPeriodChange={setFromPeriod}
          />
          <TimeField
            label="To"
            hour={toHour}
            minute={toMinute}
            period={toPeriod}
            onHourChange={setToHour}
            onMinuteChange={setToMinute}
            onPeriodChange={setToPeriod}
          />
          <div>
            <div className={styles['reasonOptions']}>
              <button
                type="button"
                aria-pressed={overnight}
                onClick={() => { setOvernight((value) => !value); }}
              >
                Ends next day
              </button>
            </div>
            {overnight && Number.isFinite(Number.parseInt(blockDay, 10)) ? (
              <p className={styles['unavailableNote']}>
                Runs overnight — ends {addDays(monthKey, Number.parseInt(blockDay, 10), 1)}.
              </p>
            ) : null}
          </div>
          <fieldset>
            <legend>Reason</legend>
            <div className={styles['reasonOptions']}>
              {reasons.map((option) => (
                <button
                  type="button"
                  aria-pressed={reason === option}
                  onClick={() => { setReason(option); }}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
            {reason === 'Other' ? (
              <input
                value={customReason}
                onChange={(event) => { setCustomReason(event.target.value); }}
                placeholder="Describe the reason"
              />
            ) : null}
          </fieldset>
        </div>
        {submitError ? (
          <p className={styles['blockError']} role="alert">{submitError}</p>
        ) : !onBlock ? (
          <p className={styles['unavailableNote']}>
            Calendar changes are unavailable until the connected availability service is enabled.
          </p>
        ) : null}
        <footer>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSubmit}
            onClick={() => { void handleSubmit(); }}
          >
            {submitting ? 'Blocking…' : 'Block date'}
          </Button>
        </footer>
      </section>
    </div>
  );
}

function TimeField({
  label,
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}: {
  readonly label: string;
  readonly hour: string;
  readonly minute: string;
  readonly period: 'AM' | 'PM';
  readonly onHourChange: (value: string) => void;
  readonly onMinuteChange: (value: string) => void;
  readonly onPeriodChange: (value: 'AM' | 'PM') => void;
}) {
  return (
    <label>
      {label}
      <div className={styles['timeControls']}>
        <select value={hour} onChange={(event) => { onHourChange(event.target.value); }}>
          {hours.map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
        <select value={minute} onChange={(event) => { onMinuteChange(event.target.value); }}>
          {minutes.map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
        <button type="button" aria-pressed={period === 'AM'} onClick={() => { onPeriodChange('AM'); }}>AM</button>
        <button type="button" aria-pressed={period === 'PM'} onClick={() => { onPeriodChange('PM'); }}>PM</button>
      </div>
    </label>
  );
}
