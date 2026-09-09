import { notFound } from 'next/navigation';

import { PublicProfileView } from '@/features/profile/components/PublicProfileView';
import { findPublicProfileFixture } from '@/features/profile/fixtures/public-profile.fixture';
import { buildPrivateMetadata } from '@/lib/seo/metadata';
import { isProductionSeo } from '@/lib/seo/site';

import type { ProfileEventFilter } from '@/features/profile/types/profile.types';
import type { Metadata } from 'next';

interface PublicProfilePageProps {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ filter?: string | string[] }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveEventFilter(value: string | undefined): ProfileEventFilter {
  return value === 'attended' ? 'attended' : 'upcoming';
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  if (isProductionSeo()) notFound();
  const profile = findPublicProfileFixture(decodeURIComponent(userId));

  if (!profile) {
    return buildPrivateMetadata('Member unavailable', 'This C1RCLE member profile is unavailable.');
  }

  return buildPrivateMetadata('Member profile', 'View a C1RCLE member profile.');
}

export default async function PublicProfilePage({ params, searchParams }: PublicProfilePageProps) {
  const [{ userId }, query] = await Promise.all([params, searchParams]);
  if (isProductionSeo()) notFound();
  const profile = findPublicProfileFixture(decodeURIComponent(userId));

  if (!profile) notFound();

  return (
    <PublicProfileView
      activeFilter={resolveEventFilter(firstValue(query?.filter))}
      profile={profile}
    />
  );
}
