import { formatInr, payouts } from '@/components/promoter/promoter-studio-model';
import {
  PromoterButton,
  PromoterPageHeader,
  StatusBadge,
} from '@/components/promoter/PromoterStudioUi';

export default function PayoutHistoryPage() {
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Settlements"
        title="Payout history"
        description="Completed and processing payouts are kept separate from your live finance overview."
        actions={<PromoterButton href="/promoter/finance">Finance overview</PromoterButton>}
      />
      <div className="pr-table-wrap">
        <table className="pr-table">
          <thead>
            <tr>
              <th>Payout</th>
              <th>Date</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td>
                  <strong>{payout.id}</strong>
                </td>
                <td>{payout.date}</td>
                <td>•••• 2481</td>
                <td>{formatInr(payout.amountPaise)}</td>
                <td>
                  <StatusBadge state="paid" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
