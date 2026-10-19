'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { RequestPayoutIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { apiClient } from '@/lib/api/client';
import { describeApiError } from '@/lib/api/describe-error';
import { requestPayout } from '@/lib/finance/api-finance-repository';

import styles from './finance.module.css';

import type { PartnerFinanceData } from '@/data/partner-data-source';

const MINIMUM_PAYOUT_PAISE = 10_000;

function rupeesToPaise(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const paise = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(paise) ? paise : null;
}

export function PayoutRequestAction({
  request,
}: {
  readonly request: PartnerFinanceData['payoutRequest'];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [intentKey, setIntentKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const canRequest =
    request?.bankAccountId != null && request.availablePaise >= MINIMUM_PAYOUT_PAISE;
  const unavailableReason =
    request === null
      ? 'Payout requests are available on API-backed finance screens.'
      : request.bankAccountId === null
        ? 'Add a payout bank account first.'
        : request.availablePaise < MINIMUM_PAYOUT_PAISE
          ? 'The minimum payout is ₹100.'
          : undefined;

  if (!open) {
    return (
      <Button
        className={styles['financeSecondaryAction']}
        variant="secondary"
        disabled={!canRequest}
        title={unavailableReason}
        onClick={() => {
          setNotice('');
          setOpen(true);
        }}
      >
        <RequestPayoutIcon size={16} aria-hidden="true" /> Request payout
      </Button>
    );
  }

  return (
    <form
      className={styles['payoutRequestForm']}
      onSubmit={(event) => {
        event.preventDefault();
        if (!request?.bankAccountId) return;
        const amountPaise = rupeesToPaise(amount);
        if (amountPaise === null || amountPaise < MINIMUM_PAYOUT_PAISE) {
          setNotice('Enter at least ₹100 using no more than two decimal places.');
          return;
        }
        if (amountPaise > request.availablePaise) {
          setNotice('The payout cannot exceed the available balance.');
          return;
        }
        const key = intentKey ?? crypto.randomUUID();
        setIntentKey(key);
        setSubmitting(true);
        setNotice('');
        void requestPayout(
          apiClient,
          request.organizationId,
          { amountPaise, bankAccountId: request.bankAccountId },
          key,
        )
          .then(() => {
            setNotice('Payout requested.');
            setOpen(false);
            setAmount('');
            setIntentKey(null);
            router.refresh();
          })
          .catch((error: unknown) => {
            // Keep the intent key so retrying this exact submission cannot
            // create a second payout if the first response was lost.
            setNotice(describeApiError(error, 'Could not request the payout. Try again.'));
          })
          .finally(() => {
            setSubmitting(false);
          });
      }}
    >
      <label className={styles['payoutAmountField']}>
        <span>Amount (₹)</span>
        <input
          inputMode="decimal"
          name="payoutAmount"
          value={amount}
          disabled={submitting}
          placeholder="100.00"
          aria-describedby="payout-request-notice"
          onChange={(event) => {
            setAmount(event.target.value);
            setIntentKey(null);
            setNotice('');
          }}
        />
      </label>
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? 'Requesting…' : 'Confirm payout'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={submitting}
        onClick={() => {
          setOpen(false);
          setAmount('');
          setIntentKey(null);
          setNotice('');
        }}
      >
        Cancel
      </Button>
      <span id="payout-request-notice" className={styles['payoutRequestNotice']} role="status">
        {notice}
      </span>
    </form>
  );
}
