import { GuestSkeleton, SkeletonBlock } from '@/components/loading/GuestSkeleton';

export default function EventLoading() {
  return (
    <GuestSkeleton
      label="Loading event details"
      className="min-h-screen px-5 pb-40 pt-24 sm:px-8 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1360px] gap-7 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:gap-12">
        <div className="space-y-5 pt-4">
          <SkeletonBlock className="h-3 w-40 rounded" />
          <SkeletonBlock className="h-20 max-w-2xl rounded-xl" />
          <SkeletonBlock className="h-16 max-w-xl rounded-xl" />
          <SkeletonBlock className="h-44 max-w-2xl rounded-2xl" />
        </div>
        <SkeletonBlock className="aspect-[4/5] w-full rounded-[1.5rem]" />
      </div>
    </GuestSkeleton>
  );
}
