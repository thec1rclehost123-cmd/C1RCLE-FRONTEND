import { PartnerSupportScreen } from '@/components/partner-support/PartnerSupportScreen';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Desk · Host Studio',
  description: 'Operations desk and support ticket management for event hosts.',
};

export default function HostSupportPage() {
  return <PartnerSupportScreen />;
}
