import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download App',
  description: 'Get THE C1RCLE Mobile App for iOS and Android.',
};

export default function AppPage() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 text-center">
      <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-4">
        THE C1RCLE APP
      </h1>
      <p className="text-sm font-medium text-white/50 uppercase tracking-widest">
        Discover Life Offline · Mobile App Experience
      </p>
    </div>
  );
}
