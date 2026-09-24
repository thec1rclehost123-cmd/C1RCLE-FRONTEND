import {
  getPublicEventsForSitemap,
  getPublicHostsForSitemap,
  getPublicVenuesForSitemap,
  isEligiblePublicHost,
  isEligiblePublicVenue,
} from '@/lib/seo/public-data';
import { absoluteUrl, isProductionSeo } from '@/lib/seo/site';

import type { MetadataRoute } from 'next';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isProductionSeo()) return [];

  const [events, venues, hosts] = await Promise.all([
    getPublicEventsForSitemap(),
    getPublicVenuesForSitemap(),
    getPublicHostsForSitemap(),
  ]);

  const staticPaths = ['/', '/app', ...(events.length > 0 ? ['/explore'] : [])];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: absoluteUrl(path),
  }));

  return [
    ...staticEntries,
    ...events.map((event) => ({
      url: absoluteUrl(`/event/${encodeURIComponent(event.slug)}`),
      lastModified: new Date(event.updatedAt),
    })),
    ...venues.filter(isEligiblePublicVenue).map((venue) => ({
      url: absoluteUrl(`/venue/${encodeURIComponent(venue.slug)}`),
      lastModified: new Date(venue.updatedAt),
    })),
    ...hosts.filter(isEligiblePublicHost).map((host) => ({
      url: absoluteUrl(`/host/${encodeURIComponent(host.slug)}`),
    })),
  ];
}
