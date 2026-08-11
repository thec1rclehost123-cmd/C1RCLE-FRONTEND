'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  AddIcon,
  BackIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  DeleteIcon,
  EditIcon,
  ForwardIcon,
  ImageIcon,
  LocationIcon,
  PublishIcon,
  TicketIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import {
  createEventReviewRows,
  createEditEventReviewRows,
  formatTicketPrice,
  initialCreateEventDraft,
  validateEventDraft,
  validateTicketTypes,
} from '../create-event-model';

import styles from './CreateEvent.module.css';

import type { CreateEventDraft, CreateEventTicket } from '../create-event-model';

export interface CreateEventMutations {
  readonly saveDraft: (draft: CreateEventDraft) => Promise<void>;
  readonly publish: (draft: CreateEventDraft) => Promise<void>;
}

export function CreateEventScreen({
  mutations,
  initialDraft = initialCreateEventDraft,
  mode = 'create',
}: {
  readonly mutations?: CreateEventMutations;
  readonly initialDraft?: CreateEventDraft;
  readonly mode?: 'create' | 'edit';
}) {
  const auth = useDashboardAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<CreateEventDraft>(initialDraft);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialDraft));
  const [preview, setPreview] = useState<'web' | 'phone'>('web');
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [posterObjectUrl, setPosterObjectUrl] = useState<string | null>(null);
  const canEdit = auth.canDo('canEditEvent');
  const canPublish = auth.canDo('canPublishEvent');
  const dirty = useMemo(() => JSON.stringify(draft) !== savedSnapshot, [draft, savedSnapshot]);

  useEffect(
    () => () => {
      if (posterObjectUrl) URL.revokeObjectURL(posterObjectUrl);
    },
    [posterObjectUrl],
  );
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [dirty]);

  const updateDraft = <K extends keyof CreateEventDraft>(key: K, value: CreateEventDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors([]);
    setStatus(null);
  };

  const goTo = (next: 1 | 2 | 3) => {
    setErrors([]);
    setStatus(null);
    setStep(next);
    document.getElementById('partner-dashboard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const continueFromDetails = () => {
    const detailErrors = validateEventDraft(draft).filter(
      (error) => !error.toLocaleLowerCase('en-IN').includes('ticket'),
    );
    if (!draft.name.trim() || !draft.description.trim() || !draft.date) {
      setErrors(
        detailErrors.length
          ? detailErrors
          : ['Complete the event name, date, and short description.'],
      );
      return;
    }
    goTo(2);
  };
  const continueFromTickets = () => {
    const result = validateTicketTypes(draft.tickets, draft.venueCapacity);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    goTo(3);
  };
  const runMutation = async (kind: 'saveDraft' | 'publish') => {
    if (!mutations) return;
    const validationErrors = validateEventDraft(draft);
    if (kind === 'publish' && validationErrors.length) {
      setErrors(validationErrors);
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await mutations[kind](draft);
      setSavedSnapshot(JSON.stringify(draft));
      setStatus(
        kind === 'publish'
          ? mode === 'edit'
            ? 'Event updated.'
            : 'Event published.'
          : 'Draft saved.',
      );
    } catch {
      setErrors([
        kind === 'publish'
          ? mode === 'edit'
            ? 'The event could not be updated.'
            : 'The event could not be published.'
          : 'The draft could not be saved.',
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles['page']}>
      <header className={styles['wizardHeader']}>
        <nav aria-label="Create event progress">
          {([1, 2, 3] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (item < step) goTo(item);
              }}
              aria-current={step === item ? 'step' : undefined}
              disabled={item > step}
            >
              <em>{item < step ? <CheckIcon size={16} aria-hidden="true" /> : item}</em>
              {item === 1 ? 'Details' : item === 2 ? 'Tickets' : 'Review'}
            </button>
          ))}
        </nav>
      </header>
      {step === 1 ? (
        <DetailsStep
          draft={draft}
          updateDraft={updateDraft}
          canEdit={canEdit}
          posterObjectUrl={posterObjectUrl}
          setPosterObjectUrl={setPosterObjectUrl}
          mode={mode}
        />
      ) : null}
      {step === 2 ? (
        <TicketsStep draft={draft} updateDraft={updateDraft} canEdit={canEdit} mode={mode} />
      ) : null}
      {step === 3 ? <ReviewStep draft={draft} onEdit={goTo} mode={mode} /> : null}
      {errors.length ? (
        <div className={styles['errors']} role="alert">
          <strong>Review this step</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {status ? (
        <p className={styles['status']} role="status">
          {status}
        </p>
      ) : null}
      <div className={styles['previewMobile']}>
        <GuestPreview draft={draft} mode={preview} setMode={setPreview} step={step} />
      </div>
      <footer className={styles['actions']}>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              goTo(step === 3 ? 2 : 1);
            }}
          >
            <BackIcon size={18} aria-hidden="true" /> Back
          </button>
        ) : mode === 'edit' ? (
          <button
            type="button"
            onClick={() => {
              if (dirty) setLeaveOpen(true);
              else router.push(`/venue/events/${initialDraft.name ? 'neon-nights-afrobeats' : ''}`);
            }}
          >
            Cancel
          </button>
        ) : (
          <span />
        )}
        <div>
          <button
            type="button"
            disabled={!canEdit || !mutations || busy}
            title={!mutations ? 'Draft saving requires the event mutation API.' : undefined}
            onClick={() => {
              void runMutation('saveDraft');
            }}
          >
            Save draft{!mutations ? ' unavailable' : ''}
          </button>
          {step === 1 ? (
            <button type="button" className={styles['primary']} onClick={continueFromDetails}>
              Continue to tickets <ForwardIcon size={18} aria-hidden="true" />
            </button>
          ) : null}
          {step === 2 ? (
            <button type="button" className={styles['primary']} onClick={continueFromTickets}>
              Continue to review <ForwardIcon size={18} aria-hidden="true" />
            </button>
          ) : null}
          {step === 3 ? (
            <button
              type="button"
              className={styles['primary']}
              disabled={!canPublish || !mutations || busy}
              title={!mutations ? 'Publishing requires the event mutation API.' : undefined}
              onClick={() => {
                void runMutation('publish');
              }}
            >
              <PublishIcon size={18} aria-hidden="true" />{' '}
              {mode === 'edit' ? 'Publish changes' : 'Publish event'}
              {!mutations ? ' unavailable' : ''}
            </button>
          ) : null}
        </div>
      </footer>
      {leaveOpen ? (
        <div className={styles['dialogBackdrop']} role="presentation">
          <section
            className={styles['dialog']}
            role="dialog"
            aria-modal="true"
            aria-label="Unsaved changes"
          >
            <h2>Unsaved changes</h2>
            <p>You have unsaved changes. What would you like to do?</p>
            <div>
              <button
                type="button"
                onClick={() => {
                  setLeaveOpen(false);
                }}
              >
                Stay
              </button>
              <button
                type="button"
                className={styles['primary']}
                onClick={() => {
                  router.push('/venue/events/neon-nights-afrobeats');
                }}
              >
                Discard changes
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function DetailsStep({
  draft,
  updateDraft,
  canEdit,
  posterObjectUrl,
  setPosterObjectUrl,
  mode,
}: {
  readonly draft: CreateEventDraft;
  readonly updateDraft: <K extends keyof CreateEventDraft>(
    key: K,
    value: CreateEventDraft[K],
  ) => void;
  readonly canEdit: boolean;
  readonly posterObjectUrl: string | null;
  readonly setPosterObjectUrl: (value: string | null) => void;
  readonly mode: 'create' | 'edit';
}) {
  return (
    <div className={styles['stepGrid']}>
      <form
        className={styles['formPanel']}
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <header>
          <h1>Event details</h1>
          <p>Tell guests what they need to know.</p>
        </header>
        <label className={styles['poster']}>
          <span>Poster</span>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- supports a local object URL before upload */}
            <img src={draft.posterSrc} alt="Event poster preview" />
            <span>
              <strong>Event poster</strong>
              <small>JPG, PNG, or WebP</small>
              <em>
                <ImageIcon size={17} aria-hidden="true" /> Change image
              </em>
            </span>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={!canEdit}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (posterObjectUrl) URL.revokeObjectURL(posterObjectUrl);
              const nextUrl = URL.createObjectURL(file);
              setPosterObjectUrl(nextUrl);
              updateDraft('posterSrc', nextUrl);
            }}
          />
        </label>
        <Field label="Event name">
          <input
            value={draft.name}
            maxLength={100}
            disabled={!canEdit}
            onChange={(event) => {
              updateDraft('name', event.target.value);
            }}
          />
        </Field>
        <Field label="Venue">
          <select
            value={draft.venueId}
            disabled={!canEdit || mode === 'edit'}
            onChange={(event) => {
              updateDraft('venueId', event.target.value);
            }}
          >
            <option value="skyline-rooftop">Skyline Rooftop</option>
          </select>
        </Field>
        <div className={styles['threeColumns']}>
          <Field label="Date">
            <input
              type="date"
              value={draft.date}
              disabled={!canEdit}
              onChange={(event) => {
                const date = event.target.value;
                const parsed = new Date(`${date}T12:00:00`);
                updateDraft('date', date);
                updateDraft(
                  'dateLabel',
                  Number.isNaN(parsed.valueOf())
                    ? date
                    : new Intl.DateTimeFormat('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }).format(parsed),
                );
              }}
            />
          </Field>
          <Field label="Start time">
            <input
              type="time"
              value={draft.startTime}
              disabled={!canEdit}
              onChange={(event) => {
                updateDraft('startTime', event.target.value);
              }}
            />
          </Field>
          <Field label="End time">
            <input
              type="time"
              value={draft.endTime}
              disabled={!canEdit}
              onChange={(event) => {
                updateDraft('endTime', event.target.value);
              }}
            />
          </Field>
        </div>
        <Field label="Genre and vibe">
          <input
            value={draft.genre}
            disabled={!canEdit}
            onChange={(event) => {
              updateDraft('genre', event.target.value);
            }}
          />
        </Field>
        {mode === 'edit' ? (
          <Field label="Artists">
            <input
              value={draft.artists ?? ''}
              disabled={!canEdit}
              onChange={(event) => {
                updateDraft('artists', event.target.value);
              }}
            />
          </Field>
        ) : null}
        <Field label="Short description">
          <textarea
            maxLength={200}
            value={draft.description}
            disabled={!canEdit}
            onChange={(event) => {
              updateDraft('description', event.target.value);
            }}
          />
          <small>{draft.description.length} / 200</small>
        </Field>
        <Field label="Age limit">
          <select
            value={draft.ageLimit}
            disabled={!canEdit}
            onChange={(event) => {
              updateDraft('ageLimit', event.target.value);
            }}
          >
            <option>18+</option>
            <option>21+</option>
            <option>All ages</option>
          </select>
        </Field>
        {mode === 'edit' ? (
          <Field label="Dress code">
            <input
              value={draft.dressCode ?? ''}
              disabled={!canEdit}
              onChange={(event) => {
                updateDraft('dressCode', event.target.value);
              }}
            />
          </Field>
        ) : null}
        <details className={styles['more']}>
          <summary>
            More details <ChevronDownIcon size={18} aria-hidden="true" />
          </summary>
          <p>Additional event fields are not required for this milestone.</p>
        </details>
      </form>
      <div className={styles['previewDesktop']}>
        <GuestPreview draft={draft} mode="web" setMode={() => undefined} step={1} />
      </div>
    </div>
  );
}

function TicketsStep({
  draft,
  updateDraft,
  canEdit,
  mode,
}: {
  readonly draft: CreateEventDraft;
  readonly updateDraft: <K extends keyof CreateEventDraft>(
    key: K,
    value: CreateEventDraft[K],
  ) => void;
  readonly canEdit: boolean;
  readonly mode: 'create' | 'edit';
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editor, setEditor] = useState({
    name: '',
    price: '',
    capacity: '',
    benefits: '',
    saleStart: '',
    saleEnd: '',
  });
  const validation = validateTicketTypes(draft.tickets, draft.venueCapacity);
  const beginEdit = (ticket?: CreateEventTicket) => {
    setEditingId(ticket?.id ?? 'new');
    setEditor({
      name: ticket?.name ?? '',
      price: ticket ? String(ticket.pricePaise / 100) : '',
      capacity: ticket ? String(ticket.capacity) : '',
      benefits: ticket?.benefits ?? '',
      saleStart: ticket?.saleStart ?? '',
      saleEnd: ticket?.saleEnd ?? '',
    });
  };
  const saveTicket = () => {
    const nextTicket: CreateEventTicket = {
      id: editingId === 'new' ? `ticket-${Date.now().toString(36)}` : (editingId ?? ''),
      name: editor.name.trim(),
      pricePaise: Math.round(Number(editor.price) * 100),
      capacity: Number(editor.capacity),
      benefits: editor.benefits.trim(),
      saleStart: editor.saleStart,
      saleEnd: editor.saleEnd,
    };
    const nextTickets =
      editingId === 'new'
        ? [...draft.tickets, nextTicket]
        : draft.tickets.map((ticket) => (ticket.id === editingId ? nextTicket : ticket));
    const nextValidation = validateTicketTypes(nextTickets, draft.venueCapacity);
    if (!nextValidation.valid) return;
    updateDraft('tickets', nextTickets);
    setEditingId(null);
  };
  return (
    <div className={styles['stepGrid']}>
      <section className={styles['ticketsPanel']}>
        <header>
          <h1>Tickets</h1>
          <p>Add the ticket types guests can buy.</p>
        </header>
        <div className={styles['ticketList']}>
          {draft.tickets.map((ticket) => (
            <article key={ticket.id}>
              <TicketIcon size={31} aria-hidden="true" />
              <span>
                <strong>{ticket.name}</strong>
                <em>{formatTicketPrice(ticket.pricePaise)}</em>
              </span>
              <span>
                <strong>{ticket.capacity} tickets</strong>
                <small>capacity</small>
              </span>
              {mode === 'edit' ? <small>{ticket.benefits ?? 'Standard entry'}</small> : null}
              <div>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    beginEdit(ticket);
                  }}
                >
                  <EditIcon size={16} aria-hidden="true" /> Edit
                </button>
                <button
                  type="button"
                  disabled={!canEdit || draft.tickets.length === 1}
                  onClick={() => {
                    updateDraft(
                      'tickets',
                      draft.tickets.filter((item) => item.id !== ticket.id),
                    );
                  }}
                >
                  <DeleteIcon size={16} aria-hidden="true" /> Remove
                </button>
              </div>
            </article>
          ))}
        </div>
        {editingId ? (
          <section
            className={styles['ticketEditor']}
            aria-label={editingId === 'new' ? 'Add ticket type' : 'Edit ticket type'}
          >
            <Field label="Ticket name">
              <input
                value={editor.name}
                onChange={(event) => {
                  setEditor((value) => ({ ...value, name: event.target.value }));
                }}
              />
            </Field>
            <Field label="Price">
              <input
                type="number"
                min="1"
                value={editor.price}
                onChange={(event) => {
                  setEditor((value) => ({ ...value, price: event.target.value }));
                }}
              />
            </Field>
            <Field label="Capacity">
              <input
                type="number"
                min="1"
                value={editor.capacity}
                onChange={(event) => {
                  setEditor((value) => ({ ...value, capacity: event.target.value }));
                }}
              />
            </Field>
            {mode === 'edit' ? (
              <>
                <Field label="Benefits">
                  <input
                    value={editor.benefits}
                    onChange={(event) => {
                      setEditor((value) => ({ ...value, benefits: event.target.value }));
                    }}
                  />
                </Field>
                <Field label="Sale start">
                  <input
                    type="datetime-local"
                    value={editor.saleStart}
                    onChange={(event) => {
                      setEditor((value) => ({ ...value, saleStart: event.target.value }));
                    }}
                  />
                </Field>
                <Field label="Sale end">
                  <input
                    type="datetime-local"
                    value={editor.saleEnd}
                    onChange={(event) => {
                      setEditor((value) => ({ ...value, saleEnd: event.target.value }));
                    }}
                  />
                </Field>
              </>
            ) : null}
            <div>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
              <button type="button" className={styles['primary']} onClick={saveTicket}>
                Save ticket
              </button>
            </div>
          </section>
        ) : (
          <button
            type="button"
            className={styles['addTicket']}
            disabled={!canEdit}
            onClick={() => {
              beginEdit();
            }}
          >
            <AddIcon size={18} aria-hidden="true" /> Add ticket type
          </button>
        )}
        <div className={styles['ticketSummary']}>
          <div>
            <span>Guest fees</span>
            <strong>{formatTicketPrice(draft.guestFeesPaise)} added at checkout</strong>
          </div>
          <div>
            <span>Total capacity</span>
            <strong>
              {validation.totalCapacity} / {draft.venueCapacity} tickets
            </strong>
          </div>
        </div>
        {mode === 'edit' ? (
          <div className={styles['editPolicies']}>
            <Field label="Booking limit per guest">
              <select
                value={draft.bookingLimit ?? '4 tickets'}
                onChange={(event) => {
                  updateDraft('bookingLimit', event.target.value);
                }}
              >
                <option>4 tickets</option>
                <option>6 tickets</option>
              </select>
            </Field>
            <Field label="Sales close time">
              <select
                value={draft.salesCloseTime ?? '1 hour before event'}
                onChange={(event) => {
                  updateDraft('salesCloseTime', event.target.value);
                }}
              >
                <option>1 hour before event</option>
                <option>At event start</option>
              </select>
            </Field>
            <Field label="Refund policy">
              <select
                value={draft.refundPolicy ?? 'No refunds'}
                onChange={(event) => {
                  updateDraft('refundPolicy', event.target.value);
                }}
              >
                <option>No refunds</option>
                <option>Refundable</option>
              </select>
            </Field>
          </div>
        ) : null}
      </section>
      <div className={styles['previewDesktop']}>
        <GuestPreview draft={draft} mode="web" setMode={() => undefined} step={2} />
      </div>
    </div>
  );
}

function ReviewStep({
  draft,
  onEdit,
  mode,
}: {
  readonly draft: CreateEventDraft;
  readonly onEdit: (step: 1 | 2 | 3) => void;
  readonly mode: 'create' | 'edit';
}) {
  const rows = mode === 'edit' ? createEditEventReviewRows(draft) : createEventReviewRows(draft);
  return (
    <div className={styles['stepGrid']}>
      <section className={styles['review']}>
        <header>
          <h1>{mode === 'edit' ? 'Review and update' : 'Ready to publish'}</h1>
          <p>
            <CheckIcon size={19} aria-hidden="true" />{' '}
            {mode === 'edit'
              ? 'Confirm your event details before publishing.'
              : 'Everything guests need is complete.'}
          </p>
        </header>
        <div>
          {rows.map((row) => (
            <article key={row.id}>
              <CheckIcon size={23} aria-hidden="true" />
              <span>
                <strong>{row.label}</strong>
                <small>{row.summary}</small>
              </span>
              <button
                type="button"
                onClick={() => {
                  onEdit(row.step);
                }}
              >
                Edit <ForwardIcon size={17} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
        {mode === 'edit' ? (
          <details className={styles['readiness']}>
            <summary>
              Readiness checklist <span>Ready to update</span>
            </summary>
            <p>All required event information is complete.</p>
          </details>
        ) : null}
      </section>
      <div className={styles['previewDesktop']}>
        <GuestPreview draft={draft} mode="web" setMode={() => undefined} step={3} />
      </div>
    </div>
  );
}

function GuestPreview({
  draft,
  mode,
  setMode,
  step,
}: {
  readonly draft: CreateEventDraft;
  readonly mode: 'web' | 'phone';
  readonly setMode: (mode: 'web' | 'phone') => void;
  readonly step: 1 | 2 | 3;
}) {
  const lowestPrice = Math.min(...draft.tickets.map((ticket) => ticket.pricePaise));
  return (
    <aside className={styles['preview']}>
      <header>
        <h2>Guest preview</h2>
        <div>
          <button
            type="button"
            className={mode === 'web' ? styles['active'] : undefined}
            onClick={() => {
              setMode('web');
            }}
          >
            Web
          </button>
          <button
            type="button"
            className={mode === 'phone' ? styles['active'] : undefined}
            onClick={() => {
              setMode('phone');
            }}
          >
            Phone
          </button>
        </div>
      </header>
      <article className={mode === 'phone' ? styles['phonePreview'] : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- supports the same local object URL as the form */}
        <img src={draft.posterSrc} alt="" />
        <div>
          <h3>{draft.name || 'Event name'}</h3>
          <p>
            <LocationIcon size={16} aria-hidden="true" /> {draft.venueName}, {draft.venueAddress}
          </p>
          <p>
            <CalendarIcon size={16} aria-hidden="true" /> {draft.dateLabel} · {draft.startTime}
          </p>
          {step === 2 ? (
            <section className={styles['previewTickets']}>
              <h4>Select tickets</h4>
              {draft.tickets.map((ticket) => (
                <div key={ticket.id}>
                  <span>
                    <strong>{ticket.name}</strong>
                    <small>On sale</small>
                  </span>
                  <b>{formatTicketPrice(ticket.pricePaise)}</b>
                </div>
              ))}
            </section>
          ) : (
            <>
              <span className={styles['age']}>{draft.ageLimit}</span>
              <hr />
              <small>Starting from</small>
              <strong className={styles['price']}>
                {formatTicketPrice(lowestPrice)} <em>/ person</em>
              </strong>
              {step === 3 ? (
                <button type="button" disabled>
                  Buy tickets
                </button>
              ) : null}
            </>
          )}
        </div>
      </article>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className={styles['field']}>
      <span>{label}</span>
      {children}
    </label>
  );
}
