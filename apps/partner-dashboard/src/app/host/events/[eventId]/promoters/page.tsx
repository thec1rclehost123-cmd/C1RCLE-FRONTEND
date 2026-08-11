import { HostEventPromotersScreen } from '@/components/host/HostEventDetailScreen';

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly eventId: string }>;
}) {
  return <HostEventPromotersScreen id={(await params).eventId} />;
}
