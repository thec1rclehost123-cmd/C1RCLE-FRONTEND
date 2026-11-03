'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { bankAccountRequestSchema } from '@c1rcle/contracts';
import { BankIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { Skeleton } from '@/components/partner-v3/States';
import { apiClient } from '@/lib/api/client';
import {
  addBankAccount,
  listBankAccounts,
  removeBankAccount,
  setDefaultBankAccount,
} from '@/lib/finance/api-finance-repository';

import styles from './finance.module.css';

import type { PartnerFinanceData } from '@/data/partner-data-source';
import type { BankAccountResponse } from '@c1rcle/contracts';

export function FinanceBankCards({ data }: { readonly data: PartnerFinanceData }) {
  const router = useRouter();
  const organizationId = data.payoutRequest?.organizationId ?? null;
  const [accounts, setAccounts] = useState<readonly BankAccountResponse[]>([]);
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
  });

  async function refreshAccounts() {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAccounts(await listBankAccounts(apiClient, organizationId));
    } catch {
      setError('Bank account details could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    void listBankAccounts(apiClient, organizationId)
      .then((items) => {
        if (active) setAccounts(items);
      })
      .catch(() => {
        if (active) setError('Bank account details could not be loaded. Try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  async function saveBankAccount(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const accountNumber = form.accountNumber.trim();
    if (accountNumber !== form.confirmAccountNumber.trim()) {
      setError('Account numbers do not match.');
      return;
    }
    const parsed = bankAccountRequestSchema.safeParse({
      bankName: form.bankName.trim(),
      accountHolder: form.accountHolder.trim(),
      accountNumber,
      ifscCode: form.ifscCode.trim().toUpperCase(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the bank details and try again.');
      return;
    }
    if (!organizationId) return;
    setBusyId('add');
    try {
      const created = await addBankAccount(apiClient, organizationId, parsed.data);
      setNotice(`${created.bankName} account added. Verification is pending.`);
      setForm({
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
      });
      setAdding(false);
      await refreshAccounts();
      router.refresh();
    } catch {
      setError('Bank account could not be saved. Check your access and try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function makeDefault(account: BankAccountResponse) {
    if (!organizationId) return;
    setBusyId(account.id);
    setError(null);
    setNotice(null);
    try {
      await setDefaultBankAccount(apiClient, organizationId, account.id);
      setNotice(`${account.bankName} is now the payout account.`);
      await refreshAccounts();
      router.refresh();
    } catch {
      setError('Default payout account could not be changed. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAccount(account: BankAccountResponse) {
    if (!organizationId || account.isDefault) return;
    setBusyId(account.id);
    setError(null);
    setNotice(null);
    try {
      await removeBankAccount(apiClient, organizationId, account.id);
      setNotice(`${account.bankName} account removed.`);
      await refreshAccounts();
      router.refresh();
    } catch {
      setError('Bank account could not be removed. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={styles['accountGrid']}>
      <section className={styles['accountPanel']} aria-labelledby="bank-account-title">
        <div className={styles['bankPanelHeader']}>
          <div>
            <h2 id="bank-account-title">Payout bank accounts</h2>
            <p>Indian bank accounts · account numbers stay masked.</p>
          </div>
          {organizationId ? (
            <Button
              variant="primary"
              onClick={() => {
                setAdding((value) => !value);
                setError(null);
              }}
            >
              {adding ? 'Close' : 'Add bank account'}
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className={styles['financeFormError']} role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className={styles['financeFormNotice']} role="status">
            {notice}
          </p>
        ) : null}
        {loading && accounts.length === 0 ? (
          <div
            className={styles['bankAccountList']}
            role="status"
            aria-label="Loading bank accounts…"
          >
            {[0, 1].map((index) => (
              <div className={styles['bankAccountRow']} key={index} aria-hidden="true">
                <div className={styles['bankAccountIdentity']}>
                  <Skeleton className="w-40" />
                  <Skeleton className="w-28" />
                </div>
                <Skeleton className="w-32" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && accounts.length === 0 ? (
          <div className={styles['bankEmptyState']}>
            <BankIcon size={20} aria-hidden="true" />
            <strong>No payout account added</strong>
            <span>Add an Indian bank account to receive eligible payouts.</span>
          </div>
        ) : null}
        {accounts.length > 0 ? (
          <ul className={styles['bankAccountList']}>
            {accounts.map((account) => (
              <li key={account.id} className={styles['bankAccountRow']}>
                <div className={styles['bankAccountIdentity']}>
                  <strong>{account.bankName}</strong>
                  <span>
                    {account.accountHolder} · {account.maskedAccountNumber}
                  </span>
                  <span>IFSC {account.ifscCode}</span>
                </div>
                <div className={styles['bankAccountActions']}>
                  <span
                    className={account.verified ? styles['bankVerified'] : styles['bankPending']}
                  >
                    {account.verified ? 'Verified' : 'Verification pending'}
                  </span>
                  {account.isDefault ? (
                    <span className={styles['bankDefault']}>Payout account</span>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled={busyId !== null}
                      onClick={() => void makeDefault(account)}
                    >
                      {busyId === account.id ? 'Saving…' : 'Set as payout account'}
                    </Button>
                  )}
                  {!account.isDefault ? (
                    <Button
                      variant="secondary"
                      disabled={busyId !== null}
                      onClick={() => void deleteAccount(account)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {adding ? (
          <form
            className={styles['bankAccountForm']}
            onSubmit={(event) => void saveBankAccount(event)}
          >
            <label>
              Bank name
              <input
                autoComplete="organization"
                required
                maxLength={120}
                value={form.bankName}
                onChange={(event) => {
                  setForm({ ...form, bankName: event.target.value });
                }}
              />
            </label>
            <label>
              Account holder name
              <input
                autoComplete="name"
                required
                maxLength={120}
                value={form.accountHolder}
                onChange={(event) => {
                  setForm({ ...form, accountHolder: event.target.value });
                }}
              />
            </label>
            <label>
              Account number
              <input
                autoComplete="off"
                inputMode="numeric"
                required
                minLength={4}
                maxLength={34}
                value={form.accountNumber}
                onChange={(event) => {
                  setForm({ ...form, accountNumber: event.target.value.replace(/\s/g, '') });
                }}
              />
            </label>
            <label>
              Confirm account number
              <input
                autoComplete="off"
                inputMode="numeric"
                required
                value={form.confirmAccountNumber}
                onChange={(event) => {
                  setForm({ ...form, confirmAccountNumber: event.target.value.replace(/\s/g, '') });
                }}
              />
            </label>
            <label>
              IFSC code
              <input
                autoComplete="off"
                required
                minLength={11}
                maxLength={11}
                value={form.ifscCode}
                onChange={(event) => {
                  setForm({ ...form, ifscCode: event.target.value.toUpperCase() });
                }}
              />
            </label>
            <p className={styles['accountNote']}>
              Details are encrypted for payout processing. Only the masked account number is shown
              after saving.
            </p>
            <div className={styles['bankFormActions']}>
              <Button
                variant="secondary"
                type="button"
                disabled={busyId !== null}
                onClick={() => {
                  setAdding(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={busyId !== null}>
                {busyId === 'add' ? 'Saving…' : 'Save bank account'}
              </Button>
            </div>
          </form>
        ) : null}
      </section>

      <section className={styles['accountPanel']} aria-labelledby="payment-card-title">
        <h2 id="payment-card-title">Payment cards</h2>
        <p>Cards are for charges, not payouts.</p>
        <div className={styles['bankEmptyState']}>
          <BankIcon size={20} aria-hidden="true" />
          <strong>No saved card</strong>
          <span>
            Payments for platform services are completed through the secure payment checkout. C1RCLE
            does not store card numbers or CVV.
          </span>
        </div>
      </section>
    </div>
  );
}
