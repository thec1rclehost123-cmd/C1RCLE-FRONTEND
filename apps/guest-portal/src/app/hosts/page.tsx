import { DirectoryLanding } from '@/features/directory/components/DirectoryLanding';
import { buildPublicMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    path: '/hosts',
    title: 'Hosts and Venues',
    description: 'Discover public hosts and venues on THE C1RCLE.',
    // Public list contracts do not yet expose verified/indexable entity states.
    indexable: false,
  });
}

export default function HostsPage() {
  return <DirectoryLanding hosts={[]} venues={[]} />;
}
