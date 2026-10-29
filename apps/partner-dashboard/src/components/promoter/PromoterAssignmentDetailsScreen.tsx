import Link from 'next/link';

import { PromoterAssignmentControls } from './PromoterAssignmentControls';

import type { PromoterEventsData, PromoterLinkedEvent } from '@/data/partner-data-source';

const inr = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

export function PromoterAssignmentDetailsScreen({
  event,
  links,
}: {
  event: PromoterLinkedEvent;
  links: PromoterEventsData['referralLinks'];
}) {
  const eventLinks = links.filter((link) => link.eventId === event.id);
  const clicks = eventLinks.reduce((sum, link) => sum + link.clicks, 0);
  const conversions = eventLinks.reduce((sum, link) => sum + link.conversions, 0);
  const revenuePaise = eventLinks.reduce((sum, link) => sum + link.revenuePaise, 0);
  const commissionPaise = eventLinks.reduce((sum, link) => sum + link.commissionPaise, 0);
  const activeAssignment =
    event.assignmentStatus === 'accepted' || event.assignmentStatus === 'active';

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 text-white sm:px-6">
      <Link
        href="/partner/promoter/events?tab=invitations"
        className="text-sm text-white/65 underline"
      >
        Back to Promoter events
      </Link>
      <header className="mt-6 border-b border-white/10 pb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Promoter campaign</p>
        <h1 className="mt-2 text-3xl font-semibold">{event.name}</h1>
        <p className="mt-2 text-sm text-white/65">{event.venue}</p>
        <p className="mt-2 text-sm text-white/65">
          Status: {event.assignmentStatus ?? 'unavailable'}
        </p>
      </header>

      <section className="mt-8" aria-labelledby="assignment-terms-title">
        <h2 id="assignment-terms-title" className="text-lg font-semibold">
          Assignment terms
        </h2>
        {event.ratePercent !== undefined ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-white/55">Commission rate</dt>
              <dd className="mt-1">{event.ratePercent}%</dd>
            </div>
            <div>
              <dt className="text-sm text-white/55">Fixed amount per eligible ticket</dt>
              <dd className="mt-1">{inr(event.flatPaise ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/55">Eligible ticket tier IDs</dt>
              <dd className="mt-1 break-all">
                {event.eligibleTierIds?.length
                  ? event.eligibleTierIds.join(', ')
                  : 'All commission-eligible tiers'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-white/55">Campaign window</dt>
              <dd className="mt-1">
                {event.startsAt
                  ? new Date(event.startsAt).toLocaleString()
                  : 'Starts when accepted'}{' '}
                to {event.expiresAt ? new Date(event.expiresAt).toLocaleString() : 'No expiry set'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-white/60">
            Assignment terms are unavailable. Refresh to try again.
          </p>
        )}
        {event.tierRates ? (
          <ul
            className="mt-4 space-y-2 text-sm text-white/75"
            aria-label="Tier-specific commission terms"
          >
            {Object.entries(event.tierRates).map(([tierId, terms]) => (
              <li key={tierId}>
                {tierId}: {terms.ratePercent}% + {inr(terms.flatPaise)}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {event.assignmentId && event.assignmentVersion ? (
        <PromoterAssignmentControls
          assignmentId={event.assignmentId}
          assignmentVersion={event.assignmentVersion}
          status={event.assignmentStatus ?? 'unavailable'}
          canCreateLink={activeAssignment && eventLinks.length === 0}
        />
      ) : null}

      <section className="mt-10" aria-labelledby="campaign-performance-title">
        <h2 id="campaign-performance-title" className="text-lg font-semibold">
          Campaign performance
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Clicks" value={String(clicks)} />
          <Metric label="Conversions" value={String(conversions)} />
          <Metric label="Attributed ticket revenue" value={inr(revenuePaise)} />
          <Metric label="Tracked commission" value={inr(commissionPaise)} />
        </dl>
        {eventLinks.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">
            No referral link or campaign activity is recorded yet.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {eventLinks.map((link) => {
              const url = link.vanitySlug
                ? `/${encodeURIComponent(link.vanityPrefix)}/${encodeURIComponent(link.vanitySlug)}`
                : `/event/${encodeURIComponent(link.eventId)}?ref=${encodeURIComponent(link.code)}`;
              return (
                <li key={link.id} className="rounded-xl border border-white/10 p-4">
                  <p className="text-sm">
                    {link.isActive ? 'Active link' : 'Revoked link'} · Code {link.code}
                  </p>
                  <a className="mt-2 inline-block break-all text-sm underline" href={url}>
                    {url}
                  </a>
                  <p className="mt-2 text-xs text-white/55">
                    {link.clicks} clicks · {link.conversions} conversions ·{' '}
                    {inr(link.commissionPaise)} tracked commission
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <dt className="text-xs text-white/55">{label}</dt>
      <dd className="mt-2 text-lg font-semibold">{value}</dd>
    </div>
  );
}
