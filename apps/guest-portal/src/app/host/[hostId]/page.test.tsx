import { describe, expect, it, vi } from 'vitest';

import HostProfilePage, { dynamic, generateMetadata } from './page';

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

vi.mock('@/lib/seo/public-data', () => ({
  getPublicHostForSeo: () => Promise.resolve(null),
  isEligiblePublicHost: () => false,
}));

describe('HostProfilePage', () => {
  it('renders public host profiles on demand', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('does not substitute fixture profiles when a public host is unavailable', async () => {
    await expect(
      HostProfilePage({ params: Promise.resolve({ hostId: 'high-spirits-collective' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('does not generate metadata for a fixture-only host', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ hostId: 'high-spirits-collective' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
