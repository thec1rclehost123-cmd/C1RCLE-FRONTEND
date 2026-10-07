import { DirectoryLanding } from '@/features/directory/components/DirectoryLanding';
import {
  hostDirectoryFixtures,
  venueDirectoryFixtures,
} from '@/features/directory/fixtures/directory.fixture';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { isProductionSeo } from '@/lib/seo/site';

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
  const production = isProductionSeo();
  return (
    <DirectoryLanding
      hosts={production ? [] : hostDirectoryFixtures}
      venues={production ? [] : venueDirectoryFixtures}
    />
  );
}
