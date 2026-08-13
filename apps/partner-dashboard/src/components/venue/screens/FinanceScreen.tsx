'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  CalendarIcon,
  CheckIcon,
  OrderIcon,
  RequestPayoutIcon,
  SearchIcon,
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
        <div className={styles['headerActions']}>
          <Link href="/venue/finance/orders">
            <OrderIcon size={18} aria-hidden="true" /> Orders
          </Link>
          {canRequestPayout ? (
            <button type="button" disabled title="Payout requests require the payout mutation API.">
              <RequestPayoutIcon size={18} aria-hidden="true" /> Request payout unavailable
            </button>
          ) : null}
        </div>
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
        <article className={styles['bankCard']}>
          <div className={styles['cardInner']}>
            {/* Card top row */}
            <div className={styles['cardTop']}>
              <span className={styles['cardBrand']}>THE C1RCLE</span>
              <svg
                width="28"
                height="20"
                viewBox="0 0 32 24"
                fill="none"
                aria-hidden="true"
                className={styles['cardContactless']}
              >
                <path
                  d="M16 18a6 6 0 000-12"
                  stroke="#d4af37"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M20 20a10 10 0 000-16"
                  stroke="#d4af37"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M24 22a14 14 0 000-20"
                  stroke="#d4af37"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            {/* Chip */}
            <div className={styles['cardChip']}>
              <svg width="36" height="28" viewBox="0 0 40 30" fill="none" aria-hidden="true">
                <rect
                  x="1"
                  y="1"
                  width="38"
                  height="28"
                  rx="5"
                  fill="#c9a84c"
                  fillOpacity=".25"
                  stroke="#c9a84c"
                  strokeOpacity=".6"
                  strokeWidth="1"
                />
                <line
                  x1="1"
                  y1="11"
                  x2="39"
                  y2="11"
                  stroke="#c9a84c"
                  strokeOpacity=".4"
                  strokeWidth=".7"
                />
                <line
                  x1="1"
                  y1="19"
                  x2="39"
                  y2="19"
                  stroke="#c9a84c"
                  strokeOpacity=".4"
                  strokeWidth=".7"
                />
                <line
                  x1="14"
                  y1="1"
                  x2="14"
                  y2="30"
                  stroke="#c9a84c"
                  strokeOpacity=".4"
                  strokeWidth=".7"
                />
                <line
                  x1="26"
                  y1="1"
                  x2="26"
                  y2="30"
                  stroke="#c9a84c"
                  strokeOpacity=".4"
                  strokeWidth=".7"
                />
              </svg>
            </div>
            {/* Account number */}
            <div className={styles['cardNumber']}>
              {venueFinanceModel.bank ? (
                <>
                  <span>•&thinsp;•&thinsp;•&thinsp;•</span>
                  <span>•&thinsp;•&thinsp;•&thinsp;•</span>
                  <span>•&thinsp;•&thinsp;•&thinsp;•</span>
                  <span>{venueFinanceModel.bank.maskedAccount.replace(/[^0-9]/g, '')}</span>
                </>
              ) : (
                <span>— — — —</span>
              )}
            </div>
            {/* Bottom row */}
            <div className={styles['cardBottom']}>
              <div className={styles['cardHolder']}>
                <small>Account Holder</small>
                <strong>{venueFinanceModel.bank?.accountHolder ?? 'Unavailable'}</strong>
              </div>
              <div className={styles['cardBank']}>
                <small>Bank</small>
                <strong>{venueFinanceModel.bank?.name ?? '—'}</strong>
              </div>
            </div>
            {/* Decorative circles */}
            <div className={styles['cardDeco']} aria-hidden="true" />
          </div>
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
