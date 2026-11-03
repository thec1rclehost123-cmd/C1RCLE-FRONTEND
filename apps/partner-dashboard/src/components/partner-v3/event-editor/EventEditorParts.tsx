import Image from 'next/image';
import { useRef, useState } from 'react';

import { EVENT_GENRE_OPTIONS } from '@/lib/events/event-editor-data';

import { canSelectEventDate } from './event-date-selection';
import styles from './event-editor.module.css';
import { EventTimeTimeline } from './EventTimeTimeline';

import type {
  CalendarDay,
  CalendarMonth,
  EventEditorData,
  EventEditorDraft,
  EventEditorTicketTier,
  PartnerEventArtwork,
} from '@/data/partner-data-source';
import type { ChangeEvent, ReactNode } from 'react';

type DraftUpdate = (values: Partial<EventEditorDraft>) => void;

export function EventPosterUploader({
  artwork,
  artworkOptions,
  onArtwork,
  onUpload,
}: {
  readonly artwork: PartnerEventArtwork;
  readonly artworkOptions: readonly PartnerEventArtwork[];
  readonly onArtwork: (artwork: PartnerEventArtwork) => void;
  readonly onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const isImage = artwork.type === 'image';
  return (
    <section className={styles['card']} aria-labelledby="poster-heading">
      <div id="poster-heading" className={styles['cardTitle']}>
        Poster
      </div>
      <div className={styles['posterEditor']}>
        <div className={styles['posterUpload']}>
          {isImage ? (
            <Image fill sizes="132px" src={artwork.value} alt={artwork.alt ?? 'Event artwork'} />
          ) : (
            <div
              className={[styles['posterGradient'], gradientClass(artwork.value)].join(' ')}
              data-gradient={artwork.value}
            />
          )}
          <span className={styles['posterOverlay']}>4:5 poster</span>
        </div>
        <div className={styles['posterCopy']}>
          <strong>Drag & drop or click to upload</strong>
          <span>
            Used as the blurred background wherever this event appears — gallery, event page, and
            Overview.
          </span>
          <label className={styles['uploadButton']}>
            Replace poster
            <input type="file" accept="image/*" onChange={onUpload} />
          </label>
          <div className={styles['artworkChoices']} aria-label="Artwork choices">
            {artworkOptions.map((option, index) => (
              <button
                className={styles['artworkChoice']}
                key={`${option.type}-${option.value}-${String(index)}`}
                type="button"
                aria-label={`Use artwork ${String(index + 1)}`}
                onClick={() => {
                  onArtwork(option);
                }}
              >
                {option.type === 'image' ? (
                  <Image fill sizes="34px" src={option.value} alt="" />
                ) : (
                  <span className={gradientClass(option.value)} />
                )}
              </button>
            ))}
          </div>
          <span>Uploaded posters are saved to the event when you publish it.</span>
        </div>
      </div>
    </section>
  );
}

export function EventBasicDetails({
  draft,
  data,
  editMode,
  showDescription = false,
  showSchedule = true,
  update,
  onArtistAdd,
  onArtistRemove,
  genrePickerOpen,
  onToggleGenres,
}: {
  readonly draft: EventEditorDraft;
  readonly data: EventEditorData;
  readonly editMode: boolean;
  readonly showDescription?: boolean;
  readonly showSchedule?: boolean;
  readonly update: DraftUpdate;
  readonly onArtistAdd: (name: string) => void;
  readonly onArtistRemove: (name: string) => void;
  readonly genrePickerOpen: boolean;
  readonly onToggleGenres: () => void;
}) {
  const [artistInput, setArtistInput] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const addCustomGenre = () => {
    const entered = customGenre.trim();
    const genre =
      [...data.genres, ...EVENT_GENRE_OPTIONS, ...draft.genres].find(
        (item) => item.toLocaleLowerCase() === entered.toLocaleLowerCase(),
      ) ?? entered;
    if (!genre || genre.length > 40) return;
    if (!draft.genres.some((item) => item.toLocaleLowerCase() === genre.toLocaleLowerCase())) {
      update({ genres: [...draft.genres, genre] });
    }
    setCustomGenre('');
    onToggleGenres();
  };
  return (
    <section className={styles['card']} aria-labelledby="basics-heading">
      <div id="basics-heading" className={styles['cardTitle']}>
        The basics
      </div>
      <div className={styles['fieldStack']}>
        <div className={styles['field']}>
          <label htmlFor="event-name">Event name</label>
          <input
            id="event-name"
            value={draft.name}
            onChange={(event) => {
              update({ name: event.target.value });
            }}
            placeholder="e.g. Neon Nights: Afrobeats Edition"
          />
        </div>
        <div className={styles['titleFontPicker']} role="group" aria-label="Event title font">
          {(
            [
              'classic',
              'eclectic',
              'fancy',
              'digital',
              'literary',
              'impact',
              'modern',
              'condensed',
            ] as const
          ).map((font) => (
            <button
              key={font}
              type="button"
              data-title-font={font}
              aria-pressed={(draft.media?.titleFont ?? 'classic') === font}
              onClick={() => {
                update({
                  media: {
                    youtubeUrl: '',
                    gallery: [],
                    spotlights: [],
                    ...draft.media,
                    titleFont: font,
                  },
                });
              }}
            >
              {font.charAt(0).toUpperCase() + font.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles['field']}>
          <label htmlFor="event-visibility">Who can find this event?</label>
          <select
            id="event-visibility"
            value={draft.visibilityMode ?? 'public'}
            onChange={(event) => {
              update({
                visibilityMode: event.target.value as 'public' | 'unlisted' | 'code' | 'invited',
              });
            }}
          >
            <option value="public">Public · listed in discovery</option>
            <option value="unlisted">Unlisted · direct link only</option>
            <option value="code">Private · access code required</option>
            <option value="invited">Private · named invitation required</option>
          </select>
        </div>
        <div className={styles['field']}>
          <label htmlFor="event-address-disclosure">
            When should guests see the full venue address?
          </label>
          <select
            id="event-address-disclosure"
            value={
              draft.addressDisclosure ??
              (draft.visibilityMode === 'code' || draft.visibilityMode === 'invited'
                ? 'hidden'
                : 'public')
            }
            onChange={(event) => {
              update({
                addressDisclosure: event.target.value as 'public' | 'after_grant' | 'hidden',
              });
            }}
          >
            <option value="public">Public · visible on event detail</option>
            <option value="after_grant">After private event access is granted</option>
            <option value="hidden">Keep the full address hidden</option>
          </select>
        </div>
        {showSchedule ? (
          <div className={styles['threeColumns']}>
            <div className={styles['field']}>
              <label htmlFor="event-date">
                Date {editMode ? <span aria-label="Date locked"> · locked</span> : null}
              </label>
              <input id="event-date" value={draft.dateLabel} readOnly disabled={editMode} />
            </div>
            <div className={styles['field']}>
              <label htmlFor="event-time">
                Start time {editMode ? <span aria-label="Time locked"> · locked</span> : null}
              </label>
              <input
                id="event-time"
                value={draft.time}
                onChange={(event) => {
                  update({ time: event.target.value });
                }}
                disabled={editMode}
                placeholder="e.g. 9:00 PM"
              />
            </div>
            <div className={styles['field']}>
              <label htmlFor="event-end-time">
                End time {editMode ? <span aria-label="Time locked"> · locked</span> : null}
              </label>
              <input
                id="event-end-time"
                value={draft.endTime ?? ''}
                onChange={(event) => {
                  update({ endTime: event.target.value });
                }}
                disabled={editMode}
                placeholder="e.g. 3:00 AM"
              />
            </div>
          </div>
        ) : null}
        {editMode && showSchedule ? (
          <div className={styles['muted']}>Date and time can’t be changed after publishing.</div>
        ) : null}
        <div className={styles['field']}>
          <div className={styles['fieldLabel']}>Genre / vibe</div>
          <div className={styles['chips']}>
            {[
              ...new Set([
                ...(data.genres.length ? data.genres : EVENT_GENRE_OPTIONS),
                ...draft.genres,
              ]),
            ].map((genre) => (
              <button
                className={[
                  styles['chip'],
                  draft.genres.includes(genre) ? styles['chipSelected'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={genre}
                type="button"
                aria-pressed={draft.genres.includes(genre)}
                onClick={() => {
                  update({
                    genres: draft.genres.includes(genre)
                      ? draft.genres.filter((item) => item !== genre)
                      : [...draft.genres, genre],
                  });
                }}
              >
                {genre}
              </button>
            ))}
            <button
              className={[styles['chip'], styles['genreAdd']].join(' ')}
              type="button"
              aria-label="Add custom genre"
              aria-expanded={genrePickerOpen}
              onClick={onToggleGenres}
            >
              +
            </button>
          </div>
          {genrePickerOpen ? (
            <div className={styles['inlineInput']}>
              <input
                aria-label="Custom genre"
                placeholder="Enter a genre"
                maxLength={40}
                value={customGenre}
                onChange={(event) => {
                  setCustomGenre(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCustomGenre();
                  }
                  if (event.key === 'Escape') {
                    setCustomGenre('');
                    onToggleGenres();
                  }
                }}
              />
              <button
                className={styles['outlineButton']}
                type="button"
                onClick={addCustomGenre}
                disabled={!customGenre.trim()}
              >
                Add
              </button>
            </div>
          ) : null}
        </div>
        <div className={styles['field']}>
          <label htmlFor="artist-input">Mentioned artists</label>
          {draft.artists.length ? (
            <div className={styles['artistList']}>
              {draft.artists.map((artist) => (
                <div className={styles['artistRow']} key={artist}>
                  <span className={styles['artistAvatar']}>{initialsFor(artist)}</span>
                  <span className={styles['artistName']}>{artist}</span>
                  <button
                    className={styles['removeButton']}
                    type="button"
                    aria-label={`Remove ${artist}`}
                    onClick={() => {
                      onArtistRemove(artist);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className={styles['inlineInput']}>
            <input
              id="artist-input"
              value={artistInput}
              onChange={(event) => {
                setArtistInput(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onArtistAdd(artistInput);
                  setArtistInput('');
                }
              }}
              placeholder="Search or type an artist name, press Enter"
            />
            <button
              className={styles['outlineButton']}
              type="button"
              onClick={() => {
                onArtistAdd(artistInput);
                setArtistInput('');
              }}
            >
              Add
            </button>
          </div>
        </div>
        {showDescription ? (
          <div className={styles['field']}>
            <label htmlFor="event-description">Event description</label>
            <textarea
              id="event-description"
              value={draft.description}
              maxLength={2000}
              rows={4}
              onChange={(event) => {
                update({ description: event.target.value });
              }}
              placeholder="Tell guests what to expect at this event."
            />
            <small>{draft.description.length} / 2,000</small>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function EventDateTimeSection({
  months,
  selectedDate,
  time,
  endTime,
  selectedSlotId,
  editorRole,
  onDate,
  onTime,
  onEndTime,
  onSlot,
}: {
  readonly months: readonly CalendarMonth[];
  readonly selectedDate: string;
  readonly time?: string;
  readonly endTime?: string;
  readonly selectedSlotId?: string;
  readonly editorRole: 'venue' | 'host';
  readonly onDate: (day: { readonly date: string; readonly day: number }) => void;
  readonly onTime?: (value: string) => void;
  readonly onEndTime?: (value: string) => void;
  readonly onSlot?: (id: string, label: string) => void;
}) {
  const selectedMonthIndex = months.findIndex((month) =>
    month.days.some((day) => day.date === selectedDate),
  );
  const referenceMonthIndex = months.findIndex((month) => month.key === '2026-08');
  const [monthIndex, setMonthIndex] = useState(
    Math.max(0, selectedMonthIndex >= 0 ? selectedMonthIndex : referenceMonthIndex),
  );
  const month = months[monthIndex] ?? months[0];
  if (!month) return null;
  const cells: (CalendarDay | null)[] = [
    ...Array.from({ length: month.firstDayOffset }, () => null),
    ...month.days,
  ];
  const monthHasOpenHostSlots = month.days.some((day) =>
    day.slots.some((slot) => slot.status === 'available'),
  );
  return (
    <section className={styles['card']} aria-labelledby="date-heading">
      <div className={styles['calendarHeader']}>
        <div>
          <div id="date-heading" className={styles['cardTitle']}>
            Pick a date
          </div>
          <div className={styles['muted']}>
            {editorRole === 'host'
              ? 'Choose a date, then select an available time.'
              : 'Choose an open date.'}
          </div>
        </div>
        <div className={styles['calendarControls']}>
          <button
            type="button"
            aria-label="Previous month"
            disabled={monthIndex === 0}
            onClick={() => {
              setMonthIndex(Math.max(0, monthIndex - 1));
            }}
          >
            ‹
          </button>
          <span>{month.label.toUpperCase()}</span>
          <button
            type="button"
            aria-label="Next month"
            disabled={monthIndex === months.length - 1}
            onClick={() => {
              setMonthIndex(Math.min(months.length - 1, monthIndex + 1));
            }}
          >
            ›
          </button>
        </div>
      </div>
      <div className={styles['weekdays']}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={styles['calendarGrid']}>
        {cells.map((day, index) =>
          day ? (
            <button
              className={[
                styles['calendarDay'],
                day.date === selectedDate ? styles['calendarDaySelected'] : '',
                !canSelectEventDate(
                  day.state,
                  editorRole,
                  day.slots.some((slot) => slot.status === 'available'),
                )
                  ? styles['calendarDayBooked']
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={day.date}
              type="button"
              disabled={
                !canSelectEventDate(
                  day.state,
                  editorRole,
                  day.slots.some((slot) => slot.status === 'available'),
                )
              }
              onClick={() => {
                onDate(day);
              }}
            >
              {day.day}
              {day.slots.some((slot) => slot.status === 'available') ? (
                <i className={styles['calendarDot']} />
              ) : day.state === 'confirmed' || day.state === 'pending' ? (
                <i
                  className={[
                    styles['calendarDot'],
                    day.state === 'confirmed' ? styles['calendarDotBooked'] : '',
                    day.state === 'pending' ? styles['calendarDotPending'] : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              ) : null}
            </button>
          ) : (
            <span aria-hidden="true" key={`empty-${String(index)}`} />
          ),
        )}
      </div>
      <div className={styles['calendarLegend']}>
        <span>
          <i />
          Open time
        </span>
        <span>
          <i className={styles['booked']} />
          Booked
        </span>
        <span>
          <i className={styles['pending']} />
          Pending
        </span>
      </div>
      {editorRole === 'host' && !monthHasOpenHostSlots ? (
        <div className={styles['calendarEmpty']} role="status">
          No free time remains this month. Choose another month.
        </div>
      ) : null}
      {onTime && onEndTime && editorRole === 'venue' ? (
        <div className={styles['twoColumns']}>
          <div className={styles['field']}>
            <label htmlFor="event-time">Start time</label>
            <input
              id="event-time"
              value={time ?? ''}
              onChange={(event) => {
                onTime(event.target.value);
              }}
              placeholder="e.g. 9:00 PM"
            />
          </div>
          <div className={styles['field']}>
            <label htmlFor="event-end-time">End time (optional)</label>
            <input
              id="event-end-time"
              value={endTime ?? ''}
              onChange={(event) => {
                onEndTime(event.target.value);
              }}
              placeholder="e.g. 1:00 AM"
            />
          </div>
        </div>
      ) : null}
      {editorRole === 'host' &&
      selectedDate.startsWith(month.key) &&
      onSlot &&
      onTime &&
      onEndTime ? (
        <EventTimeTimeline
          key={selectedDate}
          date={selectedDate}
          slots={month.days.find((day) => day.date === selectedDate)?.slots ?? []}
          time={time ?? ''}
          endTime={endTime ?? ''}
          {...(selectedSlotId ? { selectedSlotId } : {})}
          onSelect={(slot, start, end) => {
            onSlot(slot.id, slot.label);
            onTime(start);
            onEndTime(end);
          }}
        />
      ) : null}
    </section>
  );
}

export function TicketTierEditor({
  tiers,
  onChange,
}: {
  readonly tiers: readonly EventEditorTicketTier[];
  readonly onChange: (tiers: readonly EventEditorTicketTier[]) => void;
}) {
  const [ticketMode, setTicketMode] = useState<'rsvp' | 'paid' | null>(() =>
    tiers.length ? (tiers.every((tier) => tier.accessType === 'RSVP') ? 'rsvp' : 'paid') : null,
  );
  const savedModes = useRef<Partial<Record<'rsvp' | 'paid', readonly EventEditorTicketTier[]>>>({});
  const newTier = (mode: 'rsvp' | 'paid'): EventEditorTicketTier => ({
    id: `tier-${crypto.randomUUID()}`,
    name: mode === 'rsvp' ? 'Free RSVP' : 'General Entry',
    price: 0,
    quantity: 50,
    maxPerOrder: mode === 'rsvp' ? 1 : 10,
    accessType: mode === 'rsvp' ? 'RSVP' : 'ENTRY',
    ...(mode === 'rsvp' ? { guestCount: 1, commissionEligible: false } : {}),
  });
  const chooseMode = (mode: 'rsvp' | 'paid') => {
    if (ticketMode === mode) return;
    if (ticketMode) savedModes.current[ticketMode] = tiers;
    setTicketMode(mode);
    onChange(savedModes.current[mode] ?? [newTier(mode)]);
  };
  const modeChoice = (
    <fieldset className={styles['ticketModeChoice']}>
      <legend>How will guests join?</legend>
      <div>
        <label>
          <input
            type="radio"
            name="event-ticket-mode"
            value="rsvp"
            checked={ticketMode === 'rsvp'}
            onChange={() => {
              chooseMode('rsvp');
            }}
          />
          <span>RSVP</span>
        </label>
        <label>
          <input
            type="radio"
            name="event-ticket-mode"
            value="paid"
            checked={ticketMode === 'paid'}
            onChange={() => {
              chooseMode('paid');
            }}
          />
          <span>Sell tickets</span>
        </label>
      </div>
    </fieldset>
  );
  const [editingTier, setEditingTier] = useState<EventEditorTicketTier | null>(null);
  const [benefitInputs, setBenefitInputs] = useState<Record<string, string>>({});
  const purchasableUnits = (tier: EventEditorTicketTier) =>
    tier.admissionMode === 'per_person'
      ? Math.floor(tier.quantity / Math.max(1, tier.guestCount ?? 1))
      : tier.quantity;
  const soldOut = tiers.reduce((total, tier) => total + tier.price * purchasableUnits(tier), 0);
  const updateTier = (id: string, values: Partial<EventEditorTicketTier>) => {
    setEditingTier((current) => (current?.id === id ? { ...current, ...values } : current));
  };
  if (!ticketMode) return <section className={styles['card']}>{modeChoice}</section>;
  return (
    <section className={styles['card']} aria-labelledby="tickets-heading">
      {modeChoice}
      <div className={styles['cardTitleRow']}>
        <div id="tickets-heading" className={styles['cardTitle']}>
          {ticketMode === 'rsvp' ? 'RSVP capacity' : 'Ticket tiers'}
        </div>
        {ticketMode === 'paid' ? (
          <span className={styles['totalLabel']}>{formatMoney(soldOut)} if sold out</span>
        ) : null}
      </div>
      <div className={styles['compactTierList']}>
        {tiers.map((tier) => (
          <div className={styles['compactTierRow']} key={tier.id}>
            <div>
              <strong>{tier.name}</strong>
              <span>
                {tier.accessType === 'RSVP' ? 'Free RSVP' : formatMoney(tier.price)} ·{' '}
                {tier.quantity} {tier.admissionMode === 'per_person' ? 'attendees' : 'tickets'}
              </span>
            </div>
            <div className={styles['tierActions']}>
              <button
                type="button"
                className={styles['tierEdit']}
                aria-label={`Edit ${tier.name}`}
                onClick={() => {
                  setEditingTier({ ...tier });
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="m16 3 5 5L8 21H3v-5L16 3Z" />
                  <path d="m13 6 5 5" />
                </svg>
              </button>
              <button
                type="button"
                className={styles['tierEdit']}
                aria-label={`Remove ${tier.name}`}
                onClick={() => {
                  onChange(tiers.filter((item) => item.id !== tier.id));
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      {editingTier ? (
        <dialog
          className={styles['tierDialog']}
          aria-label="Edit ticket"
          ref={(node) => {
            if (node && !node.open) node.showModal();
          }}
          onCancel={() => {
            setEditingTier(null);
            setBenefitInputs({});
          }}
        >
          <div className={styles['tierDialogHeader']}>
            <h2>Edit ticket</h2>
            <button
              type="button"
              aria-label="Close ticket editor"
              onClick={() => {
                setEditingTier(null);
                setBenefitInputs({});
              }}
            >
              ×
            </button>
          </div>
          <div className={styles['ticketList']}>
            {[editingTier].map((tier) => (
              <div key={tier.id}>
                <div className={styles['ticketRow']}>
                  <label className={styles['tierFieldLabel']}>
                    <span>Ticket template</span>
                    <select
                      aria-label="Ticket template"
                      value={
                        [
                          'General Entry',
                          'Male Stag',
                          'Free Female',
                          'Couple',
                          'VIP',
                          'Free RSVP',
                        ].includes(tier.name)
                          ? tier.name
                          : 'Custom'
                      }
                      onChange={(event) => {
                        const name = event.target.value;
                        if (name === 'Custom') {
                          updateTier(tier.id, { name: 'Custom ticket' });
                          return;
                        }
                        const free = name.startsWith('Free');
                        updateTier(tier.id, {
                          name,
                          accessType: free ? 'RSVP' : name === 'VIP' ? 'VIP' : 'ENTRY',
                          audienceType:
                            name === 'Male Stag'
                              ? 'MALE'
                              : name === 'Free Female'
                                ? 'FEMALE'
                                : name === 'Couple'
                                  ? 'COUPLE'
                                  : 'GENERAL',
                          guestCount: name === 'Couple' ? 2 : 1,
                          admissionMode: name === 'Couple' ? 'bundle' : undefined,
                          maxPerOrder: free ? 1 : 10,
                          ...(free
                            ? {
                                price: 0,
                                commissionEligible: false,
                                coverAmountPaise: 0,
                                doorPrice: undefined,
                                pricingPhases: [],
                              }
                            : { commissionEligible: true }),
                        });
                      }}
                    >
                      {(ticketMode === 'rsvp'
                        ? ['Free RSVP', 'Free Female', 'Custom']
                        : ['General Entry', 'Male Stag', 'Free Female', 'Couple', 'VIP', 'Custom']
                      ).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles['tierFieldLabel']}>
                    <span>Ticket name</span>
                    <input
                      aria-label={`${tier.name} type of ticket`}
                      value={tier.name}
                      onChange={(event) => {
                        updateTier(tier.id, { name: event.target.value });
                      }}
                      placeholder="Type or select name"
                    />
                  </label>
                  {tier.accessType !== 'RSVP' ? (
                    <label className={styles['tierFieldLabel']}>
                      <span>Price (₹)</span>
                      <input
                        aria-label={`${tier.name} price`}
                        inputMode="numeric"
                        value={String(tier.price)}
                        onChange={(event) => {
                          updateTier(tier.id, { price: numberValue(event.target.value) });
                        }}
                        placeholder="Price"
                      />
                    </label>
                  ) : (
                    <div className={styles['tierFieldLabel']}>Free RSVP</div>
                  )}
                  <label className={styles['tierFieldLabel']}>
                    <span>
                      {tier.admissionMode === 'per_person' ? 'Attendee capacity' : 'Capacity'}
                    </span>
                    <input
                      aria-label={`${tier.name} capacity`}
                      inputMode="numeric"
                      value={String(tier.quantity)}
                      onChange={(event) => {
                        updateTier(tier.id, { quantity: numberValue(event.target.value) });
                      }}
                      placeholder="Capacity"
                    />
                  </label>
                  <label className={styles['tierFieldLabel']}>
                    <span>Maximum per order</span>
                    <input
                      aria-label={`${tier.name} maximum per order`}
                      type="number"
                      min="1"
                      max={tier.accessType === 'RSVP' ? '1' : '10'}
                      readOnly={tier.accessType === 'RSVP'}
                      step="1"
                      value={String(tier.maxPerOrder ?? (tier.accessType === 'RSVP' ? 1 : 10))}
                      onChange={(event) => {
                        updateTier(tier.id, { maxPerOrder: numberValue(event.target.value) });
                      }}
                    />
                    <span className={styles['muted']}>
                      {tier.accessType === 'RSVP'
                        ? 'Free RSVPs are limited to one per order.'
                        : 'The platform limit is 10 per order.'}
                    </span>
                  </label>
                </div>
                <label className={styles['tierDescription']}>
                  Inclusions (optional)
                  <textarea
                    aria-label="Ticket description"
                    rows={3}
                    placeholder="Entry, drinks or other inclusions"
                    value={benefitInputs[tier.id] ?? (tier.benefits ?? []).join('\n')}
                    onChange={(event) => {
                      const value = event.target.value;
                      setBenefitInputs((current) => ({ ...current, [tier.id]: value }));
                      updateTier(tier.id, {
                        benefits: value
                          .split('\n')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      });
                    }}
                  />
                </label>
                <details className={styles['tierExtraSettings']}>
                  <summary>Entry & pricing options</summary>
                  <div>
                    <div className={styles['ticketOptions']}>
                      {tier.accessType !== 'RSVP' ? (
                        <label className={styles['tierFieldLabel']}>
                          <span>Event cover (₹ per attendee)</span>
                          <input
                            aria-label={`${tier.name} event cover per attendee`}
                            inputMode="decimal"
                            min="0"
                            value={String((tier.coverAmountPaise ?? 0) / 100)}
                            onChange={(event) => {
                              updateTier(tier.id, {
                                coverAmountPaise: Math.round(numberValue(event.target.value) * 100),
                              });
                            }}
                            placeholder="0"
                          />
                          <span className={styles['muted']}>
                            Charged separately from admission. Promoter commission applies to
                            admission only.
                          </span>
                        </label>
                      ) : null}
                      {tier.accessType !== 'RSVP' ? (
                        <label>
                          Tier access
                          <select
                            aria-label="Tier access"
                            value={tier.accessMode ?? 'public'}
                            onChange={(event) => {
                              updateTier(tier.id, {
                                accessMode: event.target.value as NonNullable<
                                  EventEditorTicketTier['accessMode']
                                >,
                              });
                            }}
                          >
                            <option value="public">Public</option>
                            <option value="code">Code-gated</option>
                            <option value="invited">Invitation-only</option>
                          </select>
                        </label>
                      ) : null}
                      <label>
                        Ticket type / access
                        <select
                          aria-label="Ticket type / access"
                          disabled={ticketMode === 'rsvp'}
                          value={tier.accessType ?? 'ENTRY'}
                          onChange={(event) => {
                            const accessType = event.target
                              .value as EventEditorTicketTier['accessType'];
                            updateTier(
                              tier.id,
                              accessType === 'RSVP'
                                ? {
                                    accessType,
                                    price: 0,
                                    maxPerOrder: 1,
                                    guestCount: 1,
                                    admissionMode: undefined,
                                    doorPrice: undefined,
                                    pricingPhases: [],
                                    commissionEligible: false,
                                  }
                                : {
                                    accessType,
                                    price: tier.price > 0 ? tier.price : 1000,
                                    maxPerOrder: tier.maxPerOrder ?? 10,
                                    commissionEligible: true,
                                  },
                            );
                          }}
                        >
                          {(ticketMode === 'rsvp'
                            ? ['RSVP']
                            : ['ENTRY', 'VIP', 'VVIP', 'TABLE', 'PACKAGE', 'RSVP']
                          ).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Audience
                        <select
                          aria-label="Audience"
                          value={tier.audienceType ?? 'GENERAL'}
                          onChange={(event) => {
                            updateTier(tier.id, {
                              audienceType: event.target
                                .value as EventEditorTicketTier['audienceType'],
                            });
                          }}
                        >
                          {[
                            ['GENERAL', 'General'],
                            ['MALE', 'Men'],
                            ['FEMALE', 'Women'],
                            ['COUPLE', 'Couple'],
                            ['GROUP', 'Group'],
                            ['STUDENT', 'Student'],
                            ['MEMBER', 'Member'],
                          ].map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-white/50">
                          Guests confirm eligibility at checkout; the Venue may verify it at entry.
                        </span>
                      </label>
                      <label>
                        Guests
                        <input
                          aria-label="Guests"
                          type="number"
                          min="1"
                          value={String(tier.guestCount ?? 1)}
                          onChange={(event) => {
                            const guestCount = numberValue(event.target.value);
                            updateTier(tier.id, {
                              guestCount,
                              ...(guestCount <= 1 ? { admissionMode: undefined } : {}),
                            });
                          }}
                        />
                      </label>
                      {tier.accessType !== 'RSVP' && (tier.guestCount ?? 1) > 1 ? (
                        <label>
                          Admission issuance
                          <select
                            aria-label="Admission issuance"
                            value={tier.admissionMode ?? 'bundle'}
                            onChange={(event) => {
                              updateTier(tier.id, {
                                admissionMode: event.target
                                  .value as EventEditorTicketTier['admissionMode'],
                              });
                            }}
                          >
                            <option value="bundle">One group pass</option>
                            <option value="per_person">Separate pass for each attendee</option>
                          </select>
                        </label>
                      ) : null}
                      {tier.accessType !== 'RSVP' ? (
                        <label>
                          Door price (₹)
                          <input
                            aria-label="Door price (₹)"
                            type="number"
                            min="0"
                            value={tier.doorPrice != null ? String(tier.doorPrice) : ''}
                            onChange={(event) => {
                              updateTier(tier.id, {
                                doorPrice:
                                  event.target.value === ''
                                    ? undefined
                                    : numberValue(event.target.value),
                              });
                            }}
                          />
                        </label>
                      ) : null}
                      <label>
                        Max per user
                        <input
                          aria-label="Max per user"
                          type="number"
                          min="1"
                          value={tier.maxPerUser != null ? String(tier.maxPerUser) : ''}
                          onChange={(event) => {
                            updateTier(tier.id, {
                              maxPerUser:
                                event.target.value === ''
                                  ? undefined
                                  : numberValue(event.target.value),
                            });
                          }}
                        />
                      </label>
                    </div>
                    {tier.accessType === 'TABLE' ? (
                      <div className={[styles['ticketOptions'], styles['tableOptions']].join(' ')}>
                        <label>
                          Table capacity
                          <input
                            aria-label="Table capacity"
                            type="number"
                            min="1"
                            value={String(tier.tableConfig?.capacity ?? 1)}
                            onChange={(event) => {
                              updateTier(tier.id, {
                                tableConfig: {
                                  capacity: numberValue(event.target.value),
                                  minimumSpendPaise: tier.tableConfig?.minimumSpendPaise ?? 0,
                                  redeemableAmountPaise:
                                    tier.tableConfig?.redeemableAmountPaise ?? 0,
                                  tableCount: tier.tableConfig?.tableCount ?? tier.quantity,
                                },
                              });
                            }}
                          />
                        </label>
                        <label>
                          Minimum spend (₹)
                          <input
                            aria-label="Minimum spend (₹)"
                            type="number"
                            min="0"
                            value={String((tier.tableConfig?.minimumSpendPaise ?? 0) / 100)}
                            onChange={(event) => {
                              updateTier(tier.id, {
                                tableConfig: {
                                  capacity: tier.tableConfig?.capacity ?? 1,
                                  minimumSpendPaise: numberValue(event.target.value) * 100,
                                  redeemableAmountPaise:
                                    tier.tableConfig?.redeemableAmountPaise ?? 0,
                                  tableCount: tier.tableConfig?.tableCount ?? tier.quantity,
                                },
                              });
                            }}
                          />
                        </label>
                        <label>
                          Redeemable (₹)
                          <input
                            aria-label="Redeemable (₹)"
                            type="number"
                            min="0"
                            value={String((tier.tableConfig?.redeemableAmountPaise ?? 0) / 100)}
                            onChange={(event) => {
                              updateTier(tier.id, {
                                tableConfig: {
                                  capacity: tier.tableConfig?.capacity ?? 1,
                                  minimumSpendPaise: tier.tableConfig?.minimumSpendPaise ?? 0,
                                  redeemableAmountPaise: numberValue(event.target.value) * 100,
                                  tableCount: tier.tableConfig?.tableCount ?? tier.quantity,
                                },
                              });
                            }}
                          />
                        </label>
                      </div>
                    ) : null}
                    {tier.accessType !== 'RSVP' ? (
                      <div className={styles['pricingPhasesBlock']}>
                        <div className={styles['pricingPhasesHeader']}>
                          <div className={styles['cardTitle']}>Pricing phases</div>
                          <span className={styles['pricingPhasesSub']}>
                            Optional — use when the price changes by date
                          </span>
                        </div>
                        {(tier.pricingPhases ?? []).length > 0 ? (
                          <div className={styles['phaseList']}>
                            {(tier.pricingPhases ?? []).map((phase) => (
                              <div className={styles['phaseRow']} key={phase.id}>
                                <div className={styles['phaseField']}>
                                  <label
                                    htmlFor={`phase-name-${phase.id}`}
                                    className={styles['phaseLabel']}
                                  >
                                    Phase name
                                  </label>
                                  <input
                                    id={`phase-name-${phase.id}`}
                                    aria-label={`${phase.name} phase name`}
                                    value={phase.name}
                                    onChange={(event) => {
                                      updateTier(tier.id, {
                                        pricingPhases: (tier.pricingPhases ?? []).map((item) =>
                                          item.id === phase.id
                                            ? { ...item, name: event.target.value }
                                            : item,
                                        ),
                                      });
                                    }}
                                  />
                                </div>
                                <div className={styles['phaseField']}>
                                  <label
                                    htmlFor={`phase-price-${phase.id}`}
                                    className={styles['phaseLabel']}
                                  >
                                    Price (₹)
                                  </label>
                                  <input
                                    id={`phase-price-${phase.id}`}
                                    aria-label={`${phase.name} phase price`}
                                    type="number"
                                    min="0"
                                    value={String(phase.priceInPaise / 100)}
                                    onChange={(event) => {
                                      updateTier(tier.id, {
                                        pricingPhases: (tier.pricingPhases ?? []).map((item) =>
                                          item.id === phase.id
                                            ? {
                                                ...item,
                                                priceInPaise: numberValue(event.target.value) * 100,
                                              }
                                            : item,
                                        ),
                                      });
                                    }}
                                  />
                                </div>
                                <div className={styles['phaseField']}>
                                  <label
                                    htmlFor={`phase-start-${phase.id}`}
                                    className={styles['phaseLabel']}
                                  >
                                    Start date (DD-MM)
                                  </label>
                                  <input
                                    id={`phase-start-${phase.id}`}
                                    aria-label={`${phase.name} phase start date`}
                                    placeholder="DD-MM"
                                    inputMode="numeric"
                                    maxLength={5}
                                    value={phase.startDate}
                                    onChange={(event) => {
                                      updateTier(tier.id, {
                                        pricingPhases: (tier.pricingPhases ?? []).map((item) =>
                                          item.id === phase.id
                                            ? { ...item, startDate: event.target.value }
                                            : item,
                                        ),
                                      });
                                    }}
                                  />
                                </div>
                                <div className={styles['phaseField']}>
                                  <label
                                    htmlFor={`phase-end-${phase.id}`}
                                    className={styles['phaseLabel']}
                                  >
                                    End date (DD-MM)
                                  </label>
                                  <input
                                    id={`phase-end-${phase.id}`}
                                    aria-label={`${phase.name} phase end date`}
                                    placeholder="DD-MM"
                                    inputMode="numeric"
                                    maxLength={5}
                                    value={phase.endDate}
                                    onChange={(event) => {
                                      updateTier(tier.id, {
                                        pricingPhases: (tier.pricingPhases ?? []).map((item) =>
                                          item.id === phase.id
                                            ? { ...item, endDate: event.target.value }
                                            : item,
                                        ),
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <button
                          className={styles['outlineButton']}
                          type="button"
                          onClick={() => {
                            const index = (tier.pricingPhases ?? []).length + 1;
                            updateTier(tier.id, {
                              pricingPhases: [
                                ...(tier.pricingPhases ?? []),
                                {
                                  id: `phase-${String(index)}`,
                                  name: `Phase ${String(index)}`,
                                  priceInPaise: tier.price * 100,
                                  startDate: '',
                                  endDate: '',
                                  quantity: null,
                                },
                              ],
                            });
                          }}
                        >
                          + Add pricing phase
                        </button>
                      </div>
                    ) : (
                      <p>RSVP tickets have no price, phases, or commission.</p>
                    )}
                    {tier.accessType !== 'RSVP' && (tier.accessMode ?? 'public') !== 'public' ? (
                      <p className={styles['muted']}>
                        Restricted tiers stay unavailable until their access code or verified
                        invitation flow is configured.
                      </p>
                    ) : null}
                  </div>
                </details>
              </div>
            ))}
          </div>

          <div className={styles['tierDialogFooter']}>
            {' '}
            {tiers.some((tier) => tier.id === editingTier.id) ? (
              <button
                type="button"
                className={styles['tierDelete']}
                onClick={() => {
                  onChange(tiers.filter((tier) => tier.id !== editingTier.id));
                  setEditingTier(null);
                  setBenefitInputs({});
                }}
              >
                Remove ticket
              </button>
            ) : null}
            <button
              type="button"
              className={styles['outlineButton']}
              onClick={() => {
                setEditingTier(null);
                setBenefitInputs({});
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles['primaryButton']}
              onClick={() => {
                onChange(
                  tiers.some((tier) => tier.id === editingTier.id)
                    ? tiers.map((tier) => (tier.id === editingTier.id ? editingTier : tier))
                    : [...tiers, editingTier],
                );
                setEditingTier(null);
                setBenefitInputs({});
              }}
            >
              Save ticket
            </button>
          </div>
        </dialog>
      ) : null}
      <button
        className={styles['outlineButton']}
        type="button"
        onClick={() => {
          setEditingTier(newTier(ticketMode));
        }}
      >
        + Add ticket tier
      </button>
    </section>
  );
}

export function EventAdvancedSettings({
  draft,
  update,
  role = 'venue',
}: {
  readonly draft: EventEditorDraft;
  readonly update: DraftUpdate;
  readonly role?: 'venue' | 'host' | 'promoter';
}) {
  const promos =
    draft.promoCodeSettings ??
    draft.promoCodes.map((code, index) => ({
      id: `promo-${String(index)}`,
      code,
      discountType: 'percent' as const,
      discountValue: 0,
      quantity: null,
      endsAt: '',
      fundingOwner: role === 'host' ? ('host' as const) : ('venue' as const),
    }));
  const setPromos = (next: NonNullable<EventEditorDraft['promoCodeSettings']>) => {
    update({ promoCodeSettings: next, promoCodes: next.map((promo) => promo.code) });
  };
  return (
    <section className={styles['advancedSetup']} aria-labelledby="advanced-heading">
      <h2 id="advanced-heading">Advanced setup</h2>
      <div className={styles['guestlistSetting']}>
        <h3>Guestlist</h3>
        <p>Names and photos stay private unless a guest explicitly opts in.</p>
        <span>Public guestlist coming soon — guest opt-in is not connected yet.</span>
      </div>
      <div className={styles['comingSoonRow']}>
        <h3>Tables</h3>
        <span>Coming soon</span>
      </div>
      <div className={styles['promoHeading']}>
        <h3>Promo codes</h3>
        <button
          type="button"
          className={styles['outlineButton']}
          onClick={() => {
            setPromos([
              ...promos,
              {
                id: crypto.randomUUID(),
                code: '',
                discountType: 'percent',
                discountValue: 0,
                quantity: null,
                endsAt: '',
                fundingOwner: role === 'host' ? 'host' : 'venue',
              },
            ]);
          }}
        >
          + Add promo code
        </button>
      </div>
      {promos.map((promo, index) => {
        const change = (values: Partial<typeof promo>) => {
          setPromos(promos.map((item) => (item.id === promo.id ? { ...item, ...values } : item)));
        };
        return (
          <div className={styles['promoEditor']} key={promo.id}>
            <div className={styles['promoHeading']}>
              <strong>Promo code {index + 1}</strong>
              <button
                type="button"
                className={styles['tierEdit']}
                aria-label={`Remove promo code ${String(index + 1)}`}
                onClick={() => {
                  setPromos(promos.filter((item) => item.id !== promo.id));
                }}
              >
                ×
              </button>
            </div>
            <div className={styles['promoFields']}>
              <label>
                Code
                <input
                  aria-label={`Promo code ${String(index + 1)}`}
                  maxLength={40}
                  value={promo.code}
                  onChange={(event) => {
                    change({ code: event.target.value.toUpperCase().replace(/\s/g, '') });
                  }}
                  placeholder="e.g. EARLY10"
                />
              </label>
              <label>
                Discount type
                <select
                  value={promo.discountType}
                  aria-label={`Promo ${String(index + 1)} discount type`}
                  onChange={(event) => {
                    change({ discountType: event.target.value as 'percent' | 'fixed' });
                  }}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Amount (₹)</option>
                </select>
              </label>
              <label>
                Discount {promo.discountType === 'percent' ? '(%)' : '(₹)'}
                <input
                  type="number"
                  min="1"
                  max={promo.discountType === 'percent' ? 100 : undefined}
                  step={promo.discountType === 'percent' ? 1 : '0.01'}
                  aria-label={`Promo ${String(index + 1)} discount`}
                  value={promo.discountValue || ''}
                  onChange={(event) => {
                    change({ discountValue: Number(event.target.value) });
                  }}
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  step="1"
                  aria-label={`Promo ${String(index + 1)} quantity`}
                  placeholder="Unlimited"
                  value={promo.quantity ?? ''}
                  onChange={(event) => {
                    change({
                      quantity: event.target.value === '' ? null : Number(event.target.value),
                    });
                  }}
                />
              </label>
              <label>
                Promo ends (IST)
                <input
                  type="datetime-local"
                  aria-label={`Promo ${String(index + 1)} ends`}
                  value={promo.endsAt}
                  onChange={(event) => {
                    change({ endsAt: event.target.value });
                  }}
                />
              </label>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function EventPromoterSelector({
  data,
  draft,
  update,
}: {
  readonly data: EventEditorData;
  readonly draft: EventEditorDraft;
  readonly update: DraftUpdate;
}) {
  const [customPicker, setCustomPicker] = useState(false);
  const [pickerIds, setPickerIds] = useState<string[] | null>(null);
  const [editingPromoterId, setEditingPromoterId] = useState<string | null>(null);
  const [pendingOverride, setPendingOverride] = useState<Record<string, number>>({});
  const selected = new Set(draft.selectedPromoterIds);
  const paidTiers = draft.ticketTiers.filter((tier) => tier.accessType !== 'RSVP');
  const hasPaidTiers = paidTiers.length > 0;
  const tierCommissions = draft.tierCommissions ?? {};
  const setPromoterOverride = (id: string, enabled: boolean) => {
    if (!enabled) {
      update({
        promoterOverrides: Object.fromEntries(
          Object.entries(draft.promoterOverrides ?? {}).filter(([key]) => key !== id),
        ),
      });
      return;
    }
    setPendingOverride(
      draft.promoterOverrides?.[id] ??
        (draft.compensation === 'standard'
          ? { default: draft.commissionRate }
          : draft.compensation === 'custom'
            ? { ...tierCommissions }
            : { default: draft.salaryAmount ?? 0 }),
    );
    setEditingPromoterId(id);
  };
  const updatePromoterOverride = (_id: string, key: string, val: number) => {
    setPendingOverride((current) => ({ ...current, [key]: val }));
  };

  const selectModel = (model: EventEditorDraft['compensation']) => {
    if (model === draft.compensation) return;
    if (
      draft.compensation === 'custom' &&
      Object.keys(tierCommissions).length &&
      // eslint-disable-next-line no-alert
      !window.confirm('All custom commission mappings will be deleted and replaced. Continue?')
    )
      return;
    if (
      draft.compensation === 'salary' &&
      // eslint-disable-next-line no-alert
      !window.confirm('Salary-based payout settings will be removed. Continue?')
    )
      return;
    update({
      compensation: model,
      ...(model !== 'custom' ? { tierCommissions: {} } : {}),
      ...(model !== 'salary' ? { salaryAmount: 0, salaryNotes: '' } : {}),
    });
  };
  const gross = paidTiers.reduce((total, tier) => total + tier.price * tier.quantity, 0);

  const calculatePromoterCommission = (promoterId: string): number => {
    const override = draft.promoterOverrides?.[promoterId];
    if (draft.compensation === 'standard') {
      const rate = override?.['default'] ?? draft.commissionRate;
      return (gross * rate) / 100;
    }
    if (draft.compensation === 'custom') {
      return paidTiers.reduce((total, tier) => {
        const rate = override?.[tier.id] ?? tierCommissions[tier.id] ?? 0;
        return total + (tier.price * tier.quantity * rate) / 100;
      }, 0);
    }
    return 0;
  };

  const commission = draft.selectedPromoterIds.length
    ? draft.selectedPromoterIds.reduce((sum, id) => sum + calculatePromoterCommission(id), 0) /
      draft.selectedPromoterIds.length
    : draft.compensation === 'standard'
      ? (gross * draft.commissionRate) / 100
      : draft.compensation === 'custom'
        ? paidTiers.reduce(
            (total, tier) =>
              total + (tier.price * tier.quantity * (tierCommissions[tier.id] ?? 0)) / 100,
            0,
          )
        : 0;
  return (
    <div className={styles['formColumn']}>
      <section className={styles['card']}>
        <div className={styles['cardTitle']}>Promoters on this event</div>
        <button
          type="button"
          className={styles['outlineButton']}
          onClick={() => {
            setCustomPicker(false);
            setPickerIds([...draft.selectedPromoterIds]);
          }}
        >
          + Add promoter
        </button>
        <p className={styles['selectionCount']}>{draft.selectedPromoterIds.length} selected</p>
        {pickerIds ? (
          <dialog
            className={styles['tierDialog']}
            aria-label="Add promoters"
            ref={(node) => {
              if (node && !node.open) node.showModal();
            }}
            onCancel={() => {
              setPickerIds(null);
            }}
          >
            <div className={styles['tierDialogHeader']}>
              <h2>Add promoters</h2>
              <button
                type="button"
                aria-label="Close promoter picker"
                onClick={() => {
                  setPickerIds(null);
                }}
              >
                ×
              </button>
            </div>
            <div className={styles['promoterPicker']}>
              {data.promoters.length ? (
                <label>
                  <input
                    type="checkbox"
                    checked={data.promoters.every((promoter) => pickerIds.includes(promoter.id))}
                    onChange={(event) => {
                      setPickerIds(
                        event.target.checked ? data.promoters.map((promoter) => promoter.id) : [],
                      );
                    }}
                  />
                  Select all
                </label>
              ) : (
                <p>No partnered promoters available.</p>
              )}
              {data.promoters.map((promoter) => (
                <label key={promoter.id}>
                  <input
                    type="checkbox"
                    checked={pickerIds.includes(promoter.id)}
                    onChange={(event) => {
                      setPickerIds(
                        event.target.checked
                          ? [...pickerIds, promoter.id]
                          : pickerIds.filter((id) => id !== promoter.id),
                      );
                    }}
                  />
                  <span className={styles['promoterAvatar']}>
                    {promoter.initials || initialsFor(promoter.name)}
                  </span>
                  {promoter.name}
                </label>
              ))}
            </div>
            <div className={styles['tierDialogFooter']}>
              <button
                type="button"
                className={styles['outlineButton']}
                onClick={() => {
                  setPickerIds(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  update({
                    selectedPromoterIds: pickerIds,
                    promoterOverrides: Object.fromEntries(
                      Object.entries(draft.promoterOverrides ?? {}).filter(([id]) =>
                        pickerIds.includes(id),
                      ),
                    ),
                  });
                  setPickerIds(null);
                }}
              >
                Apply selection
              </button>
            </div>
          </dialog>
        ) : null}
      </section>
      {data.promoters.length && !hasPaidTiers ? (
        <p className={styles['muted']}>RSVP tickets do not have promoter commission.</p>
      ) : null}
      {data.promoters.length && hasPaidTiers ? (
        <>
          <section className={styles['card']}>
            <div className={styles['cardTitle']}>Promoter Compensation</div>

            <div className={styles['compGrid']}>
              {[
                ['standard', 'Standard Commission', 'One percentage for every ticket tier'],
                ['custom', 'Custom Commission', 'A commission for each ticket tier'],
                ['salary', 'Salary Based', 'Promoters are paid outside the platform'],
              ].map(([value, label, sub]) => (
                <button
                  className={[
                    styles['compChoice'],
                    draft.compensation === value ? styles['compChoiceSelected'] : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={value}
                  type="button"
                  onClick={() => {
                    selectModel(value as EventEditorDraft['compensation']);
                  }}
                >
                  <strong>
                    {label}{' '}
                    <span className={styles['infoHint']} aria-label={sub}>
                      ⓘ<span role="tooltip">{sub}</span>
                    </span>
                  </strong>
                </button>
              ))}
            </div>
            {draft.compensation === 'standard' ? (
              <div className={styles['field']}>
                <label htmlFor="global-commission">Global Commission (%)</label>
                <div className={styles['rateField']}>
                  <input
                    id="global-commission"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={String(draft.commissionRate)}
                    onChange={(event) => {
                      update({ commissionRate: numberValue(event.target.value) });
                    }}
                  />
                  <span>%</span>
                </div>
              </div>
            ) : null}
            {draft.compensation === 'custom' ? (
              <div>
                <div className={styles['customTierList']}>
                  {paidTiers.map((tier) => (
                    <div className={styles['customTierRow']} key={tier.id}>
                      <span className={styles['customTierName']}>{tier.name}</span>
                      <div className={styles['customRateField']}>
                        <input
                          id={`commission-${tier.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="Required"
                          aria-label={`${tier.name} commission percentage`}
                          value={tierCommissions[tier.id] ?? ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            const next = { ...tierCommissions };
                            if (value === '') {
                              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                              delete next[tier.id];
                            } else next[tier.id] = numberValue(value);
                            update({ tierCommissions: next });
                          }}
                        />
                        <span>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {draft.compensation === 'salary' ? (
              <div className={styles['field']}>
                <label htmlFor="salary-amount">Salary amount (₹)</label>
                <input
                  id="salary-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.salaryAmount ?? ''}
                  onChange={(event) => {
                    update({ salaryAmount: numberValue(event.target.value) });
                  }}
                />
                <label htmlFor="salary-period">Salary basis</label>
                <select
                  id="salary-period"
                  value={draft.salaryPeriod}
                  onChange={(event) => {
                    update({
                      salaryPeriod: event.target.value,
                    });
                  }}
                >
                  <option value="per_event">Per event</option>
                  <option value="per_day">Per day</option>
                  <option value="per_month">Per month</option>
                </select>
                <label htmlFor="salary-notes">Salary notes</label>
                <textarea
                  id="salary-notes"
                  value={draft.salaryNotes}
                  onChange={(event) => {
                    update({ salaryNotes: event.target.value });
                  }}
                  placeholder="All ticket sales are covered under promoter salary."
                />
                <p className={styles['muted']}>
                  Ticket commissions are disabled. Promoters receive this fixed payout.
                </p>
              </div>
            ) : null}
            <div className={styles['overrideSection']}>
              <div className={styles['cardTitle']}>Custom commissions</div>
              <p className={styles['muted']}>
                Each promoter uses Event Default unless you enable a custom override.
              </p>
              <button
                type="button"
                className={styles['outlineButton']}
                disabled={!draft.selectedPromoterIds.length}
                onClick={() => {
                  setCustomPicker(true);
                }}
              >
                + Add promoter for custom commission
              </button>
              {customPicker ? (
                <dialog
                  className={styles['tierDialog']}
                  aria-label="Choose promoter for custom commission"
                  ref={(node) => {
                    if (node && !node.open) node.showModal();
                  }}
                  onCancel={() => {
                    setCustomPicker(false);
                  }}
                >
                  <div className={styles['tierDialogHeader']}>
                    <h2>Custom commission</h2>
                    <button
                      type="button"
                      aria-label="Close custom promoter picker"
                      onClick={() => {
                        setCustomPicker(false);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles['promoterPicker']}>
                    {data.promoters
                      .filter((promoter) => selected.has(promoter.id))
                      .map((promoter) => (
                        <div className={styles['commissionPickerRow']} key={promoter.id}>
                          <button
                            type="button"
                            className={styles['compactPickerButton']}
                            onClick={() => {
                              setCustomPicker(false);
                              setPromoterOverride(promoter.id, true);
                            }}
                          >
                            {promoter.name}
                            <span>→</span>
                          </button>
                          {draft.promoterOverrides?.[promoter.id] ? (
                            <button
                              type="button"
                              className={styles['tierEdit']}
                              aria-label={`Remove custom commission for ${promoter.name}`}
                              onClick={() => {
                                setPromoterOverride(promoter.id, false);
                              }}
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </dialog>
              ) : null}
              <p className={styles['selectionCount']}>
                {Object.keys(draft.promoterOverrides ?? {}).filter((id) => selected.has(id)).length}{' '}
                custom commissions
              </p>
              <div>
                {draft.selectedPromoterIds.map((promoterId) => {
                  const promoter = data.promoters.find((item) => item.id === promoterId);
                  const displayName =
                    promoter?.name ??
                    (promoterId.length > 2 ? `Promoter ${promoterId.slice(-8)}` : promoterId);
                  const override =
                    editingPromoterId === promoterId
                      ? pendingOverride
                      : draft.promoterOverrides?.[promoterId];
                  return (
                    <div key={promoterId}>
                      {editingPromoterId === promoterId ? (
                        <dialog
                          className={styles['tierDialog']}
                          aria-label="Custom promoter commission"
                          ref={(node) => {
                            if (node && !node.open) node.showModal();
                          }}
                          onCancel={() => {
                            setEditingPromoterId(null);
                          }}
                        >
                          <div className={styles['tierDialogHeader']}>
                            <h2>{displayName}</h2>
                            <button
                              type="button"
                              aria-label="Close commission editor"
                              onClick={() => {
                                setEditingPromoterId(null);
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <div className={styles['overrideControls']}>
                            {draft.compensation === 'standard' ? (
                              <label>
                                Custom Commission Rate (%)
                                <div className={styles['rateField']}>
                                  <input
                                    aria-label={`${displayName} custom commission percentage`}
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={String(override?.['default'] ?? draft.commissionRate)}
                                    onChange={(event) => {
                                      updatePromoterOverride(
                                        promoterId,
                                        'default',
                                        numberValue(event.target.value),
                                      );
                                    }}
                                  />
                                  <span>%</span>
                                </div>
                              </label>
                            ) : draft.compensation === 'custom' ? (
                              <div>
                                <span className={styles['overrideSubhead']}>
                                  Custom Tier Commissions for {displayName}:
                                </span>
                                <div className={styles['customTierList']}>
                                  {paidTiers.map((tier) => (
                                    <div className={styles['customTierRow']} key={tier.id}>
                                      <span className={styles['customTierName']}>{tier.name}</span>
                                      <div className={styles['customRateField']}>
                                        <input
                                          aria-label={`${displayName} ${tier.name} custom commission`}
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="1"
                                          placeholder="Rate"
                                          value={
                                            override?.[tier.id] ?? tierCommissions[tier.id] ?? ''
                                          }
                                          onChange={(event) => {
                                            updatePromoterOverride(
                                              promoterId,
                                              tier.id,
                                              numberValue(event.target.value),
                                            );
                                          }}
                                        />
                                        <span>%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <label>
                                Custom Fixed Payout (₹)
                                <input
                                  aria-label={`${displayName} custom salary amount`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={String(override?.['default'] ?? draft.salaryAmount)}
                                  onChange={(event) => {
                                    updatePromoterOverride(
                                      promoterId,
                                      'default',
                                      numberValue(event.target.value),
                                    );
                                  }}
                                />
                              </label>
                            )}
                          </div>
                          <div className={styles['tierDialogFooter']}>
                            <button
                              type="button"
                              className={styles['outlineButton']}
                              onClick={() => {
                                setEditingPromoterId(null);
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                update({
                                  promoterOverrides: {
                                    ...(draft.promoterOverrides ?? {}),
                                    [promoterId]: pendingOverride,
                                  },
                                });
                                setEditingPromoterId(null);
                              }}
                            >
                              Save commission
                            </button>
                          </div>
                        </dialog>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          <section className={styles['card']}>
            <div className={styles['cardTitle']}>Revenue summary</div>
            <div className={styles['reviewRows']}>
              <div className={styles['reviewRow']}>
                <span>Estimated Gross Revenue</span>
                <strong>{formatMoney(gross)}</strong>
              </div>
              <div className={styles['reviewRow']}>
                <span>Estimated Promoter Commission</span>
                <strong>
                  {draft.compensation === 'salary'
                    ? 'Handled outside event'
                    : formatMoney(commission)}
                </strong>
              </div>
              <div className={styles['reviewRow']}>
                <span>Estimated Venue Revenue</span>
                <strong>
                  {draft.compensation === 'salary'
                    ? formatMoney(gross)
                    : formatMoney(gross - commission)}
                </strong>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export function EventReview({
  draft,
  venueName,
  editMode,
  errors,
  studio,
  acceptedSlotMode = false,
}: {
  readonly draft: EventEditorDraft;
  readonly venueName: string;
  readonly editMode: boolean;
  readonly errors: readonly string[];
  readonly studio: 'venue' | 'host';
  readonly acceptedSlotMode?: boolean;
}) {
  const soldOut = draft.ticketTiers.reduce((total, tier) => total + tier.price * tier.quantity, 0);
  return (
    <section className={styles['card']}>
      <div className={styles['cardTitle']}>
        {editMode ? 'Review & save' : studio === 'host' ? 'Review & submit' : 'Review & publish'}
      </div>
      <div className={styles['reviewRows']}>
        <div className={styles['reviewRow']}>
          <span>Event</span>
          <strong>{draft.name || 'Untitled event'}</strong>
        </div>
        <div className={styles['reviewRow']}>
          <span>Venue</span>
          <strong>{venueName}</strong>
        </div>
        <div className={styles['reviewRow']}>
          <span>Date & time</span>
          <strong>
            {draft.dateLabel} · {draft.time}
          </strong>
        </div>
        <div className={styles['reviewRow']}>
          <span>Ticket tiers</span>
          <strong>
            {draft.ticketTiers.length} tiers ·{' '}
            {draft.ticketTiers.reduce((total, tier) => total + tier.quantity, 0)} total
          </strong>
        </div>
        <div className={styles['reviewRow']}>
          <span>Gross ticket value</span>
          <strong>{formatMoney(soldOut)}</strong>
        </div>
      </div>
      {errors.length ? (
        <div className={styles['validation']} role="alert">
          <strong>Finish these items before continuing</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles['successNote']}>
          ✓ Everything looks good.{' '}
          {draft.externalVenue
            ? 'This event requires C1RCLE admin approval.'
            : studio === 'host' && acceptedSlotMode
              ? 'Submitting publishes this event using the accepted Venue slot.'
              : studio === 'host'
                ? 'The venue will review this request before it can be published.'
                : 'Guests will see the poster preview exactly as shown.'}
        </div>
      )}
    </section>
  );
}

export function EventPreview({
  draft,
  venueName,
  artworkOptions,
  canPreview,
  onArtwork,
  onUpload,
  onOpen,
}: {
  readonly draft: EventEditorDraft;
  readonly venueName: string;
  readonly artworkOptions: readonly PartnerEventArtwork[];
  readonly canPreview: boolean;
  readonly onArtwork: (artwork: PartnerEventArtwork) => void;
  readonly onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onOpen: (mode: 'guest' | 'mobile') => void;
}) {
  return (
    <aside className={styles['previewColumn']}>
      <div className={styles['previewLabel']}>
        <i />
        Guest page preview
      </div>
      <div className={styles['previewActions']} aria-label="Event preview options">
        {(['guest', 'mobile'] as const).map((mode) => {
          const label = mode === 'guest' ? 'Web' : 'Mobile';
          const tooltip = canPreview
            ? `Preview the event page on ${mode === 'guest' ? 'web' : 'mobile'}.`
            : 'Complete every section and finish Review to enable previews.';
          return (
            <span className={styles['previewAction']} key={mode} title={tooltip}>
              <button
                className={styles['previewOpenButton']}
                type="button"
                onClick={() => {
                  onOpen(mode);
                }}
                disabled={!canPreview}
              >
                {label} preview
              </button>
            </span>
          );
        })}
      </div>
      <div className={styles['previewPoster']}>
        <div className={styles['previewPosterImage']}>
          {draft.artwork.type === 'image' ? (
            <Image
              fill
              sizes="(max-width: 1050px) 100vw, 380px"
              src={draft.artwork.value}
              alt={`${draft.name || 'Event'} poster`}
            />
          ) : (
            <div className={gradientClass(draft.artwork.value)} />
          )}
          <span className={styles['previewPosterBadge']}>Draft</span>
          <div className={styles['posterControls']}>
            <label className={styles['posterUploadAction']}>
              <span aria-hidden="true">＋</span>
              {draft.artwork.type === 'image' ? 'Change poster' : 'Upload poster'}
              <input
                aria-label="Upload event poster"
                type="file"
                accept="image/*"
                onChange={onUpload}
              />
            </label>
            <div className={styles['artworkChoices']} aria-label="Choose poster artwork">
              {artworkOptions.map((option, index) => (
                <button
                  className={styles['artworkChoice']}
                  key={`${option.type}-${option.value}-${String(index)}`}
                  type="button"
                  aria-label={`Use artwork ${String(index + 1)}`}
                  aria-pressed={draft.artwork.value === option.value}
                  onClick={() => {
                    onArtwork(option);
                  }}
                >
                  {option.type === 'image' ? (
                    <Image fill sizes="34px" src={option.value} alt="" />
                  ) : (
                    <span className={gradientClass(option.value)} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles['previewPosterDetails']}>
          <h2 data-title-font={draft.media?.titleFont ?? 'classic'}>
            {draft.name || 'Event name'}
          </h2>
          <p>{[draft.dateLabel, draft.time, venueName].filter(Boolean).join(' · ')}</p>
          {draft.genres.length ? <p>{draft.genres.join(' · ')}</p> : null}
        </div>
      </div>
    </aside>
  );
}

export function EventPreviewOverlay({
  mode,
  draft,
  venueName,
  role,
  onClose,
}: {
  readonly mode: 'guest' | 'mobile';
  readonly draft: EventEditorDraft;
  readonly venueName: string;
  readonly role: 'venue' | 'host';
  readonly onClose: () => void;
}) {
  const preview = (
    <div
      className={[
        styles['guestEventPreview'],
        mode === 'mobile' ? styles['guestEventPreviewMobile'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div aria-hidden="true" className={styles['guestEventBackdrop']}>
        {draft.artwork.type === 'image' ? (
          <Image fill sizes="100vw" src={draft.artwork.value} alt="" />
        ) : null}
      </div>
      <div className={styles['guestEventContent']}>
        <div className={styles['guestEventInfo']}>
          <span className={styles['guestEventEyebrow']}>
            {draft.genres.join(' · ') || 'C1RCLE EVENT'}
          </span>
          <h1 data-title-font={draft.media?.titleFont ?? 'classic'}>
            {draft.name || 'Your event name'}
          </h1>
          <p className={styles['guestEventWhen']}>
            {[draft.dateLabel, draft.time, draft.endTime].filter(Boolean).join(' · ')}
          </p>
          <p className={styles['guestEventVenue']}>
            {venueName}
            {role === 'host' ? ' · Hosted event' : ''}
          </p>
          <section className={styles['guestEventAbout']}>
            <h2>About the event</h2>
            <p>{draft.description || 'Your event description will appear here.'}</p>
            {draft.artists.length ? (
              <p className={styles['guestEventArtists']}>{draft.artists.join(' · ')}</p>
            ) : null}
            {draft.media?.youtubeUrl ? (
              <a href={draft.media.youtubeUrl} target="_blank" rel="noopener noreferrer">
                Watch on YouTube ↗
              </a>
            ) : null}
            {draft.media?.gallery.length ? (
              <div className={styles['mediaGallery']}>
                {draft.media.gallery.map((image) =>
                  image.type === 'image' ? (
                    <Image
                      key={image.value}
                      src={image.value}
                      alt={image.alt ?? ''}
                      width={200}
                      height={160}
                      unoptimized
                    />
                  ) : null,
                )}
              </div>
            ) : null}
            {draft.media?.spotlights.map((feature) => (
              <article className={styles['previewSpotlight']} key={feature.id}>
                {feature.artwork?.type === 'image' ? (
                  <Image
                    src={feature.artwork.value}
                    alt={feature.title}
                    width={72}
                    height={72}
                    unoptimized
                  />
                ) : null}
                <div>
                  <h3>{feature.title}</h3>
                  {feature.startTime ? (
                    <small>
                      {feature.startTime}
                      {feature.endTime ? `–${feature.endTime}` : ''} IST
                    </small>
                  ) : null}
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </section>
        </div>
        <div className={styles['guestEventPosterColumn']}>
          <div className={styles['guestEventPoster']}>
            {draft.artwork.type === 'image' ? (
              <Image
                fill
                sizes="(max-width: 760px) 82vw, 360px"
                src={draft.artwork.value}
                alt={`${draft.name || 'Event'} poster`}
              />
            ) : (
              <div className={gradientClass(draft.artwork.value)} />
            )}
          </div>
          <section className={styles['guestEventTickets']}>
            <h2>Tickets</h2>
            {draft.ticketTiers.map((tier) => (
              <div key={tier.id}>
                <span>
                  <strong>{tier.name || 'Ticket tier'}</strong>
                  <small>{tier.quantity} available</small>
                </span>
                <b>{formatMoney(tier.price)}</b>
              </div>
            ))}
            <span className={styles['guestPreviewNotice']}>Preview only · Booking is disabled</span>
          </section>
        </div>
      </div>
    </div>
  );
  return (
    <dialog
      className={styles['overlay']}
      open
      aria-label={`${mode === 'guest' ? 'Web' : 'Mobile'} event preview`}
    >
      <div className={styles['overlayStack']}>
        {mode === 'guest' ? (
          <div className={styles['deviceFrame']}>
            <div className={styles['guestPreviewShell']}>
              <span className={styles['previewLabel']}>Web · Guest Portal</span>
              {preview}
            </div>
          </div>
        ) : (
          <div className={styles['mobileFrame']}>
            <div className={styles['mobilePreviewShell']}>
              <span className={styles['previewLabel']}>Mobile · Guest Portal</span>
              {preview}
            </div>
          </div>
        )}
        <button className={styles['overlayClose']} type="button" onClick={onClose}>
          ← Back to editing
        </button>
      </div>
    </dialog>
  );
}

export function EventEditorShell({
  children,
  studio,
  artwork,
}: {
  readonly children: ReactNode;
  readonly studio: 'venue' | 'host';
  readonly artwork: PartnerEventArtwork;
}) {
  return (
    <div
      className={[
        styles['page'],
        studio === 'host' ? styles['hostTheme'] : styles['venueTheme'],
      ].join(' ')}
    >
      <div className={styles['editorBackdrop']} aria-hidden="true">
        {artwork.type === 'image' ? <Image fill sizes="100vw" src={artwork.value} alt="" /> : null}
      </div>
      {children}
    </div>
  );
}

function gradientClass(value: string) {
  return (
    (
      {
        sunset: styles['gradientSunset'],
        warehouse: styles['gradientWarehouse'],
        bollywood: styles['gradientBollywood'],
        monsoon: styles['gradientMonsoon'],
      } as Record<string, string | undefined>
    )[value] ?? styles['posterGradient']
  );
}
function initialsFor(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
function numberValue(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
function formatMoney(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}
