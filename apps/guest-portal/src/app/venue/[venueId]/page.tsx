import { notFound } from 'next/navigation';

import { AuthoritativeVenueView } from '@/features/directory/components/AuthoritativePublicEntityView';
import { loadExploreEvents } from '@/features/explore/explore-data';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { getPublicVenueForSeo, isEligiblePublicVenue } from '@/lib/seo/public-data';

import type { Metadata } from 'next';

export const revalidate = 0;

interface VenueProfilePageProps {
  params: Promise<{ venueId: string }>;
  searchParams?: Promise<{ view?: string }>;
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

  notFound();
}

export default async function VenueProfilePage({ params, searchParams }: VenueProfilePageProps) {
  const { venueId } = await params;
  const slug = decodeURIComponent(venueId);
  const authoritativeVenue = await getPublicVenueForSeo(slug);
  if (authoritativeVenue !== null) {
    const query = searchParams ? await searchParams : { view: undefined };
    const discovery = await loadExploreEvents().then(
      (events) => events,
      () => [],
    );
    const events = discovery.filter((event) => event.venueId === authoritativeVenue.id);
    const view = query.view === 'about' ? 'about' : 'events';
    return <AuthoritativeVenueView venue={authoritativeVenue} events={events} view={view} />;
  }
  notFound();
}
