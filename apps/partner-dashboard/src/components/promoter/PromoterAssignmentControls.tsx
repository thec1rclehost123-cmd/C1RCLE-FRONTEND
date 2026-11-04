'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  createPromoterReferralLink,
  respondToPromoterAssignment,
} from '@/lib/partner/promoter-assignment-repository';

export function PromoterAssignmentControls({
  assignmentId,
  assignmentVersion,
  status,
  canCreateLink,
}: {
  assignmentId: string;
  assignmentVersion: number;
  status: string;
  canCreateLink: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<'accept' | 'reject' | 'link' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function respond(decision: 'accept' | 'reject') {
    setPending(decision);
    setError(null);
    try {
      await respondToPromoterAssignment({
        assignmentId,
        expectedVersion: assignmentVersion,
        decision,
      });
      router.refresh();
    } catch {
      setError(
        'The assignment could not be updated. Refresh to check its current status, then retry.',
      );
    } finally {
      setPending(null);
    }
  }

  async function createLink() {
    setPending('link');
    setError(null);
    try {
      const link = await createPromoterReferralLink({ assignmentId });
      const href = link.vanitySlug
        ? `${window.location.origin}/${encodeURIComponent(link.vanityPrefix)}/${encodeURIComponent(link.vanitySlug)}`
        : `${window.location.origin}/event/${encodeURIComponent(link.eventId)}?ref=${encodeURIComponent(link.code)}`;
      setPublicUrl(href);
      try {
        await navigator.clipboard.writeText(href);
        setCopied(true);
      } catch {
        setError('Link created. Copy it from the field below.');
      }
      router.refresh();
    } catch {
      setError('The referral link could not be created. Refresh and try again.');
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {status === 'invited' ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={pending !== null} onClick={() => void respond('accept')}>
            {pending === 'accept' ? 'Accepting…' : 'Accept invitation'}
          </button>
          <button type="button" disabled={pending !== null} onClick={() => void respond('reject')}>
            {pending === 'reject' ? 'Declining…' : 'Decline'}
          </button>
        </div>
      ) : null}
      {canCreateLink ? (
        <button type="button" disabled={pending !== null} onClick={() => void createLink()}>
          {pending === 'link' ? 'Creating link…' : 'Create and copy referral link'}
        </button>
      ) : null}
      {copied ? <p role="status">Referral link copied.</p> : null}
      {publicUrl ? (
        <label className="block text-sm text-white/70">
          Referral link
          <input
            className="mt-2 block w-full rounded-lg border border-white/20 bg-black px-3 py-2"
            aria-label="Referral link"
            readOnly
            value={publicUrl}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
        </label>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
