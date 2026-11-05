'use client';

import { useRef, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { Button, TextField } from '@c1rcle/ui';

import { executeRefund, rejectRefund, requestOriginalFeeReview } from '@/lib/admin/admin-api';

import type { RefundOutcome } from '@/lib/admin/admin-api';

type Request = RefundOutcome['request'];
export function RefundPolicyAction({
  request,
  onUpdated,
}: {
  readonly request: Request;
  readonly onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [policyChanged, setPolicyChanged] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const pending = useRef(false);
  const keys = useRef<Partial<Record<'execute' | 'reject' | 'review', string>>>({});
  const rejection = useRef<{ reason: string; key: string } | null>(null);
  const eligibleReview =
    request.status === 'settled' &&
    request.refundCause === 'guest_request' &&
    !request.remedyForRefundRequestId;
  const executable = request.status === 'approved' || request.status === 'failed';
  async function act(action: 'execute' | 'reject' | 'review') {
    if (
      pending.current ||
      completed ||
      (action === 'reject' && (!policyChanged || !reason.trim() || reason.trim().length > 2000))
    )
      return;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    keys.current[action] ??= crypto.randomUUID();
    try {
      if (action === 'reject' && rejection.current?.reason !== reason.trim())
        rejection.current = { reason: reason.trim(), key: crypto.randomUUID() };
      const outcome =
        action === 'execute'
          ? await executeRefund(request.id, keys.current.execute)
          : action === 'review'
            ? await requestOriginalFeeReview(request.id, keys.current.review)
            : await rejectRefund(request.id, reason.trim(), rejection.current?.key);
      setCompleted(true);
      setMessage(
        action === 'review'
          ? `Original-fee review status: ${outcome.request.status}. The request follows the existing approval and provider confirmation process.`
          : action === 'reject'
            ? 'The outdated request was rejected. Refresh the refund desk and review the replacement request; create one under the current policy if none is available.'
            : `Refund status: ${outcome.request.status}.`,
      );
      onUpdated();
    } catch (error) {
      if (
        action === 'execute' &&
        isApiClientError(error) &&
        error.status === 409 &&
        /event refund policy changed/i.test(error.message)
      ) {
        setPolicyChanged(true);
        setMessage(
          'The server rejected execution because the event refund policy changed. Reject this unexecuted request with a reason, then refresh and review any replacement request. Create one under the full original-purchase policy only if none is available.',
        );
      } else
        setMessage(
          isApiClientError(error) && error.status === 403
            ? 'Your account is not authorized for this refund action.'
            : action === 'review' && isApiClientError(error) && error.status === 409
              ? 'An original-fee review is not available under the current server policy, or a conflicting review already exists. Refresh and inspect the request.'
              : 'The action could not be confirmed. Check the current request before retrying; the same action retains its retry key.',
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (!executable && !eligibleReview) return null;
  return (
    <section aria-label="Refund policy action" className="min-w-64 space-y-3 text-left">
      {request.remedyForRefundRequestId ? (
        <p className="text-xs text-muted-foreground">
          Original-fee supplement for refund {request.remedyForRefundRequestId}. Existing approval
          requirements apply.
        </p>
      ) : null}
      {eligibleReview ? (
        <>
          <p className="text-xs text-muted-foreground">
            If an organizer cancellation or material change followed this Guest refund, request
            review of the original fees. The server checks eligibility and the remaining original
            paid amount.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || completed}
            onClick={() => void act('review')}
          >
            Request original-fee review
          </Button>
        </>
      ) : policyChanged ? (
        <>
          <TextField
            label="Policy rejection reason"
            value={reason}
            maxLength={2000}
            disabled={busy || completed}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={busy || completed || !reason.trim() || reason.trim().length > 2000}
            onClick={() => void act('reject')}
          >
            Reject outdated request
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant={request.status === 'failed' ? 'outline' : 'primary'}
          disabled={busy || completed}
          onClick={() => void act('execute')}
        >
          {request.status === 'failed' ? 'Retry provider refund' : 'Execute refund'}
        </Button>
      )}
      {message ? (
        <p role="status" className="text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
    </section>
  );
}
