export default function SearchLoading() {
  return (
    <main
      aria-label="Loading search"
      aria-busy="true"
      className="min-h-[75vh] animate-pulse px-5 pb-24 pt-32 sm:px-8 sm:pt-36"
    >
      <div className="mx-auto h-10 max-w-xl rounded-xl bg-white/10" />
      <div className="mx-auto mt-7 h-16 max-w-3xl rounded-full bg-white/[0.07]" />
      <div className="mx-auto mt-14 grid max-w-[1500px] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="aspect-[4/5] rounded-2xl bg-white/[0.06]" />
        ))}
      </div>
    </main>
  );
}
