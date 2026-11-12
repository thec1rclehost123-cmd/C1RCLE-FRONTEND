import { describe, expect, it } from 'vitest';

import { partnerPreviewFeatures } from './preview-features';

describe('unfinished Partner prototypes', () => {
  it('exposes the completed external Venue review workflow', () => {
    expect(partnerPreviewFeatures.externalVenueApproval).toBe(true);
  });
});
