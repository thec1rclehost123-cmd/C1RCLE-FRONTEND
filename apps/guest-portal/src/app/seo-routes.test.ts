// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import robots from './robots';
import sitemap from './sitemap';

const mocks = vi.hoisted(() => ({ production: true }));

vi.mock('@/lib/seo/site', () => ({
  absoluteUrl: (path: string) => `https://thec1rcle.com${path === '/' ? '/' : path}`,
  isProductionSeo: () => mocks.production,
}));

vi.mock('@/lib/seo/public-data', () => ({
  getPublicEventsForSitemap: vi.fn(() =>
    Promise.resolve([
      { id: 'event-1', slug: 'public-event', updatedAt: '2029-06-01T00:00:00.000Z' },
    ]),
  ),
  getPublicVenuesForSitemap: vi.fn(() => Promise.resolve([])),
  getPublicHostsForSitemap: vi.fn(() => Promise.resolve([])),
  isEligiblePublicVenue: () => false,
  isEligiblePublicHost: () => false,
}));

describe('SEO metadata routes', () => {
  beforeEach(() => {
    mocks.production = true;
  });

  it('publishes production robots and an authoritative-only sitemap', async () => {
    expect(robots()).toMatchObject({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://thec1rcle.com/sitemap.xml',
    });
    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      'https://thec1rcle.com/',
      'https://thec1rcle.com/app',
      'https://thec1rcle.com/explore',
      'https://thec1rcle.com/event/public-event',
    ]);
    expect(
      entries.some((entry) => /login|profile|tickets|checkout|confirmation/.test(entry.url)),
    ).toBe(false);
  });

  it('blocks crawling and removes the sitemap outside production', async () => {
    mocks.production = false;
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
    expect(await sitemap()).toEqual([]);
  });
});
