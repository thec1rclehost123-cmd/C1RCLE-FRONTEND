export default function PublicProfileLoading() {
  return (
    <div className="relative z-10 min-h-screen px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8">
      <div className="mx-auto max-w-[1280px] animate-pulse motion-reduce:animate-none">
        <div className="h-11 w-28 rounded-full bg-white/[0.05]" />
        <div className="mt-5 h-[30rem] rounded-[2rem] border border-white/10 bg-white/[0.035] sm:h-[20rem]" />
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="h-64 rounded-[1.75rem] bg-white/[0.035]" />
          <div className="h-64 rounded-[1.75rem] bg-white/[0.025]" />
        </div>
      </div>
    </div>
  );
}
