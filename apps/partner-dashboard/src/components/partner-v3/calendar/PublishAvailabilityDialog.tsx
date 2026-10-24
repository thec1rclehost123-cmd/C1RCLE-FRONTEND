'use client';

import { useState } from 'react';

import { CloseIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';

import styles from './calendar.module.css';

import type { PublishVenueAvailabilityInput } from '@/lib/calendar/venue-calendar-repository';

const TIMEZONES = ['Asia/Kolkata', 'UTC', 'America/Los_Angeles', 'America/New_York'];

export function PublishAvailabilityDialog({
  selectedDate,
  onClose,
  onPublish,
}: {
  readonly selectedDate: string;
  readonly onClose: () => void;
  readonly onPublish?: (input: PublishVenueAvailabilityInput) => Promise<void>;
}) {
  const [startsAtLocal, setStartsAtLocal] = useState(`${selectedDate}T19:00`);
  const [endsAtLocal, setEndsAtLocal] = useState(`${selectedDate}T23:00`);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!onPublish || pending) return;
    setPending(true);
    setError(null);
    try {
      await onPublish({ startsAtLocal, endsAtLocal, timezone, notes });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not publish this availability.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles['dialogRoot']} role="presentation">
      <button
        type="button"
        className={styles['dialogScrim']}
        aria-label="Close availability dialog"
        onClick={onClose}
      />
      <section
        className={styles['blockDialog']}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-availability-title"
      >
        <header>
          <h2 id="publish-availability-title">Open this time for Host requests</h2>
          <button type="button" aria-label="Close availability dialog" onClick={onClose}>
            <CloseIcon size={16} aria-hidden="true" />
          </button>
        </header>
        <div className={styles['blockForm']}>
          <p>Offer a specific future time. This is separate from unblocking a closed date.</p>
          <label>
            Starts
            <input
              type="datetime-local"
              value={startsAtLocal}
              onChange={(event) => { setStartsAtLocal(event.target.value); }}
              required
            />
          </label>
          <label>
            Ends
            <input
              type="datetime-local"
              value={endsAtLocal}
              onChange={(event) => { setEndsAtLocal(event.target.value); }}
              required
            />
          </label>
          <label>
            Timezone
            <select value={timezone} onChange={(event) => { setTimezone(event.target.value); }}>
              {TIMEZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </label>
          <label>
            Notes or constraints <small>Optional</small>
            <textarea
              value={notes}
              maxLength={2000}
              onChange={(event) => { setNotes(event.target.value); }}
              placeholder="Anything a Host should know before requesting"
            />
          </label>
          <p>Visible to all active Host partners. The Venue must accept a request before an event can be created.</p>
          {error ? <p role="alert">{error}</p> : null}
        </div>
        <footer>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={() => void submit()} disabled={pending || !onPublish}>
            {pending ? 'Publishing…' : `Publish ${selectedDate}`}
          </Button>
        </footer>
      </section>
    </div>
  );
}
