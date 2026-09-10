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
}: {
  readonly baseHref: string;
  readonly activeView: FinanceView;
}) {
  return (
    <nav className={styles['financeTabs']} aria-label="Finance views">
      {tabs.map((tab) => (
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
