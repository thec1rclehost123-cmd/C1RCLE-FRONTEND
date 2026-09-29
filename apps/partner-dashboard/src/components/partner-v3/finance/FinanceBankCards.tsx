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
            {/* Masked, and it stays masked: the API returns a
                `maskedAccountNumber` and never the real number, so there is
                nothing to reveal here even in principle. */}
            Account number
            <input value={data.bankAccount.displayNumber} readOnly />
          </label>
          <label>
            IFSC Code
            <input value={data.bankAccount.ifscCode} readOnly />
          </label>
          {!data.bankAccount.verified ? (
            <p className={styles['accountNote']}>
              <BankIcon size={16} aria-hidden="true" /> This account is awaiting verification —
              payouts to it will not settle until it clears.
            </p>
          ) : null}
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

      {data.paymentCard ? (
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
      ) : (
        /* The honest branch. There is no card on file because nothing in the
           system stores one: platform fees are collected by Razorpay in a hosted
           field and tokenized there, and a card number or CVC must never transit
           or rest in this app. The previous version of this panel always
           rendered a card from the fixture, which read as a real saved card to
           anyone looking at the screen. */
        <section className={styles['accountPanel']} aria-labelledby="payment-card-title">
          <h2 id="payment-card-title">Payment card</h2>
          <p>For platform fees and ads.</p>
          <div className={styles['accountForm']}>
            <p className={styles['accountNote']}>
              <BankIcon size={16} aria-hidden="true" /> No card on file. Platform fees and ad spend
              are charged to the card you enter at checkout — we never store its number.
            </p>
          </div>
        </section>
      )}

      <div className={styles['accountNote']}>
        <BankIcon size={16} aria-hidden="true" /> Account changes are read-only until the finance
        contract is connected.
      </div>
    </div>
  );
}
