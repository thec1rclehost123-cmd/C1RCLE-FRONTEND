import { buildPublicMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    path: '/terms',
    title: 'Terms of Service',
    description: 'Terms information for THE C1RCLE.',
    indexable: false,
  });
}

export default function TermsPage() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 text-center">
      <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-4">
        TERMS OF SERVICE
      </h1>
      <p className="text-sm font-medium text-white/50 uppercase tracking-widest">
        THE C1RCLE Terms & Conditions
      </p>
    </div>
  );
}
