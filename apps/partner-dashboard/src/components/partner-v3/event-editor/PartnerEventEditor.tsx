'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import styles from './event-editor.module.css';
import {
  EventAdvancedSettings,
  EventBasicDetails,
  EventDateTimeSection,
  EventEditorShell,
  EventPosterUploader,
  EventPreview,
  EventPreviewOverlay,
  EventPromoterSelector,
  EventReview,
  TicketTierEditor,
} from './EventEditorParts';

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
  readonly initialEvent?: PartnerEventDetailData;
}

const venueSteps: readonly EventEditorStep[] = ['basics', 'promoters', 'review'];
const hostSteps: readonly EventEditorStep[] = ['venue', 'basics', 'promoters', 'review'];

export function PartnerEventEditor({
  data,
  availability,
  mode,
  initialStep,
  initialVenueId,
  initialDate,
  initialSlotId,
  initialEvent,
}: PartnerEventEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHost = data.role === 'host';
  const steps = isHost ? hostSteps : venueSteps;
  const initialDraft = useMemo(
    () => draftFromInput(data, initialEvent, initialVenueId, initialDate),
    [data, initialDate, initialEvent, initialVenueId],
  );
  const [draft, setDraft] = useState<EventEditorDraft>(initialDraft);
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId ?? '');
  const [localStep, setLocalStep] = useState<EventEditorStep>(normaliseStep(initialStep, steps));
  const [genrePickerOpen, setGenrePickerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'closed' | 'picker' | 'guest' | 'mobile'>(
    'closed',
  );
  const [showErrors, setShowErrors] = useState(false);

  const queryStep = searchParams.get('step') ?? undefined;
  const currentStep = queryStep ? normaliseStep(queryStep, steps) : localStep;
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
  const venueName = isHost
    ? (selectedVenueAvailability?.venue.name ?? 'Choose a partnered venue')
    : (data.venues.find((venue) => venue.id === draft.venueId)?.name ?? 'Your venue');
  const validationErrors = useMemo(
    () => validateDraft(draft, isHost && mode === 'create', selectedSlotId),
    [draft, isHost, mode, selectedSlotId],
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
    setDraft((current) => ({ ...current, ...values }));
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
    update({ time: label });
    updateQuery({ slot: slotId });
  };
  const chooseVenue = (venueId: string) => {
    setSelectedSlotId('');
    const venue = data.venues.find((item) => item.id === venueId);
    update({ venueId, ...(venue ? { artwork: venue.artwork } : {}) });
    updateQuery({ venue: venueId, date: undefined, slot: undefined });
  };
  const moveStep = (step: EventEditorStep) => {
    setShowErrors(false);
    setLocalStep(step);
    updateQuery({ step }, 'push');
  };
  const nextStep = () => {
    const errors =
      currentStep === 'venue' || currentStep === 'basics'
        ? validateDraft(draft, isHost && mode === 'create', selectedSlotId)
        : [];
    if (errors.length) {
      setShowErrors(true);
      return;
    }
    const index = steps.indexOf(currentStep);
    const next = steps[index + 1];
    if (next) moveStep(next);
    else setShowErrors(true);
  };
  const previousStep = () => {
    const index = steps.indexOf(currentStep);
    const previous = steps[index - 1];
    if (previous) moveStep(previous);
  };
  const uploadArtwork = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDraft((current) => ({
      ...current,
      artwork: { type: 'image', value: URL.createObjectURL(file), alt: file.name },
    }));
  };
  const addArtist = (artist: string) => {
    const name = artist.trim();
    if (name && !draft.artists.includes(name)) update({ artists: [...draft.artists, name] });
  };
  const nextLabel =
    currentStep === 'review'
      ? mode === 'edit'
        ? 'Save changes'
        : isHost
          ? 'Submit for approval'
          : 'Publish event'
      : 'Continue';
  const pageTitle = mode === 'edit' ? 'Edit event' : 'Create event';
  return (
    <EventEditorShell studio={data.role}>
      <Link
        className={styles['cancelLink']}
        href={isHost ? '/partner/host/events' : '/partner/venue/events'}
      >
        ← Cancel
      </Link>
      <div className={styles['headingRow']}>
        <div>
          <h1>{pageTitle}</h1>
          <p>
            {isHost
              ? 'Build an event for a partnered venue, then submit it for approval.'
              : 'Shape the event guests will discover at your venue.'}
          </p>
        </div>
        <nav className={styles['stepper']} aria-label="Event editor steps">
          {steps.map((step, index) => (
            <button
              className={[
                styles['step'],
                currentStep === step ? styles['stepActive'] : '',
                steps.indexOf(currentStep) > index ? styles['stepDone'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={step}
              type="button"
              onClick={() => {
                if (steps.indexOf(step) <= steps.indexOf(currentStep)) moveStep(step);
              }}
            >
              <span className={styles['stepNumber']}>
                {steps.indexOf(step) < steps.indexOf(currentStep) ? '✓' : index + 1}
              </span>
              {labelForStep(step)}
            </button>
          ))}
        </nav>
      </div>
      <div className={styles['layout']}>
        <section className={styles['formColumn']} aria-label="Event editor form">
          {currentStep === 'venue' ? (
            <VenueStep
              data={data}
              draft={draft}
              onVenue={chooseVenue}
              onDate={chooseDate}
              onSlot={chooseSlot}
              availability={months}
              selectedSlotId={selectedSlotId}
            />
          ) : null}
          {currentStep === 'basics' ? (
            <>
              <EventPosterUploader
                artwork={draft.artwork}
                artworkOptions={data.artworkOptions}
                onArtwork={(artwork) => {
                  update({ artwork });
                }}
                onUpload={uploadArtwork}
              />
              <EventBasicDetails
                data={data}
                draft={draft}
                editMode={mode === 'edit'}
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
              {!isHost ? (
                <EventDateTimeSection
                  months={months}
                  selectedDate={draft.date}
                  editorRole="venue"
                  onDate={chooseDate}
                  onSlot={chooseSlot}
                />
              ) : null}
              <TicketTierEditor
                tiers={draft.ticketTiers}
                onChange={(ticketTiers) => {
                  update({ ticketTiers });
                }}
              />
              <EventAdvancedSettings draft={draft} update={update} />
            </>
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
            />
          ) : null}
          {showErrors && currentStep !== 'review' && validationErrors.length ? (
            <div className={styles['validation']} role="alert">
              <strong>Finish these items before continuing</strong>
              <ul>
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className={styles['actions']}>
            {steps.indexOf(currentStep) > 0 ? (
              <button className={styles['actionButton']} type="button" onClick={previousStep}>
                Back
              </button>
            ) : null}
            <button
              className={[styles['actionButton'], styles['actionButtonPrimary']].join(' ')}
              type="button"
              onClick={nextStep}
              disabled={currentStep === 'review' && validationErrors.length > 0}
            >
              {nextLabel} <span aria-hidden="true">→</span>
            </button>
          </div>
          {currentStep === 'review' ? (
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
          onOpen={() => {
            setPreviewMode('picker');
          }}
        />
      </div>
      {previewMode !== 'closed' ? (
        <EventPreviewOverlay
          mode={previewMode}
          onPick={(modeChoice) => {
            setPreviewMode(modeChoice);
          }}
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
  onDate,
  onSlot,
}: {
  readonly data: EventEditorData;
  readonly draft: EventEditorDraft;
  readonly availability: readonly CalendarMonth[];
  readonly selectedSlotId: string;
  readonly onVenue: (id: string) => void;
  readonly onDate: (day: { readonly date: string; readonly day: number }) => void;
  readonly onSlot: (id: string, label: string) => void;
}) {
  return (
    <>
      <section className={styles['card']}>
        <div className={styles['cardTitle']}>Choose a venue</div>
        <p className={styles['muted']}>Pick from the venues you’re partnered with.</p>
        <div className={styles['venueCards']}>
          {data.venues.map((venue) => (
            <button
              className={[
                styles['venueCard'],
                venue.id === draft.venueId ? styles['venueCardSelected'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={venue.id}
              type="button"
              onClick={() => {
                onVenue(venue.id);
              }}
            >
              <div className={styles['venueCover']} />
              <span className={styles['venueCardBody']}>
                <strong>{venue.name}</strong>
                <span>{venue.meta}</span>
              </span>
            </button>
          ))}
        </div>
        <div className={styles['selectedContext']}>
          Only partnered venues can receive Host event requests.
          <span>
            {data.venues.find((venue) => venue.id === draft.venueId)?.name ?? 'Not selected'}
          </span>
        </div>
      </section>
      <EventDateTimeSection
        months={availability}
        selectedDate={draft.date}
        selectedSlotId={selectedSlotId}
        editorRole="host"
        onDate={onDate}
        onSlot={onSlot}
      />
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
                quantity: event.event.capacity,
              },
            ],
      ),
  };
}

function validateDraft(draft: EventEditorDraft, host: boolean, selectedSlotId: string) {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push('Add an event name.');
  if (host && !draft.venueId) errors.push('Choose a partnered venue.');
  if (!draft.date) errors.push('Choose an available date.');
  if (host && !selectedSlotId) errors.push('Choose an available time slot.');
  if (!draft.ticketTiers.length) errors.push('Add at least one ticket tier.');
  draft.ticketTiers.forEach((tier, index) => {
    if (!tier.name.trim()) errors.push(`Name ticket tier ${String(index + 1)}.`);
    if (tier.price <= 0)
      errors.push(`Set a valid price for ${tier.name || `tier ${String(index + 1)}`}.`);
    if (tier.quantity <= 0)
      errors.push(`Set a valid quantity for ${tier.name || `tier ${String(index + 1)}`}.`);
  });
  return errors;
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
      basics: 'Basics & tickets',
      promoters: 'Assign promoters',
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
        timeZone: 'UTC',
      }).format(date);
}
function eventDateAsIso(value: string) {
  const date = new Date(`${value}, 2026 UTC`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}
