import { PartnerWorkspaceSettings } from '@/components/partner-v3/settings/PartnerWorkspaceSettings';

import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioSettingsPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  if (studio !== 'venue' && studio !== 'host') {
    if (studio === 'promoter') return <PartnerWorkspaceSettings studio="promoter" />;
    return renderStudioSkeleton(
      Promise.resolve({ studio }),
      'Settings',
      'Settings are not available for this workspace.',
    );
  }
  return <PartnerWorkspaceSettings studio={studio} />;
}
