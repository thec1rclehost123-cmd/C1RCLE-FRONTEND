import { FinanceScreen } from '@/components/venue/screens/FinanceScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Finance · Venue Studio' };

export default function VenueFinancePage() {
  return <FinanceScreen />;
}
