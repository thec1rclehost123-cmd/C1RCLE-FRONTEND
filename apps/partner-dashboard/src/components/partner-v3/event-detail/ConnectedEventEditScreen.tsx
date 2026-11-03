'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { describeApiError } from '@/lib/api/describe-error';
import {
  isoInstantToProductLocalInput,
  productLocalInputToIsoInstant,
} from '@/lib/events/event-time';
import {
  updatePartnerEventDetails,
  updatePartnerEventTicketLimit,
} from '@/lib/events/venue-event-repository';
import { loadSlotRequestsData } from '@/lib/slot-requests/slot-request-repository';

import type { EventEntryRulesDto, EventOperationsDto, TicketTierDto } from '@c1rcle/contracts';
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

function formatAcceptedSlot(request: {
  readonly slotStartTime?: string | undefined;
  readonly slotEndTime?: string | undefined;
  readonly timezone?: string | undefined;
}): string {
  if (!request.slotStartTime || !request.slotEndTime) return 'Time unavailable';
  const start = new Date(request.slotStartTime);
  const end = new Date(request.slotEndTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Time unavailable';

  try {
    const formatDate = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeZone: PRODUCT_TIME_ZONE,
    });
    const date = formatDate.format(start);
    const endDate = formatDate.format(end);
    const formatTime = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: PRODUCT_TIME_ZONE,
      timeZoneName: 'short',
    });
    const endLabel =
      endDate === date ? formatTime.format(end) : `${endDate} ${formatTime.format(end)}`;
    return `${date} · ${formatTime.format(start)} – ${endLabel}`;
  } catch {
    return 'Time unavailable';
  }
}

export function ConnectedEventEditScreen({
  event,
  organizationId,
  studio,
  ticketTiers = [],
}: {
  readonly event: EventOperationsDto;
  readonly organizationId: string;
  readonly studio: 'host' | 'venue';
  readonly ticketTiers?: readonly TicketTierDto[];
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
  const [tiers, setTiers] = useState(ticketTiers);
  const [tierLimitInputs, setTierLimitInputs] = useState<Record<string, string>>({});
  const [tierLimitErrors, setTierLimitErrors] = useState<Record<string, string>>({});
  const [savingTierId, setSavingTierId] = useState<string | null>(null);
  const tierLimitIntentKeys = useRef(new Map<string, { value: number; key: string }>());
  const [slotRequestId, setSlotRequestId] = useState('');
  const [scheduleStartAt, setScheduleStartAt] = useState(
    isoInstantToProductLocalInput(event.startAt),
  );
  const [scheduleEndAt, setScheduleEndAt] = useState(
    event.endAt ? isoInstantToProductLocalInput(event.endAt) : '',
  );
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
      const scheduleStartAtIso = productLocalInputToIsoInstant(scheduleStartAt);
      const scheduleEndAtIso = productLocalInputToIsoInstant(scheduleEndAt);
      if (selectedSlot && (!scheduleStartAtIso || !scheduleEndAtIso)) {
        setError('Enter a valid start and end time in IST.');
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
        ...(selectedSlot && scheduleStartAtIso && scheduleEndAtIso
          ? {
              venueId: selectedSlot.venueId,
              slotRequestId: selectedSlot.id,
              startAt: scheduleStartAtIso,
              endAt: scheduleEndAtIso,
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
      setScheduleStartAt(isoInstantToProductLocalInput(updated.startAt));
      setScheduleEndAt(updated.endAt ? isoInstantToProductLocalInput(updated.endAt) : '');
      setMessage('Event details saved.');
    } catch (caught) {
      setError(describeApiError(caught, 'The event details could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const saveTierLimit = async (tier: TicketTierDto) => {
    const value = Number(
      tierLimitInputs[tier.id] ?? String(tier.maxPerOrder ?? (tier.accessType === 'RSVP' ? 1 : 10)),
    );
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      setTierLimitErrors((current) => ({
        ...current,
        [tier.id]: 'Choose a whole number from 1 to 10.',
      }));
      return;
    }
    if (tier.accessType === 'RSVP' && value !== 1) {
      setTierLimitErrors((current) => ({
        ...current,
        [tier.id]: 'Free RSVP is limited to one per order.',
      }));
      return;
    }

    const pending = tierLimitIntentKeys.current.get(tier.id);
    const idempotencyKey = pending?.value === value ? pending.key : crypto.randomUUID();
    tierLimitIntentKeys.current.set(tier.id, { value, key: idempotencyKey });
    setSavingTierId(tier.id);
    setTierLimitErrors((current) => ({ ...current, [tier.id]: '' }));
    setMessage(null);
    try {
      const updated = await updatePartnerEventTicketLimit(
        organizationId,
        event.id,
        tier.id,
        tier.version,
        value,
        idempotencyKey,
      );
      setTiers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setTierLimitInputs((current) => ({
        ...current,
        [tier.id]: String(updated.maxPerOrder ?? ''),
      }));
      tierLimitIntentKeys.current.delete(tier.id);
      setMessage(`${tier.name} per-order limit saved.`);
    } catch (caught) {
      setTierLimitErrors((current) => ({
        ...current,
        [tier.id]: describeApiError(caught, 'The ticket limit could not be saved.'),
      }));
    } finally {
      setSavingTierId(null);
    }
  };

  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <section
          aria-labelledby="event-edit-title"
          className="rounded-2xl border border-white/15 bg-neutral-950 p-5"
        >
          <h1 id="event-edit-title" className="mb-3 text-2xl font-bold tracking-tight">
            Edit event details
          </h1>
          {studio === 'host' ? (
            <div className="mt-4 rounded-xl border border-white/10 p-4">
              <h2 className="font-semibold">Venue-approved reschedule</h2>
              <p className="mt-1 text-sm text-stone-400">
                Choose an approved Venue slot and keep the event interval within it.
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
                    if (request?.slotStartTime)
                      setScheduleStartAt(isoInstantToProductLocalInput(request.slotStartTime));
                    if (request?.slotEndTime)
                      setScheduleEndAt(isoInstantToProductLocalInput(request.slotEndTime));
                  }}
                >
                  <option value="">No schedule change</option>
                  {slotRequests
                    .filter((request) => request.status === 'approved')
                    .map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.partnerName.trim() || 'Venue'} · {formatAcceptedSlot(request)}
                      </option>
                    ))}
                </select>
              </label>
              {slotRequestId ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    Event start (IST)
                    <input
                      type="datetime-local"
                      className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                      value={scheduleStartAt}
                      onChange={(change) => {
                        setScheduleStartAt(change.target.value);
                      }}
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Event end (IST)
                    <input
                      type="datetime-local"
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
          {studio === 'host' ? (
            <section
              aria-labelledby="event-ticket-limits-title"
              className="mt-5 rounded-xl border border-white/10 p-4"
            >
              <h2 id="event-ticket-limits-title" className="font-semibold">
                Ticket purchase limits
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                Limits apply per order. Free RSVP is limited to 1; paid tickets can be limited to
                10.
              </p>
              <div className="mt-4 grid gap-3">
                {tiers.map((tier) => {
                  const value =
                    tierLimitInputs[tier.id] ??
                    String(tier.maxPerOrder ?? (tier.accessType === 'RSVP' ? 1 : 10));
                  const parsedValue = Number(value);
                  const valid =
                    Number.isInteger(parsedValue) && parsedValue >= 1 && parsedValue <= 10;
                  const changed = valid && tier.maxPerOrder !== parsedValue;
                  return (
                    <div
                      key={tier.id}
                      className="grid gap-3 rounded-lg border border-white/10 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                    >
                      <div>
                        <div className="font-medium">{tier.name}</div>
                        <div className="text-sm text-stone-400">
                          {tier.accessType === 'RSVP'
                            ? 'Free RSVP'
                            : `₹${(tier.priceInPaise / 100).toLocaleString('en-IN')} paid ticket`}
                        </div>
                      </div>
                      <label className="grid gap-1 text-sm">
                        Maximum per order
                        <input
                          aria-label={`${tier.name} maximum per order`}
                          type="number"
                          min="1"
                          max="10"
                          step="1"
                          value={value}
                          disabled={tier.accessType === 'RSVP'}
                          onChange={(change) => {
                            setTierLimitInputs((current) => ({
                              ...current,
                              [tier.id]: change.target.value,
                            }));
                            setTierLimitErrors((current) => ({ ...current, [tier.id]: '' }));
                          }}
                          className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-70"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={savingTierId !== null || !valid || !changed}
                        onClick={() => void saveTierLimit(tier)}
                        className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingTierId === tier.id ? 'Saving…' : changed ? 'Save limit' : 'Saved'}
                      </button>
                      {tierLimitErrors[tier.id] ? (
                        <p role="alert" className="text-sm text-red-300 sm:col-span-3">
                          {tierLimitErrors[tier.id]}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                {!tiers.length ? (
                  <p className="text-sm text-stone-400">No ticket tiers found.</p>
                ) : null}
              </div>
            </section>
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
                These facts are shown to Guests. Enter times in IST; leave a field unspecified when
                the Venue has not confirmed it.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Doors open (IST)
                  <input
                    type="datetime-local"
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                    value={isoInstantToProductLocalInput(draft.entryRules.doorsOpenAt ?? '')}
                    onChange={(change) => {
                      const value = change.target.value
                        ? productLocalInputToIsoInstant(change.target.value)
                        : null;
                      update({
                        entryRules: {
                          ...draft.entryRules,
                          doorsOpenAt: value,
                        },
                      });
                    }}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Last entry (IST)
                  <input
                    type="datetime-local"
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                    value={isoInstantToProductLocalInput(draft.entryRules.lastEntryAt ?? '')}
                    onChange={(change) => {
                      const value = change.target.value
                        ? productLocalInputToIsoInstant(change.target.value)
                        : null;
                      update({
                        entryRules: {
                          ...draft.entryRules,
                          lastEntryAt: value,
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
