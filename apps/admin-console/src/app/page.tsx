import { OverviewDesk } from '@/components/admin/overview-desk';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Overview',
};

export default function OverviewPage() {
  return <OverviewDesk />;
}