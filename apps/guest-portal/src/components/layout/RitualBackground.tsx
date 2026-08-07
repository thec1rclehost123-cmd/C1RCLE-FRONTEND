// FIXTURE_ONLY: Temporary UI development ritual background.

export function RitualBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-black pointer-events-none selection:bg-[#FF4400]/30">
      {/* Central Brand Symbol Outer Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vh] h-[120vh]">
        <div className="absolute inset-0 rounded-full border border-[#FF4400]/10 shadow-[inner_0_0_100px_rgba(255,68,0,0.05)] sm:animate-[spin_60s_linear_infinite] motion-reduce:animate-none" />
        <div className="absolute inset-[10%] rounded-full border border-[#FF4400]/5 sm:animate-[spin_90s_linear_infinite_reverse] motion-reduce:animate-none" />
      </div>

      {/* Shifting Glow Orbs */}
      <div className="absolute -left-[10%] -top-[10%] h-[60%] w-[60%] rounded-full bg-[#FF4400]/15 blur-[80px] sm:animate-pulse sm:blur-[140px] motion-reduce:animate-none" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-[#FF4400]/10 blur-[70px] sm:animate-pulse sm:blur-[120px] motion-reduce:animate-none" />

      {/* Floating Particles */}
      <div className="absolute inset-0 hidden sm:block">
        <div className="absolute top-[15%] left-[20%] h-1 w-1 bg-white/40 rounded-full blur-[1px] animate-ping motion-reduce:animate-none" />
        <div className="absolute top-[35%] left-[75%] h-1 w-1 bg-white/40 rounded-full blur-[1px] animate-ping motion-reduce:animate-none" />
        <div className="absolute top-[60%] left-[10%] h-1 w-1 bg-white/40 rounded-full blur-[1px] animate-ping motion-reduce:animate-none" />
        <div className="absolute top-[80%] left-[85%] h-1 w-1 bg-white/40 rounded-full blur-[1px] animate-ping motion-reduce:animate-none" />
        <div className="absolute top-[45%] left-[50%] h-1 w-1 bg-white/40 rounded-full blur-[1px] animate-ping motion-reduce:animate-none" />
      </div>

      {/* Global Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
    </div>
  );
}
