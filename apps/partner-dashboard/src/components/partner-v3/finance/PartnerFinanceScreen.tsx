import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './finance.module.css';
import { FinanceBankCards } from './FinanceBankCards';
import { FinanceOrdersTable } from './FinanceOrdersTable';
import { FinancePayoutHistory } from './FinancePayoutHistory';
import { FinanceSummary } from './FinanceSummary';
import { FinanceTabs } from './FinanceTabs';

import type {
  FinanceOrderStatus,
  FinanceView,
  PartnerFinanceData,
} from '@/data/partner-data-source';

type OrderSort = 'tickets' | 'amount';
type SortDirection = 'asc' | 'desc';
type OrderStatusFilter = 'All' | FinanceOrderStatus;

export interface PartnerFinanceScreenProps {
  readonly data: PartnerFinanceData;
  readonly baseHref: string;
  readonly view?: FinanceView;
  readonly search?: string;
  readonly status?: OrderStatusFilter;
  readonly sort?: OrderSort | null;
  readonly direction?: SortDirection;
}

export function PartnerFinanceScreen({
  data,
  baseHref,
  view = 'payouts',
  search = '',
  status = 'All',
  sort = null,
  direction = 'desc',
}: PartnerFinanceScreenProps) {
  return (
    <PageContainer>
      <div className={styles['financePage']} data-accent={data.accent}>
        <header className={styles['financeHeader']}>
          <h1>Finance</h1>
          <p className={styles['financeDisclosure']} role="status">
            Data read{' '}
            {new Intl.DateTimeFormat('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: data.freshness.timezone,
            }).format(new Date(data.freshness.asOf))}{' '}
            IST (Asia/Kolkata). Showing {String(data.coverage.orders.loaded)} of{' '}
            {String(data.coverage.orders.total)} recent orders and{' '}
            {String(data.coverage.payouts.loaded)} of {String(data.coverage.payouts.total)} payouts
            {data.coverage.orders.hasMore || data.coverage.payouts.hasMore
              ? '; additional records are not included in this view.'
              : '.'}
            {data.coverage.ledger.hasMore
              ? ` The balance trend uses ${String(data.coverage.ledger.loaded)} of ${String(data.coverage.ledger.total)} ledger entries.`
              : ''}
          </p>
          {data.dataStatus === 'api' ? (
            <p className={styles['financeDisclosure']} role="note">
              {data.readModel === 'legacy_ledger_v1'
                ? 'Balance source: legacy ledger. Financial journal totals are not included.'
                : 'Balance source: financial journal. Legacy ledger totals are not included.'}
              {data.readModel === 'financial_journal_v2'
                ? ' Balance trend is unavailable until journal-line trend data is connected.'
                : ''}
            </p>
          ) : null}
        </header>
        <FinanceTabs baseHref={baseHref} activeView={view} />
        {view === 'orders' ? (
          <FinanceOrdersTable
            rows={data.orders}
            initialSearch={search}
            initialStatus={status}
            initialSort={sort}
            initialDirection={direction}
          />
        ) : view === 'bank' ? (
          <FinanceBankCards data={data} />
        ) : (
          <>
            <FinanceSummary data={data} bankHref={`${baseHref}?view=bank`} />
            <FinancePayoutHistory rows={data.payouts} initialSearch={search} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
