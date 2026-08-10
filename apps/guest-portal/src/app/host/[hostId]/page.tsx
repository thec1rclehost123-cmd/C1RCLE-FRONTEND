import { notFound } from 'next/navigation';

import { HostProfileView } from '@/features/directory/components/HostProfileView';
import {
  findHostPublicProfileFixture,
  hostPublicProfileFixtures,
} from '@/features/directory/fixtures/public-profile.fixture';

import type { Metadata } from 'next';

interface HostProfilePageProps {
  params: Promise<{ hostId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return hostPublicProfileFixtures.map((host) => ({ hostId: host.id }));
}

export async function generateMetadata({ params }: HostProfilePageProps): Promise<Metadata> {
  const { hostId } = await params;
  const host = findHostPublicProfileFixture(decodeURIComponent(hostId));

  if (!host) {
    return {
      title: 'Host unavailable | THE C1RCLE',
      description: 'This C1RCLE host profile is unavailable.',
      robots: { follow: false, index: false },
    };
  }

  return {
    title: `${host.hero.title} | THE C1RCLE`,
    description: host.bio,
    alternates: { canonical: `https://thec1rcle.com/host/${encodeURIComponent(host.id)}` },
    robots: { follow: false, index: false },
    openGraph: {
      title: host.hero.title,
      description: host.bio,
      images: [{ url: host.hero.cover.src, alt: host.hero.cover.alt }],
    },
  };
}

export default async function HostProfilePage({ params }: HostProfilePageProps) {
  const { hostId } = await params;
  const host = findHostPublicProfileFixture(decodeURIComponent(hostId));

  if (!host) notFound();

  return <HostProfileView host={host} />;
}
