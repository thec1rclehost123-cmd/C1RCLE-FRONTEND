'use client';

import { useRef, useState } from 'react';

import { ChevronDownIcon } from '@c1rcle/icons';

import styles from './VenueEventDetail.module.css';

import type { VenueEventSummaryModel } from '../event-detail-model';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export function EventInformationAccordion({
  information,
}: {
  readonly information: VenueEventSummaryModel['information'];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <section className={styles['informationPanel']}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="event-information-content"
        onClick={() => {
          setOpen((value) => !value);
        }}
        onKeyDown={onKeyDown}
      >
        <span>
          <strong>Important event information</strong>
          <small>Venue, timings, age limit and contact</small>
        </span>
        <ChevronDownIcon size={20} aria-hidden="true" />
      </button>
      {open ? (
        <dl id="event-information-content">
          <div>
            <dt>Venue</dt>
            <dd>{information.venue}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{information.address}</dd>
          </div>
          <div>
            <dt>Start and end</dt>
            <dd>{information.startAndEnd}</dd>
          </div>
          <div>
            <dt>Age limit</dt>
            <dd>{information.ageLimit}</dd>
          </div>
          {information.dressCode ? (
            <div>
              <dt>Dress code</dt>
              <dd>{information.dressCode}</dd>
            </div>
          ) : null}
          <div>
            <dt>Entry method</dt>
            <dd>{information.entryMethod}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>Details hidden for privacy</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
