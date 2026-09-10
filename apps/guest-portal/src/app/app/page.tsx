import { HomeAppReview } from '@/features/home/components/HomeAppReview';
import { HomePhoneStoryClient } from '@/features/home/components/HomePhoneStoryClient';
import { buildPublicMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    path: '/app',
    title: 'THE C1RCLE App',
    description: 'Discover how THE C1RCLE helps members find events, guest lists, and experiences.',
  });
}

export default function AppPage() {
  return (
    <div className="relative z-10 bg-black text-white pt-16">
      {/* Interactive Sticky Phone Story & Features */}
      <HomePhoneStoryClient />

      {/* App Review Quote, Download Links & Party Video */}
      <HomeAppReview />
    </div>
  );
}
