'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { CalendarIcon, ChevronDownIcon, ExportIcon } from '@c1rcle/icons';

import styles from './VenueEventsAnalytics.module.css';

export function VenueEventsAnalyticsFilters({
  rows,
}: {
  readonly rows: readonly { readonly label: string; readonly value: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateRange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === '7d') next.delete('range');
    else next.set('range', value);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const exportSummary = () => {
    const csv = [
      'Metric,Value',
      ...rows.map((row) => `${JSON.stringify(row.label)},${JSON.stringify(row.value)}`),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'venue-events-analytics.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles['analyticsFilters']}>
      <label>
        <CalendarIcon size={19} aria-hidden="true" />
        <span className={styles['srOnly']}>Date range</span>
        <select
          value={searchParams.get('range') ?? '7d'}
          onChange={(event) => {
            updateRange(event.target.value);
          }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d" disabled>
            Last 30 days — unavailable
          </option>
          <option value="90d" disabled>
            Last 90 days — unavailable
          </option>
        </select>
        <ChevronDownIcon size={16} aria-hidden="true" />
      </label>
      <button type="button" onClick={exportSummary}>
        <ExportIcon size={19} aria-hidden="true" />
        Export
      </button>
    </div>
  );
}
