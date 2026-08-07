import { notFound } from 'next/navigation';

import { HostProfileView } from '@/features/directory/components/HostProfileView';
import {
  findHostDirectoryFixture,
  hostDirectoryFixtures,
} from '@/features/directory/fixtures/directory.fixture';

import type { Metadata } from 'next';

interface HostProfilePageProps {
  params: Promise<{ hostId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return hostDirectoryFixtures.map((host) => ({ hostId: host.id }));
}

export async function generateMetadata({ params }: HostProfilePageProps): Promise<Metadata> {
  const { hostId } = await params;
  const host = findHostDirectoryFixture(decodeURIComponent(hostId));

  if (!host) {
    return {
      title: 'Host unavailable | THE C1RCLE',
      description: 'This C1RCLE host profile is unavailable.',
      robots: { follow: false, index: false },
    };
  }

  return {
    title: `${host.name} | THE C1RCLE`,
    description: host.bio,
    alternates: { canonical: `https://thec1rcle.com/host/${encodeURIComponent(host.id)}` },
    robots: { follow: false, index: false },
    openGraph: {
      title: host.name,
      description: host.bio,
      images: [{ url: host.coverImage, alt: host.name }],
    },
  };
}

export default async function HostProfilePage({ params }: HostProfilePageProps) {
  const { hostId } = await params;
  const host = findHostDirectoryFixture(decodeURIComponent(hostId));

  if (!host) notFound();

  return <HostProfileView host={host} />;
}
