import { notFound } from 'next/navigation';

import { AuthoritativeVenueView } from '@/features/directory/components/AuthoritativePublicEntityView';
import { VenueProfileView } from '@/features/directory/components/VenueProfileView';
import { findVenuePublicProfileFixture } from '@/features/directory/fixtures/public-profile.fixture';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { getPublicVenueForSeo, isEligiblePublicVenue } from '@/lib/seo/public-data';
import { isProductionSeo } from '@/lib/seo/site';

import type { Metadata } from 'next';

interface VenueProfilePageProps {
  params: Promise<{ venueId: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: VenueProfilePageProps): Promise<Metadata> {
  const { venueId } = await params;
  const slug = decodeURIComponent(venueId);
  const authoritativeVenue = await getPublicVenueForSeo(slug);
  if (authoritativeVenue !== null) {
    return buildPublicMetadata({
      path: `/venue/${encodeURIComponent(authoritativeVenue.slug)}`,
      title: authoritativeVenue.name,
      description: authoritativeVenue.description,
      image: authoritativeVenue.photoUrl,
      indexable: isEligiblePublicVenue(authoritativeVenue),
    });
  }

  if (isProductionSeo()) notFound();

  const venue = findVenuePublicProfileFixture(slug);

  if (!venue) {
    return buildPublicMetadata({
      path: `/venue/${encodeURIComponent(slug)}`,
      title: 'Venue unavailable',
      description: 'This C1RCLE venue profile is unavailable.',
      indexable: false,
    });
  }

  return buildPublicMetadata({
    path: `/venue/${encodeURIComponent(venue.id)}`,
    title: venue.hero.title,
    description: venue.hero.subtitle,
    image: venue.hero.cover.src,
    indexable: false,
  });
}

export default async function VenueProfilePage({ params }: VenueProfilePageProps) {
  const { venueId } = await params;
  const slug = decodeURIComponent(venueId);
  const authoritativeVenue = await getPublicVenueForSeo(slug);
  if (authoritativeVenue !== null) return <AuthoritativeVenueView venue={authoritativeVenue} />;
  const venue = isProductionSeo() ? undefined : findVenuePublicProfileFixture(slug);

  if (!venue) notFound();

  return <VenueProfileView venue={venue} />;
}
