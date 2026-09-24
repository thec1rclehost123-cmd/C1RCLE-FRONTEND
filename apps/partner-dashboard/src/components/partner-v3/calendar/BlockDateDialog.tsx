'use client';

import { useState } from 'react';

import { CloseIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';

import styles from './calendar.module.css';

const reasons = ['Private event', 'Maintenance', 'Other'] as const;
const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minutes = ['00', '15', '30', '45'];

export function BlockDateDialog({
  day,
  dateLabel,
  onClose,
}: {
  readonly day: number;
  readonly dateLabel: string;
  readonly onClose: () => void;
}) {
  const [blockDay, setBlockDay] = useState(String(day));
  const [fromHour, setFromHour] = useState('7');
  const [fromMinute, setFromMinute] = useState('00');
  const [fromPeriod, setFromPeriod] = useState<'AM' | 'PM'>('PM');
  const [toHour, setToHour] = useState('11');
  const [toMinute, setToMinute] = useState('00');
  const [toPeriod, setToPeriod] = useState<'AM' | 'PM'>('PM');
  const [reason, setReason] = useState<(typeof reasons)[number]>('Private event');
  const [customReason, setCustomReason] = useState('');
  return (
    <div className={styles['dialogRoot']} role="presentation">
      <button
        type="button"
        className={styles['dialogScrim']}
        aria-label="Close block date dialog"
        onClick={onClose}
      />
      <section
        className={styles['blockDialog']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-date-title"
      >
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
              onChange={(event) => {
                setBlockDay(event.target.value);
              }}
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
          <fieldset>
            <legend>Reason</legend>
            <div className={styles['reasonOptions']}>
              {reasons.map((option) => (
                <button
                  type="button"
                  aria-pressed={reason === option}
                  onClick={() => {
                    setReason(option);
                  }}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
            {reason === 'Other' ? (
              <input
                value={customReason}
                onChange={(event) => {
                  setCustomReason(event.target.value);
                }}
                placeholder="Describe the reason"
              />
            ) : null}
          </fieldset>
        </div>
        <p className={styles['unavailableNote']}>
          Calendar changes are unavailable until the connected availability service is enabled.
        </p>
        <footer>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled
            title="Blocking a date requires the calendar mutation API"
          >
            Block date
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
        <select
          value={hour}
          onChange={(event) => {
            onHourChange(event.target.value);
          }}
        >
          {hours.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={minute}
          onChange={(event) => {
            onMinuteChange(event.target.value);
          }}
        >
          {minutes.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={period === 'AM'}
          onClick={() => {
            onPeriodChange('AM');
          }}
        >
          AM
        </button>
        <button
          type="button"
          aria-pressed={period === 'PM'}
          onClick={() => {
            onPeriodChange('PM');
          }}
        >
          PM
        </button>
      </div>
    </label>
  );
}
