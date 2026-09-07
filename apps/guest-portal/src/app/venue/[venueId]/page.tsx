import { notFound } from 'next/navigation';

import { VenueProfileView } from '@/features/directory/components/VenueProfileView';
import {
  findVenuePublicProfileFixture,
  venuePublicProfileFixtures,
} from '@/features/directory/fixtures/public-profile.fixture';

import type { Metadata } from 'next';

interface VenueProfilePageProps {
  params: Promise<{ venueId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return venuePublicProfileFixtures.map((venue) => ({ venueId: venue.id }));
}

export async function generateMetadata({ params }: VenueProfilePageProps): Promise<Metadata> {
  const { venueId } = await params;
  const venue = findVenuePublicProfileFixture(decodeURIComponent(venueId));

  if (!venue) {
    return {
      title: 'Venue unavailable | THE C1RCLE',
      description: 'This C1RCLE venue profile is unavailable.',
      robots: { follow: false, index: false },
    };
  }

  return {
    title: `${venue.hero.title} | THE C1RCLE`,
    description: venue.hero.subtitle,
    alternates: { canonical: `https://thec1rcle.com/venue/${encodeURIComponent(venue.id)}` },
    robots: { follow: false, index: false },
    openGraph: {
      title: venue.hero.title,
      description: venue.hero.subtitle,
      images: [{ url: venue.hero.cover.src, alt: venue.hero.cover.alt }],
    },
  };
}

export default async function VenueProfilePage({ params }: VenueProfilePageProps) {
  const { venueId } = await params;
  const venue = findVenuePublicProfileFixture(decodeURIComponent(venueId));

  if (!venue) notFound();

  return <VenueProfileView venue={venue} />;
}
