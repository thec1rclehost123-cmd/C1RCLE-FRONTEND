import { GuestSkeleton, SkeletonBlock } from '@/components/loading/GuestSkeleton';

export default function TicketsLoading() {
  return (
    <GuestSkeleton
      label="Loading your tickets"
      className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-32 sm:px-8"
    >
      <SkeletonBlock className="mx-auto h-11 w-52 rounded-xl" />
      <SkeletonBlock className="ml-auto mt-6 h-12 w-full rounded-full sm:w-72" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonBlock key={index} className="aspect-[3/4] rounded-[1.5rem]" />
        ))}
      </div>
    </GuestSkeleton>
  );
}
