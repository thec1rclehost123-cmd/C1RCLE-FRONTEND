import { PartnerOrdersScreen } from '@/components/partner-shell/PartnerOrdersScreen';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Orders · Finance · Promoter Studio' };

export default async function PromoterFinanceOrdersPage() {
  const overview = await partnerRepositories.promoter.getOverview();

  return (
    <PartnerOrdersScreen
      backHref="/promoter/finance"
      subtitle="Orders attributed to your promoter links."
      scopeLabel="Attributed orders"
      kind="promoter"
      rows={overview.recentOrders.map((order) => ({
        id: order.id,
        event: order.eventName,
        createdAt: order.createdAt,
        source: order.channel,
        ticketCount: order.ticketCount,
        attributedEarnings: formatInr(order.commissionPaise),
        status: order.status === 'confirmed' ? 'Confirmed' : order.status === 'refunded' ? 'Refunded' : 'Pending',
      }))}
    />
  );
}
