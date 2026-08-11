import { PartnersScreen } from '@/components/venue/screens/PartnersScreen';

import type { PartnersTab, PartnersView } from '@/components/venue/screens/PartnersScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Partners · Venue Studio' };

const parseTab = (value: string | string[] | undefined): PartnersTab =>
  value === 'promoters' || value === 'staff' ? value : 'hosts';

const parseView = (value: string | string[] | undefined): PartnersView =>
  value === 'find' ? 'find' : 'my';

export default async function VenuePartnersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <PartnersScreen tab={parseTab(params['tab'])} view={parseView(params['view'])} />;
}
