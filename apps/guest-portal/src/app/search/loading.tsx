import {
  GuestSkeleton,
  PosterGridSkeleton,
  SkeletonBlock,
} from '@/components/loading/GuestSkeleton';

export default function SearchLoading() {
  return (
    <GuestSkeleton
      label="Loading search"
      className="min-h-[75vh] px-5 pb-24 pt-32 sm:px-8 sm:pt-36"
    >
      <SkeletonBlock className="mx-auto h-10 max-w-xl rounded-xl" />
      <SkeletonBlock className="mx-auto mt-7 h-16 max-w-3xl rounded-full" />
      <div className="mx-auto mt-14 max-w-[1500px]">
        <PosterGridSkeleton count={10} />
      </div>
    </GuestSkeleton>
  );
}
