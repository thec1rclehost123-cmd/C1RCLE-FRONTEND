import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './finance.module.css';
import { FinanceBankCards } from './FinanceBankCards';
import { FinanceOrdersTable } from './FinanceOrdersTable';
import { FinancePayoutHistory } from './FinancePayoutHistory';
import { FinanceSummary } from './FinanceSummary';
import { FinanceTabs } from './FinanceTabs';

import type { FinanceDateRange, FinanceOrderStatus, FinanceView, PartnerFinanceData } from '@/data/partner-data-source';

type OrderSort = 'tickets' | 'amount';
type SortDirection = 'asc' | 'desc';
type OrderStatusFilter = 'All' | FinanceOrderStatus;

export interface PartnerFinanceScreenProps {
  readonly data: PartnerFinanceData;
  readonly baseHref: string;
  readonly view?: FinanceView;
  readonly search?: string;
  readonly range?: FinanceDateRange;
  readonly status?: OrderStatusFilter;
  readonly sort?: OrderSort | null;
  readonly direction?: SortDirection;
}

export function PartnerFinanceScreen({
  data,
  baseHref,
  view = 'payouts',
  search = '',
  range = 'current',
  status = 'All',
  sort = null,
  direction = 'desc',
}: PartnerFinanceScreenProps) {
  return (
    <PageContainer>
      <div className={styles['financePage']} data-accent={data.accent}>
        <header className={styles['financeHeader']}><h1>Finance</h1></header>
        <FinanceTabs baseHref={baseHref} activeView={view} />
        {view === 'orders' ? (
          <FinanceOrdersTable rows={data.orders} initialSearch={search} initialStatus={status} initialSort={sort} initialDirection={direction} />
        ) : view === 'bank' ? (
          <FinanceBankCards data={data} />
        ) : (
          <>
            <FinanceSummary data={data} bankHref={`${baseHref}?view=bank`} />
            <FinancePayoutHistory rows={data.payouts} initialSearch={search} initialRange={range} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
