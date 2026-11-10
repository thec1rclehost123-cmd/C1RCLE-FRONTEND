'use client';

import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';

import { formatProductDateTime } from '@/lib/events/event-time';
import {
  createEventPromoterAssignment,
  listEventPromoterAttributedOrders,
  revokeEventPromoterAssignment,
} from '@/lib/partner/promoter-assignment-repository';

import styles from './connected-event-promoters.module.css';

import type {
  PromoterAssignmentDto,
  PromoterAssignmentCandidateDto,
  ReferralLinkDto,
  TicketTierDto,
  EventPromoterAnalyticsDto,
} from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export function ConnectedEventPromoterManagement({
  eventId,
  connections,
  assignments,
  links,
  tiers,
  performance,
}: {
  readonly eventId: string;
  readonly connections: readonly PromoterAssignmentCandidateDto[];
  readonly assignments: readonly PromoterAssignmentDto[];
  readonly links: readonly ReferralLinkDto[];
  readonly tiers: readonly TicketTierDto[];
  readonly performance: EventPromoterAnalyticsDto;
}) {
  const router = useRouter();
  const commissionableTiers = tiers.filter(
    (tier) => tier.accessType !== 'RSVP' && tier.commissionEligible === true,
  );
  const performanceOnly =
    commissionableTiers.length === 0 &&
    tiers.length > 0 &&
    tiers.every((t) => t.accessType === 'RSVP');
  const [promoterId, setPromoterId] = useState(connections[0]?.id ?? '');
  const [ratePercent, setRatePercent] = useState(performanceOnly ? '0' : '10');
  const [flatRupees, setFlatRupees] = useState('0');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [eligibleTierIds, setEligibleTierIds] = useState<readonly string[]>(
    commissionableTiers.map((tier) => tier.id),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const promoterNames = new Map<string, string>(connections.map((item) => [item.id, item.name]));
  const performanceByPromoter = new Map(
    performance.items.map((item) => [item.promoterOrganizationId, item]),
  );
  const linksByAssignment = new Map<string, ReferralLinkDto[]>();
  for (const link of links) {
    if (!link.assignmentId) continue;
    const grouped = linksByAssignment.get(link.assignmentId) ?? [];
    grouped.push(link);
    linksByAssignment.set(link.assignmentId, grouped);
  }
  const promoterBreakdown = performance.items.map((item) => {
    const promoterLinks = links.filter((link) => link.promoterId === item.promoterOrganizationId);
    const assignment = assignments.find(
      (candidate) => candidate.promoterId === item.promoterOrganizationId,
    );
    return {
      id: item.promoterOrganizationId,
      name: promoterNames.get(item.promoterOrganizationId) ?? 'Promoter',
      status: assignment?.status ?? 'historical',
      clicks: promoterLinks.reduce((total, link) => total + link.clicks, 0),
      linkConversions: promoterLinks.reduce((total, link) => total + link.conversions, 0),
      item,
    };
  });

  async function invite(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId('create');
    setError(null);
    setNotice(null);
    try {
      await createEventPromoterAssignment({
        eventId,
        promoterId,
        ratePercent: performanceOnly ? 0 : Number(ratePercent),
        flatPaise: performanceOnly ? 0 : Math.round(Number(flatRupees) * 100),
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        eligibleTierIds,
      });
      setNotice('Invitation sent with the terms shown above.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The invitation could not be sent.');
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(assignment: PromoterAssignmentDto, inputReason: string) {
    const reason = inputReason.trim();
    if (!reason) return;
    setBusyId(assignment.id);
    setError(null);
    setNotice(null);
    try {
      await revokeEventPromoterAssignment({
        assignmentId: assignment.id,
        expectedVersion: assignment.version,
        reason,
      });
      setNotice('Assignment revoked. Existing attributed orders retain their recorded terms.');
      setRevokingId(null);
      setRevokeReason('');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The assignment could not be revoked.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 py-7 text-stone-100">
      <section className={styles['performance']}>
        <header className={styles['performanceHeader']}>
          <div>
            <p className={styles['eyebrow']}>Event performance</p>
            <h2>Promoter results</h2>
          </div>
        </header>
        <div className={styles['headlineMetrics']}>
          <article>
            <span>Attributed tickets</span>
            <strong>{performance.attributedTicketCount.toLocaleString('en-IN')}</strong>
          </article>
          <article>
            <span>Gross attributed sales</span>
            <strong>{money.format(performance.grossAttributedTicketValuePaise / 100)}</strong>
          </article>
          <article>
            <span>Refunded ticket value</span>
            <strong className={styles['negative']}>
              {money.format(performance.refundedAttributedTicketValuePaise / 100)}
            </strong>
          </article>
          <article>
            <span>Net attributed sales</span>
            <strong>{money.format(performance.netAttributedTicketValuePaise / 100)}</strong>
          </article>
        </div>
        <div className={styles['financeMetrics']}>
          <span>
            Commission recorded <strong>{money.format(performance.recordedCommissionPaise / 100)}</strong>
          </span>
          <span>
            Reversed <strong>{performance.reversedCommissionPaise === null
              ? 'Unavailable'
              : money.format(performance.reversedCommissionPaise / 100)}</strong>
          </span>
          <span>
            Current payable balance <strong>{money.format(performance.commissionPayableBalancePaise / 100)}</strong>
          </span>
          <span>
            RSVPs <strong>{performance.activeRsvpCount.toLocaleString('en-IN')} active · {performance.historicalRsvpConversionCount.toLocaleString('en-IN')} historical</strong>
          </span>
        </div>
        <p className={styles['definitionNote']}>
          Historical acquisition remains after refunds. Attributed sales records referral credit; it does not measure sales lift.
        </p>
        {!performance.refundValueComplete ? (
          <p role="status" className={styles['warning']}>
            Settled refund ticket value is incomplete because an authoritative refund journal is
            missing for one or more orders.
          </p>
        ) : null}
        {!performance.complete || !performance.liabilityComplete ? (
          <p role="status" className={styles['warning']}>
            {!performance.complete
              ? 'Sales totals cover the first 1,000 event orders; additional orders remain outside this bounded view. '
              : ''}
            {!performance.liabilityComplete
              ? 'The liability ledger scan reached its 1,000-entry limit and may be incomplete.'
              : ''}
          </p>
        ) : null}
      </section>

      <section className={styles['breakdown']} aria-labelledby="promoter-breakdown-title">
        <header className={styles['breakdownHeader']}>
          <div>
            <h2 id="promoter-breakdown-title">Promoter breakdown</h2>
            <p>Attributed ticket and RSVP outcomes by Promoter.</p>
          </div>
          <span>{promoterBreakdown.length} {promoterBreakdown.length === 1 ? 'Promoter' : 'Promoters'}</span>
        </header>
        {promoterBreakdown.length === 0 ? (
          <p className={styles['emptyBreakdown']}>
            No Promoter-attributed ticket or RSVP activity has been recorded for this event yet.
          </p>
        ) : (
          <div className={styles['promoterList']}>
            {promoterBreakdown.map(({ id, name, status, clicks, linkConversions, item }) => (
              <article className={styles['promoterCard']} key={id}>
                <header>
                  <div>
                    <h3>{name}</h3>
                    <p>{clicks.toLocaleString('en-IN')} clicks · {linkConversions.toLocaleString('en-IN')} link conversions</p>
                  </div>
                  <span className={styles['status']}>{status}</span>
                </header>
                <dl>
                  <div><dt>Attributed tickets</dt><dd>{item.attributedTicketCount.toLocaleString('en-IN')}</dd></div>
                  <div><dt>RSVPs</dt><dd>{item.activeRsvpCount.toLocaleString('en-IN')} active · {item.historicalRsvpConversionCount.toLocaleString('en-IN')} historical</dd></div>
                  <div><dt>Gross sales</dt><dd>{money.format(item.grossAttributedTicketValuePaise / 100)}</dd></div>
                  <div><dt>Refunded</dt><dd className={styles['negative']}>{money.format(item.refundedAttributedTicketValuePaise / 100)}</dd></div>
                  <div><dt>Net sales</dt><dd>{money.format(item.netAttributedTicketValuePaise / 100)}</dd></div>
                  <div><dt>Commission recorded</dt><dd>{money.format(item.recordedCommissionPaise / 100)}</dd></div>
                  <div><dt>Current payable balance</dt><dd>{money.format(item.commissionPayableBalancePaise / 100)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="rounded-2xl border border-white/15 bg-neutral-950 p-6">
        <h1 className="text-2xl font-bold">Promoter assignments</h1>
        <p className="mt-1 text-xs text-stone-400">
          Invites require an active connection; terms are fixed when sent.
        </p>
        {connections.length === 0 ? (
          <p className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-stone-300">
            No eligible Promoters are available for this event. A Promoter needs an active
            connection and current agreement evidence before you can invite them.
          </p>
        ) : (
          <form
            onSubmit={(event) => {
              void invite(event);
            }}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <label className="grid gap-1 text-sm">
              Promoter
              <select
                value={promoterId}
                onChange={(event) => {
                  setPromoterId(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
                required
              >
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Commission rate (%)
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                required
                disabled={performanceOnly}
                value={ratePercent}
                onChange={(event) => {
                  setRatePercent(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Fixed commission per order (INR)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                disabled={performanceOnly}
                value={flatRupees}
                onChange={(event) => {
                  setFlatRupees(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Campaign starts (optional)
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => {
                  setStartsAt(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Campaign expires (optional)
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => {
                  setExpiresAt(event.target.value);
                }}
                className="rounded-lg border border-white/20 bg-neutral-900 p-3"
              />
            </label>
            <fieldset className="grid gap-2 text-sm md:col-span-2">
              <legend>Eligible ticket tiers</legend>
              {performanceOnly ? (
                <p className="text-stone-300">
                  RSVP-only event. Referrals and free RSVPs are tracked with zero commission.
                </p>
              ) : commissionableTiers.length === 0 ? (
                <p className="text-stone-400">No active ticket tiers are available.</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {commissionableTiers.map((tier) => (
                    <label key={tier.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={eligibleTierIds.includes(tier.id)}
                        onChange={(event) => {
                          setEligibleTierIds((current) =>
                            event.target.checked
                              ? [...current, tier.id]
                              : current.filter((id) => id !== tier.id),
                          );
                        }}
                      />
                      {tier.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <p className="text-xs text-stone-400 md:col-span-2">
              {ratePercent || '0'}% + {money.format(Number(flatRupees) || 0)} per order.
            </p>
            <button
              type="submit"
              disabled={
                busyId !== null ||
                !promoterId ||
                (!performanceOnly &&
                  (commissionableTiers.length === 0 || eligibleTierIds.length === 0))
              }
              className="w-fit rounded-xl bg-white px-4 py-2 font-semibold text-black disabled:opacity-50"
            >
              {busyId === 'create' ? 'Sending…' : 'Send invitation'}
            </button>
          </form>
        )}
        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mt-4 text-sm text-emerald-300">
            {notice}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/15 bg-neutral-950 p-6">
        <h2 className="text-xl font-bold">Campaigns</h2>
        {assignments.length === 0 ? (
          <p className="mt-4 text-sm text-stone-400">No Promoter assignments are recorded.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-semibold">
                    {promoterNames.get(assignment.promoterId) ?? 'Connected Promoter'}
                  </h3>
                  <p className="text-sm text-stone-300">
                    {assignment.status} · {assignment.terms.ratePercent}% +{' '}
                    {money.format(assignment.terms.flatPaise / 100)} per order
                  </p>
                  {performanceByPromoter.has(assignment.promoterId) ? (
                    <p className="mt-2 text-xs text-stone-400">
                      {performanceByPromoter.get(assignment.promoterId)?.attributedTicketCount ?? 0}{' '}
                      attributed tickets ·{' '}
                      {money.format(
                        (performanceByPromoter.get(assignment.promoterId)
                          ?.recordedCommissionPaise ?? 0) / 100,
                      )}{' '}
                      recorded commission ·{' '}
                      {money.format(
                        (performanceByPromoter.get(assignment.promoterId)
                          ?.commissionPayableBalancePaise ?? 0) / 100,
                      )}{' '}
                      liability
                    </p>
                  ) : null}
                  <p className="text-xs text-stone-400">
                    {assignment.startsAt
                      ? formatProductDateTime(assignment.startsAt)
                      : 'No start limit'}
                    {' — '}
                    {assignment.expiresAt
                      ? formatProductDateTime(assignment.expiresAt)
                      : 'No expiry'}
                  </p>
                  {(linksByAssignment.get(assignment.id) ?? []).map((link) => (
                    <div key={link.id} className="mt-2 text-xs text-stone-400">
                      <p>
                        {link.label} · code {link.code} · {link.isActive ? 'Active' : 'Inactive'}
                        {link.vanitySlug ? ` · /${link.vanityPrefix}/${link.vanitySlug}` : ''}
                      </p>
                      <p>
                        {link.clicks} clicks, {link.conversions} recorded conversions,{' '}
                        {money.format(link.revenuePaise / 100)} attributed ticket value and{' '}
                        {money.format(link.commissionPaise / 100)} recorded commission
                      </p>
                    </div>
                  ))}
                  <EventAttributedOrders
                    eventId={eventId}
                    promoterId={assignment.promoterId}
                    assignmentId={assignment.id}
                  />
                </div>
                {['invited', 'accepted', 'active'].includes(assignment.status) ? (
                  revokingId === assignment.id ? (
                    <form
                      className="grid gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void revoke(assignment, revokeReason);
                      }}
                    >
                      <label className="grid gap-1 text-sm">
                        Reason for revoking future promotion
                        <input
                          required
                          minLength={3}
                          maxLength={500}
                          value={revokeReason}
                          onChange={(event) => {
                            setRevokeReason(event.target.value);
                          }}
                          className="rounded-lg border border-white/20 bg-neutral-900 p-2"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={busyId !== null}
                          className="rounded-lg border border-red-400/50 px-3 py-2 text-sm text-red-200 disabled:opacity-50"
                        >
                          {busyId === assignment.id ? 'Revoking…' : 'Confirm revoke'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => {
                            setRevokingId(null);
                            setRevokeReason('');
                          }}
                          className="rounded-lg border border-white/20 px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => {
                        setRevokingId(assignment.id);
                      }}
                      className="h-fit rounded-lg border border-red-400/50 px-3 py-2 text-sm text-red-200 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function EventAttributedOrders({
  eventId,
  promoterId,
  assignmentId,
}: {
  readonly eventId: string;
  readonly promoterId: string;
  readonly assignmentId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<Awaited<
    ReturnType<typeof listEventPromoterAttributedOrders>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(cursor?: string, append = false) {
    setLoading(true);
    setError(null);
    try {
      const nextPage = await listEventPromoterAttributedOrders({
        eventId,
        promoterId,
        ...(cursor === undefined ? {} : { cursor }),
      });
      setPage((current) =>
        append && current
          ? { ...nextPage, items: [...current.items, ...nextPage.items] }
          : nextPage,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Attributed orders could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  const nextCursor = page?.pageInfo.hasNextPage
    ? String(page.pageInfo.page * page.pageInfo.pageSize)
    : undefined;
  const regionId = `attributed-orders-${assignmentId}`;

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={regionId}
        disabled={loading}
        onClick={() => {
          const nextExpanded = !expanded;
          setExpanded(nextExpanded);
          if (nextExpanded && !page) void load();
        }}
        className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium disabled:opacity-50"
      >
        {expanded ? 'Hide attributed orders' : 'View attributed orders'}
      </button>
      {expanded ? (
        <div id={regionId} className="mt-3 rounded-xl border border-white/10 p-3">
          <h4 className="text-sm font-semibold">Attributed orders</h4>
          <p className="mt-1 text-xs text-stone-400">
            Guest contact and payment details are excluded.
          </p>
          {loading && !page ? (
            <p role="status" className="mt-3 text-sm text-stone-300">
              Loading attributed orders…
            </p>
          ) : null}
          {error ? (
            <div className="mt-3" role="alert">
              <p className="text-sm text-red-300">{error}</p>
              {!page ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void load()}
                  className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-xs"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
          {page?.items.length === 0 ? (
            <p className="mt-3 text-sm text-stone-400">No attributed orders are recorded.</p>
          ) : null}
          {page?.items.length ? (
            <>
              <p className="mt-3 text-xs text-stone-400">
                Showing {page.items.length} of {page.pageInfo.total} attributed orders.
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-xs">
                  <thead className="text-stone-400">
                    <tr>
                      <th scope="col" className="px-2 py-2">
                        Booking reference
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Status
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Tickets
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Ticket value
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Frozen commission
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Attributed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((order) => (
                      <tr key={order.id} className="border-t border-white/10">
                        <td className="px-2 py-2 font-medium">
                          {order.bookingReference ?? 'Unavailable'}
                        </td>
                        <td className="px-2 py-2 capitalize">
                          {order.status.replaceAll('_', ' ')}
                        </td>
                        <td className="px-2 py-2">{order.ticketCount}</td>
                        <td className="px-2 py-2">
                          {money.format(order.attributedTicketValuePaise / 100)}
                        </td>
                        <td className="px-2 py-2">
                          {money.format(order.promoterCommissionPaise / 100)}
                        </td>
                        <td className="px-2 py-2">{formatProductDateTime(order.attributedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {nextCursor ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void load(nextCursor, true)}
                  className="mt-3 rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-50"
                >
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
