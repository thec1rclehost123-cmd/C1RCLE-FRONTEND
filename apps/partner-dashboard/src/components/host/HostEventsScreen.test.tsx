import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HostEventsScreen } from './HostEventsScreen';

import type { ComponentProps } from 'react';


vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- vitest mock replacing next/image with a plain <img> element; no image optimization is needed in tests
  default: (props: ComponentProps<'img'>) => <img alt={props.alt ?? ''} {...props} />,
}));

describe('HostEventsScreen', () => {
  it('does not expose the confirmed nonexistent global Analytics route', () => {
    render(<HostEventsScreen />);

    expect(screen.queryByRole('link', { name: /analytics/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /host\/events\/analytics/i })).toBeNull();
  });
});
