export function PrivateDataUnavailable({ title }: { readonly title: string }) {
  return (
    <section className="relative z-10 mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center px-6 py-32 text-center text-white">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6842]">
        Secure account
      </p>
      <h1 className="mt-5 text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-7xl">
        {title}
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-7 text-white/50">
        This authenticated view is unavailable until its backend data contract is connected.
      </p>
    </section>
  );
}
