import { PartnerOrdersScreen } from '@/components/partner-shell/PartnerOrdersScreen';
import { formatInr } from '@/lib/partner/contracts';
import { partnerRepositories } from '@/lib/partner/repositories';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Orders · Finance · Host Studio' };

export default async function HostFinanceOrdersPage() {
  const overview = await partnerRepositories.host.getOverview();

  return (
    <PartnerOrdersScreen
      backHref="/host/finance"
      subtitle="Orders from your hosted events."
      scopeLabel="Hosted orders"
      kind="host"
      rows={overview.recentOrders.map((order) => ({
        id: order.id,
        event: order.eventName,
        createdAt: order.createdAt,
        ticketCount: order.ticketCount,
        total: formatInr(order.amountPaise),
        status:
          order.status === 'confirmed'
            ? 'Confirmed'
            : order.status === 'refunded'
              ? 'Refunded'
              : 'Pending',
      }))}
    />
  );
}
