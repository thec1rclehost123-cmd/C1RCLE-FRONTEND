import { getClientEnv } from '@c1rcle/config';

import type { EventEditorData, EventEditorRole } from '@/data/partner-data-source';

export const EVENT_GENRE_OPTIONS = [
  'Bollywood',
  'House',
  'Techno',
  'Hip-Hop',
  'EDM',
  'Afrobeats',
  'Live Music',
] as const;

/**
 * Tenant records are subsequently populated by scoped hooks. Genre choices
 * are static product metadata, not tenant or demo records.
 * Keep the server-provided baseline empty so a real session never inherits a
 * demo title, ticket tier, promoter, or venue from the fixture source.
 */
export function createEmptyEventEditorData(role: EventEditorRole): EventEditorData {
  const artworkOptions =
    getClientEnv().NEXT_PUBLIC_ENVIRONMENT === 'development'
      ? [
          {
            type: 'image' as const,
            value: '/partner-v3/venue/neon-nights-poster.jpg',
            alt: 'Local development event poster',
          },
        ]
      : [];

  return {
    dataStatus: 'api',
    role,
    venues: [],
    promoters: [],
    genres: EVENT_GENRE_OPTIONS,
    extraGenres: [],
    artworkOptions,
    defaultDraft: {
      name: '',
      description: '',
      venueId: '',
      date: '',
      dateLabel: '',
      time: '',
      genres: [],
      artists: [],
      artwork: { type: 'gradient', value: 'default' },
      ticketTiers: [],
      selectedPromoterIds: [],
      tableType: 'none',
      promoCodes: [],
      pricingRule: '',
      compensation: 'standard',
      commissionRate: 0,
      salaryNotes: '',
    },
  };
}
