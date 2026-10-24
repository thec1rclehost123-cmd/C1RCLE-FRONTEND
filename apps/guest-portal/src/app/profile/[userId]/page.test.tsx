import { describe, expect, it, vi } from 'vitest';

import PublicProfilePage, { dynamic, generateMetadata } from './page';

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
  it('does not expose fixture-backed public profiles while no public profile API exists', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns not-found for known fixture members in connected mode', async () => {
    await expect(
      PublicProfilePage({ params: Promise.resolve({ userId: 'riya' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('does not generate metadata for fixture-backed public identities', async () => {
    await expect(generateMetadata({ params: Promise.resolve({ userId: 'riya' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });
});
