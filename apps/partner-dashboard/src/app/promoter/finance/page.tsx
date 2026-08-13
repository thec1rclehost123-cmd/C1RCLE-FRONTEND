import Link from 'next/link';

import { anonymousOrders, formatInr } from '@/components/promoter/promoter-studio-model';
import { UnavailableAction } from '@/components/promoter/PromoterStudioActions';
import {
  MetricStrip,
  PromoterButton,
  PromoterPageHeader,
  StatusBadge,
} from '@/components/promoter/PromoterStudioUi';

export default function FinancePage() {
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Private workspace"
        title="Finance"
        description="Commission balances and event-level adjustments. Attendee identities are never exposed."
        actions={
          <>
            <PromoterButton href="/promoter/finance/payouts">Payout history</PromoterButton>
            <UnavailableAction
              label="Request payout"
              title="Payout request unavailable"
              description="The payout write adapter is not connected. Your available balance remains unchanged and no request was submitted."
            />
          </>
        }
      />
      <section className="pr-balance-card">
        <span>Available commission</span>
        <strong>{formatInr(1864000)}</strong>
        <p>Eligible to request · payout account ending 2481</p>
        <div>
          <span>
            Pending clearance <b>{formatInr(724000)}</b>
          </span>
          <span>
            Lifetime commission <b>{formatInr(12486000)}</b>
          </span>
        </div>
      </section>
      <MetricStrip
        items={[
          { label: 'This month', value: formatInr(5866000), detail: 'Across 2 active links' },
          { label: 'Pending refunds', value: formatInr(12000), detail: '1 attributed order' },
          { label: 'Next settlement', value: '24 Jul', detail: 'After refund windows close' },
        ]}
      />
      <section className="pr-section">
        <header>
          <div>
            <span className="pr-eyebrow">Commission ledger</span>
            <h2>Recent adjustments</h2>
          </div>
        </header>
        <div className="pr-table-wrap">
          <table className="pr-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Tickets</th>
                <th>Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {anonymousOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>Order #{order.id}</strong>
                    <small>Guest details private</small>
                  </td>
                  <td>{order.createdAt}</td>
                  <td>{order.tickets}</td>
                  <td>{formatInr(order.commissionPaise)}</td>
                  <td>
                    <StatusBadge state={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="pr-footnote">
        Need help with a settlement? <Link href="/support">Open support</Link> with the anonymous
        order reference.
      </p>
    </div>
  );
}
