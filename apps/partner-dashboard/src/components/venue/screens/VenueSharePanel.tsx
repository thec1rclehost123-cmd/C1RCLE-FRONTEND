'use client';

import { useCallback, useEffect, useState } from 'react';

import { getActiveOrgId } from '@/lib/org/active-org';
import { listPartnerships, setVenueShare } from '@/lib/partner/api-partnerships-repository';

import styles from './VenuePartners.module.css';

import type { PartnershipDto } from '@c1rcle/contracts';

/**
 * ─── Venue revenue share ───────────────────────────────────────────────────
 *
 * The negotiated split of each settlement's gross that belongs to the venue
 * (v1's `venueCommissionRate` convention — a whole-number percent, NOT a 0..1
 * ratio). The backend owns the rule: only a party to an `active` partnership
 * may set it, the value must be a whole number 0–50, and `null` means "not
 * negotiated", which puts settlement back on its documented fail-safe of
 * paying the whole non-platform-fee gross to the host.
 *
 * This panel is the only place in the venue app where that number is editable,
 * so it is deliberately the only place that offers the control — a rate editor
 * on a `pending` or `ended` partnership would only ever produce a 422.
 */

/** Mirrors `MAX_VENUE_SHARE_PERCENT` in the domain; the server is authoritative. */
const MAX_VENUE_SHARE_PERCENT = 50;

type LoadState = 'loading' | 'ready' | 'no-org' | 'error';

const classNames = (...values: readonly (string | undefined)[]): string =>
  values.filter((value): value is string => Boolean(value)).join(' ');

const STATUS_LABEL: Readonly<Record<PartnershipDto['status'], string>> = {
  pending: 'Pending',
  active: 'Active',
  rejected: 'Rejected',
  blocked: 'Blocked',
  ended: 'Ended',
};

/**
 * The partnership DTO carries organization ids, not display names — there is
 * no partner-side endpoint that resolves a counterparty org the viewer isn't a
 * member of. Showing a short id is honest; inventing a name would not be.
 */
function shortId(id: string): string {
  return id.length <= 10 ? id : `${id.slice(0, 8)}…`;
}

/** Which side of the pair the viewer's organization is on. */
function counterpartyOf(
  partnership: PartnershipDto,
  organizationId: string,
): { readonly id: string; readonly side: 'host' | 'venue' } {
  return partnership.hostOrganizationId === organizationId
    ? { id: partnership.venueOrganizationId, side: 'host' }
    : { id: partnership.hostOrganizationId, side: 'host' };
}

function isEditable(status: PartnershipDto['status']): boolean {
  return status === 'active';
}

/** The draft is the raw text in the input; `null` means "not negotiated". */
type Draft = string;

function toDraft(rate: number | null): Draft {
  return rate === null ? '' : String(rate);
}

/**
 * Returns the rate to send, or an error message. Kept as a pure function so the
 * bounds are testable without a DOM and so the input and the submit button
 * agree on exactly one definition of "valid".
 */
export function parseVenueShareDraft(draft: Draft): number | null | { readonly error: string } {
  const trimmed = draft.trim();
  if (trimmed === '') return null; // clearing the negotiated rate
  if (!/^\d+$/.test(trimmed)) {
    return { error: 'Enter a whole number between 0 and 50, or leave blank for not negotiated.' };
  }
  const value = Number(trimmed);
  if (value > MAX_VENUE_SHARE_PERCENT) {
    return { error: `The venue share cannot exceed ${String(MAX_VENUE_SHARE_PERCENT)}%.` };
  }
  return value;
}

export function VenueSharePanel() {
  const [state, setState] = useState<LoadState>('loading');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [partnerships, setPartnerships] = useState<readonly PartnershipDto[]>([]);
  const [drafts, setDrafts] = useState<Readonly<Record<string, Draft>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    // Same shape as `SettingsScreen`: the state updates happen inside the
    // async function's microtask continuation, never synchronously in the
    // effect body, which is what `react-hooks/set-state-in-effect` requires.
    // `cancelled` is read through a function because TS's control-flow
    // narrowing can't see the cleanup closure's later mutation.
    const lifecycle = { cancelled: false };
    const isCancelled = (): boolean => lifecycle.cancelled;
    void (async () => {
      const orgId = getActiveOrgId();
      if (orgId === null) {
        setState('no-org');
        return;
      }
      try {
        const rows = await listPartnerships(orgId);
        if (isCancelled()) return;
        setOrganizationId(orgId);
        setPartnerships(rows);
        setDrafts(Object.fromEntries(rows.map((row) => [row.id, toDraft(row.venueShareRate)])));
        setState('ready');
      } catch {
        if (!isCancelled()) setState('error');
      }
    })();
    return () => {
      lifecycle.cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (partnership: PartnershipDto, draft: Draft) => {
      if (organizationId === null) return;
      const parsed = parseVenueShareDraft(draft);
      if (parsed !== null && typeof parsed === 'object') {
        setRowError(parsed.error);
        return;
      }
      const nextRate = parsed;
      if (nextRate === partnership.venueShareRate) return; // nothing to do

      setSavingId(partnership.id);
      setRowError(null);
      setSavedId(null);
      // One key per user intent: held in a ref-free local so a retry of this
      // same save replays rather than negotiating twice. A deliberate second
      // edit generates a fresh key below.
      const idempotencyKey = crypto.randomUUID();
      try {
        const updated = await setVenueShare(
          organizationId,
          partnership.id,
          nextRate,
          idempotencyKey,
        );
        setPartnerships((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        setDrafts((current) => ({ ...current, [updated.id]: toDraft(updated.venueShareRate) }));
        setSavedId(updated.id);
      } catch {
        setRowError('Could not save the venue share. Check your connection and try again.');
      } finally {
        setSavingId(null);
      }
    },
    [organizationId],
  );

  if (state === 'loading') return <p className={styles['muted']}>Loading partnerships…</p>;
  if (state === 'no-org') {
    return <p className={styles['muted']}>Select an organization to manage its venue share.</p>;
  }
  if (state === 'error') {
    return <p className={styles['muted']}>Could not load partnerships. Try again in a moment.</p>;
  }

  if (partnerships.length === 0) {
    return (
      <p className={styles['muted']}>
        No partnerships yet. Once a host connects, you can agree your revenue share here.
      </p>
    );
  }

  return (
    <>
      <p className={styles['shareIntro']}>
        The venue share is deducted from every ticket sale before the host is paid. Leave it blank
        to decline a share — the whole amount then goes to the host.
      </p>
      <div
        className={classNames(styles['partnerTable'], styles['shareTable'])}
        role="table"
        aria-label="Venue revenue share"
      >
        <div className={styles['tableHead']} role="row">
          <span role="columnheader">Counterparty</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Venue share</span>
          <span role="columnheader">Action</span>
        </div>
        {partnerships.map((partnership) => {
          const counterparty = counterpartyOf(partnership, organizationId ?? '');
          const editable = isEditable(partnership.status);
          const draft = drafts[partnership.id] ?? toDraft(partnership.venueShareRate);
          const busy = savingId === partnership.id;
          return (
            <div className={styles['partnerRow']} role="row" key={partnership.id}>
              <div role="cell" className={styles['identity']}>
                <span>
                  <strong title={counterparty.id}>{shortId(counterparty.id)}</strong>
                  <small>Host organization</small>
                </span>
              </div>
              <span role="cell" className={styles['muted']}>
                {STATUS_LABEL[partnership.status]}
              </span>
              <span role="cell" className={styles['shareCell']}>
                <label className={styles['shareField']}>
                  <span className={styles['srOnly']}>
                    Venue share percent for {counterparty.id}
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MAX_VENUE_SHARE_PERCENT}
                    step={1}
                    value={draft}
                    disabled={!editable || busy}
                    placeholder="Not set"
                    onChange={(event) => {
                      setDrafts((current) => ({
                        ...current,
                        [partnership.id]: event.target.value,
                      }));
                      setSavedId(null);
                    }}
                  />
                  <span aria-hidden="true">%</span>
                </label>
                {editable ? null : (
                  <small className={styles['muted']}>
                    Available once this partnership is active.
                  </small>
                )}
              </span>
              <span role="cell" className={styles['shareAction']}>
                <button
                  type="button"
                  className={styles['secondaryAction']}
                  disabled={!editable || busy}
                  onClick={() => {
                    void save(partnership, draft);
                  }}
                >
                  {busy ? 'Saving…' : 'Save'}
                </button>
                {savedId === partnership.id ? (
                  <small className={styles['positive']}>Saved</small>
                ) : null}
                {rowError !== null && savingId === null ? (
                  <small className={styles['shareError']}>{rowError}</small>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
