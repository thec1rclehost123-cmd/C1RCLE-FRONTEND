import { HostEventsScreen } from '@/components/host/HostEventsScreen';

export default async function HostEventsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const value = (await searchParams)['tab'];
  return <HostEventsScreen tab={typeof value === 'string' ? value : 'upcoming'} />;
}
