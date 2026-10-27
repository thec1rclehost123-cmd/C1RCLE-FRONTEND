import { getClientEnv } from '@c1rcle/config';

import type { EventEditorData, EventEditorRole } from '@/data/partner-data-source';

/**
 * The editor's options are subsequently populated by tenant-scoped hooks.
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
    genres: [],
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
