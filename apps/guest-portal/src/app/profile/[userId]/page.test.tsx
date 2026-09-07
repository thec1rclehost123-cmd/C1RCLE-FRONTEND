import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { publicProfileFixtures } from '@/features/profile/fixtures/public-profile.fixture';

import PublicProfilePage, { generateMetadata, generateStaticParams } from './page';

vi.mock('next/image', () => ({
  default: ({ alt, fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

describe('PublicProfilePage', () => {
  it('prebuilds a destination for every event guest fixture profile', () => {
    const ids = generateStaticParams().map(({ userId }) => userId);

    expect(ids).toEqual(publicProfileFixtures.map((profile) => profile.identity.id));
    expect(ids).toEqual(expect.arrayContaining(['riya', 'ishika', 'ajay', 'maya', 'dev']));
  });

  it('renders public member identity and upcoming events without private account data', async () => {
    render(await PublicProfilePage({ params: Promise.resolve({ userId: 'riya' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Riya Kapoor' })).toBeInTheDocument();
    expect(screen.getByText(/Always looking for intimate live sets/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rooftop Jazz' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Rooftop Jazz' })).toHaveAttribute(
      'href',
      '/event/rooftop-jazz',
    );
    expect(screen.queryByText('riya@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('98765 43210')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit profile' })).not.toBeInTheDocument();
  });

  it('renders the attended event filter from URL state', async () => {
    render(
      await PublicProfilePage({
        params: Promise.resolve({ userId: 'riya' }),
        searchParams: Promise.resolve({ filter: 'attended' }),
      }),
    );

    expect(screen.getByRole('heading', { name: 'Neon Nights' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Rooftop Jazz' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'attended' })).toHaveAttribute('aria-current', 'page');
  });

  it('returns real not-found behavior for an unknown fixture member', async () => {
    await expect(
      PublicProfilePage({ params: Promise.resolve({ userId: 'missing-member' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('generates member-specific metadata without indexing fixture profiles', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ userId: 'riya' }) });

    expect(metadata.title).toBe('Riya Kapoor | THE C1RCLE');
    expect(metadata.robots).toEqual({ follow: false, index: false });
  });
});
