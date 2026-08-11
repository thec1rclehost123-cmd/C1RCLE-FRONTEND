import { HostSlotRequestScreen } from '@/components/host/HostWorkflowScreens';

export default async function HostSlotRequestPage({
  params,
}: {
  readonly params: Promise<{ readonly requestId: string }>;
}) {
  return <HostSlotRequestScreen id={(await params).requestId} />;
}
