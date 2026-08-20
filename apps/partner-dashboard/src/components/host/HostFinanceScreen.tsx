import { hostPayouts } from './host-studio-model';
import { PartnerFinanceScreen } from '@/components/partner-shell/PartnerFinanceScreen';

const hostPayoutHistory = [...hostPayouts].sort(
  ([leftDate], [rightDate]) => new Date(rightDate).getTime() - new Date(leftDate).getTime(),
);

export function HostFinanceScreen() {
  return <PartnerFinanceScreen
    subtitle="Your Host earnings and payouts."
    available="₹83,200"
    availableDetail="Ready for next payout"
    account={{
      display: 'HDFC Bank',
      bankName: 'HDFC Bank',
      maskedAccount: '••4412',
      accountHolder: 'Rhea Kapoor',
      status: 'Verified',
      manageHref: '/host/settings?tab=payout',
    }}
    pending="₹51,400"
    nextPayout="Fri, 18 Jul"
    ordersHref="/host/finance/orders"
    history={hostPayoutHistory.map(([date, event, status, amount]) => ({
      id: `${date}-${event}`,
      date,
      event,
      status,
      amount,
    }))}
  />;
}
