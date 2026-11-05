'use client';

import { useRef, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { reconcileRefundRequestSchema } from '@c1rcle/contracts';
import { Button, TextField } from '@c1rcle/ui';

import { executeRefund, reconcileRefund } from '@/lib/admin/admin-api';

import type { RefundOutcome } from '@/lib/admin/admin-api';

type RefundRequest = RefundOutcome['request'];

function recoveryError(error: unknown): string {
  if (isApiClientError(error) && error.status === 403)
    return 'Your account is not authorized to recover this refund.';
  if (isApiClientError(error) && error.status === 409)
    return 'The provider evidence could not be accepted or processing is still pending. Refresh the request and check the original refund before retrying.';
  return 'Refund recovery could not be confirmed. The refund remains subject to its server-side locks. Check its status before retrying.';
}

export function RefundRecovery({
  request,
  onUpdated,
}: {
  readonly request: RefundRequest;
  readonly onUpdated: () => void;
}) {
  const [providerRefundId, setProviderRefundId] = useState(request.providerRefundId ?? '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [observed, setObserved] = useState<RefundRequest | null>(null);
  const pending = useRef(false);
  const reconcileIntent = useRef<{ body: string; key: string } | null>(null);
  const resumeKey = useRef<string | null>(null);
  const current = observed ?? request;
  const input = {
    providerRefundId: (current.providerRefundId ?? providerRefundId).trim(),
    reason: reason.trim(),
  };
  const valid = reconcileRefundRequestSchema.safeParse(input).success;

  async function reconcile() {
    if (pending.current || !valid) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    const body = JSON.stringify(input);
    const key =
      reconcileIntent.current?.body === body ? reconcileIntent.current.key : crypto.randomUUID();
    reconcileIntent.current = { body, key };
    try {
      const outcome = await reconcileRefund(request.id, input, key);
      setObserved(outcome.request);
      // A completed observation can be followed by a fresh provider check.
      // Only an uncertain HTTP retry should replay the previous observation.
      reconcileIntent.current = null;
      resumeKey.current = null;
      onUpdated();
    } catch (caught) {
      setError(recoveryError(caught));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function resume() {
    if (pending.current || !current.providerRefundId || current.status !== 'executing') return;
    pending.current = true;
    setBusy(true);
    setError(null);
    resumeKey.current ??= crypto.randomUUID();
    try {
      const outcome = await executeRefund(request.id, resumeKey.current);
      setObserved(outcome.request);
      onUpdated();
    } catch (caught) {
      setError(recoveryError(caught));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  if (request.status !== 'executing') return null;
  return (
    <section aria-label="Refund recovery" className="min-w-72 space-y-3 text-left">
      <p className="text-xs text-muted-foreground">
        Check the original provider refund. Reconciliation verifies its payment, amount, currency
        and execution reference on the server; it does not create another refund.
      </p>
      {current.status === 'executing' ? (
        <>
          <TextField
            label="Provider refund ID"
            value={current.providerRefundId ?? providerRefundId}
            readOnly={current.providerRefundId !== null}
            disabled={busy}
            onChange={(event) => {
              setProviderRefundId(event.target.value);
            }}
            placeholder="rfnd_…"
          />
          <TextField
            label="Recovery reason"
            value={reason}
            disabled={busy}
            maxLength={2000}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !valid}
            onClick={() => void reconcile()}
          >
            Reconcile provider refund
          </Button>
          {current.providerRefundId !== null ? (
            <div className="space-y-2">
              <p role="status" className="text-xs text-muted-foreground">
                Saved provider status: {current.providerStatus ?? 'unconfirmed'}. Resume processing
                to apply authoritative refund effects. A pending result keeps the refund locked.
              </p>
              <Button size="sm" disabled={busy} onClick={() => void resume()}>
                Resume refund processing
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <p role="status" className="text-xs">
          Refund processing returned status: {current.status}.
        </p>
      )}
      {error ? (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setObserved(null);
              onUpdated();
            }}
          >
            Refresh request
          </Button>
        </div>
      ) : null}
    </section>
  );
}
