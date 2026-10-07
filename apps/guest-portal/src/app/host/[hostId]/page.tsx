import { notFound } from 'next/navigation';

import { AuthoritativeHostView } from '@/features/directory/components/AuthoritativePublicEntityView';
import { HostProfileView } from '@/features/directory/components/HostProfileView';
import { findHostPublicProfileFixture } from '@/features/directory/fixtures/public-profile.fixture';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { getPublicHostForSeo, isEligiblePublicHost } from '@/lib/seo/public-data';
import { isProductionSeo } from '@/lib/seo/site';

import type { Metadata } from 'next';

interface HostProfilePageProps {
  params: Promise<{ hostId: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: HostProfilePageProps): Promise<Metadata> {
  const { hostId } = await params;
  const slug = decodeURIComponent(hostId);
  const authoritativeHost = await getPublicHostForSeo(slug);
  if (authoritativeHost !== null) {
    return buildPublicMetadata({
      path: `/host/${encodeURIComponent(authoritativeHost.slug)}`,
      title: authoritativeHost.name,
      description: `Events and experiences from ${authoritativeHost.name}.`,
      indexable: isEligiblePublicHost(authoritativeHost),
    });
  }

  if (isProductionSeo()) notFound();

  const host = findHostPublicProfileFixture(slug);

  if (!host) {
    return buildPublicMetadata({
      path: `/host/${encodeURIComponent(slug)}`,
      title: 'Host unavailable',
      description: 'This C1RCLE host profile is unavailable.',
      indexable: false,
    });
  }

  return buildPublicMetadata({
    path: `/host/${encodeURIComponent(host.id)}`,
    title: host.hero.title,
    description: host.bio,
    image: host.hero.cover.src,
    indexable: false,
  });
}

export default async function HostProfilePage({ params }: HostProfilePageProps) {
  const { hostId } = await params;
  const slug = decodeURIComponent(hostId);
  const authoritativeHost = await getPublicHostForSeo(slug);
  if (authoritativeHost !== null) return <AuthoritativeHostView host={authoritativeHost} />;
  const host = isProductionSeo() ? undefined : findHostPublicProfileFixture(slug);

  if (!host) notFound();

  return <HostProfileView host={host} />;
}
