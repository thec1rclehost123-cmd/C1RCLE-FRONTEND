import { HomeAppReview } from '@/features/home/components/HomeAppReview';
import { HomePhoneStoryClient } from '@/features/home/components/HomePhoneStoryClient';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'THE C1RCLE App | Discover Life Offline',
  description: 'Get THE C1RCLE Mobile App for iOS and Android. Discover events, get on guest lists, and walk right in.',
};

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
