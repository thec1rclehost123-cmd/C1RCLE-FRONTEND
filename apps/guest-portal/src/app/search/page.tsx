import { SearchExperienceClient } from '@/features/explore/components/SearchExperienceClient';
import { loadExploreEvents } from '@/features/explore/explore-data';
import { deriveCities } from '@/features/explore/explore-mapping';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Events | THE C1RCLE',
  description: 'Search public C1RCLE events by event, venue, category, and city.',
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [events, params] = await Promise.all([
    loadExploreEvents(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const rawQuery = params['q'];
  const initialQuery = Array.isArray(rawQuery) ? (rawQuery[0] ?? '') : (rawQuery ?? '');

  return (
    <SearchExperienceClient
      events={events}
      cities={deriveCities(events)}
      initialQuery={initialQuery}
    />
  );
}
