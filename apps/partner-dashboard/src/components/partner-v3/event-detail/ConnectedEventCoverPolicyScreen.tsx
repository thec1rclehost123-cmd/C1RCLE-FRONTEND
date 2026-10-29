'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  eventCoverPolicyAcceptanceDtoSchema,
  eventCoverPolicyHistoryDtoSchema,
  eventCoverPolicyProposalDtoSchema,
  proposeEventCoverPolicySchema,
} from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { apiClient } from '@/lib/api/client';
import { describeApiError } from '@/lib/api/describe-error';

import type { EventCoverPolicyHistoryDto } from '@c1rcle/contracts';

const inputClass = 'rounded-lg border border-white/20 bg-neutral-900 p-3 text-stone-100';

export function ConnectedEventCoverPolicyScreen({
  studio,
  eventId,
  eventTitle,
  organizationId,
  eventOrganizationId,
  initialHistory,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly organizationId: string;
  readonly eventOrganizationId: string;
  readonly initialHistory: EventCoverPolicyHistoryDto;
}) {
  const [history, setHistory] = useState(initialHistory.items);
  const [acceptanceEnabled, setAcceptanceEnabled] = useState(initialHistory.acceptanceEnabled);
  const [policyVersion, setPolicyVersion] = useState('cover-v1');
  const [coverAmount, setCoverAmount] = useState('1500.00');
  const [minimumSpend, setMinimumSpend] = useState('500.00');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [eligibleCategories, setEligibleCategories] = useState('food');
  const [excludedCategories, setExcludedCategories] = useState('alcohol');
  const [alcoholRule, setAlcoholRule] = useState<
    'exclude_alcohol' | 'age_restricted' | 'no_alcohol'
  >('exclude_alcohol');
  const [partialRedemption, setPartialRedemption] = useState(true);
  const [splitTender, setSplitTender] = useState(true);
  const [refundPolicy, setRefundPolicy] = useState<
    'unused_full_before_redemption' | 'saved_policy_review'
  >('unused_full_before_redemption');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canPropose = organizationId === eventOrganizationId;

  async function refreshHistory() {
    const result = await apiClient.get({
      path: `/api/v2/events/${encodeURIComponent(eventId)}/cover-policy`,
      schema: eventCoverPolicyHistoryDtoSchema,
      headers: { 'x-organization-id': organizationId },
    });
    setHistory(result.items);
    setAcceptanceEnabled(result.acceptanceEnabled);
  }

  async function propose() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const amountToPaise = (value: string) => {
        if (!/^\d+(\.\d{1,2})?$/.test(value))
          throw new Error('Use an amount with up to two decimals.');
        return Math.round(Number(value) * 100);
      };
      const body = proposeEventCoverPolicySchema.parse({
        policyVersion,
        terms: {
          coverAmountPaise: amountToPaise(coverAmount),
          minimumSpendPaise: amountToPaise(minimumSpend),
          redemptionOpensAt: opensAt,
          redemptionClosesAt: closesAt,
          eligibleCategories: eligibleCategories
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          excludedCategories: excludedCategories
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          alcoholRule,
          partialRedemption,
          splitTender,
          refundPolicy,
          transferUnusedOnly: true,
          commissionBasis: 'net_admission_after_allocated_discount',
          unusedBalancePolicy: 'approved_minimum_spend_expiry',
        },
      });
      await apiClient.post({
        path: `/api/v2/events/${encodeURIComponent(eventId)}/cover-policy`,
        body,
        schema: eventCoverPolicyProposalDtoSchema,
        headers: {
          'x-organization-id': organizationId,
          'idempotency-key': crypto.randomUUID(),
        },
      });
      await refreshHistory();
      setNotice(
        'Proposal saved. Venue acceptance and cover sales remain blocked pending reviewed approvals.',
      );
    } catch (cause) {
      setError(describeApiError(cause, 'The cover policy proposal could not be saved.'));
    } finally {
      setBusy(false);
    }
  }

  async function accept(proposalId: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiClient.post({
        path: `/api/v2/events/${encodeURIComponent(eventId)}/cover-policy/${encodeURIComponent(proposalId)}/accept`,
        body: {},
        schema: eventCoverPolicyAcceptanceDtoSchema,
        headers: {
          'x-organization-id': organizationId,
          'idempotency-key': crypto.randomUUID(),
        },
      });
      await refreshHistory();
      setNotice(
        'Venue acceptance recorded for this exact policy version. Cover activation remains separately gated.',
      );
    } catch (cause) {
      setError(describeApiError(cause, 'Venue acceptance is unavailable for this policy.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(eventId)}`}
          className="text-sm text-stone-400"
        >
          ← {eventTitle}
        </Link>
        <h1 className="mt-5 text-3xl font-bold">Event cover policy</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
          Proposals preserve the exact terms each organization reviews. A saved proposal is not
          legal, merchant, tax, or accounting approval. Cover checkout, balances, and redemption
          remain unavailable until those approvals and operational controls exist.
        </p>
        <section
          aria-label="Cover activation status"
          className="mt-6 rounded-xl border border-amber-300/25 bg-amber-950/20 p-4 text-sm text-amber-100"
        >
          Cover activation is blocked.{' '}
          {acceptanceEnabled
            ? 'Exact-version Venue acceptance is enabled; sales and redemption remain separately gated.'
            : 'Venue acceptance remains disabled until reviewed policy approval is recorded.'}
        </section>

        {studio === 'venue' ? (
          <Link
            href={`/partner/venue/events/${encodeURIComponent(eventId)}/cover/redeem`}
            className="mt-4 inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-stone-100"
          >
            Open Venue redemption
          </Link>
        ) : null}

        {canPropose ? (
          <section className="mt-7 rounded-2xl border border-white/15 bg-neutral-950 p-5">
            <h2 className="text-lg font-semibold">Propose versioned terms</h2>
            <p className="mt-2 text-xs text-stone-400">
              Redemption times must be ISO 8601 UTC instants ending in Z. Categories are
              comma-separated labels. This form does not activate a product.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Version label
                <input
                  className={inputClass}
                  value={policyVersion}
                  maxLength={80}
                  onChange={(e) => {
                    setPolicyVersion(e.target.value);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Cover value (INR)
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={coverAmount}
                  onChange={(e) => {
                    setCoverAmount(e.target.value);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Minimum eligible spend (INR)
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={minimumSpend}
                  onChange={(e) => {
                    setMinimumSpend(e.target.value);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Redemption opens (ISO 8601 UTC)
                <input
                  className={inputClass}
                  placeholder="2026-11-01T18:00:00.000Z"
                  value={opensAt}
                  onChange={(e) => {
                    setOpensAt(e.target.value);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Redemption closes (ISO 8601 UTC)
                <input
                  className={inputClass}
                  placeholder="2026-11-02T02:00:00.000Z"
                  value={closesAt}
                  onChange={(e) => {
                    setClosesAt(e.target.value);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Eligible categories
                <input
                  className={inputClass}
                  value={eligibleCategories}
                  onChange={(e) => {
                    setEligibleCategories(e.target.value);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Excluded categories
                <input
                  className={inputClass}
                  value={excludedCategories}
                  onChange={(e) => {
                    setExcludedCategories(e.target.value);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Alcohol rule
                <select
                  className={inputClass}
                  value={alcoholRule}
                  onChange={(e) => {
                    setAlcoholRule(e.target.value as typeof alcoholRule);
                  }}
                >
                  <option value="exclude_alcohol">Exclude alcohol</option>
                  <option value="age_restricted">Age restricted</option>
                  <option value="no_alcohol">No alcohol</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                Refund policy
                <select
                  className={inputClass}
                  value={refundPolicy}
                  onChange={(e) => {
                    setRefundPolicy(e.target.value as typeof refundPolicy);
                  }}
                >
                  <option value="unused_full_before_redemption">
                    Unused cover before redemption
                  </option>
                  <option value="saved_policy_review">Review the saved policy</option>
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={partialRedemption}
                  onChange={(e) => {
                    setPartialRedemption(e.target.checked);
                  }}
                />
                Allow partial redemption
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={splitTender}
                  onChange={(e) => {
                    setSplitTender(e.target.checked);
                  }}
                />
                Allow split tender at Venue POS
              </label>
            </div>
            <button
              type="button"
              disabled={busy || !policyVersion.trim() || !opensAt || !closesAt}
              onClick={() => void propose()}
              className="mt-5 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save Host proposal'}
            </button>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-rose-300">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p role="status" className="mt-3 text-sm text-emerald-200">
                {notice}
              </p>
            ) : null}
          </section>
        ) : (
          <p className="mt-7 rounded-xl border border-white/10 p-4 text-sm text-stone-400">
            The Host organization can submit a proposal. Review its exact terms below; acceptance is
            available only when the reviewed policy approval gate is enabled.
          </p>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Policy history</h2>
          {history.length === 0 ? (
            <p className="mt-3 rounded-xl border border-white/10 p-4 text-sm text-stone-400">
              No cover policy proposals have been recorded for this event.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {history.map(({ proposal, acceptance }) => (
                <li
                  key={proposal.id}
                  className="rounded-xl border border-white/10 bg-neutral-950 p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{proposal.policyVersion}</h3>
                    <span className="text-xs text-stone-400">
                      {acceptance ? 'Venue response recorded' : 'Awaiting Venue response'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-300">
                    ₹{(proposal.terms.coverAmountPaise / 100).toFixed(2)} cover · minimum spend ₹
                    {(proposal.terms.minimumSpendPaise / 100).toFixed(2)} ·{' '}
                    {proposal.termsDigest.slice(0, 12)}…
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Proposed {new Date(proposal.createdAt).toLocaleString()} · exact terms remain
                    versioned
                  </p>
                  <details className="mt-3 text-sm text-stone-300">
                    <summary className="cursor-pointer">Review exact terms</summary>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div>
                        <dt className="text-stone-500">Redemption window</dt>
                        <dd>
                          {proposal.terms.redemptionOpensAt} – {proposal.terms.redemptionClosesAt}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Eligible / excluded categories</dt>
                        <dd>
                          {proposal.terms.eligibleCategories.join(', ') || 'None'} /{' '}
                          {proposal.terms.excludedCategories.join(', ') || 'None'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Alcohol</dt>
                        <dd>{proposal.terms.alcoholRule}</dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Refund and unused balance</dt>
                        <dd>
                          {proposal.terms.refundPolicy} · {proposal.terms.unusedBalancePolicy}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Partial redemption / split tender</dt>
                        <dd>
                          {proposal.terms.partialRedemption ? 'Allowed' : 'Not allowed'} /{' '}
                          {proposal.terms.splitTender ? 'Allowed' : 'Not allowed'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Commission basis</dt>
                        <dd>{proposal.terms.commissionBasis}</dd>
                      </div>
                    </dl>
                  </details>
                  {studio === 'venue' && !acceptance ? (
                    <button
                      type="button"
                      disabled={busy || !acceptanceEnabled}
                      onClick={() => void accept(proposal.id)}
                      className="mt-4 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {busy ? 'Recording…' : 'Accept exact policy version'}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-rose-300">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-3 text-sm text-emerald-200">
              {notice}
            </p>
          ) : null}
        </section>
      </main>
    </PageContainer>
  );
}
