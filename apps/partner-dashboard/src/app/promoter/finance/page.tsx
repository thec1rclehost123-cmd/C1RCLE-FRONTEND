import {
  PartnerFinanceScreen,
  type PartnerFinanceSecondarySection,
} from '@/components/partner-shell/PartnerFinanceScreen';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

export default async function PromoterFinancePage() {
  const [finance, links] = await Promise.all([
    partnerRepositories.promoter.getFinance(),
    partnerRepositories.promoter.getLinks(),
  ]);
  const payoutAccountParts = finance.payoutAccount.match(/^(.*?)\s+(••\S+)$/);
  const secondarySections: readonly PartnerFinanceSecondarySection[] = [
    {
      title: 'Campaign earnings',
      description: 'Commission totals by tracked campaign.',
      columns: ['Event', 'Source', 'Status', 'Purchases', 'Earnings'],
      rows: links.map((link) => ({
        id: link.id,
        cells: [
          { value: link.eventName, emphasis: true },
          { value: `${link.channel} · ${link.label}` },
          { value: link.status, tone: link.status === 'active' ? 'positive' : 'warning' },
          { value: String(link.purchases) },
          { value: formatInr(link.earningsPaise), emphasis: true },
        ],
      })),
    },
    {
      title: 'Adjustments',
      description: 'Refund reversals and campaign bonuses.',
      columns: ['Event', 'Date', 'Detail', 'Amount'],
      rows: finance.adjustments.map((adjustment) => ({
        id: adjustment.id,
        cells: [
          { value: adjustment.eventName, emphasis: true },
          { value: adjustment.date },
          { value: adjustment.label },
          {
            value: formatInr(adjustment.amountPaise),
            tone: adjustment.amountPaise < 0 ? 'negative' : 'positive',
            emphasis: true,
          },
        ],
      })),
    },
  ];

  return (
    <PartnerFinanceScreen
      subtitle="Your commissions and payouts."
      available={formatInr(finance.availablePaise)}
      availableDetail="Eligible for payout"
      account={{
        display: finance.payoutAccount,
        ...(payoutAccountParts
          ? { bankName: payoutAccountParts[1], maskedAccount: payoutAccountParts[2] }
          : {}),
        status:
          finance.kycStatus === 'verified'
            ? 'Verified'
            : finance.kycStatus === 'pending'
              ? 'Pending'
              : 'Required',
      }}
      pending={formatInr(finance.pendingPaise)}
      nextPayout={finance.nextPayout}
      ordersHref="/promoter/finance/orders"
      history={finance.payouts.map((payout) => ({
        id: payout.id,
        date: payout.date,
        status: payout.status.charAt(0).toUpperCase() + payout.status.slice(1),
        amount: formatInr(payout.amountPaise),
      }))}
      secondarySections={secondarySections}
    />
  );
}
