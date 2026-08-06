import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover events and nightlife experiences on THE C1RCLE.',
};

export default function ExplorePage() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 text-center">
      <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-4">
        EXPLORE
      </h1>
      <p className="text-sm font-medium text-white/50 uppercase tracking-widest">
        Coming Soon · THE C1RCLE Explore Experience
      </p>
    </div>
  );
}
