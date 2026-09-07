import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComponentProps } from 'react';

import { HostEventsScreen } from './HostEventsScreen';

vi.mock('next/image', () => ({
  default: (props: ComponentProps<'img'>) => <img {...props} />,
}));

describe('HostEventsScreen', () => {
  it('does not expose the confirmed nonexistent global Analytics route', () => {
    render(<HostEventsScreen />);

    expect(screen.queryByRole('link', { name: /analytics/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /host\/events\/analytics/i })).toBeNull();
  });
});
