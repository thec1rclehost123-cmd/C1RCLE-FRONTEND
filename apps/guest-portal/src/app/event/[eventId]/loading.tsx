export default function EventDetailLoading() {
  return (
    <main
      aria-label="Loading event"
      aria-busy="true"
      className="relative z-10 min-h-screen animate-pulse px-4 pb-36 pt-24 sm:px-6 sm:pt-28 lg:px-8"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="h-12 rounded-full bg-white/5" />
        <div className="mt-3 h-64 rounded-[1.75rem] bg-white/5" />
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-3">
            <div className="h-72 rounded-[1.75rem] bg-white/5" />
            <div className="h-64 rounded-[1.75rem] bg-white/5" />
          </div>
          <div className="aspect-[3/4] rounded-[1.75rem] bg-white/5" />
        </div>
      </div>
    </main>
  );
}
