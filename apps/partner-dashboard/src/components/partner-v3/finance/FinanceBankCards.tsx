import { BankIcon } from '@c1rcle/icons';

import { Button } from '@/components/partner-v3/Button';

import styles from './finance.module.css';

import type { PartnerFinanceData } from '@/data/partner-data-source';

export function FinanceBankCards({ data }: { readonly data: PartnerFinanceData }) {
  return (
    <div className={styles['accountGrid']}>
      <section className={styles['accountPanel']} aria-labelledby="bank-account-title">
        <h2 id="bank-account-title">Bank account</h2>
        <p>Where your payouts land.</p>
        <div className={styles['accountForm']}>
          <label>
            Account holder name
            <input value={data.bankAccount.accountHolder} readOnly />
          </label>
          <label>
            Account number
            <input value={data.bankAccount.accountNumber} readOnly />
          </label>
          <label>
            IFSC Code
            <input value={data.bankAccount.ifscCode} readOnly />
          </label>
          <Button
            className={styles['unavailableSave']}
            variant="primary"
            disabled
            title="Bank account changes require the payout account mutation API."
          >
            Save bank details
          </Button>
        </div>
      </section>

      <section className={styles['accountPanel']} aria-labelledby="payment-card-title">
        <h2 id="payment-card-title">Payment card</h2>
        <p>For platform fees and ads.</p>
        <div className={styles['paymentCard']}>
          <span>{data.paymentCard.label}</span>
          <strong>{data.paymentCard.displayNumber}</strong>
          <div>
            <span>{data.paymentCard.holder}</span>
            <span>{data.paymentCard.expiry}</span>
          </div>
        </div>
        <div className={styles['accountForm']}>
          <label>
            Card number
            <input value={data.paymentCard.cardNumber} readOnly />
          </label>
          <div className={styles['accountFormRow']}>
            <label>
              Expiry (MM/YY)
              <input value={data.paymentCard.expiry} readOnly />
            </label>
            <label>
              CVV
              <input value={data.paymentCard.cvv} readOnly />
            </label>
          </div>
        </div>
      </section>

      <div className={styles['accountNote']}>
        <BankIcon size={16} aria-hidden="true" /> Account changes are read-only until the finance
        contract is connected.
      </div>
    </div>
  );
}
