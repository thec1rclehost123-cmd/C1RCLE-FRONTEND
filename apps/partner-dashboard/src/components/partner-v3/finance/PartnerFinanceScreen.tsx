import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

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
  readonly hostSettlement?: boolean;
  readonly promoterScope?: boolean;
  readonly view?: FinanceView;
  readonly search?: string;
  readonly status?: OrderStatusFilter;
  readonly sort?: OrderSort | null;
  readonly direction?: SortDirection;
}

export function PartnerFinanceScreen({
  data,
  baseHref,
  hostSettlement = false,
  promoterScope = false,
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
          {view === 'payouts' ? (
            <p className={styles['financeDisclosure']} role="note">
              Updated{' '}
              {new Intl.DateTimeFormat('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: PRODUCT_TIME_ZONE,
              }).format(new Date(data.freshness.asOf))}{' '}
              IST · Balance from{' '}
              {data.readModel === 'legacy_ledger_v1' ? 'ledger' : 'financial journal'}
            </p>
          ) : null}
        </header>
        <FinanceTabs baseHref={baseHref} activeView={view} promoterScope={promoterScope} />
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
            <FinanceSummary
              data={data}
              bankHref={`${baseHref}?view=bank`}
              hostSettlement={hostSettlement}
            />
            <FinancePayoutHistory rows={data.payouts} initialSearch={search} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
