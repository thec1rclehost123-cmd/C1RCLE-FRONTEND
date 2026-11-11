'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { describeApiError } from '@/lib/api/describe-error';
import { discardHostEventDraft, getHostEventDraft, saveHostEventDraft } from '@/lib/events/event-draft-repository';
import { validateEventMedia } from '@/lib/events/event-media';
import { validatePromoDraft } from '@/lib/events/event-promo-codes';
import { eventEndAtFromDraft, eventStartAtFromDraft } from '@/lib/events/venue-event-repository';
import { partnerPreviewFeatures } from '@/lib/partner/preview-features';

import styles from './event-editor.module.css';
import {
  EventAdvancedSettings,
  EventBasicDetails,
  EventDateTimeSection,
  EventEditorShell,
  EventPreview,
  EventPreviewOverlay,
  EventPromoterSelector,
  EventReview,
  TicketTierEditor,
} from './EventEditorParts';
import { EventMediaStep } from './EventMediaStep';

import type {
  CalendarMonth,
  EventEditorData,
  EventEditorDraft,
  EventEditorStep,
  HostAvailabilityData,
  PartnerEventDetailData,
  VenueCalendarData,
} from '@/data/partner-data-source';
import type { ChangeEvent } from 'react';

type EditorAvailability = VenueCalendarData | HostAvailabilityData;

export interface PartnerEventEditorProps {
  readonly data: EventEditorData;
  readonly availability: EditorAvailability;
  readonly mode: 'create' | 'edit';
  readonly eventId?: string;
  readonly initialStep?: string;
  readonly initialVenueId?: string;
  readonly initialDate?: string;
  readonly initialSlotId?: string;
  readonly acceptedSlotMode?: boolean;
  readonly initialEvent?: PartnerEventDetailData;
  readonly organizationId?: string;
  readonly onSubmit?: (draft: EventEditorDraft, selectedSlotId: string) => Promise<void>;
}

const venueSteps: readonly EventEditorStep[] = [
  'basics',
  'schedule',
  'tickets',
  'promoters',
  'advanced',
  'media',
  'review',
];
const hostSteps: readonly EventEditorStep[] = [
  'venue',
  'basics',
  'tickets',
  'promoters',
  'advanced',
  'media',
  'review',
];
const acceptedHostSteps: readonly EventEditorStep[] = [
  'basics',
  'tickets',
  'promoters',
  'advanced',
  'media',
  'review',
];

export function PartnerEventEditor({
  data,
  availability,
  mode,
  initialStep,
  initialVenueId,
  initialDate,
  initialSlotId,
  acceptedSlotMode = false,
  initialEvent,
  organizationId,
  onSubmit,
}: PartnerEventEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHost = data.role === 'host';
  const steps = isHost ? (acceptedSlotMode ? acceptedHostSteps : hostSteps) : venueSteps;
  const initialDraft = useMemo(
    () => draftFromInput(data, initialEvent, initialVenueId, initialDate),
    [data, initialDate, initialEvent, initialVenueId],
  );
  const [draft, setDraft] = useState<EventEditorDraft>(initialDraft);
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId ?? '');
  const [localStep, setLocalStep] = useState<EventEditorStep>(
    normaliseStep(initialStep ?? (acceptedSlotMode ? 'basics' : undefined), steps),
  );
  const [genrePickerOpen, setGenrePickerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'closed' | 'guest' | 'mobile'>('closed');
  const [showErrors, setShowErrors] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<ReadonlySet<EventEditorStep>>(
    () => new Set(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(mode !== 'create' || !isHost || !organizationId);
  const [draftDiscarded, setDraftDiscarded] = useState(false);
  const [draftTouched, setDraftTouched] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState(false);
  const draftSaveQueue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (mode !== 'create' || !isHost || !organizationId) return;
    let active = true;
    getHostEventDraft(organizationId)
      .then(async ({ draft: saved }) => {
        if (!active || !saved) return;
        if (saved.schemaVersion !== 1 || !isRestorableDraft(saved.data)) {
          await discardHostEventDraft(organizationId);
          return;
        }
        const safeData = sanitizeEventDraft(saved.data);
        setDraft({ ...initialDraft, ...(safeData as Partial<EventEditorDraft>), ...(initialVenueId ? { venueId: initialVenueId } : {}), ...(initialDate ? { date: initialDate, dateLabel: formatDateLabel(initialDate) } : {}) });
        setSelectedSlotId(initialSlotId ?? (typeof saved.data['selectedSlotId'] === 'string' ? saved.data['selectedSlotId'] : ''));
        const savedStep = typeof saved.data['step'] === 'string' ? saved.data['step'] : initialStep;
        setLocalStep(normaliseStep(savedStep, steps));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setDraftReady(true); });
    return () => { active = false; };
  }, [initialDate, initialDraft, initialSlotId, initialStep, initialVenueId, isHost, mode, organizationId, steps]);

  const queryStep = searchParams.get('step') ?? undefined;
  const requestedStep = queryStep ? normaliseStep(queryStep, steps) : localStep;
  useEffect(() => {
    if (initialVenueId ?? initialDate) {
      // URL context is an external input; keep locally edited fields intact while syncing only location.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft((current) => ({
        ...current,
        ...(initialVenueId ? { venueId: initialVenueId } : {}),
        ...(initialDate ? { date: initialDate, dateLabel: formatDateLabel(initialDate) } : {}),
      }));
    }
  }, [initialDate, initialVenueId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSlotId(initialSlotId ?? '');
  }, [initialSlotId]);

  const hostAvailability = isHost ? (availability as HostAvailabilityData) : undefined;
  const selectedVenueAvailability = hostAvailability?.venues.find(
    (item) => item.venue.id === draft.venueId,
  );
  const months = isHost
    ? (selectedVenueAvailability?.months ?? [])
    : (availability as VenueCalendarData).months;
  const externalVenue = Boolean(draft.externalVenue);
  const venueName = externalVenue
    ? draft.externalVenue?.name.trim()
      ? draft.externalVenue.name
      : 'Venue name'
    : isHost
      ? (selectedVenueAvailability?.venue.name ?? 'Choose a partnered venue')
      : (data.venues.find((venue) => venue.id === draft.venueId)?.name ?? 'Your venue');
  const selectedWindow = months
    .flatMap((month) => month.days)
    .flatMap((day) => day.slots)
    .find((slot) => slot.id === selectedSlotId);
  const timeErrors = useMemo(() => {
    if (
      !selectedSlotId.startsWith('free-') ||
      !selectedWindow?.startTime ||
      !selectedWindow.endTime
    )
      return [];
    const start = eventStartAtFromDraft(draft);
    const end = draft.endTime?.trim()
      ? eventEndAtFromDraft(draft)
      : start
        ? new Date(
            Math.min(Date.parse(start) + 24 * 60 * 60 * 1000, Date.parse(selectedWindow.endTime)),
          ).toISOString()
        : null;
    return !start ||
      !end ||
      Date.parse(start) < Date.parse(selectedWindow.startTime) ||
      Date.parse(end) > Date.parse(selectedWindow.endTime) ||
      Date.parse(end) - Date.parse(start) > 24 * 60 * 60 * 1000
      ? ['Choose start and end times inside the selected available window.']
      : [];
  }, [draft, selectedSlotId, selectedWindow]);
  // A URL is a navigation request, never evidence that earlier steps were completed.
  const firstIncompleteIndex = steps.findIndex(
    (step) =>
      !completedSteps.has(step) ||
      validateStep(step, draft, {
        host: isHost && mode === 'create',
        selectedSlot: acceptedSlotMode || Boolean(initialEvent) || Boolean(selectedSlotId),
        steps,
        requireCopy: mode === 'create',
      }).length > 0 ||
      (step === 'venue' && timeErrors.length > 0),
  );
  const reachableIndex = firstIncompleteIndex < 0 ? steps.length - 1 : firstIncompleteIndex;
  const currentStep =
    steps[Math.min(steps.indexOf(requestedStep), reachableIndex)] ?? steps[0] ?? 'basics';
  useEffect(() => {
    if (requestedStep === currentStep) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', currentStep);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentStep, pathname, requestedStep, router, searchParams]);

  useEffect(() => {
    if (!draftReady || draftDiscarded || submitting || !draftTouched || mode !== 'create' || !isHost || !organizationId) return;
    const timer = window.setTimeout(() => {
      const data = sanitizeEventDraft({ ...draft, selectedSlotId, step: localStep });
      draftSaveQueue.current = draftSaveQueue.current
        .catch(() => undefined)
        .then(() => saveHostEventDraft(organizationId, data))
        .then(() => { setDraftSaveError(false); })
        .catch(() => { setDraftSaveError(true); });
    }, 250);
    return () => { window.clearTimeout(timer); };
  }, [draft, draftDiscarded, draftReady, draftTouched, isHost, localStep, mode, organizationId, selectedSlotId, submitting]);

  const validationErrors = useMemo(
    () => [
      ...validateDraft(draft, isHost && mode === 'create', mode === 'create'),
      ...validateCompensation(draft),
      ...timeErrors,
    ],
    [draft, isHost, mode, timeErrors],
  );
  const stepErrors = useMemo(
    () =>
      validateStep(currentStep, draft, {
        host: isHost && mode === 'create',
        selectedSlot: acceptedSlotMode || Boolean(initialEvent) ? true : Boolean(selectedSlotId),
        steps,
        requireCopy: mode === 'create',
      }),
    [acceptedSlotMode, currentStep, draft, initialEvent, isHost, mode, selectedSlotId, steps],
  );

  const updateQuery = (
    values: Record<string, string | undefined>,
    history: 'replace' | 'push' = 'replace',
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const href = `${pathname}${params.size ? `?${params.toString()}` : ''}`;
    if (history === 'push') router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  };

  const update = (values: Partial<EventEditorDraft>) => {
    setDraftDiscarded(false);
    setDraftTouched(true);
    setDraft((current) => ({ ...current, ...values }));
    const currentIndex = steps.indexOf(currentStep);
    setCompletedSteps(
      (current) => new Set([...current].filter((step) => steps.indexOf(step) < currentIndex)),
    );
    setShowErrors(false);
    setSubmitError(null);
    if (values.venueId) updateQuery({ venue: values.venueId, date: undefined, slot: undefined });
    if (values.date) updateQuery({ date: values.date });
  };
  const chooseDate = (day: { readonly date: string; readonly day: number }) => {
    setSelectedSlotId('');
    update({ date: day.date, dateLabel: formatDateLabel(day.date) });
    updateQuery({ date: day.date, slot: undefined });
  };
  const chooseSlot = (slotId: string, label: string) => {
    setSelectedSlotId(slotId);
    const slot = months
      .flatMap((month) => month.days)
      .flatMap((day) => day.slots)
      .find((item) => item.id === slotId);
    const clock = (value: string) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: PRODUCT_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(value));
    update({
      time: slot?.startTime ? clock(slot.startTime) : label,
      ...(slot?.startTime && slot.endTime
        ? {
            endTime: clock(
              new Date(
                Math.min(Date.parse(slot.startTime) + 4 * 60 * 60 * 1000, Date.parse(slot.endTime)),
              ).toISOString(),
            ),
          }
        : {}),
    });
    updateQuery({ slot: slotId });
  };
  const chooseVenue = (venueId: string) => {
    setDraftDiscarded(false);
    setDraftTouched(true);
    setSelectedSlotId('');
    const venue = data.venues.find((item) => item.id === venueId);
    const external = venueId === 'external';
    setDraft((current) => {
      const { externalVenue: previousExternal, ...rest } = current;
      return {
        ...rest,
        venueId: external ? '' : venueId,
        date: '',
        dateLabel: '',
        time: '',
        endTime: '',
        ...(external
          ? {
              externalVenue: previousExternal ?? {
                name: '',
                address: '',
                managerName: '',
                managerPhone: '',
                managerEmail: '',
              },
            }
          : {}),
        ...(venue ? { artwork: venue.artwork } : {}),
      };
    });
    setCompletedSteps(new Set());
    setShowErrors(false);
    updateQuery({ venue: external ? undefined : venueId, date: undefined, slot: undefined });
  };
  const moveStep = (step: EventEditorStep) => {
    if (steps.indexOf(step) > reachableIndex) return;
    setShowErrors(false);
    setDraftTouched(true);
    setLocalStep(step);
    updateQuery({ step }, 'push');
  };
  const nextStep = async () => {
    const errors = validateStep(currentStep, draft, {
      host: isHost && mode === 'create',
      selectedSlot: acceptedSlotMode || Boolean(initialEvent) ? true : Boolean(selectedSlotId),
      steps,
      requireCopy: mode === 'create',
    });
    if ((currentStep === 'venue' || currentStep === 'review') && timeErrors.length) {
      setSubmitError(timeErrors[0] ?? null);
      return;
    }
    if (errors.length) {
      setShowErrors(true);
      return;
    }
    setCompletedSteps((current) => new Set([...current, currentStep]));
    const index = steps.indexOf(currentStep);
    const next = steps[index + 1];
    if (next) {
      setDraftTouched(true);
      setShowErrors(false);
      setLocalStep(next);
      updateQuery({ step: next }, 'push');
    } else if (onSubmit) {
      setSubmitting(true);
      setSubmitError(null);
      try {
        let submissionDraft = draft;
        if (isHost && draft.externalVenue && organizationId) {
          const workflowKey = draft.externalWorkflowKey ?? crypto.randomUUID();
          submissionDraft = { ...draft, externalWorkflowKey: workflowKey };
          setDraft(submissionDraft);
          setDraftTouched(true);
          draftSaveQueue.current = draftSaveQueue.current
            .catch(() => undefined)
            .then(() => saveHostEventDraft(
              organizationId,
              sanitizeEventDraft({ ...submissionDraft, selectedSlotId, step: localStep }),
            ));
          await draftSaveQueue.current;
        }
        await onSubmit(submissionDraft, selectedSlotId);
      } catch (error) {
        setSubmitError(describeApiError(error, 'The event could not be submitted.'));
      } finally {
        setSubmitting(false);
      }
    } else setShowErrors(true);
  };
  const previousStep = () => {
    const index = steps.indexOf(currentStep);
    const previous = steps[index - 1];
    if (previous) moveStep(previous);
  };
  const uploadArtwork = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    update({ artwork: { type: 'image', value: URL.createObjectURL(file), alt: file.name, file } });
  };
  const addArtist = (artist: string) => {
    const name = artist.trim();
    if (name && !draft.artists.includes(name)) update({ artists: [...draft.artists, name] });
  };
  const nextLabel = submitting
    ? 'Publishing…'
    : currentStep === 'review'
      ? mode === 'edit'
        ? 'Save changes'
        : isHost && !acceptedSlotMode
          ? 'Submit for approval'
          : 'Publish event'
      : 'Continue';
  if (!draftReady) return <p role="status">Restoring your saved event draft…</p>;

  const discardDraft = async () => {
    setDraftDiscarded(true);
    if (organizationId) await discardHostEventDraft(organizationId);
    setDraft(initialDraft);
    setSelectedSlotId(initialSlotId ?? '');
    setLocalStep(steps[0] ?? 'basics');
    setCompletedSteps(new Set());
    setShowErrors(false);
    updateQuery({ step: steps[0], venue: initialVenueId, date: initialDate, slot: initialSlotId });
    setDraftSaveError(false);
    setDraftTouched(false);
  };
  const pageTitle = mode === 'edit' ? 'Edit event' : 'Create event';
  return (
    <EventEditorShell studio={data.role} artwork={draft.artwork}>
      <header className={styles['editorHeader']}>
        <Link
          className={styles['cancelLink']}
          href={isHost ? '/partner/host/events' : '/partner/venue/events'}
        >
          ← Back
        </Link>
        <div className={styles['headingRow']}>
          <div>
            <h1>{pageTitle}</h1>
          </div>
          {isHost && mode === 'create' ? (
            <button className={styles['actionButton']} type="button" onClick={() => void discardDraft()}>
              Discard draft
            </button>
          ) : null}
        </div>
      </header>
      {draftSaveError ? <p role="status">Your latest changes could not be saved. Keep this tab open and try again.</p> : null}
      <div className={styles['layout']}>
        <nav className={styles['sectionNav']} aria-label="Event setup sections">
          <span className={styles['sectionNavLabel']}>Event setup</span>
          {steps.map((step, index) => {
            const done =
              completedSteps.has(step) &&
              (firstIncompleteIndex < 0 || index < firstIncompleteIndex);
            const active = currentStep === step;
            return (
              <button
                className={[
                  styles['sectionStep'],
                  active ? styles['sectionStepActive'] : '',
                  done ? styles['sectionStepDone'] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={step}
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => {
                  if (index <= reachableIndex) moveStep(step);
                }}
                disabled={index > reachableIndex}
              >
                <span className={styles['sectionStepNumber']}>{done ? '✓' : index + 1}</span>
                <span>{labelForStep(step)}</span>
              </button>
            );
          })}
        </nav>
        <section className={styles['formColumn']} aria-label="Event editor form">
          {currentStep === 'venue' ? (
            <VenueStep
              data={data}
              draft={draft}
              onVenue={chooseVenue}
              update={update}
              onDate={chooseDate}
              onSlot={chooseSlot}
              availability={months}
              selectedSlotId={selectedSlotId}
            />
          ) : null}
          {currentStep === 'basics' ? (
            <>
              <EventBasicDetails
                data={data}
                draft={draft}
                editMode={mode === 'edit'}
                showDescription={mode === 'create'}
                showSchedule={false}
                update={update}
                onArtistAdd={addArtist}
                onArtistRemove={(artist) => {
                  update({ artists: draft.artists.filter((item) => item !== artist) });
                }}
                genrePickerOpen={genrePickerOpen}
                onToggleGenres={() => {
                  setGenrePickerOpen((open) => !open);
                }}
              />
            </>
          ) : null}
          {currentStep === 'schedule' ? (
            <EventDateTimeSection
              months={months}
              selectedDate={draft.date}
              time={draft.time}
              {...(draft.endTime !== undefined ? { endTime: draft.endTime } : {})}
              editorRole="venue"
              onDate={chooseDate}
              onTime={(time) => {
                update({ time });
              }}
              onEndTime={(endTime) => {
                update({ endTime });
              }}
              onSlot={chooseSlot}
            />
          ) : null}
          {currentStep === 'tickets' ? (
            <TicketTierEditor
              tiers={draft.ticketTiers}
              onChange={(ticketTiers) => {
                update({ ticketTiers });
              }}
            />
          ) : null}
          {currentStep === 'media' ? <EventMediaStep draft={draft} update={update} /> : null}
          {currentStep === 'advanced' ? (
            <EventAdvancedSettings draft={draft} update={update} role={data.role} />
          ) : null}
          {currentStep === 'promoters' ? (
            <EventPromoterSelector data={data} draft={draft} update={update} />
          ) : null}
          {currentStep === 'review' ? (
            <EventReview
              draft={draft}
              venueName={venueName}
              editMode={mode === 'edit'}
              errors={showErrors ? validationErrors : []}
              studio={data.role}
              acceptedSlotMode={acceptedSlotMode}
            />
          ) : null}
          {showErrors && currentStep !== 'review' && stepErrors.length ? (
            <div className={styles['validation']} role="alert">
              <strong>Finish these items before continuing</strong>
              <ul>
                {stepErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {submitError ? (
            <div className={styles['validation']} role="alert">
              {submitError}
            </div>
          ) : null}
          <div className={styles['actions']}>
            {steps.indexOf(currentStep) > 0 ? (
              <button
                className={styles['actionButton']}
                type="button"
                onClick={previousStep}
                disabled={submitting}
              >
                Back
              </button>
            ) : null}
            <button
              className={[styles['actionButton'], styles['actionButtonPrimary']].join(' ')}
              type="button"
              onClick={() => {
                void nextStep();
              }}
              disabled={submitting}
            >
              {nextLabel} <span aria-hidden="true">→</span>
            </button>
          </div>
          {currentStep === 'review' && externalVenue ? (
            <p className={styles['muted']} role="status">C1RCLE review is required before this event can be published.</p>
          ) : null}
          {currentStep === 'review' && !onSubmit ? (
            <div className={styles['unavailable']}>
              Frontend-only fixture:{' '}
              {isHost
                ? 'submission for approval'
                : mode === 'edit'
                  ? 'saving changes'
                  : 'publishing'}{' '}
              is unavailable until the backend mutation contract is connected.
            </div>
          ) : null}
        </section>
        <EventPreview
          draft={draft}
          venueName={venueName}
          artworkOptions={data.artworkOptions}
          canPreview={currentStep === 'review' && validationErrors.length === 0}
          onArtwork={(artwork) => {
            update({ artwork });
          }}
          onUpload={uploadArtwork}
          onOpen={(modeChoice) => {
            setPreviewMode(modeChoice);
          }}
        />
      </div>
      {previewMode !== 'closed' ? (
        <EventPreviewOverlay
          mode={previewMode}
          draft={draft}
          venueName={venueName}
          role={data.role}
          onClose={() => {
            setPreviewMode('closed');
          }}
        />
      ) : null}
    </EventEditorShell>
  );
}

function VenueStep({
  data,
  draft,
  availability,
  selectedSlotId,
  onVenue,
  update,
  onDate,
  onSlot,
}: {
  readonly data: EventEditorData;
  readonly draft: EventEditorDraft;
  readonly availability: readonly CalendarMonth[];
  readonly selectedSlotId: string;
  readonly onVenue: (id: string) => void;
  readonly update: (values: Partial<EventEditorDraft>) => void;
  readonly onDate: (day: { readonly date: string; readonly day: number }) => void;
  readonly onSlot: (id: string, label: string) => void;
}) {
  return (
    <>
      <section className={styles['card']}>
        <div className={styles['cardTitle']}>Choose a venue</div>
        <div className={styles['field']}>
          <label htmlFor="host-event-venue">Venue</label>
          <select
            id="host-event-venue"
            value={draft.externalVenue ? 'external' : draft.venueId}
            onChange={(event) => {
              onVenue(event.target.value);
            }}
          >
            <option value="">Select a venue</option>
            {partnerPreviewFeatures.externalVenueApproval ? (
              <option value="external">Venue not on C1RCLE</option>
            ) : null}
            {data.venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} · {venue.meta}
              </option>
            ))}
          </select>
        </div>
        {draft.venueId ? (
          <div className={styles['selectedContext']}>
            {data.venues.find((venue) => venue.id === draft.venueId)?.name}
            <span>Choose an open date and time</span>
          </div>
        ) : null}
      </section>
      {draft.externalVenue ? (
        <section className={styles['card']} aria-label="Non-partnered venue details">
          <div className={styles['cardTitle']}>Venue details</div>
          <div className={styles['fieldStack']}>
            {(['name', 'address'] as const).map((key) => (
              <div className={styles['field']} key={key}>
                <label htmlFor={`external-${key}`}>
                  {key === 'name' ? 'Venue name' : 'Full venue address'}
                </label>
                <input
                  id={`external-${key}`}
                  value={draft.externalVenue?.[key] ?? ''}
                  onChange={(event) => {
                    if (draft.externalVenue)
                      update({
                        externalVenue: { ...draft.externalVenue, [key]: event.target.value },
                      });
                  }}
                />
              </div>
            ))}
            <div className={styles['twoColumns']}>
              {(['city', 'region', 'postalCode', 'country', 'mapUrl'] as const).map((key) => (
                <div className={styles['field']} key={key}>
                  <label htmlFor={`external-${key}`}>{key === 'mapUrl' ? 'Map link (optional)' : `${key === 'postalCode' ? 'Postal code' : key.slice(0, 1).toUpperCase() + key.slice(1)} (optional)`}</label>
                  <input
                    id={`external-${key}`}
                    type={key === 'mapUrl' ? 'url' : 'text'}
                    value={draft.externalVenue?.[key] ?? ''}
                    onChange={(event) => {
                      if (draft.externalVenue) update({ externalVenue: { ...draft.externalVenue, [key]: event.target.value } });
                    }}
                  />
                </div>
              ))}
            </div>
            <div className={styles['twoColumns']}>
              <div className={styles['field']}>
                <label htmlFor="external-date">Event date · IST</label>
                <input
                  id="external-date"
                  type="date"
                  value={draft.date}
                  onChange={(event) => {
                    update({
                      date: event.target.value,
                      dateLabel: event.target.value ? formatDateLabel(event.target.value) : '',
                    });
                  }}
                />
              </div>
              <div className={styles['field']}>
                <label htmlFor="external-start">Start time · IST</label>
                <input
                  id="external-start"
                  type="time"
                  value={draft.time}
                  onChange={(event) => {
                    update({ time: event.target.value });
                  }}
                />
              </div>
              <div className={styles['field']}>
                <label htmlFor="external-end">End time · IST</label>
                <input
                  id="external-end"
                  type="time"
                  value={draft.endTime ?? ''}
                  onChange={(event) => {
                    update({ endTime: event.target.value });
                  }}
                />
              </div>
            </div>
            <div className={styles['cardTitle']}>Venue manager contact</div>
            <p className={styles['muted']}>
              Enter the manager you spoke with. C1RCLE admin approval is required.
            </p>
            {(['managerName', 'managerPhone', 'managerEmail'] as const).map((key) => (
              <div className={styles['field']} key={key}>
                <label htmlFor={`external-${key}`}>
                  {key === 'managerName'
                    ? 'Manager name'
                    : key === 'managerPhone'
                      ? 'Phone number'
                      : 'Email (optional)'}
                </label>
                <input
                  id={`external-${key}`}
                  type={key === 'managerPhone' ? 'tel' : key === 'managerEmail' ? 'email' : 'text'}
                  value={draft.externalVenue?.[key] ?? ''}
                  onChange={(event) => {
                    if (draft.externalVenue)
                      update({
                        externalVenue: { ...draft.externalVenue, [key]: event.target.value },
                      });
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {draft.venueId && availability.length ? (
        <EventDateTimeSection
          months={availability}
          selectedDate={draft.date}
          selectedSlotId={selectedSlotId}
          editorRole="host"
          time={draft.time}
          endTime={draft.endTime ?? ''}
          onTime={(time) => {
            update({ time });
          }}
          onEndTime={(endTime) => {
            update({ endTime });
          }}
          onDate={onDate}
          onSlot={onSlot}
        />
      ) : draft.venueId ? (
        <section className={styles['card']} role="status">
          <div className={styles['cardTitle']}>No available dates</div>
          <p className={styles['muted']}>Choose another partnered venue to continue.</p>
        </section>
      ) : null}
    </>
  );
}

function draftFromInput(
  data: EventEditorData,
  event: PartnerEventDetailData | undefined,
  initialVenueId: string | undefined,
  initialDate: string | undefined,
): EventEditorDraft {
  const base = data.defaultDraft;
  if (!event)
    return {
      ...base,
      ...(initialVenueId ? { venueId: initialVenueId } : {}),
      ...(initialDate ? { date: initialDate, dateLabel: formatDateLabel(initialDate) } : {}),
    };
  const parsedPrice = Number(event.event.priceLabel.replace(/[^0-9]/g, ''));
  const firstPrice = parsedPrice > 0 ? parsedPrice : (base.ticketTiers[0]?.price ?? 1000);
  const eventDate = eventDateAsIso(event.event.dateLabel);
  return {
    ...base,
    name: event.event.name,
    venueId: data.venues.find((venue) => venue.name === event.event.venue)?.id ?? base.venueId,
    date: initialDate ?? eventDate,
    dateLabel: event.event.dateLabel,
    time: event.event.timeLabel,
    genres: event.event.tag.split(' · ').filter(Boolean),
    artwork: event.event.artwork,
    ticketTiers: event.salesSummary.tiers
      .map((tier, index) => ({
        id: `edit-tier-${String(index)}`,
        name: tier.name,
        price:
          Number(tier.money.replace(/[^0-9]/g, '')) /
          Math.max(1, Number(tier.count.replace(/[^0-9]/g, ''))),
        quantity: Number(tier.count.replace(/[^0-9]/g, '')),
      }))
      .concat(
        event.salesSummary.tiers.length
          ? []
          : [
              {
                id: 'edit-tier-1',
                name: 'General Admission',
                price: firstPrice,
                quantity: event.event.capacity ?? base.ticketTiers[0]?.quantity ?? 0,
              },
            ],
      ),
  };
}

function validateDraft(draft: EventEditorDraft, host: boolean, requireCopy = false) {
  const errors: string[] = [...validatePromoDraft(draft), ...validateEventMedia(draft)];
  if (!draft.name.trim()) errors.push('Add an event name.');
  if (requireCopy && draft.description.trim().length < 40)
    errors.push('Add at least 40 characters of guest-facing event details.');
  if (host && draft.externalVenue) errors.push(...validateExternalVenue(draft));
  else if (host && !draft.venueId) errors.push('Choose a venue.');
  if (!draft.date) errors.push('Choose an available date.');
  else if (!eventStartAtFromDraft(draft)) errors.push('Enter a valid event start time.');
  if (!draft.ticketTiers.length) errors.push('Add at least one ticket tier.');
  const earlyBird = draft.earlyBirdDiscountPercent ?? 0;
  const lateArrival = draft.lateArrivalChargePercent ?? 0;
  if (earlyBird < 0 || earlyBird > 100)
    errors.push('Early bird discount must be between 0% and 100%.');
  if (lateArrival < 0 || lateArrival > 100)
    errors.push('Late arrival surcharge must be between 0% and 100%.');
  draft.ticketTiers.forEach((tier, index) => {
    if (!tier.name.trim()) errors.push(`Name ticket tier ${String(index + 1)}.`);
    if ((tier.accessType ?? 'ENTRY') !== 'RSVP' && tier.price <= 0)
      errors.push(`Set a valid price for ${tier.name || `tier ${String(index + 1)}`}.`);
    if (tier.quantity <= 0)
      errors.push(`Set a valid quantity for ${tier.name || `tier ${String(index + 1)}`}.`);
    const maxPerOrder = tier.maxPerOrder ?? (tier.accessType === 'RSVP' ? 1 : 10);
    if (!Number.isInteger(maxPerOrder) || maxPerOrder < 1 || maxPerOrder > 10)
      errors.push(
        `Max tickets for ${tier.name || `tier ${String(index + 1)}`} must be between 1 and 10.`,
      );
    if (tier.accessType === 'RSVP' && maxPerOrder !== 1)
      errors.push(
        `Free RSVP ${tier.name || `tier ${String(index + 1)}`} must be limited to one per order.`,
      );
    if (tier.accessType === 'TABLE' && !tier.tableConfig)
      errors.push(
        `Table configuration is required for ${tier.name || `tier ${String(index + 1)}`}.`,
      );
    if (
      tier.accessType === 'RSVP' &&
      (tier.pricingPhases?.length || tier.commissionEligible || tier.doorPrice != null)
    )
      errors.push(
        `RSVP ${tier.name || `tier ${String(index + 1)}`} cannot have phases, door price, or commission.`,
      );
    (tier.accessType === 'RSVP' ? [] : (tier.pricingPhases ?? [])).forEach((phase, phaseIndex) => {
      if (!phase.name.trim())
        errors.push(
          `Name pricing phase ${String(phaseIndex + 1)} in ${tier.name || `tier ${String(index + 1)}`}.`,
        );
      if (!/^\d{2}-\d{2}$/.test(phase.startDate) || !/^\d{2}-\d{2}$/.test(phase.endDate))
        errors.push(
          `Set valid start and end dates for ${phase.name || `pricing phase ${String(phaseIndex + 1)}`} in ${tier.name || `tier ${String(index + 1)}`}.`,
        );
    });
  });
  return errors;
}

function validateStep(
  step: EventEditorStep,
  draft: EventEditorDraft,
  context: {
    readonly host: boolean;
    readonly selectedSlot: boolean;
    readonly steps: readonly EventEditorStep[];
    readonly requireCopy: boolean;
  },
): string[] {
  if (step === 'venue') {
    if (draft.externalVenue) return validateExternalVenue(draft);
    const errors: string[] = [];
    if (!draft.venueId) errors.push('Choose a partnered venue.');
    if (!draft.date) errors.push('Choose an available date.');
    if (!context.selectedSlot) errors.push('Choose an available venue time.');
    return errors;
  }
  if (step === 'basics') {
    const errors: string[] = [];
    if (!draft.name.trim()) errors.push('Add an event name.');
    if (context.requireCopy && draft.description.trim().length < 40)
      errors.push('Add at least 40 characters of guest-facing event details.');
    return errors;
  }
  if (step === 'schedule') {
    if (!draft.date) return ['Choose an available date.'];
    if (!eventStartAtFromDraft(draft)) return ['Enter a valid event start time.'];
    return [];
  }
  if (step === 'tickets') return validateTicketDraft(draft);
  if (step === 'media') return validateEventMedia(draft);
  if (step === 'advanced') return validatePromoDraft(draft);
  if (step === 'promoters') return [...validateCompensation(draft)];
  return [
    ...validateDraft(draft, context.host, context.requireCopy),
    ...validateCompensation(draft),
    ...(context.host &&
    !draft.externalVenue &&
    context.steps.includes('venue') &&
    !context.selectedSlot
      ? ['Choose an available venue time.']
      : []),
  ];
}

function validateTicketDraft(draft: EventEditorDraft): string[] {
  const errors: string[] = [];
  if (!draft.ticketTiers.length) errors.push('Add at least one ticket tier.');
  draft.ticketTiers.forEach((tier, index) => {
    const tierLabel = tier.name || `tier ${String(index + 1)}`;
    if (!tier.name.trim()) errors.push(`Name ticket tier ${String(index + 1)}.`);
    if ((tier.accessType ?? 'ENTRY') !== 'RSVP' && tier.price <= 0)
      errors.push(`Set a valid price for ${tierLabel}.`);
    if (tier.quantity <= 0) errors.push(`Set a valid quantity for ${tierLabel}.`);
    const maxPerOrder = tier.maxPerOrder ?? (tier.accessType === 'RSVP' ? 1 : 10);
    if (!Number.isInteger(maxPerOrder) || maxPerOrder < 1 || maxPerOrder > 10)
      errors.push(`Max tickets for ${tierLabel} must be between 1 and 10.`);
    if (tier.accessType === 'RSVP' && maxPerOrder !== 1)
      errors.push(`Free RSVP ${tierLabel} must be limited to one per order.`);
    if (tier.accessType === 'TABLE' && !tier.tableConfig)
      errors.push(`Table configuration is required for ${tierLabel}.`);
    if (
      tier.accessType === 'RSVP' &&
      (tier.pricingPhases?.length || tier.commissionEligible || tier.doorPrice != null)
    )
      errors.push(`RSVP ${tierLabel} cannot have phases, door price, or commission.`);
    (tier.accessType === 'RSVP' ? [] : (tier.pricingPhases ?? [])).forEach((phase, phaseIndex) => {
      if (!phase.name.trim())
        errors.push(`Name pricing phase ${String(phaseIndex + 1)} in ${tierLabel}.`);
      if (!/^\d{2}-\d{2}$/.test(phase.startDate) || !/^\d{2}-\d{2}$/.test(phase.endDate))
        errors.push(
          `Set valid dates for ${phase.name || `phase ${String(phaseIndex + 1)}`} in ${tierLabel}.`,
        );
    });
  });
  const earlyBird = draft.earlyBirdDiscountPercent ?? 0;
  const lateArrival = draft.lateArrivalChargePercent ?? 0;
  if (earlyBird < 0 || earlyBird > 100)
    errors.push('Early bird discount must be between 0% and 100%.');
  if (lateArrival < 0 || lateArrival > 100)
    errors.push('Late arrival surcharge must be between 0% and 100%.');
  return errors;
}
function validateCompensation(draft: EventEditorDraft): readonly string[] {
  if (
    !draft.selectedPromoterIds.length ||
    !draft.ticketTiers.some((tier) => tier.accessType !== 'RSVP')
  )
    return [];
  const errors: string[] = [];
  const tierCommissions = draft.tierCommissions ?? {};
  if (
    draft.compensation === 'standard' &&
    (!Number.isInteger(draft.commissionRate) ||
      draft.commissionRate < 0 ||
      draft.commissionRate > 100)
  )
    errors.push('Global commission must be a whole number between 0% and 100%.');
  if (draft.compensation === 'custom')
    draft.ticketTiers
      .filter((tier) => tier.accessType !== 'RSVP')
      .forEach((tier) => {
        const rate = tierCommissions[tier.id];
        if (rate === undefined) errors.push(`${tier.name} needs a commission.`);
        else if (!Number.isInteger(rate) || rate < 0 || rate > 100)
          errors.push(`${tier.name} commission must be between 0% and 100%.`);
      });
  if (draft.compensation === 'salary') {
    if (
      draft.salaryAmount === undefined ||
      !Number.isFinite(draft.salaryAmount) ||
      draft.salaryAmount <= 0
    )
      errors.push('Salary amount must be greater than ₹0.');
  }
  return [...new Set(errors)];
}
function normaliseStep(
  value: string | undefined,
  steps: readonly EventEditorStep[],
): EventEditorStep {
  return value && steps.includes(value as EventEditorStep)
    ? (value as EventEditorStep)
    : (steps[0] ?? 'basics');
}
function labelForStep(step: EventEditorStep) {
  return (
    {
      venue: 'Venue',
      basics: 'Event details',
      schedule: 'Date & time',
      tickets: 'Tickets',
      promoters: 'Promoters',
      media: 'Media',
      advanced: 'Advanced',
      review: 'Review',
    } satisfies Record<EventEditorStep, string>
  )[step];
}
function formatDateLabel(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: PRODUCT_TIME_ZONE,
      }).format(date);
}
function eventDateAsIso(value: string) {
  const date = new Date(`${value}, 2026 UTC`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function validateExternalVenue(draft: EventEditorDraft): string[] {
  const venue = draft.externalVenue;
  if (!venue) return [];
  const errors: string[] = [];
  if (!venue.name.trim()) errors.push('Enter the venue name.');
  if (!venue.address.trim()) errors.push('Enter the full venue address.');
  if (!draft.date || !eventStartAtFromDraft(draft))
    errors.push('Choose a valid date and start time.');
  if (!draft.endTime) errors.push('Choose an end time.');
  if (!venue.managerName.trim()) errors.push('Enter the manager name.');
  if (!/^\+?[\d\s()-]{10,18}$/.test(venue.managerPhone.trim()))
    errors.push('Enter a valid manager phone number.');
  if (venue.managerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(venue.managerEmail))
    errors.push('Enter a valid manager email.');
  if (venue.mapUrl) {
    try {
      if (new URL(venue.mapUrl).protocol !== 'https:') errors.push('Map links must use HTTPS.');
    } catch { errors.push('Enter a valid map link.'); }
  }
  return errors;
}

function isRestorableDraft(data: Record<string, unknown>): boolean {
  if (typeof data['name'] !== 'string' || typeof data['description'] !== 'string') return false;
  if (data['ticketTiers'] !== undefined && !Array.isArray(data['ticketTiers'])) return false;
  if (data['selectedPromoterIds'] !== undefined && !Array.isArray(data['selectedPromoterIds'])) return false;
  if (data['externalWorkflowKey'] !== undefined && typeof data['externalWorkflowKey'] !== 'string') return false;
  const external = data['externalVenue'];
  if (external !== undefined) {
    if (!external || typeof external !== 'object') return false;
    const venue = external as Record<string, unknown>;
    if (['name', 'address', 'managerName', 'managerPhone', 'managerEmail'].some((key) => typeof venue[key] !== 'string')) return false;
  }
  return true;
}

function sanitizeEventDraft(value: unknown): Record<string, unknown> {
  const visit = (input: unknown, key = ''): unknown => {
    if (/file|token|credential|uploadurl|signedurl|authorization/i.test(key)) return undefined;
    if (typeof input === 'string') {
      if (/^(blob:|data:)/i.test(input)) return undefined;
      try {
        const url = new URL(input);
        if (url.searchParams.has('X-Goog-Signature') || url.searchParams.has('X-Amz-Signature') || url.searchParams.has('token')) return undefined;
      } catch { /* Non-URL editor values are safe to persist. */ }
      return input;
    }
    if (Array.isArray(input)) return input.map((entry) => visit(entry)).filter((entry) => entry !== undefined);
    if (input && typeof input === 'object') {
      if (key === 'artwork') {
        const value = (input as Record<string, unknown>)['value'];
        if (typeof value === 'string' && /^(blob:|data:)/i.test(value)) return undefined;
      }
      const result: Record<string, unknown> = {};
      for (const [childKey, childValue] of Object.entries(input)) {
        const safe = visit(childValue, childKey);
        if (safe !== undefined) result[childKey] = safe;
      }
      return result;
    }
    if (input === null || ['string', 'number', 'boolean'].includes(typeof input)) return input;
    return undefined;
  };
  const safe = visit(value);
  const allowed = new Set([
    'media', 'externalVenue', 'name', 'description', 'venueId', 'visibilityMode', 'addressDisclosure',
    'date', 'dateLabel', 'time', 'endTime', 'genres', 'artists', 'artwork', 'ticketTiers',
    'selectedPromoterIds', 'tableType', 'promoCodes', 'promoCodeSettings', 'pricingRule', 'compensation',
    'commissionRate', 'salaryNotes', 'tierCommissions', 'salaryAmount', 'salaryPeriod', 'promoterOverrides',
    'earlyBirdDiscountPercent', 'lateArrivalChargePercent', 'selectedSlotId', 'step', 'externalWorkflowKey',
  ]);
  return safe && typeof safe === 'object' && !Array.isArray(safe)
    ? Object.fromEntries(Object.entries(safe).filter(([key]) => allowed.has(key)))
    : {};
}
