import { formatProductDateTime } from '@/lib/events/event-time';

import { PromoterAssignmentControls } from './PromoterAssignmentControls';

import type { PromoterEventsData, PromoterLinkedEvent } from '@/data/partner-data-source';

type PromoterEventTab = 'overview' | 'performance' | 'referrals' | 'terms';

const inr = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

export function PromoterAssignmentDetailsScreen({
  event,
  links,
  activeTab = 'overview',
}: {
  readonly event: PromoterLinkedEvent;
  readonly links: PromoterEventsData['referralLinks'];
  readonly activeTab?: PromoterEventTab;
}) {
  const eventLinks = links.filter((link) => link.eventId === event.id);
  const clicks = eventLinks.reduce((sum, link) => sum + link.clicks, 0);
  const conversions = eventLinks.reduce((sum, link) => sum + link.conversions, 0);
  const revenuePaise = eventLinks.reduce((sum, link) => sum + link.revenuePaise, 0);
  const commissionPaise = eventLinks.reduce((sum, link) => sum + link.commissionPaise, 0);
  const activeAssignment =
    event.assignmentStatus === 'accepted' || event.assignmentStatus === 'active';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-stone-100 sm:px-6">
      {activeTab === 'overview' ? (
        <>
          <section className="rounded-2xl border border-white/10 bg-[#111113] p-5 sm:p-7">
            <h2 className="text-xl font-bold">Campaign overview</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric label="Assignment status" value={event.assignmentStatus ?? 'Unavailable'} />
              <Metric label="Referral clicks" value={String(clicks)} />
              <Metric label="Attributed sales" value={String(conversions)} />
            </dl>
          </section>
          {event.assignmentId && event.assignmentVersion ? (
            <PromoterAssignmentControls
              assignmentId={event.assignmentId}
              assignmentVersion={event.assignmentVersion}
              status={event.assignmentStatus ?? 'unavailable'}
              canCreateLink={activeAssignment && eventLinks.length === 0}
            />
          ) : null}
        </>
      ) : null}

      {activeTab === 'performance' ? (
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-5 sm:p-7">
          <h2 className="text-xl font-bold">Campaign performance</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Clicks" value={String(clicks)} />
            <Metric label="Conversions" value={String(conversions)} />
            <Metric label="Attributed ticket revenue" value={inr(revenuePaise)} />
            <Metric label="Tracked commission" value={inr(commissionPaise)} />
          </dl>
          {eventLinks.length === 0 ? (
            <p className="mt-5 text-sm text-stone-400">No campaign activity is recorded yet.</p>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'referrals' ? (
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-5 sm:p-7">
          <h2 className="text-xl font-bold">Referral links</h2>
          {eventLinks.length === 0 ? (
            <p className="mt-5 text-sm text-stone-400">
              No referral links are recorded for this event.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {eventLinks.map((link) => {
                const url = link.vanitySlug
                  ? `/${encodeURIComponent(link.vanityPrefix)}/${encodeURIComponent(link.vanitySlug)}`
                  : `/event/${encodeURIComponent(link.eventId)}?ref=${encodeURIComponent(link.code)}`;
                return (
                  <li key={link.id} className="rounded-xl border border-white/10 p-3">
                    <p className="text-sm font-semibold">
                      {link.isActive ? 'Active link' : 'Revoked link'} · Code {link.code}
                    </p>
                    <a
                      className="mt-2 inline-block break-all text-sm text-orange-300 underline"
                      href={url}
                    >
                      {url}
                    </a>
                    <p className="mt-2 text-xs text-stone-400">
                      {link.clicks} clicks · {link.conversions} conversions ·{' '}
                      {inr(link.commissionPaise)} tracked commission
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === 'terms' ? (
        <section className="rounded-2xl border border-white/10 bg-[#111113] p-5 sm:p-7">
          <h2 className="text-xl font-bold">Assignment terms</h2>
          {event.ratePercent !== undefined ? (
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Metric label="Commission rate" value={`${String(event.ratePercent)}%`} />
              <Metric label="Fixed amount per eligible ticket" value={inr(event.flatPaise ?? 0)} />
              <Metric
                label="Eligible ticket tiers"
                value={
                  event.eligibleTierIds?.length
                    ? event.eligibleTierIds.join(', ')
                    : 'All eligible tiers'
                }
              />
              <Metric
                label="Campaign window"
                value={`${event.startsAt ? formatProductDateTime(event.startsAt) : 'Starts when accepted'} · ${event.expiresAt ? formatProductDateTime(event.expiresAt) : 'No expiry set'}`}
              />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-stone-400">
              Assignment terms are unavailable. Refresh to try again.
            </p>
          )}
          {event.tierRates ? (
            <ul
              className="mt-5 space-y-2 text-sm text-stone-300"
              aria-label="Tier-specific commission terms"
            >
              {Object.entries(event.tierRates).map(([tierId, terms]) => (
                <li key={tierId} className="rounded-lg border border-white/10 p-3">
                  {tierId}: {terms.ratePercent}% + {inr(terms.flatPaise)}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-2 break-words text-lg font-bold text-white">{value}</dd>
    </div>
  );
}
