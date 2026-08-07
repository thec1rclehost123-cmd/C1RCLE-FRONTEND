export default function ConfirmationLoading() {
  return (
    <div className="min-h-screen bg-[#080808] px-4 pb-32 pt-28 text-white sm:px-6">
      <div className="mx-auto max-w-[980px] animate-pulse motion-reduce:animate-none">
        <div className="mx-auto h-64 max-w-2xl rounded-[2rem] bg-white/[0.035]" />
        <div className="mt-8 min-h-[520px] rounded-[2rem] border border-white/10 bg-white/[0.035]" />
      </div>
    </div>
  );
}
