import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HostProfilePage, { generateMetadata, generateStaticParams } from './page';

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    preload: _preload,
    ...props
  }: React.ComponentProps<'img'> & { fill?: boolean; preload?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

describe('HostProfilePage', () => {
  it('prebuilds every fixture host profile', () => {
    expect(generateStaticParams()).toEqual(
      expect.arrayContaining([
        { hostId: 'high-spirits-collective' },
        { hostId: 'underground-studio' },
        { hostId: 'sunday-service' },
      ]),
    );
  });

  it('renders verified host identity, events, and venue destinations', async () => {
    render(
      await HostProfilePage({
        params: Promise.resolve({ hostId: 'high-spirits-collective' }),
      }),
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'High Spirits Collective' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Verified host')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Neon Nights' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The Glass House, Mumbai' })).toHaveAttribute(
      'href',
      '/venue/the-glass-house-mumbai',
    );
    expect(screen.getAllByRole('button', { name: 'Follow soon' })[0]).toBeDisabled();
    expect(screen.getByText('The room we always want to create…')).toBeInTheDocument();
    expect(screen.getByText('After Dark')).toBeInTheDocument();
  });

  it('renders an honest empty calendar for a host without announced events', async () => {
    render(await HostProfilePage({ params: Promise.resolve({ hostId: 'underground-studio' }) }));

    expect(screen.getByText('No announced events yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore events' })).toHaveAttribute(
      'href',
      '/explore',
    );
  });

  it('uses notFound for an unknown host', async () => {
    await expect(
      HostProfilePage({ params: Promise.resolve({ hostId: 'missing-host' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('generates host-specific metadata', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ hostId: 'high-spirits-collective' }),
    });

    expect(metadata.title).toBe('High Spirits Collective | THE C1RCLE');
    expect(metadata.robots).toEqual({ follow: false, index: false });
  });
});
