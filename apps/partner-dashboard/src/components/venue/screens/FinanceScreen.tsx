'use client';

import { useMemo, useState } from 'react';

import {
  BankIcon,
  CalendarIcon,
  CheckIcon,
  RequestPayoutIcon,
  SearchIcon,
  SettingsIcon,
  TimeIcon,
  TrendUpIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { venueFinanceModel } from '../venue-finance-model';

import styles from './VenueFinance.module.css';

export function FinanceScreen() {
  const auth = useDashboardAuth();
  const [query, setQuery] = useState('');
  const canView =
    auth.grantedPermissions.length === 0 ||
    auth.grantedPermissions.includes('*') ||
    auth.hasPermission('VIEW_FINANCIALS');
  const canRequestPayout = auth.canDo('canManageFinance');
  const payouts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
    return normalized
      ? venueFinanceModel.payoutHistory.filter((item) =>
          item.events.toLocaleLowerCase('en-IN').includes(normalized),
        )
      : venueFinanceModel.payoutHistory;
  }, [query]);

  if (!canView) {
    return (
      <section className={styles['unavailable']} role="alert">
        <h1>Finance unavailable</h1>
        <p>Your current venue access does not include finance.</p>
      </section>
    );
  }

  return (
    <section className={styles['page']}>
      <header className={styles['header']}>
        <div>
          <h1>Finance</h1>
          <p>Your balance and payouts.</p>
        </div>
        {canRequestPayout ? (
          <button type="button" disabled title="Payout requests require the payout mutation API.">
            <RequestPayoutIcon size={18} aria-hidden="true" /> Request payout unavailable
          </button>
        ) : null}
      </header>
      <div className={styles['summaryGrid']}>
        <article className={styles['balance']}>
          <span>Available balance</span>
          <strong>{venueFinanceModel.available}</strong>
          <p>
            {venueFinanceModel.bank
              ? `Ready to withdraw to ${venueFinanceModel.bank.name} ${venueFinanceModel.bank.maskedAccount}`
              : 'Destination unavailable'}
          </p>
          <div>
            <TrendUpIcon size={18} aria-hidden="true" />
            <span>
              <small>Monthly comparison</small>
              <strong>{venueFinanceModel.monthlyComparison}</strong>
              <em>vs {venueFinanceModel.previousMonthAvailable}</em>
            </span>
          </div>
        </article>
        <article className={styles['bank']}>
          <h2>Bank account</h2>
          {venueFinanceModel.bank ? (
            <>
              <div>
                <BankIcon size={34} aria-hidden="true" />
                <span>
                  <strong>{venueFinanceModel.bank.name}</strong>
                  <small>{venueFinanceModel.bank.maskedAccount}</small>
                </span>
              </div>
              <dl>
                <dt>Account holder</dt>
                <dd>{venueFinanceModel.bank.accountHolder}</dd>
              </dl>
              <button
                type="button"
                disabled
                title="Bank account changes require the payout account mutation API."
              >
                <SettingsIcon size={18} aria-hidden="true" /> Manage unavailable
              </button>
            </>
          ) : (
            <p>Bank account unavailable</p>
          )}
        </article>
      </div>
      <div className={styles['balanceStrip']}>
        <div>
          <TimeIcon size={19} aria-hidden="true" />
          <span>Pending balance</span>
          <strong>{venueFinanceModel.pending}</strong>
        </div>
        <div>
          <CalendarIcon size={19} aria-hidden="true" />
          <span>Next payout</span>
          <strong>{venueFinanceModel.nextPayout}</strong>
        </div>
      </div>
      <section className={styles['history']}>
        <header>
          <h2>Payout history</h2>
          <div>
            <label>
              <span className={styles['srOnly']}>Search payout events</span>
              <SearchIcon size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Search events"
              />
            </label>
            <label>
              <span className={styles['srOnly']}>Date range</span>
              <CalendarIcon size={18} aria-hidden="true" />
              <select defaultValue="1 Jun – 14 Jul 2025">
                <option>1 Jun – 14 Jul 2025</option>
              </select>
            </label>
          </div>
        </header>
        <div role="table" aria-label="Payout history">
          <div className={styles['tableHead']} role="row">
            <span>Date</span>
            <span>Events</span>
            <span>Status</span>
            <span>Amount</span>
          </div>
          {payouts.map((payout) => (
            <div className={styles['payoutRow']} role="row" key={payout.id}>
              <span role="cell">{payout.date}</span>
              <span role="cell">{payout.events}</span>
              <span role="cell" data-status={payout.status}>
                {payout.status === 'Paid' ? <CheckIcon size={14} aria-hidden="true" /> : null}
                {payout.status}
              </span>
              <strong role="cell">{payout.amount}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
