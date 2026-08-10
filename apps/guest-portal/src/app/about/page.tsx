import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About THE C1RCLE — Discover Life Offline.',
};

export default function AboutPage() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 text-center">
      <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-4">
        ABOUT THE C1RCLE
      </h1>
      <p className="text-sm font-medium text-white/50 uppercase tracking-widest">
        Discover Life Offline
      </p>
    </div>
  );
}
