'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { BankIcon, ChevronDownIcon, NextIcon, SearchIcon } from '@c1rcle/icons';

import styles from './finance.module.css';
import { PayoutStatusBadge } from './PayoutStatusBadge';

import type { FinanceDateRange, FinancePayout } from '@/data/partner-data-source';


function buildUrl(pathname: string, search: string, range: FinanceDateRange): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (range !== 'current') params.set('range', range);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function FinancePayoutHistory({ rows, initialSearch = '', initialRange = 'current' }: { readonly rows: readonly FinancePayout[]; readonly initialSearch?: string; readonly initialRange?: FinanceDateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [range, setRange] = useState<FinanceDateRange>(initialRange);
  const [rangeOpen, setRangeOpen] = useState(false);

  const visibleRows = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('en-IN');
    return normalized
      ? rows.filter((row) => `${row.date} ${row.detail} ${row.status} ${row.amount}`.toLocaleLowerCase('en-IN').includes(normalized))
      : rows;
  }, [rows, search]);

  const updateSearch = (value: string) => {
    setSearch(value);
    router.replace(buildUrl(pathname, value, range), { scroll: false });
  };

  const updateRange = (value: FinanceDateRange) => {
    setRange(value);
    setRangeOpen(false);
    router.replace(buildUrl(pathname, search, value), { scroll: false });
  };

  return (
    <section className={styles['payoutSection']} aria-labelledby="payout-history-title">
      <div className={styles['sectionHeader']}>
        <h2 id="payout-history-title">Payout history</h2>
        <div className={styles['payoutControls']}>
          <label className={styles['financeSearch']}>
            <span className={styles['srOnly']}>Search payout history</span>
            <SearchIcon size={14} aria-hidden="true" />
            <input value={search} onChange={(event) => { updateSearch(event.target.value); }} placeholder="Search by event" type="search" />
          </label>
          <div className={styles['rangeControl']}>
            <button type="button" aria-expanded={rangeOpen} onClick={() => { setRangeOpen((open) => !open); }}>
              {range === 'all' ? 'All payout history' : 'Date range'} <ChevronDownIcon size={14} aria-hidden="true" />
            </button>
            {rangeOpen ? (
              <div className={styles['rangeMenu']} role="menu" aria-label="Payout date range">
                <button type="button" role="menuitemradio" aria-checked={range === 'current'} onClick={() => { updateRange('current'); }}>Current payout history</button>
                <button type="button" role="menuitemradio" aria-checked={range === 'all'} onClick={() => { updateRange('all'); }}>All payout history</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles['payoutRows']}>
        <div className={styles['payoutTimeline']} aria-hidden="true" />
        {visibleRows.length === 0 ? (
          <div className={styles['financeEmpty']}>No payouts match this search.</div>
        ) : visibleRows.map((row) => (
          <article className={styles['payoutRow']} key={row.id}>
            <span className={styles['payoutIcon']} aria-hidden="true"><BankIcon size={18} /></span>
            <div className={styles['payoutIdentity']}>
              <strong>{row.date}</strong>
              <span>{row.detail}</span>
            </div>
            <PayoutStatusBadge status={row.status} />
            <strong className={styles['payoutAmount']}>{row.amount}</strong>
            <NextIcon className={styles['payoutChevron']} size={18} aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}
