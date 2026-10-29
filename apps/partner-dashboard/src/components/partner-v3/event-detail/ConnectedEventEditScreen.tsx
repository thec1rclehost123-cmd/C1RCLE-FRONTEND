'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { describeApiError } from '@/lib/api/describe-error';
import { updatePartnerEventDetails } from '@/lib/events/venue-event-repository';
import { loadSlotRequestsData } from '@/lib/slot-requests/slot-request-repository';

import type { EventEntryRulesDto, EventOperationsDto } from '@c1rcle/contracts';
import type { SyntheticEvent } from 'react';

interface Draft {
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly visibilityMode: 'public' | 'unlisted' | 'code' | 'invited';
  readonly addressDisclosure: 'public' | 'after_grant' | 'hidden';
  readonly entryRules: EventEntryRulesDto;
}

const emptyEntryRules: EventEntryRulesDto = {
  doorsOpenAt: null,
  lastEntryAt: null,
  reentryAllowed: null,
  minimumAge: null,
  idRequired: null,
  accessibilityNotes: null,
  dressCode: null,
  alcoholPolicy: null,
  prohibitedItems: [],
  supportDetails: null,
};

export function ConnectedEventEditScreen({
  event,
  organizationId,
  studio,
}: {
  readonly event: EventOperationsDto;
  readonly organizationId: string;
  readonly studio: 'host' | 'venue';
}) {
  const [draft, setDraft] = useState<Draft>({
    title: event.title,
    summary: event.summary,
    description: event.description,
    visibilityMode: event.visibilityMode,
    addressDisclosure: event.addressDisclosure,
    entryRules: event.entryRules ?? emptyEntryRules,
  });
  const [savedDraft, setSavedDraft] = useState(draft);
  const [version, setVersion] = useState(event.version);
  const [slotRequests, setSlotRequests] = useState<
    Awaited<ReturnType<typeof loadSlotRequestsData>>['requests']
  >([]);
  const [slotRequestsError, setSlotRequestsError] = useState<string | null>(null);
  const [slotRequestId, setSlotRequestId] = useState('');
  const [scheduleStartAt, setScheduleStartAt] = useState(event.startAt);
  const [scheduleEndAt, setScheduleEndAt] = useState(event.endAt ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studio !== 'host') return;
    let active = true;
    loadSlotRequestsData('outgoing')
      .then((result) => {
        if (active)
          setSlotRequests(result.requests.filter((request) => request.eventId === event.id));
      })
      .catch((caught: unknown) => {
        if (active)
          setSlotRequestsError(
            caught instanceof Error ? caught.message : 'Slot requests unavailable.',
          );
      });
    return () => {
      active = false;
    };
  }, [event.id, studio]);

  const hasChanges =
    draft.title !== savedDraft.title ||
    draft.summary !== savedDraft.summary ||
    draft.description !== savedDraft.description ||
    draft.visibilityMode !== savedDraft.visibilityMode ||
    draft.addressDisclosure !== savedDraft.addressDisclosure ||
    JSON.stringify(draft.entryRules) !== JSON.stringify(savedDraft.entryRules) ||
    slotRequestId !== '';

  const update = (changes: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setMessage(null);
    setError(null);
  };

  const submit = async (form: SyntheticEvent<HTMLFormElement>) => {
    form.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      setError('Enter an event title.');
      setMessage(null);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const selectedSlot = slotRequests.find(
        (request) => request.id === slotRequestId && request.status === 'approved',
      );
      if (slotRequestId && !selectedSlot?.venueId) {
        setError('Choose an accepted Venue slot with a confirmed Venue before saving.');
        setSaving(false);
        return;
      }
      const updated = await updatePartnerEventDetails(organizationId, event.id, version, {
        title,
        summary: draft.summary.trim(),
        description: draft.description.trim(),
        visibilityMode: draft.visibilityMode,
        addressDisclosure: draft.addressDisclosure,
        entryRules: draft.entryRules,
        ...(selectedSlot
          ? {
              venueId: selectedSlot.venueId,
              slotRequestId: selectedSlot.id,
              startAt: new Date(scheduleStartAt).toISOString(),
              endAt: new Date(scheduleEndAt).toISOString(),
            }
          : {}),
      });
      const nextDraft = {
        title: updated.title,
        summary: updated.summary,
        description: updated.description,
        visibilityMode: updated.visibilityMode,
        addressDisclosure: updated.addressDisclosure,
        entryRules: updated.entryRules ?? emptyEntryRules,
      };
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      setVersion(updated.version);
      setSlotRequestId('');
      setScheduleStartAt(updated.startAt);
      setScheduleEndAt(updated.endAt ?? '');
      setMessage('Event details saved.');
    } catch (caught) {
      setError(describeApiError(caught, 'The event details could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(event.id)}`}
          className="text-sm font-medium text-stone-400 no-underline hover:text-stone-100"
        >
          ← {event.title}
        </Link>
        <section
          aria-labelledby="event-edit-title"
          className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7"
        >
          <h1 id="event-edit-title" className="mb-2 text-3xl font-bold tracking-tight">
            Edit event details
          </h1>
          <p className="m-0 leading-6 text-stone-300">
            Update event details and guest-facing entry facts. A Host can apply a new date or Venue
            only through a slot request that the Venue has approved.
          </p>
          {studio === 'host' ? (
            <div className="mt-4 rounded-xl border border-white/10 p-4">
              <h2 className="font-semibold">Venue-approved reschedule</h2>
              <p className="mt-1 text-sm text-stone-400">
                Request an alternative time from the Host calendar. Once the Venue approves it,
                choose that request here and set the event interval inside its reserved slot.
              </p>
              <Link
                href={`/partner/host/calendar?event=${encodeURIComponent(event.id)}`}
                className="mt-3 inline-flex rounded-lg border border-white/20 px-3 py-2 text-sm text-white no-underline"
              >
                Request another Venue slot
              </Link>
              <label className="mt-4 grid gap-2 text-sm">
                Accepted Venue slot request
                <select
                  className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                  value={slotRequestId}
                  onChange={(change) => {
                    const request = slotRequests.find((item) => item.id === change.target.value);
                    setSlotRequestId(change.target.value);
                    if (request?.slotStartTime) setScheduleStartAt(request.slotStartTime);
                    if (request?.slotEndTime) setScheduleEndAt(request.slotEndTime);
                  }}
                >
                  <option value="">No schedule change</option>
                  {slotRequests
                    .filter((request) => request.status === 'approved')
                    .map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.partnerName || 'Venue'} ·{' '}
                        {request.slotStartTime ?? 'Time unavailable'}
                      </option>
                    ))}
                </select>
              </label>
              {slotRequestId ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    Event start (ISO 8601 UTC)
                    <input
                      className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                      value={scheduleStartAt}
                      onChange={(change) => {
                        setScheduleStartAt(change.target.value);
                      }}
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Event end (ISO 8601 UTC)
                    <input
                      className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                      value={scheduleEndAt}
                      onChange={(change) => {
                        setScheduleEndAt(change.target.value);
                      }}
                    />
                  </label>
                </div>
              ) : null}
              {slotRequestsError ? (
                <p role="alert" className="mt-2 text-sm text-red-300">
                  {slotRequestsError}
                </p>
              ) : null}
            </div>
          ) : null}
          <form className="mt-7 grid gap-5" onSubmit={(form) => void submit(form)}>
            <div className="grid gap-2">
              <label htmlFor="event-edit-title-input" className="text-sm font-medium">
                Event title
              </label>
              <input
                id="event-edit-title-input"
                value={draft.title}
                maxLength={200}
                required
                onChange={(change) => {
                  update({ title: change.target.value });
                }}
                className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
              />
            </div>
            <fieldset className="grid gap-4 rounded-xl border border-white/10 p-4">
              <legend className="px-2 text-sm font-semibold">Entry information</legend>
              <p className="m-0 text-sm leading-5 text-stone-400">
                These facts are shown to Guests. Times must be ISO 8601 UTC instants ending in Z;
                leave a field unspecified when the Venue has not confirmed it.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Doors open (UTC ISO 8601)
                  <input
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                    placeholder="2026-11-01T18:00:00.000Z"
                    value={draft.entryRules.doorsOpenAt ?? ''}
                    onChange={(change) => {
                      update({
                        entryRules: {
                          ...draft.entryRules,
                          doorsOpenAt: change.target.value || null,
                        },
                      });
                    }}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Last entry (UTC ISO 8601)
                  <input
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                    placeholder="2026-11-01T23:00:00.000Z"
                    value={draft.entryRules.lastEntryAt ?? ''}
                    onChange={(change) => {
                      update({
                        entryRules: {
                          ...draft.entryRules,
                          lastEntryAt: change.target.value || null,
                        },
                      });
                    }}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Re-entry
                  <select
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                    value={
                      draft.entryRules.reentryAllowed === null
                        ? ''
                        : String(draft.entryRules.reentryAllowed)
                    }
                    onChange={(change) => {
                      update({
                        entryRules: {
                          ...draft.entryRules,
                          reentryAllowed:
                            change.target.value === '' ? null : change.target.value === 'true',
                        },
                      });
                    }}
                  >
                    <option value="">Unspecified</option>
                    <option value="true">Allowed</option>
                    <option value="false">Not allowed</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Minimum age
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                    value={draft.entryRules.minimumAge ?? ''}
                    onChange={(change) => {
                      update({
                        entryRules: {
                          ...draft.entryRules,
                          minimumAge:
                            change.target.value === '' ? null : Number(change.target.value),
                        },
                      });
                    }}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Photo ID requirement
                  <select
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                    value={
                      draft.entryRules.idRequired === null
                        ? ''
                        : String(draft.entryRules.idRequired)
                    }
                    onChange={(change) => {
                      update({
                        entryRules: {
                          ...draft.entryRules,
                          idRequired:
                            change.target.value === '' ? null : change.target.value === 'true',
                        },
                      });
                    }}
                  >
                    <option value="">Unspecified</option>
                    <option value="true">Required</option>
                    <option value="false">Not required</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Dress code
                  <input
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                    maxLength={500}
                    value={draft.entryRules.dressCode ?? ''}
                    onChange={(change) => {
                      update({
                        entryRules: { ...draft.entryRules, dressCode: change.target.value || null },
                      });
                    }}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm">
                Accessibility information
                <textarea
                  className="resize-y rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                  maxLength={2000}
                  rows={2}
                  value={draft.entryRules.accessibilityNotes ?? ''}
                  onChange={(change) => {
                    update({
                      entryRules: {
                        ...draft.entryRules,
                        accessibilityNotes: change.target.value || null,
                      },
                    });
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Alcohol policy
                <textarea
                  className="resize-y rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                  maxLength={1000}
                  rows={2}
                  value={draft.entryRules.alcoholPolicy ?? ''}
                  onChange={(change) => {
                    update({
                      entryRules: {
                        ...draft.entryRules,
                        alcoholPolicy: change.target.value || null,
                      },
                    });
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Prohibited items (one per line)
                <textarea
                  className="resize-y rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                  maxLength={5000}
                  rows={3}
                  value={draft.entryRules.prohibitedItems.join('\n')}
                  onChange={(change) => {
                    update({
                      entryRules: {
                        ...draft.entryRules,
                        prohibitedItems: change.target.value
                          .split('\n')
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .slice(0, 50),
                      },
                    });
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Guest support details
                <input
                  className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                  maxLength={500}
                  value={draft.entryRules.supportDetails ?? ''}
                  onChange={(change) => {
                    update({
                      entryRules: {
                        ...draft.entryRules,
                        supportDetails: change.target.value || null,
                      },
                    });
                  }}
                />
              </label>
            </fieldset>
            <div className="grid gap-2">
              <label htmlFor="event-edit-visibility" className="text-sm font-medium">
                Who can find this event?
              </label>
              <select
                id="event-edit-visibility"
                value={draft.visibilityMode}
                onChange={(change) => {
                  update({
                    visibilityMode: change.target.value as
                      'public' | 'unlisted' | 'code' | 'invited',
                  });
                }}
                className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
              >
                <option value="public">Public · listed in discovery</option>
                <option value="unlisted">Unlisted · direct link only</option>
                <option value="code">Private · access code required</option>
                <option value="invited">Private · named invitation required</option>
              </select>
              <p className="m-0 text-sm leading-5 text-stone-400">
                {draft.visibilityMode === 'unlisted'
                  ? 'Unlisted events do not appear in discovery. Anyone with the link can view and share event details.'
                  : draft.visibilityMode === 'code' || draft.visibilityMode === 'invited'
                    ? 'Private event details and checkout require a verified event-scoped grant. Configure the grant from event access.'
                    : 'Public events can appear in C1RCLE discovery.'}
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="event-edit-address-disclosure" className="text-sm font-medium">
                Full venue address
              </label>
              <select
                id="event-edit-address-disclosure"
                value={draft.addressDisclosure}
                onChange={(change) => {
                  update({
                    addressDisclosure: change.target.value as 'public' | 'after_grant' | 'hidden',
                  });
                }}
                className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
              >
                <option value="public">Visible on event detail</option>
                <option value="after_grant">After private event access is granted</option>
                <option value="hidden">Hidden</option>
              </select>
              <p className="m-0 text-sm leading-5 text-stone-400">
                Private events default to hidden. An after-grant address is shown only after the
                authenticated guest receives an event-scoped grant.
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="event-edit-summary" className="text-sm font-medium">
                Guest-facing summary
              </label>
              <textarea
                id="event-edit-summary"
                value={draft.summary}
                maxLength={1000}
                rows={3}
                onChange={(change) => {
                  update({ summary: change.target.value });
                }}
                className="resize-y rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="event-edit-description" className="text-sm font-medium">
                Event description
              </label>
              <textarea
                id="event-edit-description"
                value={draft.description}
                maxLength={20_000}
                rows={7}
                onChange={(change) => {
                  update({ description: change.target.value });
                }}
                className="resize-y rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
              />
            </div>
            {error ? (
              <p role="alert" className="m-0 text-sm text-red-300">
                {error}
              </p>
            ) : null}
            {message ? (
              <p role="status" aria-live="polite" className="m-0 text-sm text-emerald-300">
                {message}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || !hasChanges || !draft.title.trim()}
                className="rounded-xl bg-[#FF4400] px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save details'}
              </button>
              <Link
                href={`/partner/${studio}/events/${encodeURIComponent(event.id)}`}
                className="rounded-xl border border-white/20 px-6 py-3 text-xs font-black uppercase tracking-widest text-white no-underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </main>
    </PageContainer>
  );
}
