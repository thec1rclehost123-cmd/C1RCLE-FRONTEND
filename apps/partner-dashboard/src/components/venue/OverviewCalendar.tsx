'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { CalendarIcon, CloseIcon, ExternalLinkIcon } from '@c1rcle/icons';

import styles from './OverviewCalendar.module.css';

const className = (name: string): string => styles[name] ?? name;

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

export function OverviewCalendar() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const close = () => {
    setOpen(false);
    window.setTimeout(() => buttonRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={className('root')}>
      <button
        ref={buttonRef}
        type="button"
        className={className('trigger')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <ExternalLinkIcon size={16} strokeWidth={1.7} aria-hidden="true" />
        Pop-out calendar
      </button>

      {open ? (
        <section className={className('popover')} role="dialog" aria-labelledby={titleId}>
          <header>
            <div>
              <CalendarIcon size={17} aria-hidden="true" />
              <strong id={titleId}>July 2026</strong>
            </div>
            <button ref={closeRef} type="button" aria-label="Close calendar" onClick={close}>
              <CloseIcon size={17} aria-hidden="true" />
            </button>
          </header>
          <div className={className('weekdays')} aria-hidden="true">
            {WEEKDAYS.map((day, index) => (
              <span key={`${day}-${String(index)}`}>{day}</span>
            ))}
          </div>
          <div className={className('days')}>
            {Array.from({ length: 3 }, (_, index) => (
              <span key={`empty-${String(index)}`} aria-hidden="true" />
            ))}
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className={day === 16 ? className('today') : undefined}
                aria-current={day === 16 ? 'date' : undefined}
                aria-label={`July ${String(day)}, 2026`}
                onClick={close}
              >
                {day}
                {[3, 9, 16, 23, 30].includes(day) ? <i aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
