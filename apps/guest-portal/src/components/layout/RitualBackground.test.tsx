import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RitualBackground } from './RitualBackground';

describe('RitualBackground', () => {
  it('does not run persistent global animations behind every route', () => {
    const { container } = render(<RitualBackground />);
    const animatedElements = container.querySelectorAll('[class*="animate-"]');

    expect(animatedElements).toHaveLength(0);
  });
});
