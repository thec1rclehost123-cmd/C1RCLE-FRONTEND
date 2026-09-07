'use client';

import { useMemo, useState } from 'react';
import {
  BankIcon,
  CalendarIcon,
  CheckIcon,
  OrderIcon,
  SearchIcon,
  SettingsIcon,
  TimeIcon,
} from '@c1rcle/icons';

import Link from 'next/link';

import styles from '../venue/screens/VenueFinance.module.css';

export interface PartnerFinanceHistoryRow {
  readonly id: string;
  readonly date: string;
  readonly event?: string;
  readonly status: string;
  readonly amount: string;
}

export interface PartnerFinanceSecondaryCell {
  readonly value: string;
  readonly tone?: 'positive' | 'warning' | 'negative';
  readonly emphasis?: boolean;
}

export interface PartnerFinanceSecondarySection {
  readonly title: string;
  readonly description?: string;
  readonly columns: readonly string[];
  readonly rows: readonly {
    readonly id: string;
    readonly cells: readonly PartnerFinanceSecondaryCell[];
  }[];
}

export interface PartnerFinanceAccount {
  readonly display: string;
  readonly bankName?: string;
  readonly maskedAccount?: string;
  readonly accountHolder?: string;
  readonly status?: string;
  readonly manageHref?: string;
}

export function PartnerFinanceScreen({
  subtitle,
  available,
  availableDetail,
  account,
  pending,
  nextPayout,
  history,
  ordersHref,
  secondarySections = [],
}: {
  readonly subtitle: string;
  readonly available: string;
  readonly availableDetail: string;
  readonly account: PartnerFinanceAccount;
  readonly pending: string;
  readonly nextPayout: string;
  readonly history: readonly PartnerFinanceHistoryRow[];
  readonly ordersHref?: string;
  readonly secondarySections?: readonly PartnerFinanceSecondarySection[];
}) {
  const [query, setQuery] = useState('');
  const filteredHistory = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('en-IN');
        return normalized
      ? history.filter((row) =>
          `${row.date} ${row.event ?? ''} ${row.status} ${row.amount}`
            .toLocaleLowerCase('en-IN')
            .includes(normalized),
        )
      : history;
  }, [history, query]);
  const hasEvents = history.some((row) => row.event);

  return (
    <section className={styles['page']}>
      <header className={styles['header']}>
        <div>
          <h1>Finance</h1>
          <p>{subtitle}</p>
        </div>
        {ordersHref ? (
          <div className={styles['headerActions']}>
            <Link href={ordersHref}>
              <OrderIcon size={18} aria-hidden="true" /> Orders
            </Link>
          </div>
        ) : null}
      </header>

      <div className={styles['summaryGrid']}>
        <article className={styles['balance']}>
          <span>Available earnings</span>
          <strong>{available}</strong>
          <p>{availableDetail}</p>
        </article>
        <article className={styles['bank']}>
          <h2>Payout account</h2>
          <div>
            <BankIcon size={34} aria-hidden="true" />
            <span>
              <strong>{account.bankName ?? account.display}</strong>
              {account.maskedAccount ? <small>{account.maskedAccount}</small> : null}
            </span>
          </div>
          {account.accountHolder || account.status ? (
            <dl>
              {account.accountHolder ? (
                <>
                  <dt>Account holder</dt>
                  <dd>{account.accountHolder}</dd>
                </>
              ) : null}
              {account.status ? (
                <>
                  <dt>Status</dt>
                  <dd className={styles['accountStatus']} data-status={account.status}>
                    {account.status}
                  </dd>
                </>
              ) : null}
            </dl>
          ) : null}
          {account.manageHref ? (
            <a href={account.manageHref}>
              <SettingsIcon size={18} aria-hidden="true" /> Manage
            </a>
          ) : null}
        </article>
      </div>

      <div className={styles['balanceStrip']}>
        <div>
          <TimeIcon size={19} aria-hidden="true" />
          <span>Pending earnings</span>
          <strong>{pending}</strong>
        </div>
        <div>
          <CalendarIcon size={19} aria-hidden="true" />
          <span>Next payout</span>
          <strong>{nextPayout}</strong>
        </div>
      </div>

      <section className={styles['history']}>
        <header>
          <h2>Payout history</h2>
          <label>
            <span className={styles['srOnly']}>Search payout history</span>
            <SearchIcon size={18} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search history"
            />
          </label>
        </header>
        <div role="table" aria-label="Payout history">
          <div
            className={`${styles['tableHead']} ${hasEvents ? '' : styles['compactTable']}`}
            role="row"
          >
            <span>Date</span>
            {hasEvents ? <span>Event</span> : null}
            <span>Status</span>
            <span>Amount</span>
          </div>
          {filteredHistory.map((row) => (
            <div
              className={`${styles['payoutRow']} ${hasEvents ? '' : styles['compactTable']}`}
              role="row"
              key={row.id}
            >
              <span role="cell">{row.date}</span>
              {hasEvents ? <span role="cell">{row.event ?? '—'}</span> : null}
              <span role="cell" data-status={row.status}>
                {row.status === 'Paid' ? <CheckIcon size={14} aria-hidden="true" /> : null}
                {row.status}
              </span>
              <strong role="cell">{row.amount}</strong>
            </div>
          ))}
        </div>
      </section>

      {secondarySections.map((section) => (
        <section className={styles['secondaryTable']} key={section.title}>
          <header>
            <div>
              <h2>{section.title}</h2>
              {section.description ? <p>{section.description}</p> : null}
            </div>
          </header>
          <div
            className={styles['secondaryTableGrid']}
            data-columns={section.columns.length}
            role="table"
            aria-label={section.title}
          >
            <div className={styles['secondaryHead']} role="row">
              {section.columns.map((column) => <span key={column}>{column}</span>)}
            </div>
            {section.rows.map((row) => (
              <div className={styles['secondaryRow']} role="row" key={row.id}>
                {row.cells.map((cell, index) => (
                  <span
                    role="cell"
                    key={`${row.id}-${index}`}
                    data-tone={cell.tone}
                    data-emphasis={cell.emphasis ? 'true' : undefined}
                  >
                    {cell.value}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
