import { EmptyState } from '@/components/partner-v3/States';

export default function PartnerNotFound() {
  return (
    <EmptyState
      title="Partner route not found"
      description="Choose a supported Venue, Host or Promoter workspace from the Partner entry point."
    />
  );
}
