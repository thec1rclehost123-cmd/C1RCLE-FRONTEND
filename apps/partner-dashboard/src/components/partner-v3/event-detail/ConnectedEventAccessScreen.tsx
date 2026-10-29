'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  createTicketAccessCodeSchema,
  createTicketAccessInvitationSchema,
  ticketAccessCodeCreateResponseSchema,
  ticketAccessCodeDtoSchema,
} from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { apiClient } from '@/lib/api/client';
import { describeApiError } from '@/lib/api/describe-error';

import type { TicketAccessCodeDto, TicketTierDto } from '@c1rcle/contracts';

export function ConnectedEventAccessScreen({
  studio,
  eventId,
  eventTitle,
  eventVisibilityMode = 'public',
  organizationId,
  tiers,
  initialCodes,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly eventVisibilityMode?: 'public' | 'unlisted' | 'code' | 'invited';
  readonly organizationId: string;
  readonly tiers: readonly TicketTierDto[];
  readonly initialCodes: readonly TicketAccessCodeDto[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [tierId, setTierId] = useState(tiers[0]?.id ?? '');
  const [includedTierIds, setIncludedTierIds] = useState<string[]>([]);
  const [accessKind, setAccessKind] = useState<'code' | 'invitation'>(
    eventVisibilityMode === 'invited' ? 'invitation' : 'code',
  );
  const [scope, setScope] = useState<'tiers' | 'event'>(
    eventVisibilityMode === 'code' || eventVisibilityMode === 'invited' ? 'event' : 'tiers',
  );
  const [recipientEmail, setRecipientEmail] = useState('');
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [expiresAt, setExpiresAt] = useState(() =>
    new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
  );
  const [maxRedemptions, setMaxRedemptions] = useState(1);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revokingCodeId, setRevokingCodeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createCode() {
    setBusy(true);
    setError(null);
    setRevealedCode(null);
    try {
      const body =
        accessKind === 'code'
          ? createTicketAccessCodeSchema.parse({
              scope,
              tierIds: scope === 'event' ? includedTierIds : [tierId],
              startsAt: new Date(startsAt).toISOString(),
              expiresAt: new Date(expiresAt).toISOString(),
              maxRedemptions,
            })
          : createTicketAccessInvitationSchema.parse({
              scope,
              tierIds: scope === 'event' ? includedTierIds : [tierId],
              recipientEmail,
              startsAt: new Date(startsAt).toISOString(),
              expiresAt: new Date(expiresAt).toISOString(),
            });
      const created = await apiClient.post({
        path: `/api/v2/events/${encodeURIComponent(eventId)}/${accessKind === 'code' ? 'access-codes' : 'access-invitations'}`,
        body,
        schema: ticketAccessCodeCreateResponseSchema,
        headers: { 'x-organization-id': organizationId },
      });
      setCodes((current) => [created.accessCode, ...current]);
      setRevealedCode(created.code);
    } catch (cause) {
      setError(describeApiError(cause, 'The access code could not be created.'));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(code: TicketAccessCodeDto) {
    if (revokeReason.trim().length < 8) return;
    const reason = revokeReason.trim();
    setBusy(true);
    setError(null);
    try {
      const updated = await apiClient.post({
        path: `/api/v2/events/${encodeURIComponent(eventId)}/access-codes/${encodeURIComponent(code.id)}/revoke`,
        body: { reason },
        schema: ticketAccessCodeDtoSchema,
        headers: { 'x-organization-id': organizationId },
      });
      setCodes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setRevokingCodeId(null);
      setRevokeReason('');
    } catch (cause) {
      setError(describeApiError(cause, 'The access code could not be revoked.'));
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
        <h1 className="mt-5 text-3xl font-bold">Private event and tier access</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
          Event grants unlock protected event details and public tiers. They do not unlock hidden
          tiers unless those tier IDs are explicitly included. Tier grants unlock only selected
          restricted tiers. Named invitations are bound to one verified email. Secrets are shown
          once; revoking stops new access and purchases.
        </p>
        {tiers.length || eventVisibilityMode === 'code' || eventVisibilityMode === 'invited' ? (
          <section className="mt-7 rounded-2xl border border-white/15 bg-neutral-950 p-5">
            <h2 className="text-lg font-semibold">Create access code</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Grant scope
                <select
                  value={scope}
                  onChange={(event) => {
                    setScope(event.target.value as 'tiers' | 'event');
                  }}
                  className="rounded-lg border border-white/20 bg-neutral-900 p-3"
                >
                  <option value="tiers">Selected restricted tier</option>
                  {eventVisibilityMode === (accessKind === 'code' ? 'code' : 'invited') ? (
                    <option value="event">Event details and public tiers</option>
                  ) : null}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                Access type
                <select
                  value={accessKind}
                  onChange={(event) => {
                    const next = event.target.value as 'code' | 'invitation';
                    setAccessKind(next);
                    setIncludedTierIds([]);
                    if (
                      scope === 'event' &&
                      eventVisibilityMode !== (next === 'code' ? 'code' : 'invited')
                    ) {
                      setScope('tiers');
                    }
                    setTierId(
                      tiers.find(
                        (tier) => tier.accessMode === (next === 'code' ? 'code' : 'invited'),
                      )?.id ?? '',
                    );
                  }}
                  className="rounded-lg border border-white/20 bg-neutral-900 p-3"
                >
                  <option value="code">Shareable access code</option>
                  <option value="invitation">Named email invitation</option>
                </select>
              </label>
              {scope === 'tiers' ? (
                <label className="grid gap-2 text-sm">
                  Tier
                  <select
                    value={tierId}
                    onChange={(event) => {
                      setTierId(event.target.value);
                    }}
                    className="rounded-lg border border-white/20 bg-neutral-900 p-3"
                  >
                    {tiers
                      .filter(
                        (tier) => tier.accessMode === (accessKind === 'code' ? 'code' : 'invited'),
                      )
                      .map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}
              {scope === 'event' ? (
                <label className="grid gap-2 text-sm">
                  Optional restricted tiers this grant also unlocks
                  <select
                    multiple
                    value={includedTierIds}
                    onChange={(event) => {
                      setIncludedTierIds(
                        Array.from(event.target.selectedOptions, (option) => option.value),
                      );
                    }}
                    className="min-h-28 rounded-lg border border-white/20 bg-neutral-900 p-3"
                  >
                    {tiers
                      .filter(
                        (tier) => tier.accessMode === (accessKind === 'code' ? 'code' : 'invited'),
                      )
                      .map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name}
                        </option>
                      ))}
                  </select>
                  <span className="text-xs text-stone-500">
                    A private event grant never unlocks restricted tiers unless selected here.
                  </span>
                </label>
              ) : null}
              {accessKind === 'invitation' ? (
                <label className="grid gap-2 text-sm">
                  Invitee email
                  <input
                    type="email"
                    autoComplete="off"
                    value={recipientEmail}
                    onChange={(event) => {
                      setRecipientEmail(event.target.value);
                    }}
                    className="rounded-lg border border-white/20 bg-neutral-900 p-3"
                  />
                </label>
              ) : (
                <label className="grid gap-2 text-sm">
                  Maximum redemptions
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={maxRedemptions}
                    onChange={(event) => {
                      setMaxRedemptions(Number(event.target.value));
                    }}
                    className="rounded-lg border border-white/20 bg-neutral-900 p-3"
                  />
                </label>
              )}
              <label className="grid gap-2 text-sm">
                Starts
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => {
                    setStartsAt(event.target.value);
                  }}
                  className="rounded-lg border border-white/20 bg-neutral-900 p-3"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Expires
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => {
                    setExpiresAt(event.target.value);
                  }}
                  className="rounded-lg border border-white/20 bg-neutral-900 p-3"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={
                busy ||
                (scope === 'tiers' && !tierId) ||
                (scope === 'event' &&
                  eventVisibilityMode !== (accessKind === 'code' ? 'code' : 'invited')) ||
                (accessKind === 'invitation' && !recipientEmail.includes('@'))
              }
              onClick={() => void createCode()}
              className="mt-5 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {busy ? 'Saving…' : accessKind === 'invitation' ? 'Create invitation' : 'Create code'}
            </button>
            {revealedCode ? (
              <div
                className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-950/30 p-4"
                role="status"
              >
                <p className="text-sm font-semibold">
                  {accessKind === 'invitation'
                    ? 'Copy this invitation secret now and share it only with the invitee at the entered verified email. It cannot be recovered.'
                    : 'Copy this code now. It cannot be recovered later.'}
                </p>
                <code className="mt-2 block break-all text-emerald-200">{revealedCode}</code>
                <button
                  type="button"
                  className="mt-3 text-sm underline"
                  onClick={() => void navigator.clipboard.writeText(revealedCode)}
                >
                  Copy code
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <p className="mt-7 rounded-xl border border-white/10 p-5 text-sm text-stone-400">
            No restricted tiers or private event visibility are configured. Set event visibility or
            choose code/invited access on a paid tier in Edit details first.
          </p>
        )}
        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Existing codes</h2>
          {codes.length ? (
            <ul className="mt-3 grid gap-3">
              {codes.map((code) => (
                <li
                  key={code.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4"
                >
                  <div>
                    <p className="font-medium">
                      {code.kind === 'invitation' ? 'Named invitation · ' : 'Access code · '}
                      {code.scope === 'event'
                        ? 'Event details + public tiers'
                        : code.tierIds
                            .map(
                              (id) =>
                                tiers.find((tier) => tier.id === id)?.name ?? 'Restricted tier',
                            )
                            .join(', ')}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      {code.redemptionCount}/{code.maxRedemptions} used · Expires{' '}
                      {new Date(code.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {code.status === 'active' ? 'Active' : 'Revoked'}
                    </span>
                    {code.status === 'active' ? (
                      <button
                        disabled={busy}
                        type="button"
                        onClick={() => {
                          setRevokingCodeId(code.id);
                          setRevokeReason('');
                        }}
                        className="rounded-full border border-white/20 px-4 py-2 text-sm"
                      >
                        Revoke
                      </button>
                    ) : null}
                  </div>
                  {code.status === 'active' && revokingCodeId === code.id ? (
                    <div className="w-full rounded-xl border border-amber-300/20 bg-amber-950/20 p-4">
                      <label className="grid gap-2 text-sm">
                        Reason for revocation
                        <textarea
                          minLength={8}
                          value={revokeReason}
                          onChange={(event) => {
                            setRevokeReason(event.target.value);
                          }}
                          className="min-h-20 rounded-lg border border-white/20 bg-neutral-900 p-3"
                        />
                      </label>
                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          disabled={busy || revokeReason.trim().length < 8}
                          onClick={() => void revoke(code)}
                          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                        >
                          Confirm revocation
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setRevokingCodeId(null);
                          }}
                          className="rounded-full border border-white/20 px-4 py-2 text-sm"
                        >
                          Keep active
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stone-400">No access codes yet.</p>
          )}
        </section>
      </main>
    </PageContainer>
  );
}
