import { absoluteUrl, isProductionSeo } from '@/lib/seo/site';

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  if (!isProductionSeo()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
