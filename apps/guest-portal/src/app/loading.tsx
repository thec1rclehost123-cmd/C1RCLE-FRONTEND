import {
  GuestSkeleton,
  PosterGridSkeleton,
  SkeletonBlock,
} from '@/components/loading/GuestSkeleton';

export default function HomeLoading() {
  return (
    <GuestSkeleton label="Loading C1RCLE events" className="min-h-screen pb-24">
      <SkeletonBlock className="h-[82svh] min-h-[520px] w-full" />
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
        <SkeletonBlock className="h-9 w-64 rounded-lg" />
        <div className="mt-8">
          <PosterGridSkeleton />
        </div>
      </div>
    </GuestSkeleton>
  );
}
