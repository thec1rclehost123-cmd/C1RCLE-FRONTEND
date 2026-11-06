import Link from 'next/link';

import styles from './finance.module.css';

import type { FinanceView } from '@/data/partner-data-source';

const tabs: readonly { readonly value: FinanceView; readonly label: string }[] = [
  { value: 'payouts', label: 'Balance & payouts' },
  { value: 'orders', label: 'Orders' },
  { value: 'bank', label: 'Bank & cards' },
];

export function FinanceTabs({
  baseHref,
  activeView,
  promoterScope = false,
}: {
  readonly baseHref: string;
  readonly activeView: FinanceView;
  readonly promoterScope?: boolean;
}) {
  const visibleTabs = promoterScope ? tabs.filter((tab) => tab.value !== 'orders') : tabs;
  return (
    <nav className={styles['financeTabs']} aria-label="Finance views">
      {visibleTabs.map((tab) => (
        <Link
          className={styles['financeTab']}
          href={tab.value === 'payouts' ? baseHref : `${baseHref}?view=${tab.value}`}
          aria-current={activeView === tab.value ? 'page' : undefined}
          key={tab.value}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
