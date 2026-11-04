import { PartnerSettingsUnavailable } from '@/components/partner-v3/settings/PartnerSettingsUnavailable';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioSettingsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio === 'promoter') {
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Settings',
      'Promoter profile and payout settings are not connected to an authorized workspace model yet.',
    );
  }
  if (studio !== 'venue' && studio !== 'host') {
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Settings',
      'Settings are not available for this workspace.',
    );
  }
  return <PartnerSettingsUnavailable studio={studio} />;
}
