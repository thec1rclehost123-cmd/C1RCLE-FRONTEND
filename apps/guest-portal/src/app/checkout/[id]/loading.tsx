export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-32 pt-28 text-white sm:px-6">
      <div className="mx-auto grid max-w-[1180px] animate-pulse gap-3 lg:grid-cols-[minmax(0,1fr)_390px] motion-reduce:animate-none">
        <div className="min-h-[620px] rounded-[1.75rem] border border-white/10 bg-white/[0.035]" />
        <div className="min-h-[520px] rounded-[1.75rem] border border-white/10 bg-white/[0.035]" />
      </div>
    </main>
  );
}
