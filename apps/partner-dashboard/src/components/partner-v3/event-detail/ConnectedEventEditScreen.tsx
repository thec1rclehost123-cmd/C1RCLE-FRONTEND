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
  resubmitExternalVenue,
  loadExternalVenueContact,
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
  readonly refundPolicy: NonNullable<EventOperationsDto['refundPolicy']>;
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
    entryRules: { ...(event.entryRules ?? emptyEntryRules), reentryAllowed: false },
    refundPolicy: event.refundPolicy ?? { kind: 'organizer_reviewed' },
  });
  const [savedDraft, setSavedDraft] = useState(draft);
  const [version, setVersion] = useState(event.version);
  const [slotRequests, setSlotRequests] = useState<
    Awaited<ReturnType<typeof loadSlotRequestsData>>['requests']
  >([]);
  const [slotRequestsError, setSlotRequestsError] = useState<string | null>(null);
  const [tiers, setTiers] = useState(ticketTiers);
  const [tierLimitInputs, setTierLimitInputs] = useState<Record<string, string>>({});
  const [tierQuantityInputs, setTierQuantityInputs] = useState<Record<string, string>>({});
  const [tierPriceInputs, setTierPriceInputs] = useState<Record<string, string>>({});
  const [tierLimitErrors, setTierLimitErrors] = useState<Record<string, string>>({});
  const [savingTierId, setSavingTierId] = useState<string | null>(null);
  const tierLimitIntentKeys = useRef(new Map<string, { value: string; key: string }>());
  const [slotRequestId, setSlotRequestId] = useState('');
  const [scheduleStartAt, setScheduleStartAt] = useState(
    isoInstantToProductLocalInput(event.startAt),
  );
  const [scheduleEndAt, setScheduleEndAt] = useState(
    event.endAt ? isoInstantToProductLocalInput(event.endAt) : '',
  );
  const [saving, setSaving] = useState(false);
  const [resubmittingLocation, setResubmittingLocation] = useState(false);
  const [externalContact, setExternalContact] = useState({ managerName: '', phone: '', email: '' });
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

  useEffect(() => {
    if (studio !== 'host' || event.externalVenueReviewStatus !== 'rejected') return;
    let active = true;
    loadExternalVenueContact(organizationId, event.id)
      .then((contact) => {
        if (active) setExternalContact({ ...contact, email: contact.email ?? '' });
      })
      .catch((caught: unknown) => {
        if (active) setError(describeApiError(caught, 'External venue contact is unavailable.'));
      });
    return () => {
      active = false;
    };
  }, [event.externalVenueReviewStatus, event.id, organizationId, studio]);

  const hasChanges =
    draft.title !== savedDraft.title ||
    draft.summary !== savedDraft.summary ||
    draft.description !== savedDraft.description ||
    draft.visibilityMode !== savedDraft.visibilityMode ||
    draft.addressDisclosure !== savedDraft.addressDisclosure ||
    JSON.stringify(draft.entryRules) !== JSON.stringify(savedDraft.entryRules) ||
    JSON.stringify(draft.refundPolicy) !== JSON.stringify(savedDraft.refundPolicy) ||
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
        ...(JSON.stringify(draft.refundPolicy) !== JSON.stringify(savedDraft.refundPolicy)
          ? { refundPolicy: draft.refundPolicy }
          : {}),
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
        refundPolicy: updated.refundPolicy ?? { kind: 'organizer_reviewed' as const },
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

  const resubmitLocation = async () => {
    const location = event.externalLocation;
    if (!location) return;
    setResubmittingLocation(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await resubmitExternalVenue(organizationId, event.id, {
        name: location.name,
        address: location.address ?? '',
        ...(location.city ? { city: location.city } : {}),
        ...(location.region ? { region: location.region } : {}),
        ...(location.postalCode ? { postalCode: location.postalCode } : {}),
        ...(location.country ? { country: location.country } : {}),
        ...(location.mapUrl ? { mapUrl: location.mapUrl } : {}),
        contact: {
          managerName: externalContact.managerName,
          phone: externalContact.phone,
          ...(externalContact.email.trim() ? { email: externalContact.email.trim() } : {}),
        },
      });
      setVersion(updated.version);
      setMessage('External venue details resubmitted for C1RCLE review.');
    } catch (caught) {
      setError(describeApiError(caught, 'The external venue request could not be resubmitted.'));
    } finally {
      setResubmittingLocation(false);
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

    const quantity = Number(tierQuantityInputs[tier.id] ?? tier.quantity);
    const priceInput = tierPriceInputs[tier.id] ?? String(tier.priceInPaise / 100);
    const priceInPaise = Math.round(Number(priceInput) * 100);
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 0 ||
      (tier.accessType !== 'RSVP' &&
        (!/^\d+(\.\d{1,2})?$/.test(priceInput) ||
          !Number.isSafeInteger(priceInPaise) ||
          priceInPaise <= 0))
    ) {
      setTierLimitErrors((current) => ({
        ...current,
        [tier.id]: 'Enter a whole inventory quantity and a positive price with up to two decimals.',
      }));
      return;
    }
    const changes = {
      ...(tier.maxPerOrder === value ? {} : { maxPerOrder: value }),
      ...(tier.quantity === quantity ? {} : { quantity }),
      ...(tier.accessType === 'RSVP' || tier.priceInPaise === priceInPaise ? {} : { priceInPaise }),
    };
    const intent = JSON.stringify(changes);
    const pending = tierLimitIntentKeys.current.get(tier.id);
    const idempotencyKey = pending?.value === intent ? pending.key : crypto.randomUUID();
    tierLimitIntentKeys.current.set(tier.id, { value: intent, key: idempotencyKey });
    setSavingTierId(tier.id);
    setTierLimitErrors((current) => ({ ...current, [tier.id]: '' }));
    setMessage(null);
    try {
      const updated = await updatePartnerEventTicketLimit(
        organizationId,
        event.id,
        tier.id,
        tier.version,
        changes,
        idempotencyKey,
      );
      setTiers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setTierLimitInputs((current) => ({
        ...current,
        [tier.id]: String(updated.maxPerOrder ?? ''),
      }));
      setTierQuantityInputs((current) => ({ ...current, [tier.id]: String(updated.quantity) }));
      setTierPriceInputs((current) => ({
        ...current,
        [tier.id]: String(updated.priceInPaise / 100),
      }));
      tierLimitIntentKeys.current.delete(tier.id);
      setMessage(
        changes.quantity !== undefined || changes.priceInPaise !== undefined
          ? `${tier.name} ticket settings saved.`
          : `${tier.name} per-order limit saved.`,
      );
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
          {studio === 'host' &&
          event.externalVenueReviewStatus === 'rejected' &&
          event.externalLocation ? (
            <section
              aria-labelledby="external-location-resubmit"
              className="mb-5 rounded-xl border border-amber-500/30 p-4"
            >
              <h2 id="external-location-resubmit" className="font-semibold">
                Resubmit external venue
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                C1RCLE requested changes to {event.externalLocation.name}. Confirm the public
                location and re-enter the private manager contact to request another review.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  Manager name
                  <input
                    className="rounded-lg border border-white/20 bg-black px-3 py-2"
                    value={externalContact.managerName}
                    onChange={(e) => {
                      setExternalContact((v) => ({ ...v, managerName: e.target.value }));
                    }}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Manager phone
                  <input
                    className="rounded-lg border border-white/20 bg-black px-3 py-2"
                    value={externalContact.phone}
                    onChange={(e) => {
                      setExternalContact((v) => ({ ...v, phone: e.target.value }));
                    }}
                  />
                </label>
                <label className="grid gap-1 text-sm sm:col-span-2">
                  Manager email (optional)
                  <input
                    type="email"
                    className="rounded-lg border border-white/20 bg-black px-3 py-2"
                    value={externalContact.email}
                    onChange={(e) => {
                      setExternalContact((v) => ({ ...v, email: e.target.value }));
                    }}
                  />
                </label>
              </div>
              <button
                className="mt-3 rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
                type="button"
                disabled={
                  resubmittingLocation ||
                  !externalContact.managerName.trim() ||
                  !externalContact.phone.trim()
                }
                onClick={() => void resubmitLocation()}
              >
                {resubmittingLocation ? 'Submitting…' : 'Resubmit for review'}
              </button>
            </section>
          ) : null}
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
              <label className="mt-4 grid min-w-0 grid-cols-1 gap-2 text-sm">
                Accepted Venue slot request
                <select
                  className="min-w-0 w-full rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
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
                Ticket inventory, prices and purchase limits
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                Inventory is independent for each tier. Existing purchases keep their original
                price. Inventory cannot be reduced below sold and actively held tickets. Free RSVP
                is limited to one per order.
              </p>
              <div className="mt-4 grid gap-3">
                {tiers.map((tier) => {
                  const value =
                    tierLimitInputs[tier.id] ??
                    String(tier.maxPerOrder ?? (tier.accessType === 'RSVP' ? 1 : 10));
                  const parsedValue = Number(value);
                  const valid =
                    Number.isInteger(parsedValue) && parsedValue >= 1 && parsedValue <= 10;
                  const quantityValue = tierQuantityInputs[tier.id] ?? String(tier.quantity);
                  const priceValue = tierPriceInputs[tier.id] ?? String(tier.priceInPaise / 100);
                  const quantityChanged = Number(quantityValue) !== tier.quantity;
                  const priceChanged =
                    tier.accessType !== 'RSVP' &&
                    Math.round(Number(priceValue) * 100) !== tier.priceInPaise;
                  const changed =
                    valid && (tier.maxPerOrder !== parsedValue || quantityChanged || priceChanged);
                  return (
                    <div
                      key={tier.id}
                      className="grid gap-3 border-t border-white/10 py-4 sm:grid-cols-2 lg:grid-cols-4 sm:items-end"
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
                        Total inventory
                        <input
                          aria-label={`${tier.name} total inventory`}
                          type="number"
                          min="0"
                          step="1"
                          value={quantityValue}
                          onChange={(change) => {
                            setTierQuantityInputs((current) => ({
                              ...current,
                              [tier.id]: change.target.value,
                            }));
                          }}
                          className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white"
                        />
                      </label>
                      {tier.accessType !== 'RSVP' ? (
                        <label className="grid gap-1 text-sm">
                          Future price (₹)
                          <input
                            aria-label={`${tier.name} future price`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={priceValue}
                            onChange={(change) => {
                              setTierPriceInputs((current) => ({
                                ...current,
                                [tier.id]: change.target.value,
                              }));
                            }}
                            className="rounded-lg border border-white/20 bg-black px-3 py-2 text-white"
                          />
                        </label>
                      ) : null}
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
                        {savingTierId === tier.id
                          ? 'Saving…'
                          : changed
                            ? quantityChanged || priceChanged
                              ? 'Save ticket settings'
                              : 'Save limit'
                            : 'Saved'}
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
          <form
            className="mt-7 grid min-w-0 grid-cols-1 gap-5 [&_fieldset]:min-w-0 [&_input]:min-w-0 [&_select]:min-w-0 [&_textarea]:min-w-0"
            onSubmit={(form) => void submit(form)}
          >
            <div className="grid gap-2 border-t border-white/10 pt-4">
              <label htmlFor="event-refund-policy" className="text-sm font-medium">
                Refund request policy
              </label>
              <select
                id="event-refund-policy"
                value={draft.refundPolicy.kind}
                onChange={(change) => {
                  const kind = change.target.value;
                  update({
                    refundPolicy:
                      kind === 'until_cutoff'
                        ? { kind, cutoffAt: '' }
                        : { kind: kind === 'no_refunds' ? 'no_refunds' : 'organizer_reviewed' },
                  });
                }}
                className="rounded-lg border border-white/20 bg-black px-3 py-2"
              >
                <option value="organizer_reviewed">Organizer-reviewed requests</option>
                <option value="until_cutoff">Requests until a deadline</option>
                <option value="no_refunds">No refund requests</option>
              </select>
              {draft.refundPolicy.kind === 'until_cutoff' ? (
                <label className="grid gap-2 text-sm">
                  Refund request deadline (IST)
                  <input
                    type="datetime-local"
                    required
                    value={isoInstantToProductLocalInput(draft.refundPolicy.cutoffAt)}
                    onChange={(change) => {
                      update({
                        refundPolicy: {
                          kind: 'until_cutoff',
                          cutoffAt: productLocalInputToIsoInstant(change.target.value) ?? '',
                        },
                      });
                    }}
                    className="rounded-lg border border-white/20 bg-black px-3 py-2"
                  />
                </label>
              ) : null}
              <p className="text-sm text-stone-400">
                Cancellation, postponement and material event changes preserve the purchaser’s right
                to request a refund. Requests never issue an instant refund.
              </p>
            </div>

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
                    disabled
                    value="false"
                    className="rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                  >
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
