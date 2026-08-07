import { notFound } from 'next/navigation';

import { VenueProfileView } from '@/features/directory/components/VenueProfileView';
import {
  findVenueDirectoryFixture,
  venueDirectoryFixtures,
} from '@/features/directory/fixtures/directory.fixture';

import type { Metadata } from 'next';

interface VenueProfilePageProps {
  params: Promise<{ venueId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return venueDirectoryFixtures.map((venue) => ({ venueId: venue.id }));
}

export async function generateMetadata({ params }: VenueProfilePageProps): Promise<Metadata> {
  const { venueId } = await params;
  const venue = findVenueDirectoryFixture(decodeURIComponent(venueId));

  if (!venue) {
    return {
      title: 'Venue unavailable | THE C1RCLE',
      description: 'This C1RCLE venue profile is unavailable.',
      robots: { follow: false, index: false },
    };
  }

  return {
    title: `${venue.name} | THE C1RCLE`,
    description: venue.summary,
    alternates: { canonical: `https://thec1rcle.com/venue/${encodeURIComponent(venue.id)}` },
    robots: { follow: false, index: false },
    openGraph: {
      title: venue.name,
      description: venue.summary,
      images: [{ url: venue.coverImage, alt: venue.name }],
    },
  };
}

export default async function VenueProfilePage({ params }: VenueProfilePageProps) {
  const { venueId } = await params;
  const venue = findVenueDirectoryFixture(decodeURIComponent(venueId));

  if (!venue) notFound();

  return <VenueProfileView venue={venue} />;
}
