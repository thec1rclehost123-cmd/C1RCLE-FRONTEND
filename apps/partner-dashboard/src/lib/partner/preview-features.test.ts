import { describe, expect, it, vi } from 'vitest';

import StudioDoorPage from '@/app/partner/[studio]/door/page';

import { partnerPreviewFeatures } from './preview-features';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

describe('unfinished Partner prototypes', () => {
  it.each(['venue', 'host', 'promoter'])(
    'does not expose the fixture Door route for %s',
    async (studio) => {
      await expect(StudioDoorPage({ params: Promise.resolve({ studio }) })).rejects.toThrow(
        'NOT_FOUND',
      );
    },
  );
  it('exposes the completed external Venue review workflow', () => {
    expect(partnerPreviewFeatures.externalVenueApproval).toBe(true);
  });
});
