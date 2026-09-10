import { useId } from 'react';

import styles from './calendar.module.css';

import type { CalendarDay, CalendarMonth } from '@/data/partner-data-source';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({
  month,
  selectedDate,
  onPick,
}: {
  readonly month: CalendarMonth;
  readonly selectedDate: string;
  readonly onPick: (day: CalendarDay) => void;
}) {
  const labelId = useId();
  return (
    <div className={styles['calendarGridWrap']} aria-labelledby={labelId}>
      <div className={styles['weekdays']} id={labelId}>
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={styles['calendarGrid']}>
        {Array.from({ length: month.firstDayOffset }, (_, index) => (
          <span className={styles['emptyCell']} aria-hidden="true" key={`empty-${String(index)}`} />
        ))}
        {month.days.map((day) => (
          <DayCell day={day} selected={day.date === selectedDate} onPick={onPick} key={day.date} />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  day,
  selected,
  onPick,
}: {
  readonly day: CalendarDay;
  readonly selected: boolean;
  readonly onPick: (day: CalendarDay) => void;
}) {
  const label = `${day.date}, ${day.state === 'available' ? 'available' : day.state}`;
  const stateClass = {
    available: styles['dayAvailable'],
    unavailable: styles['dayUnavailable'],
    confirmed: styles['dayConfirmed'],
    pending: styles['dayPending'],
    blocked: styles['dayBlocked'],
  }[day.state];
  return (
    <button
      type="button"
      className={[styles['dayCell'], stateClass, selected ? styles['daySelected'] : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => {
        onPick(day);
      }}
    >
      <span>{day.day}</span>
      {day.events.length ? <i aria-hidden="true" /> : null}
    </button>
  );
}
