import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioLinksPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Promotion links',
    studio === 'promoter'
      ? 'Referral-link management is not connected to an authorized promoter workspace yet. No link metrics are shown.'
      : 'Promotion links are not available for this workspace.',
  );
}
