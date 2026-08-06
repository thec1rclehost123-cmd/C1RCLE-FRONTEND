import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hosts',
  description: 'Meet premier hosts and venues on THE C1RCLE.',
};

export default function HostsPage() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 text-center">
      <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-4">
        HOSTS
      </h1>
      <p className="text-sm font-medium text-white/50 uppercase tracking-widest">
        Coming Soon · THE C1RCLE Premier Hosts & Venues
      </p>
    </div>
  );
}
