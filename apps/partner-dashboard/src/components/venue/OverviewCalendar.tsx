'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  AddIcon,
  ArchiveIcon,
  CalendarIcon,
  CloseIcon,
  ExternalLinkIcon,
  ListViewIcon,
  NextIcon,
  PreviousIcon,
  SearchIcon,
  TimeIcon,
} from '@c1rcle/icons';

import styles from './OverviewCalendar.module.css';

const className = (name: string): string => styles[name] ?? name;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAYS_IN_MONTH = 31;
const LEADING_DAYS = 3;
const VIEW_OPTIONS = ['Day', 'Week', 'Month', 'Year'] as const;
type View = (typeof VIEW_OPTIONS)[number];

interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  time: string;
  venue: string;
  status: 'Live' | 'Confirmed' | 'Draft';
  tone: 'orange' | 'purple' | 'blue';
}

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'neon-nights',
    day: 16,
    title: 'Neon Nights: Afrobeats Edition',
    time: '10:00 PM',
    venue: 'Skyline Rooftop',
    status: 'Live',
    tone: 'orange',
  },
  {
    id: 'bollytech',
    day: 18,
    title: 'Bollytech',
    time: '9:00 PM',
    venue: 'Kitty Su Mumbai',
    status: 'Confirmed',
    tone: 'purple',
  },
  {
    id: 'sunset-sessions',
    day: 19,
    title: 'Sunset Sessions Vol. 4',
    time: '5:00 PM',
    venue: 'Skypark Beach Club',
    status: 'Confirmed',
    tone: 'blue',
  },
  {
    id: 'urban-fridays',
    day: 24,
    title: 'Urban Fridays',
    time: '10:00 PM',
    venue: 'Lodi - The Garden',
    status: 'Confirmed',
    tone: 'purple',
  },
  {
    id: 'monsoon-sessions',
    day: 26,
    title: 'Monsoon Sessions',
    time: '8:00 PM',
    venue: 'The Stables',
    status: 'Draft',
    tone: 'blue',
  },
  {
    id: 'warehouse-rave',
    day: 30,
    title: 'Warehouse Rave',
    time: '11:00 PM',
    venue: 'The Bombay Exhibition Centre',
    status: 'Confirmed',
    tone: 'orange',
  },
];

const formatDate = (day: number): string => `July ${String(day)}, 2026`;

export function OverviewCalendar() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('Month');
  const [query, setQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState(16);
  const [selectedEventId, setSelectedEventId] = useState('neon-nights');
  const [blocking, setBlocking] = useState(false);
  const [blockedDays, setBlockedDays] = useState<number[]>([21]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => buttonRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [close, open]);

  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return CALENDAR_EVENTS;
    return CALENDAR_EVENTS.filter((event) =>
      `${event.title} ${event.venue} ${event.status}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const selectedEvent = CALENDAR_EVENTS.find((event) => event.id === selectedEventId)
    ?? visibleEvents.find((event) => event.day === selectedDay);
  const selectedDayEvents = visibleEvents.filter((event) => event.day === selectedDay);

  const selectDay = (day: number) => {
    setSelectedDay(day);
    const dayEvent = visibleEvents.find((event) => event.day === day);
    if (dayEvent) setSelectedEventId(dayEvent.id);
    if (blocking && !blockedDays.includes(day)) {
      setBlockedDays((current) => [...current, day]);
    }
  };

  return (
    <div className={className('root')}>
      <button
        ref={buttonRef}
        type="button"
        className={className('trigger')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value); }}
      >
        <ExternalLinkIcon size={16} strokeWidth={1.7} aria-hidden="true" />
        Pop-out calendar
      </button>

      {open ? createPortal(
        <div
          className={className('overlay')}
          role="presentation"
          onKeyDown={(event) => {
            if (event.key === 'Escape') close();
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section className={className('calendarShell')} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className={className('topBar')}>
              <div className={className('trafficLights')} aria-hidden="true">
                <span className={className('trafficRed')} />
                <span className={className('trafficYellow')} />
                <span className={className('trafficGreen')} />
              </div>
              <div className={className('utilityActions')}>
                <button type="button" className={className('iconButton')} aria-label="Calendar view">
                  <CalendarIcon size={18} aria-hidden="true" />
                </button>
                <button type="button" className={className('iconButton')} aria-label="Agenda view">
                  <ListViewIcon size={18} aria-hidden="true" />
                </button>
                <button type="button" className={className('addIconButton')} aria-label="Add event">
                  <AddIcon size={20} aria-hidden="true" />
                </button>
              </div>

              <div className={className('viewSwitcher')} aria-label="Calendar view">
                {VIEW_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={view === option ? className('activeView') : undefined}
                    aria-pressed={view === option}
                    onClick={() => { setView(option); }}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className={className('topBarRight')}>
                <label className={className('searchField')}>
                  <SearchIcon size={18} aria-hidden="true" />
                  <span className={className('visuallyHidden')}>Search calendar events</span>
                  <input
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); }}
                    placeholder="Search"
                    aria-label="Search calendar events"
                  />
                </label>
                <button ref={closeRef} type="button" className={className('closeButton')} aria-label="Close calendar" onClick={close}>
                  <CloseIcon size={20} aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className={className('calendarHeading')}>
              <div>
                <p className={className('eyebrow')}>Venue schedule · July 2026</p>
                <h1 id={titleId}>July 2026</h1>
              </div>
              <div className={className('headingActions')}>
                <button type="button" className={className('navButton')} aria-label="Previous month">
                  <PreviousIcon size={18} aria-hidden="true" />
                </button>
                <button type="button" className={className('todayButton')} onClick={() => { selectDay(16); }}>Today</button>
                <button type="button" className={className('navButton')} aria-label="Next month">
                  <NextIcon size={18} aria-hidden="true" />
                </button>
                <button type="button" className={className('blockButton')} aria-pressed={blocking} onClick={() => { setBlocking((value) => !value); }}>
                  <TimeIcon size={16} aria-hidden="true" />
                  {blocking ? 'Exit time blocking' : 'Block time'}
                </button>
              </div>
            </div>

            {blocking ? (
              <div className={className('blockingBanner')} role="status">
                <TimeIcon size={16} aria-hidden="true" />
                <span><strong>Time blocking enabled.</strong> Select any day to add a draft venue hold.</span>
                <button type="button" onClick={() => { setBlockedDays([]); }}>Clear draft holds</button>
              </div>
            ) : null}

            <div className={className('calendarBody')}>
              <div className={className('monthGrid')}>
                <div className={className('weekdayRow')}>
                  {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
                </div>
                <div className={className('dayGrid')}>
                  {Array.from({ length: LEADING_DAYS }, (_, index) => (
                    <span key={`empty-${String(index)}`} className={className('emptyDay')} aria-hidden="true" />
                  ))}
                  {Array.from({ length: DAYS_IN_MONTH }, (_, index) => {
                    const day = index + 1;
                    const dayEvents = visibleEvents.filter((event) => event.day === day);
                    const isToday = day === 16;
                    const isSelected = day === selectedDay;
                    const isBlocked = blockedDays.includes(day);
                    const weekdayIndex = (LEADING_DAYS + day - 1) % 7;
                    const isWeekend = weekdayIndex === 0 || weekdayIndex === 6;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`${className('dayCell')} ${isSelected ? className('selectedDay') : ''} ${isToday ? className('todayDay') : ''} ${isWeekend ? className('weekendDay') : ''} ${blocking ? className('blockingDay') : ''}`}
                        aria-label={`${formatDate(day)}${dayEvents.length ? `, ${String(dayEvents.length)} events` : ''}`}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => { selectDay(day); }}
                      >
                        <span className={className('dayNumber')}>{day}</span>
                        {isBlocked ? <span className={className('blockedChip')}><TimeIcon size={11} aria-hidden="true" /> Venue hold</span> : null}
                        {dayEvents.map((event) => (
                          <span
                            key={event.id}
                            role="button"
                            tabIndex={0}
                            className={`${className('eventChip')} ${className(`event${event.tone}`)} ${selectedEventId === event.id ? className('eventSelected') : ''}`}
                            onClick={(eventClick) => {
                              eventClick.stopPropagation();
                              setSelectedDay(event.day);
                              setSelectedEventId(event.id);
                            }}
                            onKeyDown={(eventKey) => {
                              if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                                eventKey.preventDefault();
                                setSelectedDay(event.day);
                                setSelectedEventId(event.id);
                              }
                            }}
                            aria-label={`${event.title}, ${event.time}`}
                          >
                            <span>{event.time}</span>
                            <strong>{event.title}</strong>
                          </span>
                        ))}
                      </button>
                    );
                  })}
                </div>
              </div>

              <aside className={className('agendaPanel')} aria-label="Selected day agenda">
                <div className={className('agendaHeader')}>
                  <div>
                    <span className={className('agendaLabel')}>{selectedDay === 16 ? 'Today' : 'Selected day'}</span>
                    <h2>July {selectedDay}</h2>
                  </div>
                  <CalendarIcon size={19} aria-hidden="true" />
                </div>
                {selectedDayEvents.length > 0 ? (
                  <div className={className('agendaEvents')}>
                    {selectedDayEvents.map((event) => (
                      <button key={event.id} type="button" className={className('agendaEvent')} onClick={() => { setSelectedEventId(event.id); }}>
                        <span className={`${className('agendaDot')} ${className(`event${event.tone}`)}`} />
                        <span><strong>{event.title}</strong><small>{event.time} · {event.venue}</small></span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={className('emptyAgenda')}>No events scheduled for this day.</p>
                )}
                {selectedEvent ? (
                  <div className={className('eventInspector')}>
                    <span className={className('inspectorLabel')}>Selected event</span>
                    <strong>{selectedEvent.title}</strong>
                    <span>{selectedEvent.time} · {selectedEvent.venue}</span>
                    <span className={`${className('statusPill')} ${className(`status${selectedEvent.status}`)}`}>{selectedEvent.status}</span>
                    <button type="button" className={className('openEventButton')}><ExternalLinkIcon size={14} aria-hidden="true" /> Open event</button>
                  </div>
                ) : null}
                <div className={className('agendaFooter')}>
                  <ArchiveIcon size={16} aria-hidden="true" />
                  <span>{String(CALENDAR_EVENTS.length)} events this month</span>
                </div>
              </aside>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
