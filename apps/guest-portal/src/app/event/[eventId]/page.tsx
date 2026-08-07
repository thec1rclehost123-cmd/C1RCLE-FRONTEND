import { notFound } from 'next/navigation';

import { EventDetailView } from '@/features/event-detail/components/EventDetailView';
import {
  eventDetailFixtures,
  findEventDetailFixture,
} from '@/features/event-detail/fixtures/event-detail.fixture';

import type { Metadata } from 'next';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return eventDetailFixtures.map((event) => ({ eventId: event.slug }));
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = findEventDetailFixture(decodeURIComponent(eventId));

  if (!event) {
    return {
      title: 'Event unavailable | THE C1RCLE',
      description: 'This C1RCLE event is unavailable or has been removed.',
      robots: { index: false, follow: false },
    };
  }

  const canonical = `https://thec1rcle.com/event/${encodeURIComponent(event.slug)}`;
  return {
    title: `${event.title} | THE C1RCLE`,
    description: event.summary,
    alternates: { canonical },
    robots: { index: false, follow: false },
    openGraph: {
      title: event.title,
      description: event.summary,
      type: 'website',
      url: canonical,
      images: [{ url: event.image, alt: event.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.summary,
      images: [event.image],
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const event = findEventDetailFixture(decodeURIComponent(eventId));

  if (!event) notFound();

  return <EventDetailView event={event} />;
}
