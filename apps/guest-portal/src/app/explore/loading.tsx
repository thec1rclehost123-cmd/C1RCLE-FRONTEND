import {
  GuestSkeleton,
  PosterGridSkeleton,
  SkeletonBlock,
} from '@/components/loading/GuestSkeleton';

export default function ExploreLoading() {
  return (
    <GuestSkeleton
      label="Loading events"
      className="min-h-screen px-4 pb-24 pt-24 sm:px-6 md:pb-0 md:pt-28 lg:px-8"
    >
      <SkeletonBlock className="min-h-[34rem] rounded-[2rem] border border-white/10 sm:min-h-[38rem] lg:min-h-[42rem]" />
      <div className="mx-auto mt-10 max-w-[1400px]">
        <SkeletonBlock className="h-14 max-w-4xl rounded-full" />
        <div className="mt-14">
          <PosterGridSkeleton />
        </div>
      </div>
    </GuestSkeleton>
  );
}
