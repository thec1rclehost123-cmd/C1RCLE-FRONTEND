'use client';

import { useState } from 'react';

import { CloseIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';

import styles from './calendar.module.css';

import type { CreateVenueBlockInput } from '@/lib/calendar/venue-calendar-repository';

const reasons = ['Private event', 'Maintenance', 'Other'] as const;
const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minutes = ['00', '15', '30', '45'];

export function BlockDateDialog({ date, dateLabel, onClose, onSubmit }: { readonly date: string; readonly dateLabel: string; readonly onClose: () => void; readonly onSubmit?: (input: CreateVenueBlockInput) => Promise<void> }) {
  const [fromHour, setFromHour] = useState('7');
  const [fromMinute, setFromMinute] = useState('00');
  const [fromPeriod, setFromPeriod] = useState<'AM' | 'PM'>('PM');
  const [toHour, setToHour] = useState('11');
  const [toMinute, setToMinute] = useState('00');
  const [toPeriod, setToPeriod] = useState<'AM' | 'PM'>('PM');
  const [reason, setReason] = useState<(typeof reasons)[number]>('Private event');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finalReason = reason === 'Other' ? customReason.trim() : reason;

  const submit = async () => {
    if (!onSubmit || !finalReason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        date,
        from: toTwentyFourHour(fromHour, fromMinute, fromPeriod),
        to: toTwentyFourHour(toHour, toMinute, toPeriod),
        reason: finalReason,
      });
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'The date could not be blocked.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className={styles['dialogRoot']} role="presentation"><button type="button" className={styles['dialogScrim']} aria-label="Close block date dialog" onClick={onClose} /><section className={styles['blockDialog']} role="dialog" aria-modal="true" aria-labelledby="block-date-title"><header><h2 id="block-date-title">Block a date</h2><button type="button" aria-label="Close block date dialog" onClick={onClose}><CloseIcon size={16} aria-hidden="true" /></button></header><div className={styles['blockForm']}><label>Date <small>{dateLabel}</small><input type="date" value={date} readOnly /></label><TimeField label="From" hour={fromHour} minute={fromMinute} period={fromPeriod} onHourChange={setFromHour} onMinuteChange={setFromMinute} onPeriodChange={setFromPeriod} /><TimeField label="To" hour={toHour} minute={toMinute} period={toPeriod} onHourChange={setToHour} onMinuteChange={setToMinute} onPeriodChange={setToPeriod} /><fieldset><legend>Reason</legend><div className={styles['reasonOptions']}>{reasons.map((option) => <button type="button" aria-pressed={reason === option} onClick={() => { setReason(option); }} key={option}>{option}</button>)}</div>{reason === 'Other' ? <input value={customReason} onChange={(event) => { setCustomReason(event.target.value); }} placeholder="Describe the reason" aria-label="Custom block reason" /> : null}</fieldset></div>{error ? <p className={styles['unavailableNote']} role="alert">{error}</p> : null}<footer><Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button><Button type="button" variant="primary" disabled={!onSubmit || !finalReason || submitting} onClick={() => { void submit(); }}>{submitting ? 'Blocking…' : 'Block date'}</Button></footer></section></div>;
}

function toTwentyFourHour(hour: string, minute: string, period: 'AM' | 'PM'): string {
  let value = Number(hour) % 12;
  if (period === 'PM') value += 12;
  return `${String(value).padStart(2, '0')}:${minute}`;
}

function TimeField({ label, hour, minute, period, onHourChange, onMinuteChange, onPeriodChange }: { readonly label: string; readonly hour: string; readonly minute: string; readonly period: 'AM' | 'PM'; readonly onHourChange: (value: string) => void; readonly onMinuteChange: (value: string) => void; readonly onPeriodChange: (value: 'AM' | 'PM') => void }) {
  return <label>{label}<div className={styles['timeControls']}><select value={hour} onChange={(event) => { onHourChange(event.target.value); }}>{hours.map((value) => <option value={value} key={value}>{value}</option>)}</select><select value={minute} onChange={(event) => { onMinuteChange(event.target.value); }}>{minutes.map((value) => <option value={value} key={value}>{value}</option>)}</select><button type="button" aria-pressed={period === 'AM'} onClick={() => { onPeriodChange('AM'); }}>AM</button><button type="button" aria-pressed={period === 'PM'} onClick={() => { onPeriodChange('PM'); }}>PM</button></div></label>;
}
