import { renderStudioSkeleton } from '../route-helpers';

export default async function StudioLeaderboardPage({
  params,
}: {
  readonly params: Promise<{ studio: string }>;
}) {
  const { studio } = await params;
  return renderStudioSkeleton(
    Promise.resolve({ studio }),
    'Leaderboard',
    studio === 'promoter'
      ? 'A promoter leaderboard would require an approved, tenant-scoped ranking definition. It is not available in Milestone 3.'
      : 'Leaderboard data is not available for this workspace.',
  );
}
