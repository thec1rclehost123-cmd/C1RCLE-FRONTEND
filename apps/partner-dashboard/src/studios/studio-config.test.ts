import { describe, expect, it } from 'vitest';

import { STUDIO_CONFIG } from './studio-config';

describe('Promoter navigation scope', () => {
  it('keeps activity and hides deferred leaderboard and marketing', () => {
    const labels = STUDIO_CONFIG.promoter.navigation.map((item) => item.label);
    expect(labels).toContain('Activity');
    expect(labels).not.toContain('Guests');
    expect(labels).not.toContain('Leaderboard');
    expect(labels).not.toContain('Marketing');
  });
});
