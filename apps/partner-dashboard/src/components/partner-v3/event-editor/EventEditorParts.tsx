import Image from 'next/image';
import { useState } from 'react';

import { canSelectEventDate } from './event-date-selection';
import styles from './event-editor.module.css';

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
  update,
  onArtistAdd,
  onArtistRemove,
  genrePickerOpen,
  onToggleGenres,
}: {
  readonly draft: EventEditorDraft;
  readonly data: EventEditorData;
  readonly editMode: boolean;
  readonly update: DraftUpdate;
  readonly onArtistAdd: (name: string) => void;
  readonly onArtistRemove: (name: string) => void;
  readonly genrePickerOpen: boolean;
  readonly onToggleGenres: () => void;
}) {
  const [artistInput, setArtistInput] = useState('');
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
        {editMode ? (
          <div className={styles['muted']}>Date and time can’t be changed after publishing.</div>
        ) : null}
        <div className={styles['field']}>
          <div className={styles['fieldLabel']}>Genre / vibe</div>
          <div className={styles['chips']}>
            {data.genres.map((genre) => (
              <button
                className={[
                  styles['chip'],
                  draft.genres.includes(genre) ? styles['chipSelected'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={genre}
                type="button"
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
            <button className={styles['chip']} type="button" onClick={onToggleGenres}>
              {genrePickerOpen ? 'Hide more' : '+ Add genre'}
            </button>
          </div>
          {genrePickerOpen ? (
            <div className={[styles['chips'], styles['moreGenres']].join(' ')}>
              {data.extraGenres.map((genre) => (
                <button
                  className={[
                    styles['chip'],
                    draft.genres.includes(genre) ? styles['chipSelected'] : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={genre}
                  type="button"
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
      </div>
    </section>
  );
}

export function EventDateTimeSection({
  months,
  selectedDate,
  selectedSlotId,
  editorRole,
  onDate,
  onSlot,
}: {
  readonly months: readonly CalendarMonth[];
  readonly selectedDate: string;
  readonly selectedSlotId?: string;
  readonly editorRole: 'venue' | 'host';
  readonly onDate: (day: { readonly date: string; readonly day: number }) => void;
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
  return (
    <section className={styles['card']} aria-labelledby="date-heading">
      <div className={styles['calendarHeader']}>
        <div>
          <div id="date-heading" className={styles['cardTitle']}>
            Pick a date
          </div>
          <div className={styles['muted']}>
            {editorRole === 'host'
              ? 'Partnered venue availability — grey dates are already taken.'
              : 'Your venue’s open nights — grey dates are already taken.'}
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
                !canSelectEventDate(day.state, editorRole) ? styles['calendarDayBooked'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={day.date}
              type="button"
              disabled={!canSelectEventDate(day.state, editorRole)}
              onClick={() => {
                onDate(day);
              }}
            >
              {day.day}
              {day.state === 'confirmed' || day.state === 'pending' ? (
                <i
                  className={[
                    styles['calendarDot'],
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
          Available
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
      {editorRole === 'host' && selectedDate && onSlot ? (
        <div className={styles['slotList']}>
          <div className={styles['muted']}>
            Select a venue time window (or set custom start &amp; end time in Basics &amp; tickets)
          </div>
          {(month.days.find((day) => day.date === selectedDate)?.slots ?? []).map((slot) => (
            <button
              className={[
                styles['slotButton'],
                slot.id === selectedSlotId ? styles['slotButtonSelected'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={slot.id}
              type="button"
              onClick={() => {
                onSlot(slot.id, slot.label);
              }}
            >
              <span>{slot.label}</span>
              <span>{slot.id === selectedSlotId ? 'Selected' : 'Choose'}</span>
            </button>
          ))}
        </div>
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
  const [benefitInputs, setBenefitInputs] = useState<Record<string, string>>({});
  const soldOut = tiers.reduce((total, tier) => total + tier.price * tier.quantity, 0);
  const updateTier = (id: string, values: Partial<EventEditorTicketTier>) => {
    onChange(tiers.map((tier) => (tier.id === id ? { ...tier, ...values } : tier)));
  };
  return (
    <section className={styles['card']} aria-labelledby="tickets-heading">
      <div className={styles['cardTitleRow']}>
        <div id="tickets-heading" className={styles['cardTitle']}>
          Ticket tiers
        </div>
        <span className={styles['totalLabel']}>{formatMoney(soldOut)} if sold out</span>
      </div>
      <div className={styles['ticketList']}>
        {tiers.map((tier) => (
          <div className={styles['ticketCard']} key={tier.id}>
            <div className={styles['ticketRow']}>
              <label className={styles['tierFieldLabel']}>
                <span>Tier Name</span>
                <input
                  aria-label={`${tier.name} type of ticket`}
                  list={`tier-presets-${tier.id}`}
                  value={tier.name}
                  onChange={(event) => {
                    updateTier(tier.id, { name: event.target.value });
                  }}
                  placeholder="Type or select name"
                />
                <datalist id={`tier-presets-${tier.id}`}>
                  <option value="General Admission" />
                  <option value="Early Bird" />
                  <option value="Phase 1" />
                  <option value="Phase 2" />
                  <option value="VIP" />
                  <option value="VVIP" />
                  <option value="Female Entry" />
                  <option value="Couple Entry" />
                  <option value="Table / Cabana" />
                </datalist>
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
                <span>Capacity</span>
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
              {tier.accessType !== 'RSVP' ? (
                <div className={styles['tierFieldLabel']}>
                  <span>Tier Gross</span>
                  <span className={styles['ticketGross']}>
                    {formatMoney(tier.price * tier.quantity)}
                  </span>
                </div>
              ) : null}
              <button
                className={styles['ticketRemove']}
                type="button"
                aria-label={`Remove ${tier.name}`}
                onClick={() => {
                  onChange(tiers.filter((item) => item.id !== tier.id));
                }}
              >
                ×
              </button>
            </div>
            <details className={styles['details']}>
              <summary className={styles['summary']}>
                <span className={styles['summaryHeader']}>
                  <span>Ticket options</span>
                  <span className={styles['summaryBadge']}>
                    {tier.accessType ?? 'ENTRY'} · {tier.audienceType ?? 'GENERAL'}
                  </span>
                </span>
                <span className={styles['summaryIcon']}>▼</span>
              </summary>
              <div className={styles['detailsBody']}>
                <div className={styles['ticketOptions']}>
                  <label>
                    Ticket type / access
                    <select
                      aria-label="Ticket type / access"
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
                                doorPrice: undefined,
                                pricingPhases: [],
                                commissionEligible: false,
                              }
                            : {
                                accessType,
                                price: tier.price > 0 ? tier.price : 1000,
                                commissionEligible: true,
                              },
                        );
                      }}
                    >
                      {['ENTRY', 'VIP', 'VVIP', 'TABLE', 'PACKAGE', 'RSVP'].map((value) => (
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
                          audienceType: event.target.value as EventEditorTicketTier['audienceType'],
                        });
                      }}
                    >
                      {['GENERAL', 'MALE', 'FEMALE', 'COUPLE', 'GROUP'].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Guests
                    <input
                      aria-label="Guests"
                      type="number"
                      min="1"
                      value={String(tier.guestCount ?? 1)}
                      onChange={(event) => {
                        updateTier(tier.id, { guestCount: numberValue(event.target.value) });
                      }}
                    />
                  </label>
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
                    Benefits
                    <input
                      aria-label="Benefits"
                      value={benefitInputs[tier.id] ?? (tier.benefits ?? []).join(', ')}
                      onChange={(event) => {
                        const value = event.target.value;
                        setBenefitInputs((current) => ({ ...current, [tier.id]: value }));
                        updateTier(tier.id, {
                          benefits: value
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean),
                        });
                      }}
                      placeholder="Entry, Drinks"
                    />
                  </label>
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
                            event.target.value === '' ? undefined : numberValue(event.target.value),
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
                              redeemableAmountPaise: tier.tableConfig?.redeemableAmountPaise ?? 0,
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
                              redeemableAmountPaise: tier.tableConfig?.redeemableAmountPaise ?? 0,
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
                              <label className={styles['phaseLabel']}>Phase name</label>
                              <input
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
                              <label className={styles['phaseLabel']}>Price (₹)</label>
                              <input
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
                              <label className={styles['phaseLabel']}>Start date (DD-MM)</label>
                              <input
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
                              <label className={styles['phaseLabel']}>End date (DD-MM)</label>
                              <input
                                aria-label={`${phase.name} phase end date`}
                                placeholder="DD-MM"
                                inputMode="numeric"
                                maxLength={5}
                                value={phase.endDate}
                                onChange={(event) =>
                                  updateTier(tier.id, {
                                    pricingPhases: (tier.pricingPhases ?? []).map((item) =>
                                      item.id === phase.id
                                        ? { ...item, endDate: event.target.value }
                                        : item,
                                    ),
                                  })
                                }
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
              </div>
            </details>
          </div>
        ))}
      </div>
      <button
        className={styles['outlineButton']}
        type="button"
        onClick={() => {
          onChange([
            ...tiers,
            { id: `tier-${String(tiers.length + 1)}`, name: 'New tier', price: 1000, quantity: 50 },
          ]);
        }}
      >
        + Add tier
      </button>
    </section>
  );
}

export function EventAdvancedSettings({
  draft,
  update,
}: {
  readonly draft: EventEditorDraft;
  readonly update: DraftUpdate;
}) {
  return (
    <details className={[styles['card'], styles['details']].join(' ')}>
      <summary className={styles['summary']}>
        <span>
          ⚙ Advanced setup <span className={styles['muted']}>Tables & promo codes</span>
        </span>
        <span className={styles['summaryIcon']}>▼</span>
      </summary>
      <div className={styles['detailsBody']}>
        <div>
          <div className={styles['cardTitle']}>Tables</div>
          <div className={styles['optionGrid']}>
            {[
              ['none', 'No tables', 'Ticket-only event'],
              ['low', 'Low tables', 'Up to 4 tables'],
              ['high', 'High tables', 'Bottle service'],
            ].map(([value, label, sub]) => (
              <button
                className={[
                  styles['optionButton'],
                  draft.tableType === value ? styles['optionSelected'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={value}
                type="button"
                onClick={() => {
                  update({ tableType: value as EventEditorDraft['tableType'] });
                }}
              >
                <strong>{label}</strong>
                <span>{sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className={styles['cardTitle']}>Promo codes</div>
          <div className={styles['promoRows']}>
            {draft.promoCodes.map((code, index) => (
              <div className={styles['promoRow']} key={`${code}-${String(index)}`}>
                <input
                  value={code}
                  onChange={(event) => {
                    update({
                      promoCodes: draft.promoCodes.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value.toUpperCase() : item,
                      ),
                    });
                  }}
                  aria-label={`Promo code ${String(index + 1)}`}
                />
                <small>Limited uses</small>
                <button
                  className={styles['removeButton']}
                  type="button"
                  aria-label={`Remove promo code ${code}`}
                  onClick={() => {
                    update({
                      promoCodes: draft.promoCodes.filter((_, itemIndex) => itemIndex !== index),
                    });
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            className={styles['outlineButton']}
            type="button"
            onClick={() => {
              update({ promoCodes: [...draft.promoCodes, 'NEWCODE'] });
            }}
          >
            + Add code
          </button>
        </div>
      </div>
    </details>
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
  const selected = new Set(draft.selectedPromoterIds);
  const paidTiers = draft.ticketTiers.filter((tier) => tier.accessType !== 'RSVP');
  const hasPaidTiers = paidTiers.length > 0;
  const tierCommissions = draft.tierCommissions ?? {};
  const toggle = (id: string) => {
    const next = selected.has(id)
      ? draft.selectedPromoterIds.filter((item) => item !== id)
      : [...draft.selectedPromoterIds, id];
    update({ selectedPromoterIds: next });
  };
  const setPromoterOverride = (promoterId: string, enabled: boolean) => {
    const next = { ...(draft.promoterOverrides ?? {}) };
    if (enabled) {
      if (draft.compensation === 'standard') {
        next[promoterId] = { default: draft.commissionRate };
      } else if (draft.compensation === 'custom') {
        next[promoterId] = { ...tierCommissions };
      } else if (draft.compensation === 'salary') {
        next[promoterId] = { default: draft.salaryAmount };
      } else {
        next[promoterId] = { default: draft.commissionRate };
      }
    } else {
      delete next[promoterId];
    }
    update({ promoterOverrides: next });
  };

  const updatePromoterOverride = (promoterId: string, key: string, val: number) => {
    const current = draft.promoterOverrides?.[promoterId] ?? {};
    const nextOverrides = {
      ...(draft.promoterOverrides ?? {}),
      [promoterId]: {
        ...current,
        [key]: val,
      },
    };
    update({ promoterOverrides: nextOverrides });
  };

  const selectModel = (model: EventEditorDraft['compensation']) => {
    if (model === draft.compensation) return;
    if (
      draft.compensation === 'custom' &&
      Object.keys(tierCommissions).length &&
      !window.confirm('All custom commission mappings will be deleted and replaced. Continue?')
    )
      return;
    if (
      draft.compensation === 'salary' &&
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
      const rate = override?.default ?? draft.commissionRate;
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
        <p className={styles['muted']}>
          Select from your connected promoters. The first promoter uses Standard Commission at 15%
          by default.
        </p>
        <div className={styles['promoterList']}>
          {data.promoters.map((promoter) => (
            <button
              className={[
                styles['promoterRow'],
                selected.has(promoter.id) ? styles['promoterRowSelected'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={promoter.id}
              type="button"
              onClick={() => {
                toggle(promoter.id);
              }}
            >
              <span className={styles['promoterAvatar']} aria-hidden="true">
                {promoter.initials || initialsFor(promoter.name)}
              </span>
              <span className={styles['promoterIdentity']}>
                <strong>{promoter.name}</strong>
              </span>
              <span className={styles['check']}>{selected.has(promoter.id) ? '✓' : ''}</span>
            </button>
          ))}
        </div>
        {!data.promoters.length ? (
          <p className={styles['muted']}>
            No connected promoters. You can publish without compensation.
          </p>
        ) : null}
      </section>
      {data.promoters.length && !hasPaidTiers ? (
        <p className={styles['muted']}>RSVP tickets do not have promoter commission.</p>
      ) : null}
      {data.promoters.length && hasPaidTiers ? (
        <>
          <section className={styles['card']}>
            <div className={styles['cardTitle']}>Promoter Compensation</div>
            <p className={styles['muted']}>
              Only one promoter compensation model can be used per event.
            </p>
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
                  <strong>{label}</strong>
                  <span>{sub}</span>
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
                <span className={styles['muted']}>
                  New ticket tiers automatically inherit this percentage.
                </span>
              </div>
            ) : null}
            {draft.compensation === 'custom' ? (
              <div>
                <p className={styles['customTierSubtext']}>
                  Every ticket tier needs a commission. 0% is allowed.
                </p>
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
                            if (value === '') delete next[tier.id];
                            else next[tier.id] = numberValue(value);
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
                  value={draft.salaryAmount || ''}
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
                      salaryPeriod: event.target.value as EventEditorDraft['salaryPeriod'],
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
              <div className={styles['cardTitle']}>Promoter Overrides</div>
              <p className={styles['muted']}>
                Each promoter uses Event Default unless you enable a custom override.
              </p>
              <div className={styles['overrideList']}>
                {!draft.selectedPromoterIds.length ? (
                  <p className={styles['muted']}>
                    Select at least one promoter in &quot;Promoters on this event&quot; above to set
                    custom promoter overrides.
                  </p>
                ) : null}
                {draft.selectedPromoterIds.map((promoterId) => {
                  const promoter = data.promoters.find((item) => item.id === promoterId);
                  const displayName =
                    promoter?.name ||
                    (promoterId.length > 2 ? `Promoter ${promoterId.slice(-8)}` : promoterId);
                  const override = draft.promoterOverrides?.[promoterId];
                  const isCustomized = Boolean(override);

                  return (
                    <div
                      className={[
                        styles['overrideCard'],
                        isCustomized ? styles['overrideCardActive'] : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      key={promoterId}
                    >
                      <div className={styles['overrideHeader']}>
                        <div className={styles['overrideIdentity']}>
                          <span className={styles['promoterAvatar']} aria-hidden="true">
                            {promoter?.initials || initialsFor(displayName)}
                          </span>
                          <div>
                            <strong>{displayName}</strong>
                            <span className={styles['overrideBadge']}>
                              {isCustomized ? 'Custom override' : 'Event default'}
                            </span>
                          </div>
                        </div>
                        <button
                          className={styles['outlineButton']}
                          type="button"
                          onClick={() => {
                            setPromoterOverride(promoterId, !isCustomized);
                          }}
                        >
                          {isCustomized ? 'Use Event Default' : '+ Set custom commission'}
                        </button>
                      </div>
                      {isCustomized ? (
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
                                  value={String(override?.default ?? draft.commissionRate)}
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
                          ) : draft.compensation === 'salary' ? (
                            <label>
                              Custom Fixed Payout (₹)
                              <input
                                aria-label={`${displayName} custom salary amount`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={String(override?.default ?? draft.salaryAmount)}
                                onChange={(event) => {
                                  updatePromoterOverride(
                                    promoterId,
                                    'default',
                                    numberValue(event.target.value),
                                  );
                                }}
                              />
                            </label>
                          ) : null}
                        </div>
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
}: {
  readonly draft: EventEditorDraft;
  readonly venueName: string;
  readonly editMode: boolean;
  readonly errors: readonly string[];
  readonly studio: 'venue' | 'host';
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
          {studio === 'host'
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
  onOpen,
}: {
  readonly draft: EventEditorDraft;
  readonly venueName: string;
  readonly onOpen: () => void;
}) {
  return (
    <aside className={styles['previewColumn']}>
      <div className={styles['previewLabel']}>
        <i />
        Live preview · what guests see
      </div>
      <button
        className={styles['previewCard']}
        type="button"
        aria-label={`Open preview for ${draft.name.length ? draft.name : 'Your event name'}`}
        onClick={onOpen}
      >
        <div
          className={[styles['previewBackground'], gradientClass(draft.artwork.value)].join(' ')}
        />
        {draft.artwork.type === 'image' ? (
          <Image
            fill
            sizes="380px"
            className={styles['previewImage']}
            src={draft.artwork.value}
            alt=""
          />
        ) : null}
        <div className={styles['previewShade']} />
        <div className={styles['previewContent']}>
          <span className={styles['previewStatus']}>
            <i />
            Draft
          </span>
          <div className={styles['previewPrice']}>
            {formatMoney(draft.ticketTiers[0]?.price ?? 0)}
          </div>
          <div className={styles['previewName']}>
            {draft.name.length ? draft.name : 'Your event name'}
          </div>
          <div className={styles['previewMeta']}>
            {venueName} · {draft.dateLabel}
          </div>
          <div className={styles['buyButton']}>Buy tickets</div>
          <span className={styles['previewOpenButton']}>Open preview ↗</span>
        </div>
      </button>
      <div className={styles['previewHint']}>Select Guest portal or Mobile app</div>
    </aside>
  );
}

export function EventPreviewOverlay({
  mode,
  draft,
  venueName,
  onPick,
  onClose,
}: {
  readonly mode: 'picker' | 'guest' | 'mobile';
  readonly draft: EventEditorDraft;
  readonly venueName: string;
  readonly onPick: (mode: 'guest' | 'mobile') => void;
  readonly onClose: () => void;
}) {
  const preview = (
    <div className={styles['fullPreview']}>
      <div className={[styles['fullPreviewArtwork'], gradientClass(draft.artwork.value)].join(' ')}>
        {draft.artwork.type === 'image' ? (
          <Image fill sizes="420px" src={draft.artwork.value} alt="" />
        ) : null}
      </div>
      <div className={styles['fullPreviewBody']}>
        <span className={styles['previewStatus']}>
          <i />
          Draft
        </span>
        <h2>{draft.name || 'Your event name'}</h2>
        <p>
          {venueName} · {draft.dateLabel} · {draft.time}
        </p>
        <div className={styles['fullPreviewTickets']}>
          {draft.ticketTiers.map((tier) => (
            <div key={tier.id}>
              <span>{tier.name}</span>
              <strong>{formatMoney(tier.price)}</strong>
            </div>
          ))}
        </div>
        <button className={styles['fullPreviewBuy']} type="button">
          Buy tickets
        </button>
      </div>
    </div>
  );
  return (
    <dialog className={styles['overlay']} open aria-label="Preview destination">
      {mode === 'picker' ? (
        <div className={styles['previewPicker']}>
          <p>Choose where to preview this event</p>
          <button
            type="button"
            onClick={() => {
              onPick('guest');
            }}
          >
            ◉ Guest portal
          </button>
          <button
            type="button"
            onClick={() => {
              onPick('mobile');
            }}
          >
            ▣ Mobile app
          </button>
        </div>
      ) : (
        <div className={styles['overlayStack']}>
          {mode === 'guest' ? (
            <div className={styles['deviceFrame']}>
              <div className={styles['guestPreviewShell']}>
                <span className={styles['previewLabel']}>Guest portal</span>
                {preview}
              </div>
            </div>
          ) : (
            <div className={styles['mobileFrame']}>
              <div className={styles['mobilePreviewShell']}>
                <span className={styles['previewLabel']}>Mobile app</span>
                {preview}
              </div>
            </div>
          )}
          <button className={styles['overlayClose']} type="button" onClick={onClose}>
            ← Back to editing
          </button>
        </div>
      )}
    </dialog>
  );
}

export function EventEditorShell({
  children,
  studio,
}: {
  readonly children: ReactNode;
  readonly studio: 'venue' | 'host';
}) {
  return (
    <div
      className={[
        styles['page'],
        studio === 'host' ? styles['hostTheme'] : styles['venueTheme'],
      ].join(' ')}
    >
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
