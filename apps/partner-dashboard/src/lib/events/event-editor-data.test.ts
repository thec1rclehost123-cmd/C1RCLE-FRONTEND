import { describe, expect, it } from 'vitest';

import { createEmptyEventEditorData } from './event-editor-data';

describe('createEmptyEventEditorData', () => {
  it('starts a live editor without fixture records or a prefilled event', () => {
    const data = createEmptyEventEditorData('venue');

    expect(data).toMatchObject({
      dataStatus: 'api',
      role: 'venue',
      venues: [],
      promoters: [],
      artworkOptions: [
        {
          type: 'image',
          value: '/partner-v3/venue/neon-nights-poster.jpg',
          alt: 'Local development event poster',
        },
      ],
      defaultDraft: { name: '', ticketTiers: [], selectedPromoterIds: [] },
    });
  });
});
