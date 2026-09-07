import { PartnersScreen } from '@/components/venue/screens/PartnersScreen';

import type { PartnersTab } from '@/components/venue/screens/PartnersScreen';
import type {
  PartnershipRequestDirection,
  VenuePartnerKind,
} from '@/components/venue/venue-partners-model';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Partnerships · Venue Studio' };

const parseTab = (value: string | string[] | undefined): PartnersTab =>
  value === 'requests' || value === 'discover' ? value : 'connected';

const parseSegment = (value: string | string[] | undefined): VenuePartnerKind =>
  value === 'promoter' ? 'promoter' : 'host';

const parseRequestView = (value: string | string[] | undefined): PartnershipRequestDirection =>
  value === 'sent' ? 'sent' : 'received';

export default async function VenuePartnersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <PartnersScreen
      tab={parseTab(params['tab'])}
      segment={parseSegment(params['view'])}
      requestView={parseRequestView(params['requestView'])}
    />
  );
}
