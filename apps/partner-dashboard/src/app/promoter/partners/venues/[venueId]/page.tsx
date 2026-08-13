import { PromoterPartnerProfilePage } from '@/components/promoter/PromoterPartnerProfilePage';

export default async function VenueProfilePage({
  params,
}: {
  readonly params: Promise<{ venueId: string }>;
}) {
  return <PromoterPartnerProfilePage id={(await params).venueId} kind="venue" />;
}
