import { DirectoryLanding } from '@/features/directory/components/DirectoryLanding';
import {
  hostDirectoryFixtures,
  venueDirectoryFixtures,
} from '@/features/directory/fixtures/directory.fixture';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hosts & Venues | THE C1RCLE',
  description: 'Meet the hosts shaping the calendar and the venues powering the C1RCLE circuit.',
  alternates: { canonical: 'https://thec1rcle.com/hosts' },
  robots: { follow: false, index: false },
};

export default function HostsPage() {
  return <DirectoryLanding hosts={hostDirectoryFixtures} venues={venueDirectoryFixtures} />;
}
