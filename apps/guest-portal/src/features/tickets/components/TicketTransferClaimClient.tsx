'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useSession } from '@c1rcle/auth';
import { ticketTransferPreviewSchema } from '@c1rcle/contracts';
import { useMounted } from '@c1rcle/hooks';
import { Dialog } from '@c1rcle/ui';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import { formatEventTitle } from '../ticket-presentation';
import {
  acceptTicketTransferResponseSchema,
  declineTicketTransferResponseSchema,
} from '../transfer-api';

import type { TicketTransferPreview } from '@c1rcle/contracts';

const primary =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black disabled:opacity-40';
const secondary =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm text-white/70 disabled:opacity-40';

export function TicketTransferClaimClient({ transferId }: { transferId: string }) {
  const router = useRouter();
  const mounted = useMounted();
  const { isAuthenticated, isLoading } = useSession();
  const [preview, setPreview] = useState<TicketTransferPreview | null>(null);
  const [readState, setReadState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState(false);
  const [resolved, setResolved] = useState<'accepted' | 'declined' | null>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void bffClient
      .get({
        path: `/api/ticket-transfers/${encodeURIComponent(transferId)}`,
        schema: ticketTransferPreviewSchema,
        retries: 0,
      })
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
          setReadState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setReadState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [transferId, isAuthenticated, attempt]);

  async function accept() {
    if (busy || !preview?.canAccept) return;
    setBusy('accept');
    setError(false);
    try {
      const result = await bffClient.post({
        path: `/api/ticket-transfers/${encodeURIComponent(transferId)}/accept`,
        body: {},
        headers: csrfHeaders(),
        schema: acceptTicketTransferResponseSchema,
      });
      if (result.transfer.status === 'accepted') setResolved('accepted');
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }
  async function decline() {
    if (busy || !preview?.canAccept) return;
    setBusy('decline');
    setError(false);
    try {
      const result = await bffClient.post({
        path: `/api/ticket-transfers/${encodeURIComponent(transferId)}/decline`,
        body: {},
        headers: csrfHeaders(),
        schema: declineTicketTransferResponseSchema,
      });
      if (result.transfer.status === 'declined') setResolved('declined');
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }
  const accepted = resolved === 'accepted' || preview?.status === 'accepted';
  const declined = resolved === 'declined' || preview?.status === 'declined';
  if (!mounted) return null;
  return createPortal(
    <Dialog
      open
      onClose={() => {
        router.replace('/tickets');
      }}
      title={accepted ? 'Ticket accepted' : declined ? 'Invitation declined' : 'Ticket invitation'}
      className="max-w-xl rounded-2xl border-white/15 bg-[#0a0a0a] p-5 text-white shadow-2xl sm:p-7"
    >
      <div className="space-y-5">
        {isLoading ? (
          <p role="status" className="text-sm text-white/60">
            Checking your sign-in…
          </p>
        ) : !isAuthenticated ? (
          <>
            <p className="text-sm leading-6 text-white/60">
              Sign in with the verified email address this ticket was sent to.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/ticket-transfer/${transferId}`)}`}
              className={primary}
            >
              Sign in to continue
            </Link>
          </>
        ) : readState === 'failed' ? (
          <>
            <p role="alert" className="text-sm leading-6 text-white/60">
              This invitation is unavailable or does not match your verified account.
            </p>
            <button
              type="button"
              className={secondary}
              onClick={() => {
                setReadState('loading');
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </button>
          </>
        ) : !preview ? (
          <p role="status" className="text-sm text-white/55">
            Loading invitation…
          </p>
        ) : (
          <>
            <div className="border-b border-white/10 pb-5">
              <h3 className="text-xl font-semibold">{formatEventTitle(preview.eventTitle)}</h3>
              <p className="mt-2 text-sm text-white/65">{preview.tierName} ×1</p>
              {preview.startsAt ? (
                <p className="mt-1 text-xs text-white/50">
                  {new Date(preview.startsAt).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}{' '}
                  IST
                </p>
              ) : null}
              <p className="mt-3 text-sm text-white/55">Shared by {preview.senderName}</p>
            </div>
            {accepted ? (
              <>
                <p role="status" className="text-sm leading-6 text-white/65">
                  Ticket accepted. The previous entry code has been replaced.
                </p>
                <button
                  type="button"
                  className={primary}
                  onClick={() => {
                    router.replace('/tickets');
                  }}
                >
                  View my tickets
                </button>
              </>
            ) : declined ? (
              <p role="status" className="text-sm leading-6 text-white/65">
                Invitation declined. The ticket stays with its current holder.
              </p>
            ) : !preview.canAccept ? (
              <p role="status" className="text-sm leading-6 text-white/60">
                {preview.unavailableReason ?? 'This invitation is no longer available.'}
              </p>
            ) : (
              <>
                <p className="text-sm leading-6 text-white/60">
                  Accepting moves this ticket to your account and replaces the sender’s entry code.
                </p>
                <p className="text-xs text-white/45">
                  Invitation expires{' '}
                  {new Date(preview.expiresAt).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}{' '}
                  IST
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={primary}
                    disabled={busy !== null}
                    onClick={() => void accept()}
                  >
                    {busy === 'accept' ? 'Accepting…' : 'Accept ticket'}
                  </button>
                  <button
                    type="button"
                    className={secondary}
                    disabled={busy !== null}
                    onClick={() => void decline()}
                  >
                    {busy === 'decline' ? 'Declining…' : 'Decline invitation'}
                  </button>
                </div>
              </>
            )}
            {error ? (
              <p role="alert" className="text-sm leading-6 text-red-300">
                This invitation is unavailable or does not match your verified account.
              </p>
            ) : null}
          </>
        )}
      </div>
    </Dialog>,
    document.body,
  );
}
