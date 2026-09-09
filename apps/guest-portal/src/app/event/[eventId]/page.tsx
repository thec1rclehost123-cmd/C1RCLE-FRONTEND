import { notFound } from 'next/navigation';

import { AuthoritativeEventView } from '@/features/event-detail/components/AuthoritativeEventView';
import { EventDetailView } from '@/features/event-detail/components/EventDetailView';
import { findEventDetailFixture } from '@/features/event-detail/fixtures/event-detail.fixture';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { getPublicEventForSeo } from '@/lib/seo/public-data';
import { isProductionSeo } from '@/lib/seo/site';

import type { Metadata } from 'next';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const slug = decodeURIComponent(eventId);
  const authoritativeEvent = await getPublicEventForSeo(slug);

  if (authoritativeEvent !== null) {
    return buildPublicMetadata({
      path: `/event/${encodeURIComponent(authoritativeEvent.slug)}`,
      title: authoritativeEvent.title,
      description: authoritativeEvent.summary,
      image: authoritativeEvent.imageUrl,
    });
  }

  if (isProductionSeo()) notFound();

  const event = findEventDetailFixture(slug);

  if (!event) {
    return buildPublicMetadata({
      path: `/event/${encodeURIComponent(slug)}`,
      title: 'Event unavailable',
      description: 'This C1RCLE event is unavailable or has been removed.',
      indexable: false,
    });
  }

  return buildPublicMetadata({
    path: `/event/${encodeURIComponent(event.slug)}`,
    title: event.title,
    description: event.summary,
    image: event.image,
    indexable: false,
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const slug = decodeURIComponent(eventId);
  const authoritativeEvent = await getPublicEventForSeo(slug);

  if (authoritativeEvent !== null) return <AuthoritativeEventView event={authoritativeEvent} />;

  const event = isProductionSeo() ? undefined : findEventDetailFixture(slug);

  if (!event) notFound();

  return <EventDetailView event={event} />;
}
