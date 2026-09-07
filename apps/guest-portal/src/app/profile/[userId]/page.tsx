import { notFound } from 'next/navigation';

import { PublicProfileView } from '@/features/profile/components/PublicProfileView';
import {
  findPublicProfileFixture,
  publicProfileFixtures,
} from '@/features/profile/fixtures/public-profile.fixture';

import type { ProfileEventFilter } from '@/features/profile/types/profile.types';
import type { Metadata } from 'next';

interface PublicProfilePageProps {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ filter?: string | string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return publicProfileFixtures.map((profile) => ({ userId: profile.identity.id }));
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveEventFilter(value: string | undefined): ProfileEventFilter {
  return value === 'attended' ? 'attended' : 'upcoming';
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const profile = findPublicProfileFixture(decodeURIComponent(userId));

  if (!profile) {
    return {
      title: 'Member unavailable | THE C1RCLE',
      description: 'This C1RCLE member profile is unavailable.',
      robots: { follow: false, index: false },
    };
  }

  return {
    title: `${profile.identity.displayName} | THE C1RCLE`,
    description: profile.identity.bio,
    alternates: {
      canonical: `https://thec1rcle.com/profile/${encodeURIComponent(profile.identity.id)}`,
    },
    robots: { follow: false, index: false },
  };
}

export default async function PublicProfilePage({ params, searchParams }: PublicProfilePageProps) {
  const [{ userId }, query] = await Promise.all([params, searchParams]);
  const profile = findPublicProfileFixture(decodeURIComponent(userId));

  if (!profile) notFound();

  return (
    <PublicProfileView
      activeFilter={resolveEventFilter(firstValue(query?.filter))}
      profile={profile}
    />
  );
}
