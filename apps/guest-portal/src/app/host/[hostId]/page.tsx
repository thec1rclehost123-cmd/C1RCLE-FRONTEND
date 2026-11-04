import { notFound } from 'next/navigation';

import { AuthoritativeHostView } from '@/features/directory/components/AuthoritativePublicEntityView';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { getPublicHostForSeo, isEligiblePublicHost } from '@/lib/seo/public-data';

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

  notFound();
}

export default async function HostProfilePage({ params }: HostProfilePageProps) {
  const { hostId } = await params;
  const slug = decodeURIComponent(hostId);
  const authoritativeHost = await getPublicHostForSeo(slug);
  if (authoritativeHost !== null) return <AuthoritativeHostView host={authoritativeHost} />;
  notFound();
}
