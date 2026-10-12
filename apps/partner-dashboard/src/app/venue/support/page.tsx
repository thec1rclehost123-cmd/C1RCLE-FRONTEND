import { PartnerSupportScreen } from '@/components/partner-support/PartnerSupportScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Desk · Venue Studio',
  description: 'Operations desk and support ticket management for venue partners.',
};

export default function VenueSupportPage() {
  return <PartnerSupportScreen />;
}
