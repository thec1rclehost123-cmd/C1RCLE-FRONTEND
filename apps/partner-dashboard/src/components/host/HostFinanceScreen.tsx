import { PartnerFinanceScreen } from '@/components/partner-shell/PartnerFinanceScreen';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

import { mapHostPayoutAccount, mapHostPayoutHistory } from './host-finance-mapping';

export async function HostFinanceScreen() {
  const finance = await partnerRepositories.host.getFinance();
  const account = mapHostPayoutAccount(finance.payoutAccount);

  return (
    <PartnerFinanceScreen
      subtitle="Your Host earnings and payouts."
      available={formatInr(finance.availablePaise)}
      availableDetail="Ready for next payout"
      account={account}
      pending={formatInr(finance.pendingPaise)}
      nextPayout={finance.nextPayout}
      ordersHref="/host/finance/orders"
      history={mapHostPayoutHistory(finance)}
    />
  );
}
