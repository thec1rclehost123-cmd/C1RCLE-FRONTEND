import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HostsPage from './page';

vi.mock('next/image', () => ({
  default: ({ alt, fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

describe('HostsPage', () => {
  it('does not show fixture profiles when no public directory data is available', () => {
    render(<HostsPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'DISCOVER HOSTS & VENUES' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Venues' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search hosts and venues' })).toBeInTheDocument();
    expect(screen.getByText('No public venues are available yet.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'HOSTS' }));

    expect(screen.getByText('No public hosts are available yet.')).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });
});
