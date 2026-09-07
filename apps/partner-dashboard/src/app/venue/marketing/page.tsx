import { MarketingScreen } from '@/components/venue/screens/MarketingScreen';

import type { MarketingTab } from '@/components/venue/screens/MarketingScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Marketing · Venue Studio' };

const parseTab = (value: string | string[] | undefined): MarketingTab =>
  value === 'history' || value === 'templates' ? value : 'compose';

export default async function VenueMarketingPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const template = typeof params['template'] === 'string' ? params['template'] : null;
  return <MarketingScreen tab={parseTab(params['tab'])} templateId={template} />;
}
