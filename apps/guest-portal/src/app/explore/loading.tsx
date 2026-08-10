export default function ExploreLoading() {
  return (
    <div
      aria-label="Loading events"
      aria-busy="true"
      className="relative z-10 min-h-screen animate-pulse px-4 pb-24 pt-24 sm:px-6 md:pb-0 md:pt-28 lg:px-8"
    >
      <div className="min-h-[34rem] rounded-[2rem] border border-white/10 bg-white/5 sm:min-h-[38rem] lg:min-h-[42rem]" />
      <div className="mx-auto mt-10 max-w-[1400px]">
        <div className="h-14 max-w-4xl rounded-full bg-white/5" />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="aspect-[4/5] rounded-[1.75rem] bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
