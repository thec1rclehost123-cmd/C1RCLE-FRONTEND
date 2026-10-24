'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { BankIcon, NextIcon, SearchIcon } from '@c1rcle/icons';

import styles from './finance.module.css';
import { PayoutStatusBadge } from './PayoutStatusBadge';

import type { FinancePayout } from '@/data/partner-data-source';

function buildUrl(pathname: string, search: string): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function FinancePayoutHistory({
  rows,
  initialSearch = '',
}: {
  readonly rows: readonly FinancePayout[];
  readonly initialSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);

  const visibleRows = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('en-IN');
    return normalized
      ? rows.filter((row) =>
          `${row.date} ${row.detail} ${row.status} ${row.amount}`
            .toLocaleLowerCase('en-IN')
            .includes(normalized),
        )
      : rows;
  }, [rows, search]);

  const updateSearch = (value: string) => {
    setSearch(value);
    router.replace(buildUrl(pathname, value), { scroll: false });
  };

  return (
    <section className={styles['payoutSection']} aria-labelledby="payout-history-title">
      <div className={styles['sectionHeader']}>
        <h2 id="payout-history-title">Payout history</h2>
        <div className={styles['payoutControls']}>
          <label className={styles['financeSearch']}>
            <span className={styles['srOnly']}>Search payout history</span>
            <SearchIcon size={14} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => {
                updateSearch(event.target.value);
              }}
              placeholder="Search by event"
              type="search"
            />
          </label>
        </div>
      </div>

      <div className={styles['payoutRows']}>
        <div className={styles['payoutTimeline']} aria-hidden="true" />
        {visibleRows.length === 0 ? (
          <div className={styles['financeEmpty']}>No payouts match this search.</div>
        ) : (
          visibleRows.map((row) => (
            <article className={styles['payoutRow']} key={row.id}>
              <span className={styles['payoutIcon']} aria-hidden="true">
                <BankIcon size={18} />
              </span>
              <div className={styles['payoutIdentity']}>
                <strong>{row.date}</strong>
                <span>{row.detail}</span>
              </div>
              <PayoutStatusBadge status={row.status} />
              <strong className={styles['payoutAmount']}>{row.amount}</strong>
              <NextIcon className={styles['payoutChevron']} size={18} aria-hidden="true" />
            </article>
          ))
        )}
      </div>
    </section>
  );
}
