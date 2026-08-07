import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HostsPage from './page';

vi.mock('next/image', () => ({
  default: ({ alt, fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => (
    <img alt={alt} {...props} />
  ),
}));

describe('HostsPage', () => {
  it('renders host and venue discovery with real profile destinations', () => {
    render(<HostsPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'The names behind the night.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /High Spirits Collective/i })).toHaveAttribute(
      'href',
      '/host/high-spirits-collective',
    );
    expect(screen.getByRole('link', { name: /Skyline Social/i })).toHaveAttribute(
      'href',
      '/venue/skyline-social',
    );
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });
});
