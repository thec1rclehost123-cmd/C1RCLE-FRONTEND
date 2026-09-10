import { AddIcon, ChevronDownIcon, CreditCardIcon, RefreshIcon, WalletIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './promoter-finance.module.css';

import type { PromoterFinanceData } from '@/data/partner-data-source';

export function PromoterFinanceScreen({ data }: { readonly data: PromoterFinanceData }) {
  return (
    <PageContainer>
      <div className={styles['promoterFinancePage']}>
        <header className={styles['financeHeader']}>
          <h1>Finance</h1>
          <div className={styles['financeHeaderActions']}>
            <span className={styles['walletPill']}>
              <WalletIcon size={14} aria-hidden="true" />
              {data.walletBalance}
            </span>
            <Button
              className={styles['refreshButton']}
              variant="secondary"
              disabled
              title="Finance refresh is unavailable in fixture mode."
            >
              <RefreshIcon size={14} aria-hidden="true" /> Refresh
            </Button>
            <span className={styles['withdrawalsNotice']} role="status">
              {data.withdrawalsMessage}
            </span>
          </div>
        </header>

        <div className={styles['financeGrid']}>
          <div className={styles['leftColumn']}>
            <section className={styles['walletCard']} aria-labelledby="wallet-balance-title">
              <div className={styles['walletCardTop']}>
                <span className={styles['walletIcon']}>
                  <CreditCardIcon size={16} aria-hidden="true" />
                </span>
                <span className={styles['walletStatus']}>{data.walletStatus}</span>
              </div>
              <span className={styles['walletLabel']} id="wallet-balance-title">
                Wallet Balance
              </span>
              <strong className={styles['walletBalance']}>{data.walletBalance}</strong>
              <div className={styles['walletBreakdown']}>
                <div>
                  <span>Pending</span>
                  <strong>{data.pendingBalance}</strong>
                </div>
                <div>
                  <span>Instant Available</span>
                  <strong>{data.instantAvailable}</strong>
                </div>
              </div>
            </section>

            <section className={styles['settingsCard']} aria-labelledby="finance-settings-title">
              <h2 id="finance-settings-title">Settings</h2>
              <div className={styles['settingsRows']}>
                <div>
                  <span>Country</span>
                  <strong>{data.country}</strong>
                </div>
                <div>
                  <span>Currency</span>
                  <strong>{data.currency}</strong>
                </div>
                <div>
                  <span>Statement Descriptor</span>
                  <strong>{data.statementDescriptor}</strong>
                </div>
                <div>
                  <span>Payout Schedule</span>
                  <strong>
                    {data.payoutSchedule}
                    <ChevronDownIcon size={13} aria-hidden="true" />
                  </strong>
                </div>
              </div>
            </section>

            <section className={styles['settingsCard']} aria-labelledby="bank-destinations-title">
              <div className={styles['sectionTitleRow']}>
                <h2 id="bank-destinations-title">{data.bankSectionTitle}</h2>
                <AddIcon size={16} aria-hidden="true" />
              </div>
              <Button
                className={styles['addBankButton']}
                variant="secondary"
                disabled
                title="Bank account setup requires the payout destination API."
              >
                {data.bankSetupLabel}
              </Button>
              <p>{data.bankSetupNote}</p>
            </section>
          </div>

          <section className={styles['payoutsCard']} aria-labelledby="promoter-payouts-title">
            <div className={styles['sectionTitleRow']}>
              <h2 id="promoter-payouts-title">{data.payoutsTitle}</h2>
              <RefreshIcon size={15} aria-hidden="true" />
            </div>
            <p className={styles['lastUpdated']}>Last updated {data.lastUpdated}</p>
            <div className={styles['emptyPayouts']} role="status">
              <strong>{data.emptyPayoutTitle}</strong>
              <span>{data.emptyPayoutDescription}</span>
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
