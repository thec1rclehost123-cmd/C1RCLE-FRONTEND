'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import {
  socialMutationReceiptSchema,
  socialReportReceiptSchema,
} from '@c1rcle/contracts/guest-social';
import { Button } from '@c1rcle/ui';

import { csrfHeaders } from '@/lib/bff/csrf';

import { socialClient } from './social-client';

export function ReportGuestControl({ targetId }: { targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<'harassment' | 'impersonation' | 'safety' | 'other'>(
    'safety',
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const key = useRef<string | null>(null);
  async function submit() {
    if (busy) return;
    if (reason.trim().length < 10) {
      setMessage('Please describe the concern in at least 10 characters.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      key.current ??= crypto.randomUUID();
      await socialClient.post({
        path: `/api/social/reports/${encodeURIComponent(targetId)}`,
        body: { category, reason: reason.trim() },
        headers: { ...csrfHeaders(), 'idempotency-key': key.current },
        schema: socialReportReceiptSchema,
      });
      setMessage('Report sent to C1RCLE support. The Guest is not notified.');
      setOpen(false);
      setReason('');
      key.current = null;
    } catch {
      setMessage('Your report could not be sent. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <Button
        variant="secondary"
        onClick={() => {
          setOpen(!open);
        }}
        disabled={busy}
      >
        Report Guest
      </Button>
      {open && (
        <form
          className="max-w-lg space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <p className="text-sm text-white/60">
            Your report goes privately to C1RCLE support. It does not automatically ban anyone.
          </p>
          <label className="block text-sm">
            Concern
            <select
              className="mt-2 min-h-11 w-full rounded-xl border border-white/20 bg-black p-3"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as typeof category);
                key.current = null;
              }}
            >
              <option value="safety">Safety concern</option>
              <option value="harassment">Harassment</option>
              <option value="impersonation">Impersonation</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm">
            What happened?
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-white/20 bg-black p-3"
              maxLength={2000}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                key.current = null;
              }}
            />
          </label>
          <Button disabled={busy} type="submit">
            {busy ? 'Sending…' : 'Send report'}
          </Button>
        </form>
      )}
      {message && (
        <p role="status" className="max-w-lg text-sm text-white/75">
          {message}
        </p>
      )}
    </div>
  );
}

export function GuestSocialActions({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function block() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await socialClient.put({
        path: `/api/social/blocks/${encodeURIComponent(targetId)}`,
        body: { blocked: true },
        schema: socialMutationReceiptSchema,
        headers: csrfHeaders(),
      });
      router.push('/profile?view=settings&section=social');
      router.refresh();
    } catch {
      setError('This Guest could not be blocked. Try again.');
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="Guest safety controls"
      className="mt-10 space-y-4 border-t border-white/10 pt-6"
    >
      <p className="text-sm text-white/60">
        Blocking hides your social profiles and guestlist identities from each other. It does not
        change admission or tickets.
      </p>
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="secondary" disabled={busy} onClick={() => void block()}>
          {busy ? 'Blocking…' : 'Block Guest'}
        </Button>
        <ReportGuestControl targetId={targetId} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
