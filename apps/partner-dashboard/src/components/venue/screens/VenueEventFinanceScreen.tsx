'use client';

import Link from 'next/link';

import { BankIcon, LockedIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import styles from '../event-detail/VenueEventOperations.module.css';
import { useVenueStudio } from '../store';

import type { VenueEventFinanceModel } from '../event-detail-model';

const canViewFinance = (permissions: readonly string[]): boolean =>
  permissions.length === 0 || permissions.includes('*') || permissions.includes('VIEW_FINANCIALS');

export function VenueEventFinanceScreen({
  model,
}: {
  readonly model: VenueEventFinanceModel | null;
}) {
  const auth = useDashboardAuth();
  const venue = useVenueStudio();

  if (!canViewFinance(auth.grantedPermissions)) {
    return (
      <section className={styles['restrictedState']}>
        <LockedIcon size={25} aria-hidden="true" />
        <h2>Finance access is required.</h2>
        <p>This event’s payout details are available only to authorized finance roles.</p>
      </section>
    );
  }

  if (!model) {
    return (
      <section className={styles['emptyState']}>
        <h2>Financial details are unavailable.</h2>
        <p>No authoritative event ledger is connected for this event.</p>
        <Link href="/venue/events">Return to events</Link>
      </section>
    );
  }

  return (
    <div className={[styles['operationsPage'], styles['financePage']].filter(Boolean).join(' ')}>
      <section className={styles['financeSummary']} aria-label="Event finance summary">
        <article>
          <span>Gross sales</span>
          <strong>{model.summary.grossSales}</strong>
        </article>
        <article>
          <span>Deductions</span>
          <strong>{model.summary.deductions}</strong>
        </article>
        <article>
          <span>Expected payout</span>
          <strong>{model.summary.expectedPayout}</strong>
        </article>
        <p>{model.summary.payoutDate}</p>
      </section>

      <div className={styles['financeGrid']}>
        <section className={styles['panel']} aria-labelledby="payout-breakdown-title">
          <h2 id="payout-breakdown-title">Payout breakdown</h2>
          <dl className={styles['payoutBreakdown']}>
            {model.breakdown.map((item) => (
              <div
                key={item.label}
                data-total={item.label === 'Expected payout' ? 'true' : 'false'}
              >
                <dt>{item.label}</dt>
                <dd data-negative={item.amountPaise < 0 ? 'true' : 'false'}>{item.amount}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles['panel']} aria-labelledby="payout-account-title">
          <h2 id="payout-account-title">Payout account</h2>
          <div className={styles['payoutAccount']}>
            <span aria-hidden="true">
              <BankIcon size={24} />
            </span>
            <strong>
              {model.payoutAccount.bankName} {model.payoutAccount.maskedAccount}
            </strong>
            {auth.canDo('canManageFinance') ? (
              <button type="button" onClick={venue.goBank}>
                Manage
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <section className={[styles['panel'], styles['transactionsPanel']].filter(Boolean).join(' ')}>
        <h2>Transactions</h2>
        <div className={styles['tableWrap']}>
          <table className={styles['transactionTable']}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {model.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td data-label="Date">{transaction.date}</td>
                  <td data-label="Description">{transaction.description}</td>
                  <td data-label="Status">
                    <span
                      className={styles['status']}
                      data-status={transaction.status.toLowerCase()}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td
                    data-label="Amount"
                    data-negative={transaction.amountPaise < 0 ? 'true' : 'false'}
                  >
                    {transaction.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
