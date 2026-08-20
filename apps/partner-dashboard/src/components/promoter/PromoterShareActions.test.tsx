import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CopyLinkButton } from './PromoterShareActions';

describe('CopyLinkButton', () => {
  it('copies the actual link instead of only changing its label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyLinkButton value="https://c1rcle.in/zoya/neon" label="Copy link" />);
    screen.getByRole('button', { name: /copy link/i }).click();

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://c1rcle.in/zoya/neon');
    });
  });
});
